import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('holiday')
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  office: string;

  @Column({ type: 'date' })
  holiday_date: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({ default: false })
  is_recurring: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}