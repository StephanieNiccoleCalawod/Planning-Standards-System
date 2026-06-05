import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PhHolidayService } from './ph-holiday.service';

@Injectable()
export class HolidaySeederService implements OnApplicationBootstrap {
    private readonly logger = new Logger(HolidaySeederService.name);

    constructor(private readonly phHolidayService: PhHolidayService) { }

    async onApplicationBootstrap(): Promise<void> {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 3;
        const endYear = currentYear + 3;

        this.logger.log(`Starting holiday auto-sync for years ${startYear} to ${endYear}...`);

        for (let year = startYear; year <= endYear; year++) {
            try {
                const result = await this.phHolidayService.syncPhHolidays(year);
                this.logger.log(
                    `${year} - synced: ${result.synced}, skipped: ${result.skipped}`,
                );
            } catch (err) {
                this.logger.error(`Holiday sync failed for ${year}`, String(err));
            }
        }
    }
}
