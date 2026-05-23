import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Kpi } from '../database/kpi.entity';
import { SlaRule } from '../database/sla-rule.entity';
import { SlaRuleVersion } from '../database/sla-rule-version.entity';
import { Holiday } from '../database/holiday.entity';
import { EvaluationPeriod, PeriodStatus } from '../database/evaluation-period.entity';
import { CreateKpiDto } from '../dto/create-kpi.dto';
import { UpdateKpiDto } from '../dto/update-kpi.dto';
import { CreateSlaRuleDto } from '../dto/create-sla-rule.dto';
import { UpdateSlaRuleDto } from '../dto/update-sla-rule.dto';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';

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
  ) {}

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
  //  if (dto.service_id) await this.validateServiceExists(dto.service_id, office); //wag tanggalin kasi wala pa jwt
    const kpi = this.kpiRepo.create({ ...dto, office, created_by: actor });
    return this.kpiRepo.save(kpi);
  }

  async findAllKpis(office: string, filters: { service_id?: string; category?: string }): Promise<Kpi[]> {
    const query = this.kpiRepo
      .createQueryBuilder('kpi')
      .where('kpi.office = :office', { office })
      .andWhere('kpi.is_active = true');

    if (filters.service_id) query.andWhere('kpi.service_id = :service_id', { service_id: filters.service_id });
    if (filters.category) query.andWhere('kpi.category = :category', { category: filters.category });

    return query.getMany();
  }

  async updateKpi(id: string, office: string, dto: UpdateKpiDto): Promise<Kpi> {
    const kpi = await this.kpiRepo.findOne({ where: { id, office, is_active: true } });
    if (!kpi) throw new NotFoundException(`KPI ${id} not found`);
    Object.assign(kpi, dto);
    return this.kpiRepo.save(kpi);
  }

  async removeKpi(id: string, office: string): Promise<{ message: string }> {
    const kpi = await this.kpiRepo.findOne({ where: { id, office, is_active: true } });
    if (!kpi) throw new NotFoundException(`KPI ${id} not found`);
    kpi.is_active = false;
    await this.kpiRepo.save(kpi);
    return { message: `KPI ${id} deactivated` };
  }

  async createSlaRule(office: string, dto: CreateSlaRuleDto): Promise<SlaRule> {
    const rule = this.slaRepo.create({ ...dto, office });
    return this.slaRepo.save(rule);
  }

  async findAllSlaRules(office: string): Promise<SlaRule[]> {
    return this.slaRepo.find({ where: { office, is_active: true } });
  }

  async updateSlaRule(id: string, office: string, actor: string, dto: UpdateSlaRuleDto): Promise<SlaRule> {
    const existing = await this.slaRepo.findOne({ where: { id, office } });
    if (!existing) throw new NotFoundException(`SLA Rule ${id} not found`);

    await this.slaVersionRepo.save(
      this.slaVersionRepo.create({
        sla_rule_id: existing.id,
        work_schedule: existing.work_schedule,
        work_start_time: existing.work_start_time,
        work_end_time: existing.work_end_time,
        warn_threshold_pct: existing.warn_threshold_pct,
        changed_by: actor,
      }),
    );

    Object.assign(existing, dto);
    return this.slaRepo.save(existing);
  }

  async createHoliday(office: string, dto: CreateHolidayDto): Promise<Holiday[]> {
    const exists = await this.holidayRepo.findOne({
      where: { office, holiday_date: dto.holiday_date },
    });
    if (exists) throw new ConflictException('Holiday already exists for this date and office');

    const holidays: Holiday[] = [];
    const baseDate = new Date(dto.holiday_date);
    const yearsToCreate = dto.is_recurring ? 5 : 1;

    for (let i = 0; i < yearsToCreate; i++) {
      const date = new Date(baseDate);
      date.setFullYear(date.getFullYear() + i);
      const holiday = this.holidayRepo.create({
        ...dto,
        office,
        holiday_date: date.toISOString().split('T')[0],
      });
      holidays.push(await this.holidayRepo.save(holiday));
    }
    return holidays;
  }

  async findAllHolidays(office: string, filters: { month?: number; year?: number; type?: string }): Promise<Holiday[]> {
    const query = this.holidayRepo
      .createQueryBuilder('h')
      .where('h.office = :office', { office })
      .orderBy('h.holiday_date', 'ASC');

    if (filters.month) query.andWhere('EXTRACT(MONTH FROM h.holiday_date::date) = :month', { month: filters.month });
    if (filters.year) query.andWhere('EXTRACT(YEAR FROM h.holiday_date::date) = :year', { year: filters.year });
    if (filters.type) query.andWhere('h.type = :type', { type: filters.type });

    return query.getMany();
  }

  async updateHoliday(id: string, office: string, dto: UpdateHolidayDto): Promise<Holiday> {
    const holiday = await this.holidayRepo.findOne({ where: { id, office } });
    if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
    Object.assign(holiday, dto);
    return this.holidayRepo.save(holiday);
  }

  async removeHoliday(id: string, office: string): Promise<{ message: string }> {
    const holiday = await this.holidayRepo.findOne({ where: { id, office } });
    if (!holiday) throw new NotFoundException(`Holiday ${id} not found`);
    await this.holidayRepo.delete(id);
    return { message: `Holiday ${id} removed` };
  }

  async createPeriod(office: string, dto: CreatePeriodDto): Promise<EvaluationPeriod> {
    const active = await this.periodRepo.findOne({ where: { office, status: PeriodStatus.ACTIVE } });
    if (active) throw new ConflictException('An active period already exists for this office');
    const period = this.periodRepo.create({ ...dto, office });
    return this.periodRepo.save(period);
  }

  async findAllPeriods(office: string): Promise<EvaluationPeriod[]> {
    return this.periodRepo.find({ where: { office }, order: { start_date: 'DESC' } });
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
    return this.periodRepo.save(period);
  }

  async removePeriod(id: string, office: string): Promise<{ message: string }> {
    const period = await this.periodRepo.findOne({ where: { id, office } });
    if (!period) throw new NotFoundException(`Period ${id} not found`);
    await this.periodRepo.delete(id);
    return { message: `Period ${id} deleted` };
  }

}