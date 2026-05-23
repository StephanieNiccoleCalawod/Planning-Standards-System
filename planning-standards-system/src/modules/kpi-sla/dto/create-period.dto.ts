import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PeriodType } from '../database/evaluation-period.entity';

export class CreatePeriodDto {
  @ApiProperty({ example: 'Q1 FY 2025' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: PeriodType })
  @IsEnum(PeriodType)
  period_type: PeriodType;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2025-03-31' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ example: 'mock-actor' })
  @IsString()
  created_by: string;
}