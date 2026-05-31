import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Commitment } from '../database/commitment.entity';
import { CommitmentStatus } from '../enums';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private kpiSlaUrl: string;
  private catalogueUrl: string;

  constructor(
    @InjectRepository(Commitment, 'commitment_db')
    private readonly commitmentRepo: Repository<Commitment>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.kpiSlaUrl = this.configService.get<string>('KPI_SLA_SERVICE_URL') || 'http://kpi-sla:3001';
    this.catalogueUrl = this.configService.get<string>('SERVICE_CATALOGUE_URL') || 'http://service-catalogue:3000';
  }

  async getSummary(office: string) {
    let activePeriod = null;
    let activeServices = 0;
    let activeKpis = 0;

    // 1. Fetch Active Period
    try {
      const { data: periods } = await lastValueFrom(
        this.httpService.get(`${this.kpiSlaUrl}/api/periods`, {
          headers: {
            Authorization: `Bearer mock-token`,
            'x-mock-office': office,
          },
        })
      );
      // Backend returns { data, total... } for periods? Wait, the KPI service might just return an array or { data: [] }
      const periodList = Array.isArray(periods) ? periods : (periods?.data || []);
      activePeriod = periodList.find(p => p.status === 'Active' || p.status === 'Open');
    } catch (err) {
      this.logger.error('Failed to fetch periods', err);
    }

    // 2. Fetch Active Services Count
    try {
      const { data: services } = await lastValueFrom(
        this.httpService.get(`${this.catalogueUrl}/api/services?status=ACTIVE`, {
          headers: {
            Authorization: `Bearer mock-token`,
            'x-mock-office': office,
          },
        })
      );
      const serviceList = Array.isArray(services) ? services : (services?.data || []);
      activeServices = serviceList.filter(s => (s.status === 'ACTIVE' || s.is_active || s.active) && (!s.archived && s.status !== 'ARCHIVED')).length;
    } catch (err) {
      this.logger.error('Failed to fetch services', err);
    }

    // 3. Fetch Active KPIs Count
    try {
      const { data: kpis } = await lastValueFrom(
        this.httpService.get(`${this.kpiSlaUrl}/api/kpis?include_inactive=false`, {
          headers: {
            Authorization: `Bearer mock-token`,
            'x-mock-office': office,
          },
        })
      );
      const kpiList = Array.isArray(kpis) ? kpis : (kpis?.data || []);
      activeKpis = kpiList.length;
    } catch (err) {
      this.logger.error('Failed to fetch KPIs', err);
    }

    // 4. Fetch Commitment Status for Active Period
    let commitmentStatus = 'Not Started';
    if (activePeriod) {
      const commitment = await this.commitmentRepo.findOne({
        where: { office, period_id: activePeriod.id.toString() },
      });
      if (commitment) {
        commitmentStatus = commitment.status; // 'Draft' or 'Locked'
      }
    }

    return {
      active_period: activePeriod || null,
      active_services_count: activeServices,
      active_kpis_count: activeKpis,
      commitment_status: commitmentStatus,
    };
  }
}

