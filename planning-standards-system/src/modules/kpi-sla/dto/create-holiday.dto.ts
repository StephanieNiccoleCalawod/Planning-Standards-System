import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HolidayType } from '../enums';

export class CreateHolidayDto {
  @ApiProperty({ example: "New Year's Day" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  holiday_date: string;

  @ApiProperty({ enum: HolidayType, example: HolidayType.REGULAR })
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;
}