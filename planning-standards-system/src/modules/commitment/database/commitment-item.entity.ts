import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Commitment } from './commitment.entity';
import { CommitmentItemUnit } from '../enums';

/**
 * A single line-item inside a commitment form.
 *
 * IMPORTANT: service_id and kpi_id are NOT database-level FKs because
 * SERVICE lives in service-catalogue and KPI lives in kpi-sla.
 * Referential integrity is enforced at the application layer via HTTP.
 */
@Entity('commitment_item')
export class CommitmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Commitment, (c) => c.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commitment_id' })
  commitment: Commitment;

  @Index('idx_commitment_item_commitment')
  @Column()
  commitment_id: string;

  /**
   * References a SERVICE in the service-catalogue microservice.
   * Validated via API call — no database FK across services.
   */
  @Index('idx_commitment_item_service')
  @Column()
  service_id: string;

  /**
   * References a KPI in the kpi-sla microservice.
   * Validated via API call — no database FK across services.
   */
  @Index('idx_commitment_item_kpi')
  @Column()
  kpi_id: string;

  @Column({ type: 'numeric', precision: 10, scale: 4, nullable: true })
  target_value: number;

  @Column({ type: 'enum', enum: CommitmentItemUnit, default: CommitmentItemUnit.COUNT })
  unit: CommitmentItemUnit;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
