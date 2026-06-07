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
import { JwtAuthGuard } from '../guards/jwt.guard';

@ApiTags('OPCR Commitments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiHeader({
  name: 'x-mock-office',
  description: 'Mock office identifier (e.g. mock-office or mock-office-2)',
  required: false,
})
@Controller('api')
export class CommitmentController {
  constructor(private readonly svc: CommitmentService) {}

  @Post('commitments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new commitment draft' })
  createCommitment(@Request() req, @Body() dto: CreateCommitmentDto) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.createCommitment(office, actor, dto);
  }

  @Get('commitments')
  @ApiOperation({ summary: 'Get all commitments for the authenticated office (paginated)' })
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
    const office = req.user?.office ?? 'mock-office';
    const { period_id, status, ...pagination } = query;
    return this.svc.findAllCommitments(office, { period_id, status }, pagination);
  }

  @Get('commitments/:id')
  @ApiOperation({ summary: 'Get a single commitment by ID (with items and versions)' })
  findOneCommitment(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findOneCommitment(id, office);
  }

  @Patch('commitments/:id')
  @ApiOperation({ summary: 'Update a draft commitment (auto-save / manual save)' })
  updateCommitment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCommitmentDto,
  ) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.updateCommitment(id, office, actor, dto);
  }

  @Patch('commitments/:id/lock')
  @ApiOperation({ summary: 'Lock and submit a commitment — makes it immutable' })
  lockCommitment(@Request() req, @Param('id') id: string) {
    const office = req.user?.office ?? 'mock-office';
    const actor = req.user?.sub ?? 'mock-actor';
    return this.svc.lockCommitment(id, office, actor);
  }

  @Get('opcr/commitments')
  @ApiOperation({ summary: 'Get all locked (submitted) commitments — OPCR data endpoint' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findLockedCommitments(@Request() req, @Query() pagination?: PaginationDto) {
    const office = req.user?.office ?? 'mock-office';
    return this.svc.findLockedCommitments(office, pagination);
  }
}