import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Kpi } from './database/kpi.entity';
import { SlaRule } from './database/sla-rule.entity';
import { SlaRuleVersion } from './database/sla-rule-version.entity';
import { Holiday } from './database/holiday.entity';
import { EvaluationPeriod } from './database/evaluation-period.entity';
import { KpiSlaController } from './controller/kpi-sla.controller';
import { KpiSlaService } from './service/kpi-sla.service';
import { PhHolidayService } from './service/ph-holiday.service';
import { HolidaySeederService } from './service/holiday-seeder.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule,
        TypeOrmModule.forRootAsync({
            name: 'kpi_sla_db',
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                name: 'kpi_sla_db',
                host: config.get('DB_HOST'),
                port: config.get<number>('DB_PORT'),
                username: config.get('DB_USERNAME'),
                password: config.get('DB_PASSWORD'),
                database: config.get('DB_NAME'),
                entities: [Kpi, SlaRule, SlaRuleVersion, Holiday, EvaluationPeriod],
                synchronize: true,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Kpi, SlaRule, SlaRuleVersion, Holiday, EvaluationPeriod], 'kpi_sla_db'),
    ],
    controllers: [KpiSlaController],
    providers: [KpiSlaService, PhHolidayService, HolidaySeederService],
})
export class AppModule { }