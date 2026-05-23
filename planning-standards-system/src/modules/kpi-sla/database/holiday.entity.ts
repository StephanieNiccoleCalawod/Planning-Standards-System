import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { HolidayType } from '../enums';

@Unique('uq_holiday_date_name', ['holiday_date', 'name'])
@Entity('holiday')
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  holiday_date: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'enum', enum: HolidayType })
  type: HolidayType;

  @Column({ default: false })
  is_recurring: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}