import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { KpiSlaService } from '../service/kpi-sla.service';
import { CreateKpiDto } from '../dto/create-kpi.dto';
import { UpdateKpiDto } from '../dto/update-kpi.dto';
import { CreateSlaRuleDto } from '../dto/create-sla-rule.dto';
import { UpdateSlaRuleDto } from '../dto/update-sla-rule.dto';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';

@ApiTags('KPI & SLA Standards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class KpiSlaController {
  constructor(private readonly svc: KpiSlaService) {}

  @Post('kpis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a KPI' })
  createKpi(@Request() req, @Body() dto: CreateKpiDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.createKpi(office, actor, dto);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get all KPIs for the authenticated office' })
  @ApiQuery({ name: 'service_id', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAllKpis(
    @Request() req,
    @Query('service_id') service_id?: string,
    @Query('category') category?: string,
  ) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findAllKpis(office, { service_id, category });
  }

  @Put('kpis/:id')
  @ApiOperation({ summary: 'Update a KPI' })
  updateKpi(@Request() req, @Param('id') id: string, @Body() dto: UpdateKpiDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.updateKpi(id, office, dto);
  }

  @Delete('kpis/:id')
  @ApiOperation({ summary: 'Soft-delete a KPI' })
  removeKpi(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.removeKpi(id, office);
  }

  @Post('sla-rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an SLA rule' })
  createSlaRule(@Request() req, @Body() dto: CreateSlaRuleDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.createSlaRule(office, dto);
  }

  @Get('sla-rules')
  @ApiOperation({ summary: 'Get all SLA rules for the authenticated office' })
  findAllSlaRules(@Request() req) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findAllSlaRules(office);
  }

  @Put('sla-rules/:id')
  @ApiOperation({ summary: 'Update SLA rule (saves version history)' })
  updateSlaRule(@Request() req, @Param('id') id: string, @Body() dto: UpdateSlaRuleDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.updateSlaRule(id, office, actor, dto);
  }

  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a holiday' })
  createHoliday(@Request() req, @Body() dto: CreateHolidayDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.createHoliday(office, dto);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Get all holidays for the authenticated office' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false })
  findAllHolidays(
    @Request() req,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('type') type?: string,
  ) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findAllHolidays(office, { month, year, type });
  }

  @Put('holidays/:id')
  @ApiOperation({ summary: 'Update a holiday' })
  updateHoliday(@Request() req, @Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.updateHoliday(id, office, dto);
  }

  @Delete('holidays/:id')
  @ApiOperation({ summary: 'Delete a holiday' })
  removeHoliday(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.removeHoliday(id, office);
  }

  @Post('periods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an evaluation period' })
  createPeriod(@Request() req, @Body() dto: CreatePeriodDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.createPeriod(office, dto);
  }

  @Get('periods')
  @ApiOperation({ summary: 'Get all evaluation periods for the authenticated office' })
  findAllPeriods(@Request() req) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findAllPeriods(office);
  }

  @Put('periods/:id')
  @ApiOperation({ summary: 'Update an evaluation period' })
  updatePeriod(@Request() req, @Param('id') id: string, @Body() dto: UpdatePeriodDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.updatePeriod(id, office, dto);
  }

  @Patch('periods/:id/close')
  @ApiOperation({ summary: 'Close an evaluation period' })
  closePeriod(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.closePeriod(id, office);
  }

  @Delete('periods/:id')
  @ApiOperation({ summary: 'Delete an evaluation period' })
  removePeriod(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.removePeriod(id, office);
  }
}