// ─── Service Classification ────────────────────────────────────────────────
export enum ServiceClassification {
  SIMPLE = 'Simple',
  COMPLEX = 'Complex',
  HIGHLY_TECHNICAL = 'Highly Technical',
}

// ─── Service Status ────────────────────────────────────────────────────────
export enum ServiceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ARCHIVED = 'Archived',
}

// ─── Intake Field Types ────────────────────────────────────────────────────
export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  DROPDOWN = 'DROPDOWN',
  BOOLEAN = 'BOOLEAN',
  FILE = 'FILE',
  /** @deprecated Use BOOLEAN instead — will be removed in a future release */
  CHECKBOX = 'CHECKBOX',
  /** @deprecated Use TEXT instead — will be removed in a future release */
  TEXTAREA = 'TEXTAREA',
}

// ─── SLA Target Unit ───────────────────────────────────────────────────────
// Replaces the old sla_target_days numeric column with sla_target_value + sla_target_unit
export enum SlaUnit {
  MINUTES = 'Minutes',
  HOURS = 'Hours',
  DAYS = 'Days',
}

// ─── Referral Status ───────────────────────────────────────────────────────
export enum ReferralStatus {
  WITH = 'With',
  WITHOUT = 'Without',
  NA = 'N/A',
}
