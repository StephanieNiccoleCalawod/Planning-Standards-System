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
        const isSyncedBool = is_synced !== undefined ? is_synced === 'true' : undefined;
        return this.auditSvc.findAll({ is_synced: isSyncedBool, event, office_id });
    }

    @Patch(':id/sync')
    @Roles(Permission.COMMITMENTS_WRITE)
    @ApiOperation({ summary: 'Mark an audit event as synced' })
    markSynced(@Param('id') id: string) {
        return this.auditSvc.markSynced(id);
    }

    @Post()
    @ApiOperation({ summary: 'Log a new audit event (used by other PSS microservices and the gateway)' })
    async createEvent(@Request() req, @Body() payload: any) {
        // service-catalogue / kpi-sla call this endpoint directly (not through
        // the gateway), so they may not carry x-arms-role / x-actor-username /
        // x-client-ip headers. Whatever they DO send in the body wins; these
        // headers are a fallback for requests that go through the gateway
        // (e.g. if a future caller proxies through it, or for events logged
        // by commitment's own controllers which already pass these fields
        // explicitly in the payload).
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
