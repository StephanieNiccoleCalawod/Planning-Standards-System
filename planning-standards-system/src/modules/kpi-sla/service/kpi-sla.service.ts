import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
                    headers: { 'x-mock-office': office },
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
            warning_message: `OVERDUE – Period ended ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago. Please close this period.`,
        };
    }

    async createKpi(office: string, actor: string, dto: CreateKpiDto): Promise<Kpi> {
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

        const kpi = this.kpiRepo.create({ ...dto, office, created_by: actor });
        return this.kpiRepo.save(kpi);
    }

    async findAllKpis(
        office: string,
        filters: { service_id?: string; category?: string; include_inactive?: boolean },
        pagination: PaginationDto = new PaginationDto(),
    ): Promise<{ data: Kpi[]; total: number; page: number; limit: number }> {
        const query = this.kpiRepo
            .createQueryBuilder('kpi')
            .where('kpi.office = :office', { office });

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
        const kpi = await this.kpiRepo.findOne({ where: { id, office } });
        if (!kpi) throw new NotFoundException(`KPI ${id} not found`);
        Object.assign(kpi, dto);
        return this.kpiRepo.save(kpi);
    }

    async removeKpi(id: string, office: string): Promise<{ message: string }> {
        const kpi = await this.kpiRepo.findOne({ where: { id, office } });
        if (!kpi) throw new NotFoundException(`KPI ${id} not found`);
        kpi.is_active = false;
        await this.kpiRepo.save(kpi);
        return { message: `KPI ${id} deactivated` };
    }

    async createSlaRule(office: string, actor: string, dto: CreateSlaRuleDto): Promise<SlaRule> {
        if (dto.work_schedule_type === WorkScheduleType.CUSTOM && !dto.work_schedule_config?.length) {
            throw new BadRequestException('work_schedule_config is required when work_schedule_type is CUSTOM');
        }

        const existingActive = await this.slaRepo.findOne({ where: { office, is_active: true } });
        if (existingActive) {
            throw new ConflictException('An active SLA rule already exists for this office. Deactivate it first.');
        }

        const rule = this.slaRepo.create({ ...dto, office, created_by: actor });
        return this.slaRepo.save(rule);
    }

    async findAllSlaRules(office: string): Promise<SlaRule[]> {
        return this.slaRepo.find({
            where: { office },
            relations: { versions: true },
            order: { created_at: 'DESC' },
        });
    }

    async updateSlaRule(id: string, office: string, actor: string, dto: UpdateSlaRuleDto): Promise<SlaRule> {
        const existing = await this.slaRepo.findOne({ where: { id, office } });
        if (!existing) throw new NotFoundException(`SLA Rule ${id} not found`);

        const newType = dto.work_schedule_type ?? existing.work_schedule_type;
        const newConfig = dto.work_schedule_config ?? existing.work_schedule_config;
        if (newType === WorkScheduleType.CUSTOM && (!newConfig || !Array.isArray(newConfig) || newConfig.length === 0)) {
            throw new BadRequestException('work_schedule_config is required when work_schedule_type is CUSTOM');
        }

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
        const rule = await this.slaRepo.findOne({ where: { id, office } });
        if (!rule) throw new NotFoundException(`SLA Rule ${id} not found`);

        return this.slaVersionRepo.find({
            where: { sla_rule_id: id },
            order: { changed_at: 'DESC' },
        });
    }

    async restoreSlaVersion(
        id: string,
        versionId: string,
        office: string,
        actor: string,
    ): Promise<SlaRule> {
        const rule = await this.slaRepo.findOne({ where: { id, office } });
        if (!rule) throw new NotFoundException(`SLA Rule ${id} not found`);

        const version = await this.slaVersionRepo.findOne({
            where: { id: versionId, sla_rule_id: id },
        });
        if (!version) throw new NotFoundException(`Version ${versionId} not found`);

        await this.slaVersionRepo.save(
            this.slaVersionRepo.create({
                sla_rule_id: rule.id,
                work_schedule_type: rule.work_schedule_type,
                work_schedule_config: rule.work_schedule_config,
                work_start_time: rule.work_start_time,
                work_end_time: rule.work_end_time,
                warn_threshold_pct: rule.warn_threshold_pct,
                overdue_threshold_pct: rule.overdue_threshold_pct,
                changed_by: actor,
            }),
        );

        rule.work_schedule_type = version.work_schedule_type;
        rule.work_schedule_config = version.work_schedule_config;
        rule.work_start_time = version.work_start_time;
        rule.work_end_time = version.work_end_time;
        rule.warn_threshold_pct = version.warn_threshold_pct;
        rule.overdue_threshold_pct = version.overdue_threshold_pct;

        return this.slaRepo.save(rule);
    }

    async createHoliday(dto: CreateHolidayDto): Promise<Holiday> {
        const where: any = { month: dto.month, day: dto.day, name: dto.name };
        where.year = dto.year ?? IsNull();

        const exists = await this.holidayRepo.findOne({ where });
        if (exists) throw new ConflictException('Holiday with this month, day, and name already exists');

        const holiday = this.holidayRepo.create({
            month: dto.month,
            day: dto.day,
            year: dto.year ?? null,
            name: dto.name,
            type: dto.type,
            is_recurring: dto.is_recurring ?? false,
        });
        return this.holidayRepo.save(holiday);
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

    async removeHoliday(id: string): Promise<{ message: string }> {
        const holiday = await this.holidayRepo.findOne({ where: { id } });
        if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
        await this.holidayRepo.delete(id);
        return { message: `Holiday ${id} removed` };
    }

    async createPeriod(office: string, actor: string, dto: CreatePeriodDto): Promise<EvaluationPeriod> {
        if (new Date(dto.start_date) >= new Date(dto.end_date)) {
            throw new BadRequestException('start_date must be before end_date');
        }

        // ✅ FIXED: Check overlap against ALL statuses (OPEN, QUEUED, CLOSED)
        // Previously only checked OPEN periods, allowing new periods to be created
        // with dates that overlap a CLOSED (completed) period.
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
        return this.periodRepo.save(period);
    }

    async findAllPeriods(
        office: string,
        pagination: PaginationDto = new PaginationDto(),
    ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const [periods, total] = await this.periodRepo.findAndCount({
            where: { office, is_active: true },
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

    async findOnePeriod(id: string): Promise<any> {
        const period = await this.periodRepo.findOne({ where: { id } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);
        return {
            ...period,
            ...this.computeWarningLevel(period.end_date),
        };
    }

    async getPeriodWarnings(office: string): Promise<any[]> {
        const periods = await this.periodRepo.find({
            where: { office, status: PeriodStatus.OPEN, is_active: true },
        });

        return periods
            .map(p => ({
                ...p,
                ...this.computeWarningLevel(p.end_date),
            }))
            .filter(p => p.warning_level !== 'none');
    }

    async updatePeriod(id: string, office: string, dto: UpdatePeriodDto): Promise<EvaluationPeriod> {
        const period = await this.periodRepo.findOne({ where: { id, office } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);
        Object.assign(period, dto);
        return this.periodRepo.save(period);
    }

    async completePeriod(id: string, office: string): Promise<EvaluationPeriod> {
        const period = await this.periodRepo.findOne({ where: { id, office } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);

        if (period.status !== PeriodStatus.OPEN) {
            throw new ForbiddenException('Only OPEN periods can be marked as completed.');
        }

        period.status = PeriodStatus.CLOSED;
        await this.periodRepo.save(period);

        const nextQueued = await this.periodRepo.findOne({
            where: { office, status: PeriodStatus.QUEUED, is_active: true },
            order: { created_at: 'ASC' },
        });

        if (nextQueued) {
            nextQueued.status = PeriodStatus.OPEN;
            await this.periodRepo.save(nextQueued);
        }

        return period;
    }

    async removePeriod(id: string, office: string): Promise<{ message: string }> {
        const period = await this.periodRepo.findOne({ where: { id, office } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);

        if (period.status !== PeriodStatus.QUEUED) {
            throw new ForbiddenException('Only QUEUED periods can be deleted.');
        }

        period.is_active = false;
        await this.periodRepo.save(period);
        return { message: `Period ${id} deleted` };
    }
}