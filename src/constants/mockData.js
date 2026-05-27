export const MOCK_TRANSACTIONS = [
  { id: "SLP-00381", date: "Jan 15, 2024", client: "Stephanie Calawod", service: "Medical Consultation", processing: "34 min", docStatus: "Complete", sla: "Compliant", type: "MEDICAL" },
  { id: "SLP-00382", date: "Feb 10, 2024", client: "Ralph Duenas", service: "Dental Checkup", processing: "40 min", docStatus: "Incomplete", sla: "Non-Compliant", type: "DENTAL" },
  { id: "SLP-00379", date: "Apr 22, 2024", client: "Jhaz Ferrer", service: "Library Borrowing", processing: "—", docStatus: "N/A", sla: "Overdue", type: "ADMIN" },
  { id: "SLP-00380", date: "May 05, 2024", client: "Paula Villacarlos", service: "Document Certification", processing: "12 min", docStatus: "Complete", sla: "Compliant", type: "ADMIN" },
  { id: "SLP-00383", date: "Jul 13, 2024", client: "Juan dela Cruz", service: "Emergency Medical Consultation", processing: "18 min", docStatus: "Complete", sla: "Compliant", type: "MEDICAL" },
  { id: "SLP-00384", date: "Aug 13, 2024", client: "Maria Santos", service: "Facility Reservation", processing: "22 min", docStatus: "Complete", sla: "Compliant", type: "ADMIN" },
  { id: "SLP-00385", date: "Oct 12, 2024", client: "Maria Santos", service: "Facility Reservation", processing: "22 min", docStatus: "Complete", sla: "Compliant", type: "ADMIN" },
];

export const MOCK_SERVICES = [
  { id: 1, name: "Academic Program Accreditation", classification: "Highly Technical", sla: "60 Days 30 Minutes", slaTarget: "60 Days 30 Minutes", responsibleUnit: "Quality Assurance", active: true, naFlag: false, lastUpdated: "Sep 5, 2025 09:30 AM" },
  { id: 2, name: "Certification of Grades", classification: "Simple", sla: "15 Minutes", slaTarget: "15 Minutes", responsibleUnit: "Records Office", active: true, naFlag: false, lastUpdated: "Jan 5, 2026 02:15 PM" },
  { id: 3, name: "Curriculum Revision Proposal", classification: "Complex", sla: "14 Days 15 Minutes", slaTarget: "14 Days 15 Minutes", responsibleUnit: "Academic Affairs", active: true, naFlag: true, lastUpdated: "Nov 15, 2025 11:45 AM" },
  { id: 4, name: "Document Request Processing", classification: "Simple", sla: "15 Minutes", slaTarget: "15 Minutes", responsibleUnit: "Records Office", active: true, naFlag: false, lastUpdated: "Jan 10, 2026 08:30 AM" },
  { id: 5, name: "Enrollment Assessment", classification: "Simple", sla: "30 Minutes", slaTarget: "30 Minutes", responsibleUnit: "Records Office", active: true, naFlag: false, lastUpdated: "Jan 3, 2026 04:00 PM" },
  { id: 6, name: "Student Clearance Clearance", classification: "Simple", sla: "1 Day 45 Minutes", slaTarget: "1 Day 45 Minutes", responsibleUnit: "Records Office", active: true, naFlag: false, lastUpdated: "Jan 12, 2026 10:15 AM" },
  { id: 7, name: "Faculty Evaluation Request", classification: "Complex", sla: "7 Days 30 Minutes", slaTarget: "7 Days 30 Minutes", responsibleUnit: "Academic Affairs", active: true, naFlag: false, lastUpdated: "Feb 18, 2026 03:45 PM" },
  { id: 8, name: "Lab Access Reservation", classification: "Simple", sla: "2 Hours", slaTarget: "2 Hours", responsibleUnit: "Laboratory Division", active: true, naFlag: false, lastUpdated: "Mar 10, 2026 01:20 PM" },
  { id: 9, name: "Research Grant Application", classification: "Highly Technical", sla: "30 Days 10 Minutes", slaTarget: "30 Days 10 Minutes", responsibleUnit: "Research Office", active: true, naFlag: true, lastUpdated: "Apr 22, 2026 09:10 AM" },
  { id: 10, name: "Library Card Issuance", classification: "Simple", sla: "10 Minutes", slaTarget: "10 Minutes", responsibleUnit: "Library Services", active: true, naFlag: false, lastUpdated: "May 02, 2026 11:00 AM" },
  { id: 11, name: "Alumni ID Registration", classification: "Simple", sla: "3 Days 15 Minutes", slaTarget: "3 Days 15 Minutes", responsibleUnit: "Alumni Relations", active: true, naFlag: false, lastUpdated: "May 15, 2026 02:50 PM" },
  { id: 12, name: "Graduation Application Audit", classification: "Highly Technical", sla: "45 Days 20 Minutes", slaTarget: "45 Days 20 Minutes", responsibleUnit: "Registrar Office", active: false, naFlag: false, lastUpdated: "Dec 12, 2025 04:30 PM" },
  { id: 13, name: "Classroom Rescheduling", classification: "Complex", sla: "2 Days 30 Minutes", slaTarget: "2 Days 30 Minutes", responsibleUnit: "Academic Affairs", active: false, naFlag: false, lastUpdated: "Nov 02, 2025 10:05 AM" },
  { id: 14, name: "Decommissioned Archives System", classification: "Complex", sla: "—", slaTarget: "—", responsibleUnit: "IT Department", active: false, naFlag: false, lastUpdated: "Jan 1, 2025 08:00 AM", archived: true },
];

// ── Mock Data ─────────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS = [
  { id: 1, timestamp: "05-10-2026 09:41 AM", actor: "Administrative", action: "Created", entity: "Transaction", description: "Logged Permission to Conduct an Activity (Activity Permit) for student." },
  { id: 2, timestamp: "05-10-2026 08:09 AM", actor: "Administrative", action: "Deactivated", entity: "Service Registry", description: "Deactivated \"Permission to Conduct an Activity\" from service list." },
  { id: 3, timestamp: "05-09-2026 04:30 AM", actor: "Nurse", action: "Created", entity: "Transaction", description: "Logged Medical Consultation — Students transaction." },
  { id: 4, timestamp: "05-10-2026 09:41 AM", actor: "Dentist", action: "Created", entity: "Transaction", description: "Logged Dental Consultation transaction for faculty member." },
  { id: 5, timestamp: "05-08-2026 11:15 AM", actor: "Administrative", action: "Updated", entity: "Service Registry", description: "Updated SLA target for Emergency Medical Consultation." },
  { id: 6, timestamp: "05-08-2026 10:00 AM", actor: "Nurse", action: "Deleted", entity: "Transaction", description: "Deleted duplicate Medical Certificate entry." },
  { id: 7, timestamp: "05-07-2026 03:22 PM", actor: "Dentist", action: "Created", entity: "Transaction", description: "Logged Dental Clearance — Faculty & Admin transaction." },
  { id: 8, timestamp: "05-07-2026 01:45 PM", actor: "Administrative", action: "Updated", entity: "Commitment", description: "Revised Q2 2026 commitment targets for administrative services." },
  { id: 9, timestamp: "05-06-2026 09:10 AM", actor: "Nurse", action: "Created", entity: "Transaction", description: "Logged Library Borrowing transaction for student." },
  { id: 10, timestamp: "05-05-2026 08:55 AM", actor: "Administrative", action: "Deactivated", entity: "Service Registry", description: "Deactivated Library Borrowing service for maintenance." },
  { id: 11, timestamp: "05-04-2026 02:30 PM", actor: "Dentist", action: "Updated", entity: "Transaction", description: "Updated processing time for Dental Clearance transaction." },
  { id: 12, timestamp: "05-03-2026 11:00 AM", actor: "Administrative", action: "Created", entity: "Commitment", description: "Created new Q2 commitment record for administrative review." },
];