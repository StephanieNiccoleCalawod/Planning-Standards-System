import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { CommitmentService } from '../service/commitment.service';
import { CreateCommitmentDto } from '../dto/create-commitment.dto';
import { UpdateCommitmentDto } from '../dto/update-commitment.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { GetCommitmentsQueryDto } from '../dto/get-commitments-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permission } from '../../../common/rbac/permission.enum';

@ApiTags('OPCR Commitments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiHeader({
  name: 'x-office',
  description: 'Office identifier set by the gateway from the validated ARMS token',
  required: false,
})
@Controller('api')
export class CommitmentController {
  constructor(private readonly svc: CommitmentService) {}

  @Post('commitments')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Permission.COMMITMENTS_WRITE)
  @ApiOperation({ summary: 'Create a new commitment draft' })
  createCommitment(@Request() req, @Body() dto: CreateCommitmentDto) {
    const office = req.user?.office ?? 'unknown-office';
    const actor = req.user?.sub ?? 'system';
    return this.svc.createCommitment(office, actor, dto, {
      actor_role: req.user?.armsRole,
      actor_username: req.user?.username,
      ip_address: req.headers['x-client-ip'],
    });
  }

  @Get('commitments')
  @Roles(Permission.COMMITMENTS_READ)
  @ApiOperation({ summary: 'Get all commitments for the authenticated office (paginated). Cross-office roles see all offices.' })
  @ApiQuery({ name: 'period_id', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Draft', 'Locked'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort_by', required: false })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  findAllCommitments(
    @Request() req,
    @Query() query: GetCommitmentsQueryDto,
  ) {
    const office = req.user?.office ?? 'unknown-office';
    const isCrossOffice = req.user?.isCrossOffice ?? false;
    const { period_id, status, ...pagination } = query;
    return this.svc.findAllCommitments(office, { period_id, status }, pagination, isCrossOffice);
  }

  @Get('commitments/:id')
  @Roles(Permission.COMMITMENTS_READ)
  @ApiOperation({ summary: 'Get a single commitment by ID (with items and versions). Cross-office roles can view commitments from other offices.' })
  findOneCommitment(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'unknown-office';
    const isCrossOffice = req.user?.isCrossOffice ?? false;
    return this.svc.findOneCommitment(id, office, isCrossOffice);
  }

  @Patch('commitments/:id')
  @Roles(Permission.COMMITMENTS_WRITE)
  @ApiOperation({ summary: 'Update a draft commitment (auto-save / manual save)' })
  updateCommitment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCommitmentDto,
  ) {
    const office = req.user?.office ?? 'unknown-office';
    const actor = req.user?.sub ?? 'system';
    const isCrossOffice = req.user?.isCrossOffice ?? false;
    return this.svc.updateCommitment(id, office, actor, dto, isCrossOffice);
  }

  @Patch('commitments/:id/lock')
  @Roles(Permission.COMMITMENTS_LOCK)
  @ApiOperation({ summary: 'Lock and submit a commitment — makes it immutable' })
  lockCommitment(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'unknown-office';
    const actor = req.user?.sub ?? 'system';
    const isCrossOffice = req.user?.isCrossOffice ?? false;
    return this.svc.lockCommitment(id, office, actor, {
      actor_role: req.user?.armsRole,
      actor_username: req.user?.username,
      ip_address: req.headers['x-client-ip'],
    }, isCrossOffice);
  }

  @Get('opcr/commitments')
  @Roles(Permission.COMMITMENTS_READ)
  @ApiOperation({ summary: 'Get all locked (submitted) commitments — OPCR data endpoint. Cross-office roles see all offices.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findLockedCommitments(@Request() req, @Query() pagination?: PaginationDto) {
    const office = req.user?.office ?? 'unknown-office';
    const isCrossOffice = req.user?.isCrossOffice ?? false;
    return this.svc.findLockedCommitments(office, pagination, isCrossOffice);
  }
}
