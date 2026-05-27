export const INITIAL_KPIS = [
  { id: 1, name: "SLA Compliance Rate", category: "Timeliness", target_value: 95, unit: "%", service_id: 2, active: true },
  { id: 2, name: "Customer Satisfaction Score", category: "Quality", target_value: 90, unit: "%", service_id: 2, active: true },
  { id: 3, name: "Document Issuance Queue Efficiency", category: "Efficiency", target_value: 12, unit: "Minutes", service_id: 4, active: true },
  { id: 4, name: "Program Accreditation Review Accuracy", category: "Quality", target_value: 100, unit: "%", service_id: 1, active: true },
  { id: 5, name: "Assessment Processing Speed", category: "Timeliness", target_value: 20, unit: "Minutes", service_id: 5, active: true },
];

export const INITIAL_SLA_RULE = {
  working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  work_start_time: "08:00",
  work_end_time: "17:00",
  warn_threshold_pct: 80,
  overdue_threshold_pct: 100,
};

export const INITIAL_SLA_HISTORY = [
  { id: 1, timestamp: "May 10, 2026 09:30 AM", actor: "System Admin", working_days: "Mon-Fri", working_hours: "08:00 AM - 05:00 PM", warn_threshold: "80%", overdue_threshold: "100%" },
  { id: 2, timestamp: "May 18, 2026 02:15 PM", actor: "Subsystem Admin", working_days: "Mon-Fri", working_hours: "08:30 AM - 04:30 PM", warn_threshold: "85%", overdue_threshold: "100%" },
];

export const INITIAL_HOLIDAYS = [
  { id: 1, date: "2026-01-01", name: "New Year's Day", type: "National", is_recurring: true },
  { id: 2, date: "2026-04-09", name: "Araw ng Kagitingan", type: "National", is_recurring: true },
  { id: 3, date: "2026-05-01", name: "Labor Day", type: "National", is_recurring: true },
  { id: 4, date: "2026-06-12", name: "Independence Day", type: "National", is_recurring: true },
  { id: 5, date: "2026-08-31", name: "National Heroes Day", type: "National", is_recurring: true },
  { id: 6, date: "2026-11-30", name: "Bonifacio Day", type: "National", is_recurring: true },
  { id: 7, date: "2026-12-25", name: "Christmas Day", type: "National", is_recurring: true },
  { id: 8, date: "2026-12-30", name: "Rizal Day", type: "National", is_recurring: true },
];

export const INITIAL_PERIODS = [
  { id: 1, name: "1st Semester AY 2025-2026", type: "Semestral", start_date: "2025-08-01", end_date: "2025-12-20", status: "Closed" },
  { id: 2, name: "2nd Semester AY 2025-2026", type: "Semestral", start_date: "2026-01-05", end_date: "2026-06-15", status: "Active" },
  { id: 3, name: "Q1 2026 Review Cycle", type: "Quarterly", start_date: "2026-01-01", end_date: "2026-03-31", status: "Closed" },
];
