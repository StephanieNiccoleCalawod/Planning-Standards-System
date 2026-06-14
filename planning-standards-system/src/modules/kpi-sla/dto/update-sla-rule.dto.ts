import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, Matches, Validate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSlaRuleDto, WorkEndAfterStartConstraint } from './create-sla-rule.dto';

/**
 * UpdateSlaRuleDto
 *
 * All fields from CreateSlaRuleDto become optional via PartialType.
 * `work_end_time` is re-declared here to attach WorkEndAfterStartConstraint
 * explicitly, so the decorator stack is present on the concrete update class
 * and not only inherited — this guarantees class-validator picks it up
 * when the update payload contains both time fields.
 *
 * When the payload contains only one of the two time fields, the constraint
 * returns true (skip) and the service layer enforces ordering using the
 * merged (existing-record + dto) values.
 */
export class UpdateSlaRuleDto extends PartialType(CreateSlaRuleDto) {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'work_end_time must be HH:MM format' })
  @Validate(WorkEndAfterStartConstraint) // ← BE2-1 addition
  work_end_time?: string;
}
