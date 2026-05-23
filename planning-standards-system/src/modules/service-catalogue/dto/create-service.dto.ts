import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceClassification } from '../database/service.entity';

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

  @ApiProperty({ example: 3.5, description: 'SLA target in working days' })
  @IsNumber()
  @Min(0.5)
  sla_target_days: number;

  @ApiProperty({ example: 'Records Section' })
  @IsNotEmpty()
  @IsString()
  responsible_unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  required_documents?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  processing_steps?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expected_output?: string;
}