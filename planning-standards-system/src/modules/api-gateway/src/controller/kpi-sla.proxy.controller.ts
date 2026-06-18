import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProxyService } from '../service/proxy.service';

@ApiTags('KPI & SLA (proxied)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class KpiSlaProxyController {
    constructor(
        private readonly proxy: ProxyService,
        private readonly config: ConfigService,
    ) { }

    private get target(): string {
        return this.config.get<string>('KPI_SLA_URL');
    }

    @All('kpis')
    @ApiOperation({ summary: 'Proxies to kpi-sla: /api/kpis' })
    kpis(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('kpis/*')
    kpisWildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('sla-rules')
    @ApiOperation({ summary: 'Proxies to kpi-sla: /api/sla-rules' })
    slaRules(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('sla-rules/*')
    slaRulesWildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('holidays')
    @ApiOperation({ summary: 'Proxies to kpi-sla: /api/holidays' })
    holidays(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('holidays/*')
    holidaysWildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('periods')
    @ApiOperation({ summary: 'Proxies to kpi-sla: /api/periods' })
    periods(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('periods/*')
    periodsWildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    // ── Task 9: SLA Computation Monitor (read-only log + utilization) ──────
    @All('sla-computation-logs')
    @ApiOperation({ summary: 'Proxies to kpi-sla: /api/sla-computation-logs' })
    slaComputationLogs(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('sla-computation-logs/*')
    slaComputationLogsWildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('service-utilization')
    @ApiOperation({ summary: 'Proxies to kpi-sla: /api/service-utilization' })
    serviceUtilization(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }

    @All('service-utilization/*')
    serviceUtilizationWildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.target);
    }
}
