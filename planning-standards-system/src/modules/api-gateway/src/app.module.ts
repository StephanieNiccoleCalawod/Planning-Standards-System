import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CatalogueProxyController } from './controller/catalogue.proxy.controller';
import { KpiSlaProxyController } from './controller/kpi-sla.proxy.controller';
import { CommitmentProxyController } from './controller/commitment.proxy.controller';
import { ProxyService } from './service/proxy.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForwardedIpInterceptor } from './interceptors/forwarded-ip.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
  ],
  controllers: [
    CatalogueProxyController,
    KpiSlaProxyController,
    CommitmentProxyController,
  ],
  providers: [
    ProxyService,
    JwtAuthGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: ForwardedIpInterceptor,
    },
  ],
})
export class AppModule {}
