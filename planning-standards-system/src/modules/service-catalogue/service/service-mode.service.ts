import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceMode } from '../database/service-mode.entity';

@Injectable()
export class ServiceModeService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ServiceModeService.name);

    constructor(
        @InjectRepository(ServiceMode, 'catalogue_db')
        private readonly serviceModeRepo: Repository<ServiceMode>,
    ) { }

    async onApplicationBootstrap(): Promise<void> {
        const standardModes = [
            { name: 'Walk-in', description: 'Standard walk-in service delivery mode' },
            { name: 'Online', description: 'Service delivered entirely online' },
            { name: 'Email', description: 'Service processed via email communication' },
            { name: 'Referral', description: 'Service requires an external or internal referral' },
            { name: 'Non-Referral', description: 'Service can be availed directly without a referral' },
            { name: 'Phone', description: 'Service delivered via phone call' },
        ];

        this.logger.log('Seeding standard service modes...');

        for (const mode of standardModes) {
            const exists = await this.serviceModeRepo.findOne({ where: { name: mode.name } });
            if (!exists) {
                const newMode = this.serviceModeRepo.create(mode);
                await this.serviceModeRepo.save(newMode);
                this.logger.log(`Seeded service mode: ${mode.name}`);
            }
        }
        this.logger.log('Service modes seeding complete.');
    }

    async findAllActive(): Promise<ServiceMode[]> {
        return this.serviceModeRepo.find({
            where: { is_active: true },
            order: { name: 'ASC' },
            select: { id: true, name: true },
        });
    }
}
