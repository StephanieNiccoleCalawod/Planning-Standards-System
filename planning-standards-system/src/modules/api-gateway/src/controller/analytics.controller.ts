import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Task 8 — GET /api/analytics/overall-performance
 *
 * Real (non-proxy) endpoint. Aggregates institutional figures across two
 * microservices, since "total active services" lives in service-catalogue and
 * "total KPIs / type distribution / target %" live in kpi-sla:
 *   - service-catalogue  GET /api/services/analytics/summary
 *   - kpi-sla            GET /api/analytics/kpi-summary
 *
 * Returns a flat shape for the dashboard's 3 metric cards + KPI-type chart.
 * Resilient: if a downstream call fails, that section degrades to 0/empty
 * rather than failing the whole dashboard.
 */
@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private downstreamHeaders(req: Request): Record<string, string> {
    // Mirror the headers ProxyService injects so downstream guards accept the
    // internal call. The summary endpoints count institutionally and ignore
    // office, so we forward the validated user as-is.
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
    const catalogueUrl = this.config.get<string>('SERVICE_CATALOGUE_URL');
    const kpiSlaUrl = this.config.get<string>('KPI_SLA_URL');

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

    return {
      total_active_services: services.total_active_services,
      total_kpis: kpis.total_kpis,
      overall_institutional_target_pct: kpis.overall_target_pct,
      kpi_type_distribution: kpis.kpi_type_distribution,
    };
  }
}
