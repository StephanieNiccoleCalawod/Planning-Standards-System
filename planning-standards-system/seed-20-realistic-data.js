const { Client } = require('pg');

// Connection strings inside Docker network
const CATALOGUE_URL = 'postgresql://postgres:steph123gd@postgres-catalogue:5432/service-catalogue-db';
const KPI_SLA_URL = 'postgresql://postgres:steph123gd@postgres-kpi-sla:5432/kpi-sla-db';
const COMMITMENT_URL = 'postgresql://postgres:steph123gd@postgres-commitment:5432/commitment-db';

const services = [
  // ACAD (7)
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a901',
    office: 'ACAD',
    name: 'Enrollment and Registration of Undergraduate Students',
    classification: 'Walk-in / Online Portal',
    sla_target_value: 30,
    sla_target_unit: 'Minutes',
    responsible_unit: 'Registrar Office',
    with_referral: 'Without',
    required_documents: ['Form 138 (Report Card)', 'PSA Birth Certificate', 'Good Moral Certificate'],
    processing_steps: ['Document Verification', 'Portal Encoding', 'Section Assignment', 'Certificate of Registration Printing'],
    expected_output: 'Printed and Stamped Certificate of Registration (COR)',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a902',
    office: 'ACAD',
    name: 'Processing of Graduation Application & Clearance',
    classification: 'Highly Technical',
    sla_target_value: 5,
    sla_target_unit: 'Days',
    responsible_unit: 'Academic Records Section',
    with_referral: 'With',
    required_documents: ['Transcript of Records', 'Evaluation of Grades Form', 'Library Clearance', 'OSAS Clearance'],
    processing_steps: ['Grade Audit', 'Clearance Verification', 'Board Approval', 'Clearance Issuance'],
    expected_output: 'Approved Graduation Clearance Certificate',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a903',
    office: 'ACAD',
    name: 'Issuance of Transcript of Records (TOR) & Diploma',
    classification: 'Complex',
    sla_target_value: 10,
    sla_target_unit: 'Days',
    responsible_unit: 'Registrar Archives Section',
    with_referral: 'Without',
    required_documents: ['Receipt of Payment', 'Clearance Sheet', 'Letter of Request'],
    processing_steps: ['Record Retrieval', 'Encoding and Printing', 'Registrar Signature', 'Dry Seal Application'],
    expected_output: 'Official Transcript of Records and Diploma Certificate',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a904',
    office: 'ACAD',
    name: 'Evaluation of Transfer Credentials / Shifting Applications',
    classification: 'Simple',
    sla_target_value: 3,
    sla_target_unit: 'Days',
    responsible_unit: 'Admissions and Registrar Office',
    with_referral: 'With',
    required_documents: ['Certified True Copy of Grades', 'Honorable Dismissal', 'Description of Subjects'],
    processing_steps: ['Subject Matching', 'Credit Valuation', 'Department Dean Approval', 'Encoding of Credited Subjects'],
    expected_output: 'Approved Credit Evaluation Form',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a905',
    office: 'ACAD',
    name: 'Re-admission and Returning Student Evaluation',
    classification: 'Simple',
    sla_target_value: 2,
    sla_target_unit: 'Days',
    responsible_unit: 'Office of the Dean',
    with_referral: 'Without',
    required_documents: ['Letter of Intent', 'Latest COR', 'Dean Clearance Form'],
    processing_steps: ['Academic Standing Verification', 'Dean Interview', 'Re-admission Form Approval', 'Enlistment Activation'],
    expected_output: 'Signed Re-admission Form',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a906',
    office: 'ACAD',
    name: 'Request for Change or Correction of Grades',
    classification: 'Complex',
    sla_target_value: 7,
    sla_target_unit: 'Days',
    responsible_unit: 'Registrar and Dean Office',
    with_referral: 'With',
    required_documents: ['Completion / Correction Form', 'Professor Signature', 'Dean Approval', 'Grade Sheet Copy'],
    processing_steps: ['Form Submission', 'Verification of Completion', 'Registrar Validation', 'Database Grade Override'],
    expected_output: 'Corrected Grade Posted in Student Portal',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-acab-467a-b9c1-58019b88a907',
    office: 'ACAD',
    name: 'Certificate of Registration (COR) Reprinting and Authentication',
    classification: 'Simple',
    sla_target_value: 15,
    sla_target_unit: 'Minutes',
    responsible_unit: 'Registrar Windows',
    with_referral: 'Without',
    required_documents: ['Official Receipt', 'Student ID'],
    processing_steps: ['Verification in Database', 'Reprinting', 'Signing/Stamping'],
    expected_output: 'Authenticated Certificate of Registration',
    created_by: 'system-seeder'
  },

  // OSAS (7)
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a908',
    office: 'OSAS',
    name: 'Student Organization Accreditation & Renewal',
    classification: 'Complex',
    sla_target_value: 15,
    sla_target_unit: 'Days',
    responsible_unit: 'Student Activities Unit',
    with_referral: 'Without',
    required_documents: ['Constitution & By-Laws', 'List of Officers & Members', 'Calendar of Activities', 'Adviser Consent Form'],
    processing_steps: ['Document Assessment', 'Interview and Defense', 'Office Review', 'Certificate of Accreditation Printing'],
    expected_output: 'Official Certificate of Accreditation',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a909',
    office: 'OSAS',
    name: 'Scholarship & Financial Assistance Application Processing',
    classification: 'Complex',
    sla_target_value: 10,
    sla_target_unit: 'Days',
    responsible_unit: 'Scholarship and Financial Aid Section',
    with_referral: 'Without',
    required_documents: ['Application Form', 'Certificate of Indigency', 'Latest COR', 'Latest Grades Copy'],
    processing_steps: ['Application Evaluation', 'Background Verification', 'Interview and Board Selection', 'Approval List Posting'],
    expected_output: 'Scholarship Grant Certificate',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a910',
    office: 'OSAS',
    name: 'Student ID Card Application and Issuance',
    classification: 'Simple',
    sla_target_value: 1,
    sla_target_unit: 'Days',
    responsible_unit: 'Student ID Processing Section',
    with_referral: 'Without',
    required_documents: ['ID Application Form', 'Official Receipt of Fee', 'COR'],
    processing_steps: ['ID Verification', 'Photo Capture', 'ID Printing', 'Validation Stamping'],
    expected_output: 'Printed Student Identification Card',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a911',
    office: 'OSAS',
    name: 'Counseling & Psychological Consultation Services',
    classification: 'Walk-in / Scheduled',
    sla_target_value: 2,
    sla_target_unit: 'Hours',
    responsible_unit: 'Guidance and Counseling Section',
    with_referral: 'Without',
    required_documents: ['Intake Form', 'Student ID'],
    processing_steps: ['Initial Interview', 'Counseling Session', 'Action Plan Formulation', 'Feedback Collection'],
    expected_output: 'Counseling Log Summary & Follow-up Schedule',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a912',
    office: 'OSAS',
    name: 'Processing of Good Moral Character Certificate',
    classification: 'Simple',
    sla_target_value: 1,
    sla_target_unit: 'Days',
    responsible_unit: 'Student Discipline Section',
    with_referral: 'Without',
    required_documents: ['Request Slip', 'Student ID', 'Latest Clearance Form'],
    processing_steps: ['Disciplinary Record Verification', 'Document Preparation', 'OSAS Chief Signature'],
    expected_output: 'Good Moral Character Certificate',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a913',
    office: 'OSAS',
    name: 'Student Disciplinary Action & Grievance Resolution',
    classification: 'Highly Technical',
    sla_target_value: 20,
    sla_target_unit: 'Days',
    responsible_unit: 'Student Discipline Board',
    with_referral: 'With',
    required_documents: ['Incident Report', 'Signed Witness Statements', 'Evidentiary Documents'],
    processing_steps: ['Summons Issuance', 'Board Hearing & Fact Finding', 'Resolution Drafting', 'OSAS Office Execution'],
    expected_output: 'Official Disciplinary Board Resolution Case Report',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-05a5-467a-b9c1-58019b88a914',
    office: 'OSAS',
    name: 'Medical and Dental Clearance for Athletes & OJT',
    classification: 'Simple',
    sla_target_value: 4,
    sla_target_unit: 'Hours',
    responsible_unit: 'Medical and Dental Clinic',
    with_referral: 'Without',
    required_documents: ['Medical History Form', 'Laboratory Results (X-ray, CBC)', 'Dental Records Form'],
    processing_steps: ['Physical Examination', 'Dental Checkup', 'Lab Results Verification', 'Clearance Signing'],
    expected_output: 'Signed Medical & Dental Clearance Certificate',
    created_by: 'system-seeder'
  },

  // ADMIN (6)
  {
    id: 'f87a8761-ad00-467a-b9c1-58019b88a915',
    office: 'ADMIN',
    name: 'Processing of Gate Pass for Equipment & Vehicles',
    classification: 'Simple',
    sla_target_value: 2,
    sla_target_unit: 'Hours',
    responsible_unit: 'Security Office',
    with_referral: 'Without',
    required_documents: ['Gate Pass Request Form', 'Official Receipt/Property Card', 'Approving Authority Signature'],
    processing_steps: ['Form Verification', 'Serial Number Matching', 'Gate Pass Issuance'],
    expected_output: 'Approved Gate Pass Copy',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-ad00-467a-b9c1-58019b88a916',
    office: 'ADMIN',
    name: 'Facility Reservation & Equipment Borrowing',
    classification: 'Simple',
    sla_target_value: 1,
    sla_target_unit: 'Days',
    responsible_unit: 'Physical Planning & Facilities Unit',
    with_referral: 'Without',
    required_documents: ['Facility Reservation Request Form', 'Approved Activity Proposal', 'Student ID'],
    processing_steps: ['Calendar Conflict Check', 'Facility Inspections', 'Director Approval', 'Key Issuance'],
    expected_output: 'Approved Reservation Slip',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-ad00-467a-b9c1-58019b88a917',
    office: 'ADMIN',
    name: 'Requisition of Supplies and Office Equipment (Procurement)',
    classification: 'Highly Technical',
    sla_target_value: 30,
    sla_target_unit: 'Days',
    responsible_unit: 'Procurement Unit',
    with_referral: 'With',
    required_documents: ['Purchase Request Form', 'Project Procurement Management Plan', 'Approved Budget Allocation'],
    processing_steps: ['PR Verification', 'Bidding and Quoting', 'Purchase Order Issuance', 'Supplies Delivery & Testing'],
    expected_output: 'Delivered and Inspected Supplies/Equipment',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-ad00-467a-b9c1-58019b88a918',
    office: 'ADMIN',
    name: 'IT Helpdesk Ticket Resolution (WiFi, Portal Pass Reset)',
    classification: 'Simple',
    sla_target_value: 30,
    sla_target_unit: 'Minutes',
    responsible_unit: 'Management Information Systems (MIS)',
    with_referral: 'Without',
    required_documents: ['Support Ticket Form', 'Student / Employee ID'],
    processing_steps: ['Identity Verification', 'Ticket Assessment', 'System Modification / Account Reset', 'Confirmation Email'],
    expected_output: 'Reset Account Credentials & Resolved Support Ticket',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-ad00-467a-b9c1-58019b88a919',
    office: 'ADMIN',
    name: 'Human Resource (HR) Certificate of Employment Request',
    classification: 'Simple',
    sla_target_value: 2,
    sla_target_unit: 'Days',
    responsible_unit: 'Human Resource Management Section',
    with_referral: 'Without',
    required_documents: ['HR Document Request Form', 'Valid Identification Card'],
    processing_steps: ['Employee Record Check', 'Document Printing', 'HR Director Signature'],
    expected_output: 'Official Certificate of Employment (COE)',
    created_by: 'system-seeder'
  },
  {
    id: 'f87a8761-ad00-467a-b9c1-58019b88a920',
    office: 'ADMIN',
    name: 'Building Maintenance and Repair Requests',
    classification: 'Complex',
    sla_target_value: 3,
    sla_target_unit: 'Days',
    responsible_unit: 'Campus Maintenance Unit',
    with_referral: 'Without',
    required_documents: ['Maintenance Request Form (Job Order)', 'Description of Damage'],
    processing_steps: ['Request Validation', 'Technician Assessment', 'Procurement of Parts (if needed)', 'Repair Execution'],
    expected_output: 'Completed Maintenance / Repair (Job Order Signed-off)',
    created_by: 'system-seeder'
  }
];

const kpis = services.map((s) => {
  let category = 'EFFICIENCY';
  if (s.name.includes('Clearance') || s.name.includes('Accreditation') || s.name.includes('Grievance')) {
    category = 'COMPLIANCE';
  } else if (s.name.includes('Counseling') || s.name.includes('Helpdesk')) {
    category = 'CUSTOMER';
  }

  let kpi_target_value = 95.0000;
  let unit = 'PERCENT';

  if (s.name.includes('Accreditation') || s.name.includes('ID Card')) {
    kpi_target_value = 100.0000;
  }

  const kpi_id = s.id.replace('f87a8761', 'd32a3212');

  return {
    id: kpi_id,
    office: s.office,
    sub_office: s.responsible_unit,
    service_id: s.id,
    name: `SLA Compliance Rate (${s.sla_target_value} ${s.sla_target_unit}) for ${s.name}`,
    category: category,
    target_value: kpi_target_value,
    unit: unit,
    measurement_basis: `Total transactions completed within the ${s.sla_target_value} ${s.sla_target_unit} SLA divided by total transactions of ${s.name}.`,
    created_by: 'system-seeder'
  };
});

const evaluationPeriods = [
  {
    id: 'e0101010-acab-467a-b9c1-58019b88a101',
    office: 'ACAD',
    name: '2nd Quarter Evaluation Period 2026 (ACAD)',
    period_type: 'Quarterly',
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    status: 'Open',
    created_by: 'system-seeder'
  },
  {
    id: 'e0101010-05a5-467a-b9c1-58019b88a102',
    office: 'OSAS',
    name: '2nd Quarter Evaluation Period 2026 (OSAS)',
    period_type: 'Quarterly',
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    status: 'Open',
    created_by: 'system-seeder'
  },
  {
    id: 'e0101010-ad00-467a-b9c1-58019b88a103',
    office: 'ADMIN',
    name: '2nd Quarter Evaluation Period 2026 (ADMIN)',
    period_type: 'Quarterly',
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    status: 'Open',
    created_by: 'system-seeder'
  }
];

const slaRules = [
  {
    id: 'a0202020-acab-467a-b9c1-58019b88a201',
    office: 'ACAD',
    work_schedule_type: 'WEEKDAYS',
    work_schedule_config: JSON.stringify([{ day: 'Monday-Friday', hours: '08:00-17:00' }]),
    work_start_time: '08:00:00',
    work_end_time: '17:00:00',
    warn_threshold_pct: 80,
    overdue_threshold_pct: 100,
    created_by: 'system-seeder'
  },
  {
    id: 'a0202020-05a5-467a-b9c1-58019b88a202',
    office: 'OSAS',
    work_schedule_type: 'WEEKDAYS',
    work_schedule_config: JSON.stringify([{ day: 'Monday-Friday', hours: '08:00-17:00' }]),
    work_start_time: '08:00:00',
    work_end_time: '17:00:00',
    warn_threshold_pct: 80,
    overdue_threshold_pct: 100,
    created_by: 'system-seeder'
  },
  {
    id: 'a0202020-ad00-467a-b9c1-58019b88a203',
    office: 'ADMIN',
    work_schedule_type: 'WEEKDAYS',
    work_schedule_config: JSON.stringify([{ day: 'Monday-Friday', hours: '08:00-17:00' }]),
    work_start_time: '08:00:00',
    work_end_time: '17:00:00',
    warn_threshold_pct: 80,
    overdue_threshold_pct: 100,
    created_by: 'system-seeder'
  }
];

const commitments = [
  {
    id: 'c0303030-acab-467a-b9c1-58019b88a301',
    office: 'ACAD',
    period_id: 'e0101010-acab-467a-b9c1-58019b88a101',
    status: 'Draft',
    version_number: 1,
    created_by: 'system-seeder'
  },
  {
    id: 'c0303030-05a5-467a-b9c1-58019b88a302',
    office: 'OSAS',
    period_id: 'e0101010-05a5-467a-b9c1-58019b88a102',
    status: 'Draft',
    version_number: 1,
    created_by: 'system-seeder'
  },
  {
    id: 'c0303030-ad00-467a-b9c1-58019b88a303',
    office: 'ADMIN',
    period_id: 'e0101010-ad00-467a-b9c1-58019b88a103',
    status: 'Draft',
    version_number: 1,
    created_by: 'system-seeder'
  }
];

const commitmentItems = services.map((s) => {
  const matchingKpi = kpis.find(k => k.service_id === s.id);
  const matchingCommitment = commitments.find(c => c.office === s.office);

  return {
    id: s.id.replace('f87a8761', 'a54b5412'),
    commitment_id: matchingCommitment.id,
    service_id: s.id,
    kpi_id: matchingKpi.id,
    target_value: matchingKpi.target_value,
    unit: matchingKpi.unit
  };
});

async function main() {
  console.log('--- STARTING 20 REALISTIC DATA SEEDER ---');
  
  const catalogueClient = new Client({ connectionString: CATALOGUE_URL });
  const kpiSlaClient = new Client({ connectionString: KPI_SLA_URL });
  const commitmentClient = new Client({ connectionString: COMMITMENT_URL });

  try {
    await catalogueClient.connect();
    await kpiSlaClient.connect();
    await commitmentClient.connect();
    console.log('Connected to all three databases successfully.');

    // 1. CLEAN UP EXISTING SEEDS
    console.log('Cleaning up existing data...');
    await commitmentClient.query('DELETE FROM commitment_item;');
    await commitmentClient.query('DELETE FROM commitment;');
    
    await catalogueClient.query('DELETE FROM na_flag;');
    await catalogueClient.query('DELETE FROM intake_field;');
    await catalogueClient.query('DELETE FROM service_version;');
    await catalogueClient.query('DELETE FROM service;');

    await kpiSlaClient.query('DELETE FROM kpi;');
    await kpiSlaClient.query('DELETE FROM sla_rule_version;');
    await kpiSlaClient.query('DELETE FROM sla_rule;');
    await kpiSlaClient.query('DELETE FROM evaluation_period;');
    console.log('Clean up complete.');

    // 2. SEED EVALUATION PERIODS
    console.log('Seeding evaluation periods...');
    for (const ep of evaluationPeriods) {
      await kpiSlaClient.query(
        `INSERT INTO evaluation_period (id, office, name, period_type, start_date, end_date, status, created_by, created_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true)`,
        [ep.id, ep.office, ep.name, ep.period_type, ep.start_date, ep.end_date, ep.status, ep.created_by]
      );
    }

    // 3. SEED SLA RULES
    console.log('Seeding SLA rules...');
    for (const rule of slaRules) {
      await kpiSlaClient.query(
        `INSERT INTO sla_rule (id, office, work_schedule_type, work_schedule_config, work_start_time, work_end_time, warn_threshold_pct, overdue_threshold_pct, is_active, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, NOW())`,
        [rule.id, rule.office, rule.work_schedule_type, rule.work_schedule_config, rule.work_start_time, rule.work_end_time, rule.warn_threshold_pct, rule.overdue_threshold_pct, rule.created_by]
      );
    }

    // 4. SEED SERVICES
    console.log('Seeding services...');
    for (const s of services) {
      await catalogueClient.query(
        `INSERT INTO service (id, office, sub_office, name, classification, sla_target_value, sla_target_unit, responsible_unit, with_referral, required_documents, processing_steps, expected_output, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active', $13, NOW(), NOW())`,
        [
          s.id,
          s.office,
          s.sub_office,
          s.name,
          s.classification,
          s.sla_target_value,
          s.sla_target_unit,
          s.responsible_unit,
          s.with_referral,
          JSON.stringify(s.required_documents),
          JSON.stringify(s.processing_steps),
          s.expected_output,
          s.created_by
        ]
      );
    }

    // 5. SEED KPIS
    console.log('Seeding KPIs...');
    for (const k of kpis) {
      await kpiSlaClient.query(
        `INSERT INTO kpi (id, office, sub_office, service_id, name, category, target_value, unit, measurement_basis, is_active, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW())`,
        [k.id, k.office, k.sub_office, k.service_id, k.name, k.category, k.target_value, k.unit, k.measurement_basis, k.created_by]
      );
    }

    // 6. SEED COMMITMENTS
    console.log('Seeding commitments...');
    for (const c of commitments) {
      await commitmentClient.query(
        `INSERT INTO commitment (id, office, period_id, status, version_number, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [c.id, c.office, c.period_id, c.status, c.version_number, c.created_by]
      );
    }

    // 7. SEED COMMITMENT ITEMS
    console.log('Seeding commitment items...');
    for (const ci of commitmentItems) {
      await commitmentClient.query(
        `INSERT INTO commitment_item (id, commitment_id, service_id, kpi_id, target_value, unit, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [ci.id, ci.commitment_id, ci.service_id, ci.kpi_id, ci.target_value, ci.unit]
      );
    }

    console.log('All 20 realistic services, KPIs, and commitments seeded successfully!');
  } catch (err) {
    console.error('Fatal error during seeding:', err);
  } finally {
    await catalogueClient.end();
    await kpiSlaClient.end();
    await commitmentClient.end();
    console.log('Disconnected from all databases.');
  }
}

main();
