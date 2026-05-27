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
import { PaginationDto } from '../dto/pagination.dto';
import { GetKpisQueryDto } from '../dto/get-kpis-query.dto';
import { GetHolidaysQueryDto } from '../dto/get-holidays-query.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';

@ApiTags('KPI & SLA Standards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class KpiSlaController {
  constructor(private readonly svc: KpiSlaService) {}

  // ─── KPIs ───────────────────────────────────────────────────────────────

  @Post('kpis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a KPI' })
  createKpi(@Request() req, @Body() dto: CreateKpiDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.createKpi(office, actor, dto);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get all KPIs for the authenticated office (paginated)' })
  @ApiQuery({ name: 'service_id', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  findAllKpis(
    @Request() req,
    @Query() query: GetKpisQueryDto,
  ) {
    const office = req.user?.office ?? 'mock-office';
    const { service_id, category, include_inactive, ...pagination } = query;
    const includeInactiveBool = include_inactive === 'true';
    return this.svc.findAllKpis(office, { service_id, category, include_inactive: includeInactiveBool }, pagination);
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

  // ─── SLA Rules ──────────────────────────────────────────────────────────

  @Post('sla-rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an SLA rule' })
  createSlaRule(@Request() req, @Body() dto: CreateSlaRuleDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.createSlaRule(office, actor, dto);
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

  // ─── Holidays ───────────────────────────────────────────────────────────

  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a holiday' })
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.svc.createHoliday(dto);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'Get all holidays (paginated)' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllHolidays(
    @Query() query: GetHolidaysQueryDto,
  ) {
    const { month, year, type, ...pagination } = query;
    return this.svc.findAllHolidays({ month, year, type }, pagination);
  }

  @Put('holidays/:id')
  @ApiOperation({ summary: 'Update a holiday' })
  updateHoliday(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.svc.updateHoliday(id, dto);
  }

  @Delete('holidays/:id')
  @ApiOperation({ summary: 'Delete a holiday' })
  removeHoliday(@Param('id') id: string) {
    return this.svc.removeHoliday(id);
  }

  // ─── Evaluation Periods ─────────────────────────────────────────────────

  @Post('periods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an evaluation period' })
  createPeriod(@Request() req, @Body() dto: CreatePeriodDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.createPeriod(office, actor, dto);
  }

  @Get('periods')
  @ApiOperation({ summary: 'Get all evaluation periods for the authenticated office (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllPeriods(@Request() req, @Query() pagination?: PaginationDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findAllPeriods(office, pagination);
  }

  @Get('periods/:id')
  @ApiOperation({ summary: 'Get a single evaluation period by ID (includes soft-deleted — for ARMS compatibility)' })
  findOnePeriod(@Param('id') id: string) {
    return this.svc.findOnePeriod(id);
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