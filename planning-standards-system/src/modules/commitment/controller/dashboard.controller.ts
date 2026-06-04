import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { DashboardService } from '../service/dashboard-data.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardSvc: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get aggregated dashboard summary for the active period' })
  async getSummary(@Request() req) {
    const office = req.user?.office ?? 'mock-office';
    return this.dashboardSvc.getSummary(office);
  }
}
