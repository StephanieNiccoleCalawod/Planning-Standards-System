import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
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
import { PhHolidayService } from './ph-holiday.service';

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
        private readonly phHolidayService: PhHolidayService,
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

    async createHoliday(dto: CreateHolidayDto): Promise<Holiday[]> {
        const exists = await this.holidayRepo.findOne({
            where: { holiday_date: dto.holiday_date, name: dto.name },
        });
        if (exists) throw new ConflictException('Holiday with this date and name already exists');

        const holidays: Holiday[] = [];
        const baseDate = new Date(dto.holiday_date);
        const yearsToCreate = dto.is_recurring ? 5 : 1;

        for (let i = 0; i < yearsToCreate; i++) {
            const date = new Date(baseDate);
            date.setFullYear(date.getFullYear() + i);
            const holiday = this.holidayRepo.create({
                ...dto,
                holiday_date: date.toISOString().split('T')[0],
            });
            holidays.push(await this.holidayRepo.save(holiday));
        }
        return holidays;
    }

    async findAllHolidays(
        filters: { month?: number; year?: number; type?: string },
        pagination: PaginationDto = new PaginationDto(),
    ): Promise<{ data: Holiday[]; total: number; page: number; limit: number }> {
        const query = this.holidayRepo.createQueryBuilder('h');

        if (filters.month) query.andWhere('EXTRACT(MONTH FROM h.holiday_date::date) = :month', { month: filters.month });
        if (filters.year) query.andWhere('EXTRACT(YEAR FROM h.holiday_date::date) = :year', { year: filters.year });
        if (filters.type) query.andWhere('h.type = :type', { type: filters.type });

        const [data, total] = await query
            .orderBy('h.holiday_date', pagination.sort_order === 'DESC' ? 'DESC' : 'ASC')
            .skip((pagination.page - 1) * pagination.limit)
            .take(pagination.limit)
            .getManyAndCount();

        return { data, total, page: pagination.page, limit: pagination.limit };
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

    async syncPhHolidays(year: number): Promise<{ synced: number; skipped: number }> {
        const phHolidays = await this.phHolidayService.fetchPhHolidays(year);

        let synced = 0;
        let skipped = 0;

        for (const h of phHolidays) {
            const holidayName = h.name;
            const exists = await this.holidayRepo.findOne({
                where: { holiday_date: h.date, name: holidayName },
            });

            if (exists) {
                skipped++;
                continue;
            }

            await this.holidayRepo.save(
                this.holidayRepo.create({
                    holiday_date: h.date,
                    name: holidayName,
                    type: this.phHolidayService.mapToHolidayType(h.types),
                    is_recurring: h.fixed,
                }),
            );
            synced++;
        }

        return { synced, skipped };
    }

    async createPeriod(office: string, actor: string, dto: CreatePeriodDto): Promise<EvaluationPeriod> {
        if (new Date(dto.start_date) >= new Date(dto.end_date)) {
            throw new BadRequestException('start_date must be before end_date');
        }

        const overlapping = await this.periodRepo
            .createQueryBuilder('p')
            .where('p.office = :office', { office })
            .andWhere('p.status = :status', { status: PeriodStatus.OPEN })
            .andWhere('p.is_active = true')
            .andWhere('p.start_date <= :end', { end: dto.end_date })
            .andWhere('p.end_date >= :start', { start: dto.start_date })
            .getOne();

        if (overlapping) {
            throw new ConflictException(
                `Selected dates overlap with an existing OPEN period "${overlapping.name}". Please choose dates after the existing period ends.`,
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
    ): Promise<{ data: EvaluationPeriod[]; total: number; page: number; limit: number }> {
        const [data, total] = await this.periodRepo.findAndCount({
            where: { office, is_active: true },
            order: { start_date: pagination.sort_order === 'ASC' ? 'ASC' : 'DESC' },
            skip: (pagination.page - 1) * pagination.limit,
            take: pagination.limit,
        });

        return { data, total, page: pagination.page, limit: pagination.limit };
    }

    async findOnePeriod(id: string): Promise<EvaluationPeriod> {
        const period = await this.periodRepo.findOne({ where: { id } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);
        return period;
    }

    async updatePeriod(id: string, office: string, dto: UpdatePeriodDto): Promise<EvaluationPeriod> {
        const period = await this.periodRepo.findOne({ where: { id, office } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);
        Object.assign(period, dto);
        return this.periodRepo.save(period);
    }

    async closePeriod(id: string, office: string): Promise<EvaluationPeriod> {
        const period = await this.periodRepo.findOne({ where: { id, office } });
        if (!period) throw new NotFoundException(`Period ${id} not found`);

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
        period.is_active = false;
        await this.periodRepo.save(period);
        return { message: `Period ${id} deactivated` };
    }
}