import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { ServiceClassification } from '../enums';

export class GetServicesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ServiceClassification })
  @IsOptional()
  @IsEnum(ServiceClassification)
  classification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  include_archived?: boolean;
}
