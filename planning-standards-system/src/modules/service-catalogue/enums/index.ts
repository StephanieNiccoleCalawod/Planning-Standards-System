
export enum ServiceClassification {
  SIMPLE = 'Simple',
  COMPLEX = 'Complex',
  HIGHLY_TECHNICAL = 'Highly Technical',
}


export enum ServiceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ARCHIVED = 'Archived',
}


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


export enum SlaUnit {
  MINUTES = 'Minutes',
  HOURS = 'Hours',
  DAYS = 'Days',
}


export enum ReferralStatus {
  WITH = 'With',
  WITHOUT = 'Without',
  NA = 'N/A',
}
