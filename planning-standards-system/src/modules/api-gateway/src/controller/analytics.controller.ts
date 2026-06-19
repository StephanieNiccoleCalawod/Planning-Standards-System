import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) { }

    // for building headers to pass user info to other services
    private downstreamHeaders(req: Request): Record<string, string> {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (req.user) {
            headers['x-office'] = req.user.office ?? 'unknown-office';
            headers['x-role'] = req.user.role ?? 'Admin';
            headers['x-actor-id'] = req.user.userId ?? req.user.sub ?? 'system';
            headers['x-actor-username'] = req.user.username ?? req.user.userId ?? 'system';
            headers['x-arms-role'] = req.user.armsRole ?? req.user.role ?? 'STAFF';
            headers['x-is-cross-office'] = req.user.isCrossOffice ? 'true' : 'false';
        }
        return headers;
    }

    // for safe http get requests, returns fallback if service is down
    private async safeGet<T>(url: string, headers: Record<string, string>, fallback: T): Promise<T> {
        try {
            const res = await firstValueFrom(
                this.http.get(url, { headers, validateStatus: () => true }),
            );
            if (res.status >= 200 && res.status < 300) return res.data as T;
            return fallback;
        } catch {
            return fallback;
        }
    }

    @Get('overall-performance')
    @ApiOperation({ summary: 'Task 8 — institutional analytics: active services, total KPIs, target %, KPI-type distribution' })
    async overallPerformance(@Req() req: Request) {
        const headers = this.downstreamHeaders(req);

        // get service urls from env
        const catalogueUrl = this.config.get<string>('SERVICE_CATALOGUE_URL');
        const kpiSlaUrl = this.config.get<string>('KPI_SLA_URL');

        // fetch from both services at the same time
        const [services, kpis] = await Promise.all([
            this.safeGet<{ total_active_services: number }>(
                `${catalogueUrl}/api/services/analytics/summary`,
                headers,
                { total_active_services: 0 },
            ),
            this.safeGet<{
                total_kpis: number;
                kpi_type_distribution: Record<string, number>;
                overall_target_pct: number | null;
            }>(
                `${kpiSlaUrl}/api/analytics/kpi-summary`,
                headers,
                { total_kpis: 0, kpi_type_distribution: {}, overall_target_pct: null },
            ),
        ]);

        // combine and return
        return {
            total_active_services: services.total_active_services,
            total_kpis: kpis.total_kpis,
            overall_institutional_target_pct: kpis.overall_target_pct,
            kpi_type_distribution: kpis.kpi_type_distribution,
        };
    }
}