import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
    private readonly NAGER_API = 'https://date.nager.at/api/v3/PublicHolidays';

    constructor(private readonly http: HttpService) { }

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
}