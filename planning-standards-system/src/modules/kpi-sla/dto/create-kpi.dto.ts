import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKpiDto {
  @ApiProperty()
  @IsUUID()
  evaluation_period_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sub_office?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  service_id?: string;

  @ApiProperty({ example: '% of transactions completed on time' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'timeliness', description: 'timeliness, quality, or volume' })
  @IsString()
  category: string;

  @ApiProperty({ example: 95.0 })
  @IsNumber()
  target_value: number;

  @ApiProperty({ example: '%', description: '%, days, count, etc.' })
  @IsString()
  unit: string;
}