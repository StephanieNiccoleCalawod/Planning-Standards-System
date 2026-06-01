import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServiceCatalogueService } from '../service/service-catalogue.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { CreateIntakeFieldDto } from '../dto/create-intake-field.dto';
import { UpdateIntakeFieldDto } from '../dto/update-intake-field.dto';
import { CreateNaFlagDto } from '../dto/create-na-flag.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { GetServicesQueryDto } from '../dto/get-services-query.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';

@ApiTags('Service Catalogue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/services')
export class ServiceCatalogueController {
  constructor(private readonly svc: ServiceCatalogueService) {}

  @Get()
  @ApiOperation({ summary: 'Get all services for the authenticated office (paginated)' })
  @ApiQuery({ name: 'classification', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'include_archived', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  findAll(
    @Request() req,
    @Query() query: GetServicesQueryDto,
  ) {
    const office = req.user?.office ?? 'mock-office';
    const { classification, status, search, include_archived, ...pagination } = query;
    return this.svc.findAll(office, { classification, status, search, include_archived }, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findOne(id, office);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service' })
  create(@Request() req, @Body() dto: CreateServiceDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.create(office, dto, actor);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service (with audit logging)' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.update(id, office, dto, actor);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a service' })
  archive(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.archive(id, office, actor);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a service (set status to ACTIVE)' })
  activate(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.activate(id, office, actor);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a service (set status to INACTIVE)' })
  deactivate(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.deactivate(id, office, actor);
  }

  @Get(':id/intake-fields')
  @ApiOperation({ summary: 'Get all intake fields of a service' })
  getIntakeFields(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.getIntakeFields(id, office);
  }

  @Post(':id/intake-fields')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an intake field to a service' })
  createIntakeField(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateIntakeFieldDto,
  ) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.createIntakeField(id, office, dto);
  }

  @Put(':id/intake-fields/:fieldId')
  @ApiOperation({ summary: 'Update an intake field' })
  updateIntakeField(
    @Request() req,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateIntakeFieldDto,
  ) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.updateIntakeField(id, office, fieldId, dto);
  }

  @Delete(':id/intake-fields/:fieldId')
  @ApiOperation({ summary: 'Deactivate an intake field' })
  removeIntakeField(
    @Request() req,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
  ) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.removeIntakeField(id, office, fieldId);
  }

  @Get(':id/na-flags')
  @ApiOperation({ summary: 'Get all NA flags of a service' })
  getNaFlags(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.getNaFlags(id, office);
  }

  @Post(':id/na-flags')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Flag a service as Not Applicable for a period' })
  createNaFlag(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateNaFlagDto,
  ) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.createNaFlag(id, office, dto, actor);
  }

  @Delete(':id/na-flags/:flagId')
  @ApiOperation({ summary: 'Lift a NA flag' })
  removeNaFlag(
    @Request() req,
    @Param('id') id: string,
    @Param('flagId') flagId: string,
  ) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.removeNaFlag(id, office, flagId);
  }
}