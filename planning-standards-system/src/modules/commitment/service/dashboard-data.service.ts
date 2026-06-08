import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Commitment } from '../database/commitment.entity';
import { CommitmentItem } from '../database/commitment-item.entity';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);
    private kpiSlaUrl: string;
    private catalogueUrl: string;

    constructor(
        @InjectRepository(Commitment, 'commitment_db')
        private readonly commitmentRepo: Repository<Commitment>,

        @InjectRepository(CommitmentItem, 'commitment_db')
        private readonly itemRepo: Repository<CommitmentItem>,

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

        // ── Fetch active period ─────────────────────────────────────────────
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

        // ── Fetch active services ───────────────────────────────────────────
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

        // ── Task 3: COUNT KPIs via DB query instead of fetching the full list
        // First try a direct COUNT from the commitment_item table (most reliable
        // since it reflects what this office has actually committed to).
        // If no items exist yet, fall back to fetching the kpi-sla catalogue.
        // ────────────────────────────────────────────────────────────────────
        try {
            // Count distinct KPI IDs already used in this office's commitments
            const dbKpiCount = await this.itemRepo
                .createQueryBuilder('item')
                .innerJoin('item.commitment', 'commitment')
                .where('commitment.office = :office', { office })
                .select('COUNT(DISTINCT item.kpi_id)', 'count')
                .getRawOne<{ count: string }>();

            const countFromDb = parseInt(dbKpiCount?.count ?? '0', 10);

            if (countFromDb > 0) {
                // Use DB count — fast, no HTTP call needed
                activeKpis = countFromDb;
            } else {
                // Fall back: fetch from kpi-sla catalogue and count the list
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
            }
        } catch (err) {
            this.logger.error('Failed to count KPIs', String(err));
        }

        // ── Fetch current commitment for this office ────────────────────────
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

        // ── Map services with commitment targets ────────────────────────────
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

        // ── Task 3: Return kpi_count explicitly for the frontend ────────────
        return {
            current_period: activePeriod || null,
            active_services_count: activeServices.length,
            active_kpis_count: activeKpis,   // renamed field kept for backward compat
            kpi_count: activeKpis,            // explicit count field for frontend
            commitment_status: commitmentStatus,
            services: servicesWithTargets,
        };
    }
}