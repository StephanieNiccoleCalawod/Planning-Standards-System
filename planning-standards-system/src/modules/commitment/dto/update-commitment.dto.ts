import { PartialType } from '@nestjs/mapped-types';
import { CreateCommitmentDto, CreateCommitmentItemDto } from './create-commitment.dto';

export class UpdateCommitmentDto extends PartialType(CreateCommitmentDto) {
  items?: CreateCommitmentItemDto[];
}
