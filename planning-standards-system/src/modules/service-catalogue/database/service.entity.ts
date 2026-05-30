import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ServiceVersion } from './service-version.entity';
import { IntakeField } from './service-intake-field.entity';
import { NaFlag } from './service-na-flag.entity';
import { ServiceClassification, ServiceStatus, SlaUnit } from '../enums';

@Entity('service')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  office: string;

  @Column({ length: 100, nullable: true })
  sub_office: string;

  @Index('idx_service_name')
  @Column({ length: 300 })
  name: string;

  @Index('idx_service_classification')
  @Column({ type: 'enum', enum: ServiceClassification })
  classification: ServiceClassification;

  /**
   * SLA target numeric value — interpreted together with sla_target_unit.
   * Replaces the old sla_target_days NUMERIC(6,2) column.
   */
  @Column({ type: 'int' })
  sla_target_value: number;

  /**
   * Unit for sla_target_value (Minutes, Hours, Days).
   * Defaults to 'Days' for backward compatibility with old sla_target_days.
   */
  @Column({ type: 'enum', enum: SlaUnit, default: SlaUnit.DAYS })
  sla_target_unit: SlaUnit;

  @Column({ length: 200 })
  responsible_unit: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  required_documents: string[];

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  processing_steps: string[];

  @Column({ type: 'text', nullable: true })
  expected_output: string;

  @Index('idx_service_status')
  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  archived_at: Date;

  @Column({ length: 100, nullable: true })
  archived_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ length: 100 })
  created_by: string;

  @OneToMany(() => ServiceVersion, (v) => v.service)
  versions: ServiceVersion[];

  @OneToMany(() => IntakeField, (f) => f.service)
  intake_fields: IntakeField[];

  @OneToMany(() => NaFlag, (n) => n.service)
  na_flags: NaFlag[];
}