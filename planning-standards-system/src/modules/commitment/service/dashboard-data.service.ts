import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

    /**
     * @param office        The authenticated user's own office.
     * @param isCrossOffice True for SUPER_ADMIN / OPCR_EVALUATOR (ARMS isCrossOffice=true, office=null).
     * @param officeParam   Office to view, from ?office=. If omitted for cross-office roles,
     *                       the summary is computed across ALL offices (global view).
     *                       Ignored for office-scoped users (they always see their own office).
     */
    async getSummary(office: string, isCrossOffice: boolean = false, officeParam?: string) {
        // For cross-office roles, an omitted officeParam means "all offices" (global view).
        // For office-scoped roles, the office is always their own — officeParam is ignored.
        const targetOffice: string | undefined = isCrossOffice
            ? (officeParam || undefined)
            : office;
        const isGlobalView = isCrossOffice && !officeParam;

        let activePeriod = null;
        let activeServices = [];
        let activeKpis = 0;

        // ── Fetch active period ─────────────────────────────────────────────
        try {
            const { data: periods } = await lastValueFrom(
                this.httpService.get(`${this.kpiSlaUrl}/api/periods`, {
                    headers: {
                        Authorization: `Bearer service-token`,
                        'x-office': targetOffice ?? 'ALL',
                        'x-is-cross-office': isGlobalView ? 'true' : 'false',
                    },
                })
            );
            const periodList = Array.isArray(periods) ? periods : (periods?.data || []);
            activePeriod = periodList.find(p => p.status === 'Open' || p.status === 'Active') || null;
        } catch (err) {
            this.logger.error('Failed to fetch periods', String(err));
        }

        // ── Fetch services (active + inactive) ──────────────────────────────
        // include_archived=true so we get ALL non-archived statuses (ACTIVE + INACTIVE),
        // letting us compute an accurate active/inactive split below.
        let allServices = [];
        try {
            const { data: services } = await lastValueFrom(
                this.httpService.get(`${this.catalogueUrl}/api/services`, {
                    headers: {
                        Authorization: `Bearer service-token`,
                        'x-office': targetOffice ?? 'ALL',
                        'x-is-cross-office': isGlobalView ? 'true' : 'false',
                    },
                    params: { include_archived: true, limit: 1000 },
                })
            );
            allServices = Array.isArray(services) ? services : (services?.data || []);
        } catch (err) {
            this.logger.error('Failed to fetch services', String(err));
        }

        // Only count services whose status is Active (exclude Inactive / Archived).
        // ServiceStatus enum values are 'Active' | 'Inactive' | 'Archived'.
        activeServices = allServices.filter((s) => s.status === 'Active');

        // ── Task 3: COUNT KPIs via DB query instead of fetching the full list
        // First try a direct COUNT from the commitment_item table (most reliable
        // since it reflects what this office has actually committed to).
        // If no items exist yet, fall back to fetching the kpi-sla catalogue.
        // ────────────────────────────────────────────────────────────────────
        try {
            const itemQuery = this.itemRepo
                .createQueryBuilder('item')
                .innerJoin('item.commitment', 'commitment')
                .select('COUNT(DISTINCT item.kpi_id)', 'count');

            if (!isGlobalView) {
                itemQuery.where('commitment.office = :office', { office: targetOffice });
            }

            const dbKpiCount = await itemQuery.getRawOne<{ count: string }>();

            const countFromDb = parseInt(dbKpiCount?.count ?? '0', 10);

            if (countFromDb > 0) {
                // Use DB count — fast, no HTTP call needed
                activeKpis = countFromDb;
            } else {
                // Fall back: fetch from kpi-sla catalogue and count the list
                const { data: kpis } = await lastValueFrom(
                    this.httpService.get(`${this.kpiSlaUrl}/api/kpis?include_inactive=false`, {
                        headers: {
                            Authorization: `Bearer service-token`,
                            'x-office': targetOffice ?? 'ALL',
                            'x-is-cross-office': isGlobalView ? 'true' : 'false',
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
        // Commitment status is inherently office-scoped — for a global view
        // there's no single "current commitment", so we skip this lookup.
        let commitmentStatus = 'None';
        let commitment = null;
        if (activePeriod && !isGlobalView && targetOffice) {
            commitment = await this.commitmentRepo.findOne({
                where: { office: targetOffice, period_id: activePeriod.id },
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
            office: isGlobalView ? 'ALL' : targetOffice,
            current_period: activePeriod || null,
            active_services_count: activeServices.length,
            total_services_count: allServices.length,
            active_kpis_count: activeKpis,   // renamed field kept for backward compat
            kpi_count: activeKpis,            // explicit count field for frontend
            commitment_status: commitmentStatus,
            services: servicesWithTargets,
        };
    }
}