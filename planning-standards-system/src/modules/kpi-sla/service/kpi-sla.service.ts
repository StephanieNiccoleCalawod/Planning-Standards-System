import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Kpi } from '../database/kpi.entity';
import { SlaRule } from '../database/sla-rule.entity';
import { SlaRuleVersion } from '../database/sla-rule-version.entity';
import { Holiday } from '../database/holiday.entity';
import { EvaluationPeriod } from '../database/evaluation-period.entity';
import { PeriodStatus, WorkScheduleType } from '../enums';
import { CreateKpiDto } from '../dto/create-kpi.dto';
import { UpdateKpiDto } from '../dto/update-kpi.dto';
import { CreateSlaRuleDto } from '../dto/create-sla-rule.dto';
import { UpdateSlaRuleDto } from '../dto/update-sla-rule.dto';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { RequestContext } from '../../../common/context/request-context';

// ─── BE2-1: shared time-ordering guard ──────────────────────────────────────

/**
 * Throws BadRequestException when work_end_time <= work_start_time.
 * Called from both createSlaRule and updateSlaRule so the check lives in
 * exactly one place. Both callers must pass the *effective* (merged) times.
 */
function assertWorkEndAfterStart(start: string, end: string): void {
    if (end <= start) {
        throw new BadRequestException('work_end_time must be after work_start_time');
    }
}

// ─── BE2-2: shared working-days non-empty guard ──────────────────────────────

/**
 * Throws BadRequestException when work_schedule_config is present but empty.
 * Called from both createSlaRule and updateSlaRule.
 *
 * Only validates when the value is actually provided — absence is allowed
 * (WEEKDAYS / MONDAY_TO_SATURDAY do not require it). The CUSTOM-type
 * requirement check remains a separate guard in the service methods.
 */
function assertWorkScheduleConfigNotEmpty(config: object[] | null | undefined): void {
    if (config !== undefined && config !== null && config.length === 0) {
        throw new BadRequestException('At least one working day must be configured.');
    }
}

// ────────────────────────────────────────────────────────────────────────────

@Injectable()
export class KpiSlaService {
    constructor(
        @InjectRepository(Kpi, 'kpi_sla_db')
        private readonly kpiRepo: Repository<Kpi>,

        @InjectRepository(SlaRule, 'kpi_sla_db')
        private readonly slaRepo: Repository<SlaRule>,

        @InjectRepository(SlaRuleVersion, 'kpi_sla_db')
        private readonly slaVersionRepo: Repository<SlaRuleVersion>,

        @InjectRepository(Holiday, 'kpi_sla_db')
        private readonly holidayRepo: Repository<Holiday>,

        @InjectRepository(EvaluationPeriod, 'kpi_sla_db')
        private readonly periodRepo: Repository<EvaluationPeriod>,

        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) { }

    private async validateServiceExists(service_id: string, office: string): Promise<void> {
        const baseUrl = this.config.get<string>('SERVICE_CATALOGUE_URL');
        try {
            await firstValueFrom(
                this.http.get(`${baseUrl}/api/services/${service_id}`, {
                    headers: { 'x-office': office },
                }),
            );
        } catch {
            throw new NotFoundException(`Service ${service_id} not found in service-catalogue`);
        }
    }

    private computeWarningLevel(endDate: string): {
        days_until_end: number;
        warning_level: 'none' | 'warning' | 'due' | 'overdue';
        warning_message: string | null;
    } {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        const diffMs = end.getTime() - today.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (days > 7) return { days_until_end: days, warning_level: 'none', warning_message: null };
        if (days > 0) return {
            days_until_end: days,
            warning_level: 'warning',
            warning_message: `This period ends in ${days} day${days !== 1 ? 's' : ''}. Please prepare to close it.`,
        };
        if (days === 0) return {
            days_until_end: 0,
            warning_level: 'due',
            warning_message: 'This period has reached its end date. Are you ready to mark it as completed?',
        };
        return {
            days_until_end: days,
            warning_level: 'overdue',
            warning_message: `OVERDUE — Period ended ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago. Please close this period.`,
        };
    }

    async createKpi(office: string, actor: string, dto: CreateKpiDto): Promise<Kpi> {
        // BE1-10: prevent duplicate KPI names per office (case-insensitive, trimmed)
        const trimmedName = dto.name.trim();
        const duplicateName = await this.kpiRepo
            .createQueryBuilder('kpi')
            .where('kpi.office = :office', { office })
            .andWhere('kpi.is_active = true')
            .andWhere('LOWER(kpi.name) = LOWER(:name)', { name: trimmedName })
            .getOne();
        if (duplicateName) {
            throw new ConflictException('A KPI with this name already exists for your office.');
        }

        const existing = await this.kpiRepo.findOne({
            where: {
                office,
                category: dto.category,
                service_id: dto.service_id ?? null,
                is_active: true,
            },
        });
        if (existing) {
            throw new ConflictException(
                `A KPI with category "${dto.category}" already exists for this service`,
            );
        }

        const kpi = this.kpiRepo.create({ ...dto, name: trimmedName, office, created_by: actor });
        const saved = await this.kpiRepo.save(kpi);
        this.logAudit({
            event_type: 'KPI_CREATED',
            actor_id: actor,
            office_id: office,
            resource_id: saved.id,
            timestamp: new Date().toISOString(),
        });
        return saved;
    }

    async findAllKpis(
        office: string,
        filters: { service_id?: string; category?: string; include_inactive?: boolean },
        pagination: PaginationDto = new PaginationDto(),
        isCrossOffice: boolean = false,
    ): Promise<{ data: Kpi[]; total: number; page: number; limit: number }> {
        const query = this.kpiRepo.createQueryBuilder('kpi');

        if (isCrossOffice) {
            query.where('1=1');
        } else {
            query.where('kpi.office = :office', { office });
        }

        if (!filters.include_inactive) {
            query.andWhere('kpi.is_active = true');
        }

        if (filters.service_id) query.andWhere('kpi.service_id = :service_id', { service_id: filters.service_id });
        if (filters.category) query.andWhere('kpi.category = :category', { category: filters.category });

        const allowedSortFields = ['name', 'category', 'target_value', 'created_at'];
        const sortBy = allowedSortFields.includes(pagination.sort_by) ? pagination.sort_by : 'created_at';

        const [data, total] = await query
            .orderBy(`kpi.${sortBy}`, pagination.sort_order)
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return { data, total, page: pagination.page, limit: pagination.limit };
    }

    async updateKpi(id: string, office: string, dto: UpdateKpiDto): Promise<Kpi> {
        const kpi = await this.findOneKpiOrFail(id, office);

        // BE1-10: if renaming, ensure no other active KPI in the same office
        // has the same name (case-insensitive, trimmed).
        if (dto.name !== undefined) {
            const trimmedName = dto.name.trim();
            const duplicateName = await this.kpiRepo
                .createQueryBuilder('kpi')
                .where('kpi.office = :office', { office })
                .andWhere('kpi.is_active = true')
                .andWhere('kpi.id != :id', { id })
                .andWhere('LOWER(kpi.name) = LOWER(:name)', { name: trimmedName })
                .getOne();
            if (duplicateName) {
                throw new ConflictException('A KPI with this name already exists for your office.');
            }
            dto.name = trimmedName;
        }

        Object.assign(kpi, dto);
        return this.kpiRepo.save(kpi);
    }

    async removeKpi(id: string, office: string, actor: string): Promise<{ message: string }> {
        const kpi = await this.findOneKpiOrFail(id, office);
        kpi.is_active = false;
        const saved = await this.kpiRepo.save(kpi);
        this.logAudit({
            event_type: 'KPI_REMOVED',
            actor_id: actor,
            office_id: office,
            resource_id: saved.id,
            timestamp: new Date().toISOString(),
        });
        return { message: `KPI ${id} deactivated` };
    }

    async createSlaRule(office: string, actor: string, dto: CreateSlaRuleDto): Promise<SlaRule> {
        if (dto.work_schedule_type === WorkScheduleType.CUSTOM && !dto.work_schedule_config?.length) {
            throw new BadRequestException('work_schedule_config is required when work_schedule_type is CUSTOM');
        }

        // ── BE2-2: defensive working-days non-empty guard ─────────────────
        assertWorkScheduleConfigNotEmpty(dto.work_schedule_config);
        // ─────────────────────────────────────────────────────────────────

        // ── BE2-1: defensive time-ordering guard ──────────────────────────
        assertWorkEndAfterStart(dto.work_start_time, dto.work_end_time);
        // ─────────────────────────────────────────────────────────────────

        const existingActive = await this.slaRepo.findOne({ where: { office, is_active: true } });
        if (existingActive) {
            throw new ConflictException('An active SLA rule already exists for this office. Deactivate it first.');
        }

        const rule = this.slaRepo.create({ ...dto, office, created_by: actor });
        return this.slaRepo.save(rule);
    }

    async findAllSlaRules(office: string, isCrossOffice: boolean = false): Promise<SlaRule[]> {
        return this.slaRepo.find({
            where: isCrossOffice ? {} : { office },
            relations: { versions: true },
            order: { created_at: 'DESC' },
        });
    }

    async updateSlaRule(id: string, office: string, actor: string, dto: UpdateSlaRuleDto): Promise<SlaRule> {
        const existing = await this.findOneSlaRuleOrFail(id, office);

        const newType = dto.work_schedule_type ?? existing.work_schedule_type;
        const newConfig = dto.work_schedule_config ?? existing.work_schedule_config;
        if (newType === WorkScheduleType.CUSTOM && (!newConfig || !Array.isArray(newConfig) || newConfig.length === 0)) {
            throw new BadRequestException('work_schedule_config is required when work_schedule_type is CUSTOM');
        }

        // ── BE2-2: defensive working-days non-empty guard ─────────────────
        // Only validates when dto.work_schedule_config is explicitly supplied.
        assertWorkScheduleConfigNotEmpty(dto.work_schedule_config);
        // ─────────────────────────────────────────────────────────────────

        // ── BE2-1: defensive time-ordering guard ──────────────────────────
        const effectiveStart = dto.work_start_time ?? existing.work_start_time;
        const effectiveEnd = dto.work_end_time ?? existing.work_end_time;
        assertWorkEndAfterStart(effectiveStart, effectiveEnd);
        // ─────────────────────────────────────────────────────────────────

        await this.slaVersionRepo.save(
            this.slaVersionRepo.create({
                sla_rule_id: existing.id,
                work_schedule_type: existing.work_schedule_type,
                work_schedule_config: existing.work_schedule_config,
                work_start_time: existing.work_start_time,
                work_end_time: existing.work_end_time,
                warn_threshold_pct: existing.warn_threshold_pct,
                overdue_threshold_pct: existing.overdue_threshold_pct,
                changed_by: actor,
            }),
        );

        Object.assign(existing, dto);
        return this.slaRepo.save(existing);
    }

    async getSlaRuleVersions(id: string, office: string): Promise<SlaRuleVersion[]> {
        const rule = await this.findOneSlaRuleOrFail(id, office);

        return this.slaVersionRepo.find({
            where: { sla_rule_id: id },
            order: { changed_at: 'DESC' },
        });
    }

    async restoreSlaVersion(id: string, versionId: string, office: string, actor: string): Promise<SlaRule> {
        const rule = await this.findOneSlaRuleOrFail(id, office);

        const version = await this.slaVersionRepo.findOne({
            where: { id: versionId, sla_rule_id: id },
        });
        if (!version) throw new NotFoundException(`Version ${versionId} not found`);

        const currentType = rule.work_schedule_type;
        const currentConfig = rule.work_schedule_config;
        const currentStart = rule.work_start_time;
        const currentEnd = rule.work_end_time;
        const currentWarn = rule.warn_threshold_pct;
        const currentOverdue = rule.overdue_threshold_pct;

        rule.work_schedule_type = version.work_schedule_type;
        rule.work_schedule_config = version.work_schedule_config;
        rule.work_start_time = version.work_start_time;
        rule.work_end_time = version.work_end_time;
        rule.warn_threshold_pct = version.warn_threshold_pct;
        rule.overdue_threshold_pct = version.overdue_threshold_pct;
        const savedRule = await this.slaRepo.save(rule);

        version.work_schedule_type = currentType;
        version.work_schedule_config = currentConfig;
        version.work_start_time = currentStart;
        version.work_end_time = currentEnd;
        version.warn_threshold_pct = currentWarn;
        version.overdue_threshold_pct = currentOverdue;
        version.changed_by = actor;
        await this.slaVersionRepo.save(version);

        return savedRule;
    }

    async createHoliday(dto: CreateHolidayDto, actor: string): Promise<{ data: Holiday | Holiday[]; warning?: string }> {
        let warning: string | undefined;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentDay = now.getDate();

        const holidaysToSave: Holiday[] = [];
        let isPast = false;

        if (dto.is_recurring) {
            for (let i = 0; i < 5; i++) {
                const year = currentYear + i;
                holidaysToSave.push(this.holidayRepo.create({ ...dto, year }));
            }
        } else {
            const checkYear = dto.year ?? currentYear;
            if (checkYear < currentYear) {
                isPast = true;
            } else if (checkYear === currentYear) {
                if (dto.month < currentMonth) {
                    isPast = true;
                } else if (dto.month === currentMonth && dto.day < currentDay) {
                    isPast = true;
                }
            }
            holidaysToSave.push(this.holidayRepo.create({ ...dto, year: checkYear }));
        }

        const savedHolidays = await this.holidayRepo.save(holidaysToSave);

        this.logAudit({
            event_type: 'HOLIDAY_CREATED',
            actor_id: actor,
            office_id: 'GLOBAL',
            resource_id: savedHolidays[0].id,
            details: { is_recurring: dto.is_recurring, count: savedHolidays.length },
            timestamp: new Date().toISOString(),
        });

        if (isPast) {
            warning = "This holiday date is in the past";
        }

        return { data: dto.is_recurring ? savedHolidays : savedHolidays[0], warning };
    }

    async findAllHolidays(
        filters: { month?: number; year?: number; type?: string },
        pagination: PaginationDto = new PaginationDto(),
    ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = this.holidayRepo.createQueryBuilder('h');

        if (filters.month) query.andWhere('h.month = :month', { month: filters.month });
        if (filters.year) query.andWhere('(h.year = :year OR h.year IS NULL)', { year: filters.year });
        if (filters.type) query.andWhere('h.type = :type', { type: filters.type });

        const [holidays, total] = await query
            .orderBy('h.month', 'ASC')
            .addOrderBy('h.day', 'ASC')
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return { data: holidays, total, page: pagination.page, limit: pagination.limit };
    }

    async updateHoliday(id: string, dto: UpdateHolidayDto): Promise<Holiday> {
        const holiday = await this.holidayRepo.findOne({ where: { id } });
        if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
        Object.assign(holiday, dto);
        return this.holidayRepo.save(holiday);
    }

    async removeHoliday(id: string, actor: string): Promise<{ message: string }> {
        const holiday = await this.holidayRepo.findOne({ where: { id } });
        if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
        await this.holidayRepo.delete(id);
        this.logAudit({
            event_type: 'HOLIDAY_DELETED',
            actor_id: actor,
            office_id: 'GLOBAL',
            resource_id: id,
            timestamp: new Date().toISOString(),
        });
        return { message: `Holiday ${id} removed` };
    }

    async createPeriod(office: string, actor: string, dto: CreatePeriodDto): Promise<EvaluationPeriod> {
        if (new Date(dto.start_date) >= new Date(dto.end_date)) {
            throw new BadRequestException('start_date must be before end_date');
        }

        const overlapping = await this.periodRepo
            .createQueryBuilder('p')
            .where('p.office = :office', { office })
            .andWhere('p.is_active = true')
            .andWhere('p.start_date <= :end', { end: dto.end_date })
            .andWhere('p.end_date >= :start', { start: dto.start_date })
            .getOne();

        if (overlapping) {
            throw new ConflictException(
                `Selected dates overlap with an existing ${overlapping.status} period "${overlapping.name}". Please choose non-overlapping dates.`,
            );
        }

        const activePeriod = await this.periodRepo.findOne({
            where: { office, status: PeriodStatus.OPEN, is_active: true },
        });

        const newStatus = activePeriod ? PeriodStatus.QUEUED : PeriodStatus.OPEN;

        const period = this.periodRepo.create({
            ...dto,
            office,
            created_by: actor,
            status: newStatus,
        });
        const saved = await this.periodRepo.save(period);
        this.logAudit({
            event_type: 'PERIOD_CREATED',
            actor_id: actor,
            office_id: office,
            resource_id: saved.id,
            timestamp: new Date().toISOString(),
        });
        return saved;
    }

    async findAllPeriods(
        office: string,
        pagination: PaginationDto = new PaginationDto(),
        isCrossOffice: boolean = false,
    ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const [periods, total] = await this.periodRepo.findAndCount({
            where: isCrossOffice ? { is_active: true } : { office, is_active: true },
            order: { start_date: pagination.sort_order === 'ASC' ? 'ASC' : 'DESC' },
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
        });

        const data = periods.map(p => ({
            ...p,
            ...this.computeWarningLevel(p.end_date),
        }));

        return { data, total, page: pagination.page, limit: pagination.limit };
    }

    async findOnePeriod(id: string, office?: string, isCrossOffice: boolean = false): Promise<any> {
        const period = await this.findOnePeriodOrFail(id, office, isCrossOffice);
        return {
            ...period,
            ...this.computeWarningLevel(period.end_date),
        };
    }

    async getPeriodWarnings(office: string, isCrossOffice: boolean = false): Promise<any[]> {
        const periods = await this.periodRepo.find({
            where: isCrossOffice
                ? { status: PeriodStatus.OPEN, is_active: true }
                : { office, status: PeriodStatus.OPEN, is_active: true },
        });

        return periods
            .map(p => ({
                ...p,
                ...this.computeWarningLevel(p.end_date),
            }))
            .filter(p => p.warning_level !== 'none');
    }

    async updatePeriod(id: string, office: string, dto: UpdatePeriodDto): Promise<EvaluationPeriod> {
        const period = await this.findOnePeriodOrFail(id, office);
        Object.assign(period, dto);
        return this.periodRepo.save(period);
    }

    async completePeriod(id: string, office: string, actor: string): Promise<EvaluationPeriod> {
        const period = await this.findOnePeriodOrFail(id, office);

        if (period.status !== PeriodStatus.OPEN) {
            throw new ForbiddenException('Only OPEN periods can be marked as completed.');
        }

        period.status = PeriodStatus.CLOSED;
        const saved = await this.periodRepo.save(period);

        this.logAudit({
            event_type: 'PERIOD_CLOSED',
            actor_id: actor,
            office_id: office,
            resource_id: saved.id,
            timestamp: new Date().toISOString(),
        });

        const nextQueued = await this.periodRepo.findOne({
            where: { office, status: PeriodStatus.QUEUED, is_active: true },
            order: { created_at: 'ASC' },
        });

        if (nextQueued) {
            nextQueued.status = PeriodStatus.OPEN;
            await this.periodRepo.save(nextQueued);
        }

        try {
            const catalogueUrl = this.config.get<string>('SERVICE_CATALOGUE_URL');
            await firstValueFrom(
                this.http.delete(`${catalogueUrl}/api/services/na-flags/period/${period.id}`),
            );
        } catch {
        }

        return period;
    }

    async removePeriod(id: string, office: string): Promise<{ message: string }> {
        const period = await this.findOnePeriodOrFail(id, office);

        if (period.status !== PeriodStatus.QUEUED) {
            throw new ForbiddenException('Only QUEUED periods can be deleted.');
        }

        period.is_active = false;
        await this.periodRepo.save(period);
        return { message: `Period ${id} deleted` };
    }
    private async findOneKpiOrFail(id: string, office: string): Promise<Kpi> {
        const kpi = await this.kpiRepo.findOne({ where: { id } });
        if (!kpi) throw new NotFoundException(`KPI ${id} not found`);
        if (kpi.office !== office) {
            throw new ForbiddenException('You cannot access KPIs from another office');
        }
        return kpi;
    }

    private async findOneSlaRuleOrFail(id: string, office: string): Promise<SlaRule> {
        const rule = await this.slaRepo.findOne({ where: { id } });
        if (!rule) throw new NotFoundException(`SLA Rule ${id} not found`);
        if (rule.office !== office) {
            throw new ForbiddenException('You cannot access SLA Rules from another office');
        }
        return rule;
    }

    private async findOnePeriodOrFail(id: string, office?: string, isCrossOffice: boolean = false): Promise<EvaluationPeriod> {
        const period = await this.periodRepo.findOne({ where: { id } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);
        if (!isCrossOffice && office && period.office !== office) {
            throw new ForbiddenException('You cannot access Evaluation Periods from another office');
        }
        return period;
    }

    private logAudit(payload: {
        event_type: string;
        actor_id: string;
        office_id: string;
        resource_id?: string;
        details?: any;
        timestamp?: string;
    }) {
        const url = this.config.get<string>('COMMITMENT_URL') || 'http://localhost:4002';
        const ctx = RequestContext.get();
        this.http.post(`${url}/api/audit-events`, {
            ...payload,
            actor_role: ctx?.actorRole,
            actor_username: ctx?.actorUsername,
            ip_address: ctx?.clientIp,
            service_name: 'pss-kpi-sla',
        }, {
            headers: { 'x-office': payload.office_id, 'x-role': 'Admin' },
        }).subscribe({
            error: (err) => console.error('Failed to send audit log:', err.message),
        });
    }
}