import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProxyService } from '../service/proxy.service';

@ApiTags('Service Catalogue (proxied)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/services')
export class CatalogueProxyController {
    constructor(
        private readonly proxy: ProxyService,
        private readonly config: ConfigService,
    ) { }

    @All()
    @ApiOperation({ summary: 'Proxies to service-catalogue: /api/services' })
    base(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.config.get<string>('SERVICE_CATALOGUE_URL'));
    }

    @All('*')
    @ApiOperation({ summary: 'Proxies to service-catalogue: /api/services/*' })
    wildcard(@Req() req: Request, @Res() res: Response) {
        return this.proxy.forward(req, res, this.config.get<string>('SERVICE_CATALOGUE_URL'));
    }
}
