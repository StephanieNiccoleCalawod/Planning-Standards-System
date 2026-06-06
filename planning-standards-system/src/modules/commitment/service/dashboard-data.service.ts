import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Commitment } from '../database/commitment.entity';

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
        this.kpiSlaUrl = this.configService.get<string>('KPI_SLA_URL');
        this.catalogueUrl = this.configService.get<string>('SERVICE_CATALOGUE_URL');
    }

    async getSummary(office: string) {
        let activePeriod = null;
        let activeServices = [];
        let activeKpis = 0;

        try {
            const { data: periods } = await lastValueFrom(
                this.httpService.get(`${this.kpiSlaUrl}/api/periods`, {
                    headers: {
                        Authorization: `Bearer mock-token`,
                        'x-mock-office': office,
                    },
                })
            );
            const periodList = Array.isArray(periods) ? periods : (periods?.data || []);
            activePeriod = periodList.find(p => p.status === 'Open' || p.status === 'Active') || null;
        } catch (err) {
            this.logger.error('Failed to fetch periods', String(err));
        }

        try {
            const { data: services } = await lastValueFrom(
                this.httpService.get(`${this.catalogueUrl}/api/services`, {
                    headers: {
                        Authorization: `Bearer mock-token`,
                        'x-mock-office': office,
                    },
                })
            );
            activeServices = Array.isArray(services) ? services : (services?.data || []);
        } catch (err) {
            this.logger.error('Failed to fetch services', String(err));
        }

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
            this.logger.error('Failed to fetch KPIs', String(err));
        }

        let commitmentStatus = 'None';
        let commitment = null;
        if (activePeriod) {
            commitment = await this.commitmentRepo.findOne({
                where: { office, period_id: activePeriod.id },
                relations: { items: true },
            });
            if (commitment) {
                commitmentStatus = commitment.status;
            }
        }

        const servicesWithTargets = activeServices.map((service) => {
            let commitmentTarget = null;
            if (commitment?.items?.length) {
                const matchedItem = commitment.items.find(
                    (item) => item.service_id === service.id,
                );
                commitmentTarget = matchedItem?.target_value ?? null;
            }
            return {
                id: service.id,
                name: service.name,
                sla_target: `${service.sla_target_value} ${service.sla_target_unit}`,
                commitment_target: commitmentTarget,
            };
        });

        return {
            current_period: activePeriod || null,
            active_services_count: activeServices.length,
            active_kpis_count: activeKpis,
            commitment_status: commitmentStatus,
            services: servicesWithTargets,
        };
    }
}