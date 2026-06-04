import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Matches,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkScheduleType } from '../enums';

@ValidatorConstraint({ name: 'warnLessThanOverdue', async: false })
class WarnLessThanOverdueConstraint implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments): boolean {
    const obj = args.object as CreateSlaRuleDto;
    return obj.warn_threshold_pct < obj.overdue_threshold_pct;
  }

  defaultMessage(): string {
    return 'warn_threshold_pct must be less than overdue_threshold_pct';
  }
}

export class CreateSlaRuleDto {
  @ApiProperty({ enum: WorkScheduleType, example: WorkScheduleType.WEEKDAYS })
  @IsEnum(WorkScheduleType)
  work_schedule_type: WorkScheduleType;

  @ApiPropertyOptional({
    description: 'Required when work_schedule_type is CUSTOM. Array of day/hour config objects.',
    example: [
      { day: 'Monday', is_working: true, start: '08:00', end: '17:00' },
      { day: 'Saturday', is_working: true, start: '08:00', end: '12:00' },
    ],
  })
  @IsOptional()
  @IsObject({ each: true })
  work_schedule_config?: object[];

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'work_start_time must be HH:MM format' })
  work_start_time: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'work_end_time must be HH:MM format' })
  work_end_time: string;

  @ApiProperty({ example: 75, description: 'Must be less than overdue_threshold_pct' })
  @IsInt()
  @Min(0)
  @Max(100)
  @Validate(WarnLessThanOverdueConstraint)
  warn_threshold_pct: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  overdue_threshold_pct: number;
}