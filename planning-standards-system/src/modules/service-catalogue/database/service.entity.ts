import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceVersion } from './service-version.entity';
import { IntakeField } from './service-intake-field.entity';
import { NaFlag } from './service-na-flag.entity';

export enum ServiceClassification {
  SIMPLE = 'Simple',
  COMPLEX = 'Complex',
  HIGHLY_TECHNICAL = 'Highly Technical',
}

export enum ServiceStatus {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
}

@Entity('service')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  office: string;

  @Column({ length: 100, nullable: true })
  sub_office: string;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'enum', enum: ServiceClassification })
  classification: ServiceClassification;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  sla_target_days: number;

  @Column({ length: 200 })
  responsible_unit: string;

  @Column({ type: 'text', nullable: true })
  required_documents: string;

  @Column({ type: 'text', nullable: true })
  processing_steps: string;

  @Column({ type: 'text', nullable: true })
  expected_output: string;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  archived_at: Date;

  @Column({ length: 100, nullable: true })
  archived_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ length: 100 })
  created_by: string;

  @OneToMany(() => ServiceVersion, (v) => v.service)
  versions: ServiceVersion[];

  @OneToMany(() => IntakeField, (f) => f.service)
  intake_fields: IntakeField[];

  @OneToMany(() => NaFlag, (n) => n.service)
  na_flags: NaFlag[];
}