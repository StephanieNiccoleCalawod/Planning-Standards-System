import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNaFlagDto {
  @ApiProperty()
  @IsUUID()
  period_id: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}