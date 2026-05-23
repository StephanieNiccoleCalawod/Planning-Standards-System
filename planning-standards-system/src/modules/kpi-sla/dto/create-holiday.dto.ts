import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: "New Year's Day" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  holiday_date: string;

  @ApiProperty({ example: 'Regular' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;
}