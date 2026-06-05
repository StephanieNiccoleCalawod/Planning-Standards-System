import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Holiday } from '../database/holiday.entity';
import { HolidayType } from '../enums';

export interface PhHoliday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
    types: string[];
}

@Injectable()
export class PhHolidayService {
    private readonly logger = new Logger(PhHolidayService.name);
    private readonly NAGER_API = 'https://date.nager.at/api/v3/PublicHolidays';

    constructor(
        private readonly http: HttpService,
        @InjectRepository(Holiday, 'kpi_sla_db')
        private readonly holidayRepo: Repository<Holiday>,
    ) { }

    async fetchPhHolidays(year: number): Promise<PhHoliday[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<PhHoliday[]>(`${this.NAGER_API}/${year}/PH`),
            );
            return response.data;
        } catch {
            throw new BadRequestException(
                `Failed to fetch Philippine public holidays for year ${year}`,
            );
        }
    }

    mapToHolidayType(types: string[]): HolidayType {
        if (types.includes('Optional')) return HolidayType.SPECIAL_NON_WORKING;
        return HolidayType.REGULAR;
    }

    async syncPhHolidays(year: number): Promise<{ synced: number; skipped: number }> {
        const phHolidays = await this.fetchPhHolidays(year);

        let synced = 0;
        let skipped = 0;

        for (const h of phHolidays) {
            const holidayName = h.name;
            const existing = await this.holidayRepo
                .createQueryBuilder('h')
                .where('h.name = :name', { name: holidayName })
                .andWhere('EXTRACT(YEAR FROM h.holiday_date::date) = :year', { year })
                .getOne();

            if (existing) {
                if (existing.holiday_date === h.date) {
                    skipped++;
                    continue;
                } else {
                    await this.holidayRepo.delete(existing.id);
                    this.logger.log(
                        `Holiday date changed: "${holidayName}" ${existing.holiday_date} → ${h.date}`,
                    );
                }
            }

            await this.holidayRepo.save(
                this.holidayRepo.create({
                    holiday_date: h.date,
                    name: holidayName,
                    type: this.mapToHolidayType(h.types),
                    is_recurring: h.fixed,
                }),
            );
            synced++;
        }

        return { synced, skipped };
    }
}