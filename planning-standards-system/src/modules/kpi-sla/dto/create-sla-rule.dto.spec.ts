import { validate } from 'class-validator';
import { CreateSlaRuleDto } from './create-sla-rule.dto';
import { WorkScheduleType } from '../enums';

describe('CreateSlaRuleDto', () => {
  let dto: CreateSlaRuleDto;

  beforeEach(() => {
    dto = new CreateSlaRuleDto();
    dto.work_schedule_type = WorkScheduleType.WEEKDAYS;
    dto.work_start_time = '08:00';
    dto.work_end_time = '17:00';
    dto.overdue_threshold_pct = 100;
  });

  it('should fail when warn_threshold_pct = 0 (below min)', async () => {
    dto.warn_threshold_pct = 0;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const warnErrors = errors.find((e) => e.property === 'warn_threshold_pct');
    expect(warnErrors).toBeDefined();
    expect(warnErrors?.constraints?.min).toBeDefined();
  });

  it('should pass when warn_threshold_pct = 1 (boundary)', async () => {
    dto.warn_threshold_pct = 1;
    dto.overdue_threshold_pct = 2; // satisfy WarnLessThanOverdueConstraint
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass when warn_threshold_pct = 99 (boundary)', async () => {
    dto.warn_threshold_pct = 99;
    dto.overdue_threshold_pct = 100; // satisfy WarnLessThanOverdueConstraint
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when warn_threshold_pct = 100 (above max)', async () => {
    dto.warn_threshold_pct = 100;
    dto.overdue_threshold_pct = 101; // prevent WarnLessThanOverdueConstraint from interfering
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const warnErrors = errors.find((e) => e.property === 'warn_threshold_pct');
    expect(warnErrors).toBeDefined();
    expect(warnErrors?.constraints?.max).toBeDefined();
  });
});
