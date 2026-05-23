import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SlaRule } from './sla-rule.entity';

@Entity('sla_rule_version')
export class SlaRuleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SlaRule, (r) => r.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sla_rule_id' })
  sla_rule: SlaRule;

  @Column()
  sla_rule_id: string;

  @Column({ type: 'jsonb', default: [] })
  work_schedule: object[];

  @Column({ type: 'time' })
  work_start_time: string;

  @Column({ type: 'time' })
  work_end_time: string;

  @Column({ type: 'int' })
  warn_threshold_pct: number;

  @Column({ length: 100 })
  changed_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  changed_at: Date;
}