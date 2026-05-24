import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KpiCategory, KpiUnit } from '../enums';

export class CreateKpiDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sub_office?: string;

  @ApiPropertyOptional({ description: 'References a service in the service-catalogue microservice' })
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({ example: '% of transactions completed on time' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: KpiCategory, example: KpiCategory.EFFICIENCY })
  @IsEnum(KpiCategory)
  category: KpiCategory;

  @ApiProperty({ example: 95.0, description: 'Must be a positive number' })
  @IsNumber()
  @IsPositive()
  target_value: number;

  @ApiProperty({ enum: KpiUnit, example: KpiUnit.PERCENT })
  @IsEnum(KpiUnit)
  unit: KpiUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}