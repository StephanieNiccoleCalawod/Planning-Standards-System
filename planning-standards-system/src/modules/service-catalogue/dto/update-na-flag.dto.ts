import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNaFlagDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}