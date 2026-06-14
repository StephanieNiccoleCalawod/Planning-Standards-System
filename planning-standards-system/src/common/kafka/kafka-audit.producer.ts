import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

/**
 * ARMS Kafka topic for centralized audit events.
 * Matches `KafkaTopics.ARMS_AUDIT_EVENTS` in opcr-arms `packages/kafka/src/topics.ts`.
 */
export const ARMS_AUDIT_TOPIC = 'arms.audit.events';

/**
 * Matches `IngestAuditEventDto` in opcr-arms `packages/dto/src/audit.dto.ts`.
 */
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

@Injectable()
export class KafkaAuditProducer implements OnModuleDestroy {
    private readonly logger = new Logger(KafkaAuditProducer.name);
    private readonly kafka: Kafka;
    private readonly producer: Producer;
    private connected = false;

    constructor(private readonly config: ConfigService) {
        this.kafka = new Kafka({
            clientId: this.config.get<string>('KAFKA_CLIENT_ID') ?? 'pss-service',
            brokers: [this.config.get<string>('KAFKA_BROKER') ?? 'localhost:9092'],
        });
        this.producer = this.kafka.producer();

        this.producer
            .connect()
            .then(() => {
                this.connected = true;
                this.logger.log('Connected to ARMS Kafka broker');
            })
            .catch((err) => {
                this.logger.warn(
                    `Kafka broker unreachable — audit events will NOT be pushed to ARMS (local pending_audit_event log is unaffected): ${err.message}`,
                );
            });
    }

    /**
     * Fire-and-forget emit to ARMS. Never throws — Kafka being down must
     * never block PSS's main request flow (local audit log is the source
     * of truth; this is best-effort real-time forwarding).
     */
    async emit(event: ArmsAuditEvent): Promise<void> {
        if (!this.connected) {
            this.logger.warn(`Kafka not connected — skipping ARMS push for action=${event.action}`);
            return;
        }
        try {
            await this.producer.send({
                topic: ARMS_AUDIT_TOPIC,
                messages: [{ value: JSON.stringify(event) }],
            });
        } catch (err: any) {
            this.logger.error(`Failed to emit audit event to Kafka: ${err.message}`, err.stack);
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.connected) {
            await this.producer.disconnect();
        }
    }
}
