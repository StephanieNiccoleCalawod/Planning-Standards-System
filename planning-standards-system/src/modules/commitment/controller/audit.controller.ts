import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from '../service/audit.service';
import { JwtAuthGuard } from '../guards/jwt.guard';

@ApiTags('Audit Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/audit-events')
export class AuditController {
    constructor(private readonly auditSvc: AuditService) { }

    @Get()
    @ApiOperation({ summary: 'Get all audit events — fetched by audit group' })
    @ApiQuery({ name: 'is_synced', required: false, type: Boolean })
    @ApiQuery({ name: 'event', required: false })
    @ApiQuery({ name: 'office_id', required: false })
    findAll(
        @Query('is_synced') is_synced?: string,
        @Query('event') event?: string,
        @Query('office_id') office_id?: string,
    ) {
        const isSyncedBool = is_synced !== undefined ? is_synced === 'true' : undefined;
        return this.auditSvc.findAll({ is_synced: isSyncedBool, event, office_id });
    }

    @Patch(':id/sync')
    @ApiOperation({ summary: 'Mark an audit event as synced' })
    markSynced(@Param('id') id: string) {
        return this.auditSvc.markSynced(id);
    }
}