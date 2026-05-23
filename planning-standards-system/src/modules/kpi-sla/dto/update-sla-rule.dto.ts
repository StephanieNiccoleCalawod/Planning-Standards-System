import { PartialType } from '@nestjs/mapped-types';
import { CreateSlaRuleDto } from './create-sla-rule.dto';

export class UpdateSlaRuleDto extends PartialType(CreateSlaRuleDto) {}
