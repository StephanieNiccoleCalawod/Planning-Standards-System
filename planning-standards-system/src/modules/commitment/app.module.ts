import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Commitment } from './database/commitment.entity';
import { CommitmentItem } from './database/commitment-item.entity';
import { CommitmentVersion } from './database/commitment-version.entity';
import { PendingAuditEvent } from './database/pending-audit-event.entity';
import { CommitmentController } from './controller/commitment.controller';
import { DashboardController } from './controller/dashboard.controller';
import { AuditController } from './controller/audit.controller';
import { CommitmentService } from './service/commitment.service';
import { DashboardService } from './service/dashboard-data.service';
import { AuditService } from './service/audit.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule,
        TypeOrmModule.forRootAsync({
            name: 'commitment_db',
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                name: 'commitment_db',
                host: config.get('DB_HOST'),
                port: config.get<number>('DB_PORT'),
                username: config.get('DB_USERNAME'),
                password: config.get('DB_PASSWORD'),
                database: config.get('DB_NAME'),
                entities: [Commitment, CommitmentItem, CommitmentVersion, PendingAuditEvent],
                synchronize: true,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature(
            [Commitment, CommitmentItem, CommitmentVersion, PendingAuditEvent],
            'commitment_db',
        ),
    ],
    controllers: [CommitmentController, DashboardController, AuditController],
    providers: [CommitmentService, DashboardService, AuditService],
})
export class AppModule { }