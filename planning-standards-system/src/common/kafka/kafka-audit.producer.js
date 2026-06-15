"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KafkaAuditProducer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaAuditProducer = exports.ARMS_AUDIT_TOPIC = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafkajs_1 = require("kafkajs");
exports.ARMS_AUDIT_TOPIC = 'arms.audit.events';
let KafkaAuditProducer = KafkaAuditProducer_1 = class KafkaAuditProducer {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(KafkaAuditProducer_1.name);
        this.connected = false;
        this.kafka = new kafkajs_1.Kafka({
            clientId: this.config.get('KAFKA_CLIENT_ID') ?? 'pss-service',
            brokers: [this.config.get('KAFKA_BROKER') ?? 'localhost:9092'],
        });
        this.producer = this.kafka.producer();
        this.producer
            .connect()
            .then(() => {
            this.connected = true;
            this.logger.log('Connected to ARMS Kafka broker');
        })
            .catch((err) => {
            this.logger.warn(`Kafka broker unreachable — audit events will NOT be pushed to ARMS (local pending_audit_event log is unaffected): ${err.message}`);
        });
    }
    async emit(event) {
        if (!this.connected) {
            this.logger.warn(`Kafka not connected — skipping ARMS push for action=${event.action}`);
            return;
        }
        try {
            await this.producer.send({
                topic: exports.ARMS_AUDIT_TOPIC,
                messages: [{ value: JSON.stringify(event) }],
            });
        }
        catch (err) {
            this.logger.error(`Failed to emit audit event to Kafka: ${err.message}`, err.stack);
        }
    }
    async onModuleDestroy() {
        if (this.connected) {
            await this.producer.disconnect();
        }
    }
};
exports.KafkaAuditProducer = KafkaAuditProducer;
exports.KafkaAuditProducer = KafkaAuditProducer = KafkaAuditProducer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaAuditProducer);
//# sourceMappingURL=kafka-audit.producer.js.map