import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingAuditEvent } from '../database/pending-audit-event.entity';
import { KafkaAuditProducer } from '../../../common/kafka/kafka-audit.producer';

// --------------------------------------------------------------------------
// Payload interface
// --------------------------------------------------------------------------

export interface AuditEventPayload {
    /** Required: short action label, e.g. COMMITMENT_SUBMITTED */
    event: string;
    /** Required: user / service that performed the action */
    actor_id: string;
    /** Required: office that owns the affected record */
    office_id: string;
    /** Optional: TypeORM entity name, e.g. "Commitment" */
    target_entity?: string;
    /** Optional: PK of the affected row */
    target_id?: string;
    /** Optional: any extra structured data */
    metadata?: Record<string, any> | null;
    /** Optional: originating request IP */
    ip_address?: string | null;
    /** Optional: ARMS role of the actor (SUPER_ADMIN/SUBSYSTEM_ADMIN/STAFF/OPCR_EVALUATOR) — required by ARMS Kafka contract */
    actor_role?: string | null;
    /** Optional: ARMS username of the actor — required by ARMS Kafka contract */
    actor_username?: string | null;
    /** Optional: which PSS module originated this event, e.g. "pss-service-catalogue" */
    service_name?: string | null;
}

// --------------------------------------------------------------------------
// Service
// --------------------------------------------------------------------------

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(PendingAuditEvent, 'commitment_db')
        private readonly auditRepo: Repository<PendingAuditEvent>,
        private readonly kafkaProducer: KafkaAuditProducer,
    ) {}

    /**
     * Fire-and-forget audit logger.
     *
     * - Never throws – DB failures are caught and logged so the main
     *   request flow is never interrupted.
     * - Validates required fields before writing; skips silently when
     *   data is unusable.
     * - Accepts undefined / null / empty payloads gracefully.
     * - After a successful local write, best-effort pushes the same event
     *   to ARMS via Kafka (topic: arms.audit.events). If Kafka is down,
     *   the local pending_audit_event row remains the source of truth.
     */
    async log(payload: AuditEventPayload | null | undefined): Promise<void> {
        try {
            // ── Guard: reject null / undefined payload entirely ───────────
            if (!payload) {
                this.logger.warn('AuditService.log: received null/undefined payload, skipping');
                return;
            }

            // ── Guard: normalise & trim required string fields ────────────
            const event     = typeof payload.event     === 'string' ? payload.event.trim()     : '';
            const actor_id  = typeof payload.actor_id  === 'string' ? payload.actor_id.trim()  : '';
            const office_id = typeof payload.office_id === 'string' ? payload.office_id.trim() : '';

            if (!event || !actor_id || !office_id) {
                this.logger.warn(
                    'AuditService.log: missing required field(s) ' +
                    `[event="${event}" actor_id="${actor_id}" office_id="${office_id}"], skipping insert`,
                );
                return;
            }

            // ── Guard: truncate fields that exceed column limits ──────────
            const safeStr = (v: string | undefined | null, max: number): string | null =>
                typeof v === 'string' ? v.trim().substring(0, max) : null;

            // ── Guard: validate metadata is a plain object or null ────────
            let safeMetadata: Record<string, any> | null = null;
            if (payload.metadata !== null && payload.metadata !== undefined) {
                if (typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)) {
                    safeMetadata = payload.metadata;
                } else {
                    this.logger.warn('AuditService.log: metadata is not a plain object, storing null');
                }
            }

            await this.auditRepo.save(
                this.auditRepo.create({
                    event:         event.substring(0, 100),
                    actor_id:      actor_id.substring(0, 100),
                    office_id:     office_id.substring(0, 100),
                    target_entity: safeStr(payload.target_entity, 100) ?? undefined,
                    target_id:     safeStr(payload.target_id, 100)     ?? undefined,
                    metadata:      safeMetadata,
                    ip_address:    safeStr(payload.ip_address, 100),
                    is_synced:     false,
                }),
            );

            // ── Best-effort push to ARMS via Kafka ─────────────────────────
            // Never blocks / never throws back to the caller — local row above
            // is already saved regardless of Kafka availability.
            void this.kafkaProducer.emit({
                serviceName: safeStr(payload.service_name, 100) ?? 'pss-commitment',
                entityType:  safeStr(payload.target_entity, 100) ?? 'unknown',
                entityId:    safeStr(payload.target_id, 100) ?? undefined,
                userRole:    safeStr(payload.actor_role, 50) ?? 'STAFF',
                userName:    safeStr(payload.actor_username, 100) ?? actor_id,
                userId:      actor_id,
                action:      event,
                ipAddress:   safeStr(payload.ip_address, 100) ?? undefined,
                office:      office_id,
                metadata:    safeMetadata ?? undefined,
            });
        } catch (err: unknown) {
            // Log but NEVER re-throw – audit must never crash the caller
            this.logger.error(
                'AuditService.log: failed to persist audit event',
                err instanceof Error ? err.stack : String(err),
            );
        }
    }

    /**
     * Returns all audit events matching the supplied filters.
     * All filter fields are optional; pass an empty object for all rows.
     */
    async findAll(filters: {
        is_synced?: boolean;
        event?: string;
        office_id?: string;
    }): Promise<PendingAuditEvent[]> {
        try {
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

            return await query.orderBy('a.timestamp', 'DESC').getMany();
        } catch (err: unknown) {
            this.logger.error(
                'AuditService.findAll: query failed',
                err instanceof Error ? err.stack : String(err),
            );
            return [];
        }
    }

    /**
     * Marks a single event as synced after the central audit service
     * has consumed it.
     */
    async markSynced(id: string): Promise<{ message: string }> {
        try {
            if (!id || typeof id !== 'string') {
                return { message: 'Invalid id supplied' };
            }
            await this.auditRepo.update(id, { is_synced: true });
            return { message: `Audit event ${id} marked as synced` };
        } catch (err: unknown) {
            this.logger.error(
                `AuditService.markSynced: failed for id=${id}`,
                err instanceof Error ? err.stack : String(err),
            );
            return { message: `Failed to mark audit event ${id} as synced` };
        }
    }
}
