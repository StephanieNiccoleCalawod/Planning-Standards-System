import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceModeService } from '../service/service-mode.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Service Catalogue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/service-modes')
export class ServiceModeController {
    constructor(private readonly svc: ServiceModeService) { }

    @Get()
    @ApiOperation({ summary: 'Get all active service modes' })
    findAll() {
        return this.svc.findAllActive();
    }
}
