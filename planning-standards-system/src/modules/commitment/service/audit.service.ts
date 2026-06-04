import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingAuditEvent } from '../database/pending-audit-event.entity';

export interface AuditEventPayload {
    event: string;
    actor_id: string;
    office_id: string;
    target_entity: string;
    target_id: string;
    metadata?: Record<string, any>;
    ip_address?: string;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(PendingAuditEvent, 'commitment_db')
        private readonly auditRepo: Repository<PendingAuditEvent>,
    ) { }

    // Fire-and-forget — never throws, never breaks main flow
    async log(payload: AuditEventPayload): Promise<void> {
        try {
            if (!payload.event || !payload.actor_id || !payload.office_id) {
                this.logger.warn('AuditService: missing required fields, skipping insert');
                return;
            }

            await this.auditRepo.save(
                this.auditRepo.create({
                    event: payload.event,
                    actor_id: payload.actor_id,
                    office_id: payload.office_id,
                    target_entity: payload.target_entity,
                    target_id: payload.target_id,
                    metadata: payload.metadata ?? null,
                    ip_address: payload.ip_address ?? null,
                    is_synced: false,
                }),
            );
        } catch (err) {
            this.logger.error('AuditService: failed to log event', String(err));
        }
    }

    async findAll(filters: {
        is_synced?: boolean;
        event?: string;
        office_id?: string;
    }): Promise<PendingAuditEvent[]> {
        const query = this.auditRepo.createQueryBuilder('a');

        if (filters.is_synced !== undefined) {
            query.andWhere('a.is_synced = :is_synced', { is_synced: filters.is_synced });
        }
        if (filters.event) {
            query.andWhere('a.event = :event', { event: filters.event });
        }
        if (filters.office_id) {
            query.andWhere('a.office_id = :office_id', { office_id: filters.office_id });
        }

        return query.orderBy('a.timestamp', 'DESC').getMany();
    }

    async markSynced(id: string): Promise<{ message: string }> {
        await this.auditRepo.update(id, { is_synced: true });
        return { message: `Audit event ${id} marked as synced` };
    }
}