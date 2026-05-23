// ─── Work Schedule Type ────────────────────────────────────────────────────
export enum WorkScheduleType {
  WEEKDAYS = 'WEEKDAYS',
  MONDAY_TO_SATURDAY = 'MONDAY_TO_SATURDAY',
  CUSTOM = 'CUSTOM',
}

// ─── Holiday Type ──────────────────────────────────────────────────────────
export enum HolidayType {
  REGULAR = 'REGULAR',
  SPECIAL_NON_WORKING = 'SPECIAL_NON_WORKING',
  COMPANY = 'COMPANY',
}

// ─── Evaluation Period Type ────────────────────────────────────────────────
export enum PeriodType {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly',
  /** @deprecated Use YEARLY instead */
  ANNUAL = 'Annual',
  /** @deprecated Use QUARTERLY or YEARLY instead */
  SEMESTER = 'Semester',
}

// ─── Evaluation Period Status ──────────────────────────────────────────────
export enum PeriodStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  ARCHIVED = 'Archived',
  /** @deprecated Use OPEN instead */
  DRAFT = 'Draft',
  /** @deprecated Use OPEN instead */
  ACTIVE = 'Active',
}

// ─── KPI Category ──────────────────────────────────────────────────────────
export enum KpiCategory {
  EFFICIENCY = 'EFFICIENCY',
  COMPLIANCE = 'COMPLIANCE',
  CUSTOMER = 'CUSTOMER',
}

// ─── KPI Unit ──────────────────────────────────────────────────────────────
export enum KpiUnit {
  DAYS = 'DAYS',
  PERCENT = 'PERCENT',
  COUNT = 'COUNT',
}
