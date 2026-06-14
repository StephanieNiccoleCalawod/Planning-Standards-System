import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/rbac/permission.enum';
import { DashboardService } from '../service/dashboard-data.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardSvc: DashboardService) {}

  @Get('summary')
  @Roles(Permission.COMMITMENTS_READ)
  @ApiOperation({ summary: 'Get aggregated dashboard summary for the active period' })
  async getSummary(@Request() req) {
    const office = req.user?.office ?? 'mock-office';
    return this.dashboardSvc.getSummary(office);
  }
}
