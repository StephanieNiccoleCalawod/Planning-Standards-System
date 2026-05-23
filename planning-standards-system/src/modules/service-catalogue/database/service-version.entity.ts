import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';

@Entity('service_version')
export class ServiceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service, (s) => s.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column()
  service_id: string;

  @Column({ length: 100 })
  field_changed: string;

  @Column({ type: 'text', nullable: true })
  old_value: string;

  @Column({ type: 'text', nullable: true })
  new_value: string;

  @Column({ length: 100 })
  changed_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  changed_at: Date;
}