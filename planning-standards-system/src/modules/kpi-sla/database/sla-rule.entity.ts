import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { SlaRuleVersion } from './sla-rule-version.entity';

@Entity('sla_rule')
export class SlaRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  office: string;

  @Column({ type: 'jsonb', default: [] })
  work_schedule: object[];

  @Column({ type: 'time' })
  work_start_time: string;

  @Column({ type: 'time' })
  work_end_time: string;

  @Column({ type: 'int' })
  warn_threshold_pct: number;

  @Column({ type: 'int' })
  overdue_threshold_pct: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ length: 100 })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => SlaRuleVersion, (v) => v.sla_rule)
  versions: SlaRuleVersion[];
}