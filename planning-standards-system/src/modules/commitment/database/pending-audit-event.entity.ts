import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('pending_audit_event')
export class PendingAuditEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    event: string;

    @Column({ length: 100 })
    actor_id: string;

    @Column({ length: 100 })
    office_id: string;

    @Column({ length: 100 })
    target_entity: string;

    @Column({ length: 100 })
    target_id: string;

    @Column({ length: 50, default: 'PSS' })
    subsystem: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ default: false })
    is_synced: boolean;

    @Column({ length: 100, nullable: true })
    ip_address: string;

    @CreateDateColumn({ type: 'timestamptz' })
    timestamp: Date;
}