import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from '../service/audit.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permission } from '../../../common/rbac/permission.enum';

@ApiTags('Audit Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/audit-events')
export class AuditController {
    constructor(private readonly auditSvc: AuditService) { }

    // for getting all audit events with optional filters
    @Get()
    @Roles(Permission.COMMITMENTS_READ)
    @ApiOperation({ summary: 'Get all audit events - fetched by audit group' })
    @ApiQuery({ name: 'is_synced', required: false, type: Boolean })
    @ApiQuery({ name: 'event', required: false })
    @ApiQuery({ name: 'office_id', required: false })
    findAll(
        @Query('is_synced') is_synced?: string,
        @Query('event') event?: string,
        @Query('office_id') office_id?: string,
    ) {
        // convert is_synced string to boolean before passing to service
        const isSyncedBool = is_synced !== undefined ? is_synced === 'true' : undefined;
        return this.auditSvc.findAll({ is_synced: isSyncedBool, event, office_id });
    }

    // for marking an audit event as synced
    @Patch(':id/sync')
    @Roles(Permission.COMMITMENTS_WRITE)
    @ApiOperation({ summary: 'Mark an audit event as synced' })
    markSynced(@Param('id') id: string) {
        return this.auditSvc.markSynced(id);
    }

    // for logging a new audit event from other pss microservices or the gateway
    @Post()
    @ApiOperation({ summary: 'Log a new audit event (used by other PSS microservices and the gateway)' })
    async createEvent(@Request() req, @Body() payload: any) {
        const enriched = {
            ...payload,
            actor_role: payload.actor_role ?? req.headers['x-arms-role'] ?? req.user?.armsRole,
            actor_username: payload.actor_username ?? req.headers['x-actor-username'] ?? req.user?.username,
            ip_address: payload.ip_address ?? req.headers['x-client-ip'],
        };
        await this.auditSvc.log(enriched);
        return { success: true };
    }
}