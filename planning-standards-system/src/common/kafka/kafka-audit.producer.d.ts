import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare const ARMS_AUDIT_TOPIC = "arms.audit.events";
export interface ArmsAuditEvent {
    serviceName: string;
    entityType: string;
    entityId?: string;
    userRole: string;
    userName: string;
    userId: string;
    action: string;
    ipAddress?: string;
    office?: string;
    metadata?: Record<string, any>;
}
export declare class KafkaAuditProducer implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private readonly kafka;
    private readonly producer;
    private connected;
    constructor(config: ConfigService);
    emit(event: ArmsAuditEvent): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
