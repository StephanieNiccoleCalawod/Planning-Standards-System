import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EvaluationPeriod } from './evaluation-period.entity';

@Entity('kpi')
export class Kpi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EvaluationPeriod, (p) => p.kpis, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'evaluation_period_id' })
  evaluation_period: EvaluationPeriod;

  @Column()
  evaluation_period_id: string;

  @Column({ length: 100 })
  office: string;

  @Column({ length: 100, nullable: true })
  sub_office: string;

  @Column({ nullable: true })
  service_id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100 })
  category: string;

  @Column({ type: 'numeric', precision: 10, scale: 4 })
  target_value: number;

  @Column({ length: 50 })
  unit: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ length: 100 })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}