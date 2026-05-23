import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceClassification, SlaUnit } from '../enums';

export class CreateServiceDto {
  @ApiProperty({ example: 'Request for Transcript of Records' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ example: 'OSAS' })
  @IsOptional()
  @IsString()
  sub_office?: string;

  @ApiProperty({ enum: ServiceClassification })
  @IsEnum(ServiceClassification)
  classification: ServiceClassification;

  @ApiProperty({ example: 3, description: 'SLA target numeric value (interpreted with sla_target_unit)' })
  @IsNumber()
  @Min(1)
  sla_target_value: number;

  @ApiPropertyOptional({ enum: SlaUnit, default: SlaUnit.DAYS, description: 'Unit for SLA target: Minutes, Hours, or Days' })
  @IsOptional()
  @IsEnum(SlaUnit)
  sla_target_unit?: SlaUnit;

  @ApiProperty({ example: 'Records Section' })
  @IsNotEmpty()
  @IsString()
  responsible_unit: string;

  @ApiPropertyOptional({ example: ['Form 137', 'Valid ID'], description: 'List of required documents' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_documents?: string[];

  @ApiPropertyOptional({ example: ['Submit form', 'Pay fees', 'Receive document'], description: 'Ordered processing steps' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  processing_steps?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expected_output?: string;
}