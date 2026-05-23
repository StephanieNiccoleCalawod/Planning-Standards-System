import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSlaRuleDto {
  @ApiProperty({
    example: [
      { day: 'Monday', is_working: true, work_start_time: '08:00', work_end_time: '17:00', working_minutes: 480 }
    ]
  })
  @IsArray()
  work_schedule: object[];

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'work_start_time must be HH:MM format' })
  work_start_time: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'work_end_time must be HH:MM format' })
  work_end_time: string;

  @ApiProperty({ example: 75 })
  @IsInt()
  @Min(0)
  @Max(100)
  warn_threshold_pct: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  overdue_threshold_pct: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  created_by?: string;
}