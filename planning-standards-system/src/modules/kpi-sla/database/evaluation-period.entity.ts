import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Kpi } from './kpi.entity';

export enum PeriodType {
  ANNUAL = 'Annual',
  QUARTERLY = 'Quarterly',
  SEMESTER = 'Semester',
}

export enum PeriodStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  CLOSED = 'Closed',
}

@Entity('evaluation_period')
export class EvaluationPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  office: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'enum', enum: PeriodType })
  period_type: PeriodType;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'enum', enum: PeriodStatus, default: PeriodStatus.DRAFT })
  status: PeriodStatus;

  @Column({ length: 100 })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => Kpi, (k) => k.evaluation_period)
  kpis: Kpi[];
}