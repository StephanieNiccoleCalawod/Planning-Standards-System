import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './database/service.entity';
import { ServiceVersion } from './database/service-version.entity';
import { IntakeField } from './database/service-intake-field.entity';
import { NaFlag } from './database/service-na-flag.entity';
import { ServiceCatalogueController } from './controller/service-catalogue.controller';
import { ServiceCatalogueService } from './service/service-catalogue.service';

@Module({
  imports: [
        ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      name: 'catalogue_db',
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        name: 'catalogue_db',
        host:     config.get('DB_HOST'),
        port:     config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
          password: String(config.get('DB_PASSWORD')),
        database: config.get('DB_NAME'),
        entities: [Service, ServiceVersion, IntakeField, NaFlag],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Service, ServiceVersion, IntakeField, NaFlag], 'catalogue_db'),
  ],
  controllers: [ServiceCatalogueController],
  providers: [ServiceCatalogueService],
})
export class AppModule {}