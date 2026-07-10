/**
 * TT1 — DB Seed: Administrative, Academic, OSAS Services
 * PSS Service Catalogue Microservice (Sprint 4 — BE Dev 1 - Steph)
 *
 * Fixes applied over the original SEEDING_INSTRUCTIONS.md, based on an audit
 * of the actual data in CHARTER SEEDER/output/*.json:
 *
 *  FIX 1 — Dedupe key changed from (office, name) to (office, name, service_mode).
 *          The raw data has multiple real, distinct services sharing the same
 *          `name` (e.g. "Processing of Request for Credentials Service" x4),
 *          differentiated only by `service_mode`. A name-only dedupe check
 *          would wrongly skip 3 of those 4 as "already exists".
 *
 *  FIX 2 — with_referral is derived from `service_mode`, not parsed out of
 *          `name`. Zero records in the actual data have "(With Referral)" /
 *          "(Without Referral)" in the name string, so the original
 *          name-parsing rule would always fall through to "Non-Referral" and
 *          silently discard the real referral data.
 *
 *  FIX 3 — Name disambiguation. When several records share the same
 *          (office, name) but different service_mode values, the mode is
 *          appended to the name on insert (e.g. "... — Transcript of
 *          Records") so they don't collide as indistinguishable rows in the
 *          `service` table. Only applied when the name is actually ambiguous
 *          — untouched otherwise.
 *
 * Everything else follows SEEDING_INSTRUCTIONS.md as written:
 *   - service_mode itself is still omitted from the POST payload (not a DB column)
 *   - required_documents string -> array parsing
 *   - sla_target_unit always sent as "minutes"
 *   - status "Active", created_by "system_seed"
 *   - office header read per-record from the "office" field
 *   - intake_fields posted only for services actually created (not skipped)
 *
 * Usage:
 *   node seed-services.js --dry-run     # audit + preview only, no API calls
 *   node seed-services.js               # actually seed against the running API
 *
 * Env vars:
 *   API_BASE   default: http://localhost:3000
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const DRY_RUN = process.argv.includes('--dry-run');

const DATA_DIR = process.env.SEED_DATA_DIR || path.join(__dirname, 'data');
const BATCH_FILES = [
  'batch1_academic_office.json',
  'batch2_osas.json',
  'batch3_administrative_office.json',
];

// ---------------------------------------------------------------------------
// 1. Load + merge all batch files
// ---------------------------------------------------------------------------
function loadRecords() {
  const all = [];
  for (const file of BATCH_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Seed file not found: ${filePath}`);
    }
    const records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const r of records) {
      r._sourceFile = file;
    }
    all.push(...records);
  }
  return all;
}

// ---------------------------------------------------------------------------
// 2. FIX 1 — build a dedupe key on (office, name, service_mode) and drop
//    exact cross-file overlaps (e.g. 3 records identical in batch1 + batch2)
// ---------------------------------------------------------------------------
function dedupeExactOverlaps(records) {
  const seen = new Map(); // key -> first record kept
  const kept = [];
  const droppedExactOverlaps = [];

  for (const r of records) {
    const key = [r.office, r.name, r.service_mode ?? null].join('||');
    if (seen.has(key)) {
      droppedExactOverlaps.push(r);
      continue;
    }
    seen.set(key, r);
    kept.push(r);
  }

  return { kept, droppedExactOverlaps };
}

// ---------------------------------------------------------------------------
// 3. FIX 3 — detect ambiguous (office, name) groups (same name, different
//    service_mode) and mark which records need the mode appended to the name
// ---------------------------------------------------------------------------
function markDisambiguation(records) {
  const groups = new Map(); // "office||name" -> [records]
  for (const r of records) {
    const key = `${r.office}||${r.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const disambiguated = [];
  for (const r of records) {
    const key = `${r.office}||${r.name}`;
    const group = groups.get(key);
    const isAmbiguous = group.length > 1;
    const finalName =
      isAmbiguous && r.service_mode
        ? `${r.name} — ${r.service_mode}`
        : r.name;
    disambiguated.push({ ...r, _finalName: finalName, _wasDisambiguated: isAmbiguous });
  }
  return disambiguated;
}

// ---------------------------------------------------------------------------
// 4. FIX 2 — derive with_referral from service_mode, not from the name
// ---------------------------------------------------------------------------
function deriveWithReferral(serviceMode) {
  if (serviceMode === 'With Referral') return 'With';
  if (serviceMode === 'Without Referral') return 'Without';
  return 'Non-Referral';
}

// ---------------------------------------------------------------------------
// required_documents: "No Requirements Needed" -> []; else split by "; "
// ---------------------------------------------------------------------------
function parseRequiredDocuments(raw) {
  if (!raw || raw.trim() === '' || raw.trim() === 'No Requirements Needed') {
    return [];
  }
  return raw.split('; ').map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Build the POST payload for a single record (service_mode intentionally
// omitted — not a DB column per SEEDING_INSTRUCTIONS.md)
// ---------------------------------------------------------------------------
function buildServicePayload(record) {
  return {
    name: record._finalName,
    office: record.office,
    responsible_unit: record.responsible_unit,
    classification: record.classification,
    sla_target_value: Number(record.sla_target_value),
    sla_target_unit: 'minutes',
    processing_steps: record.processing_steps,
    required_documents: parseRequiredDocuments(record.required_documents),
    expected_output: record.expected_output,
    with_referral: deriveWithReferral(record.service_mode),
    status: 'Active',
    created_by: 'system_seed',
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function apiGet(pathname, office) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method: 'GET',
    headers: {
      'x-mock-role': 'SubsystemAdmin',
      'x-mock-office': office,
    },
  });
  if (!res.ok) {
    throw new Error(`GET ${pathname} (${office}) failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function apiPost(pathname, office, body) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-role': 'SubsystemAdmin',
      'x-mock-office': office,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(`POST ${pathname} (${office}) failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Fetch existing service names per office (idempotency lookup)
// ---------------------------------------------------------------------------
async function fetchExistingNamesByOffice(offices) {
  const lookup = new Map(); // office -> Set(names)
  for (const office of offices) {
    const existing = await apiGet('/api/services', office);
    const names = new Set((existing || []).map((s) => s.name));
    lookup.set(office, names);
  }
  return lookup;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== TT1 Seed — Service Catalogue ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no API calls)' : 'LIVE'}`);
  console.log(`API base: ${API_BASE}\n`);

  const raw = loadRecords();
  console.log(`Loaded ${raw.length} raw records from ${BATCH_FILES.length} files.`);

  const { kept, droppedExactOverlaps } = dedupeExactOverlaps(raw);
  console.log(`Dropped ${droppedExactOverlaps.length} exact cross-file duplicate(s):`);
  for (const d of droppedExactOverlaps) {
    console.log(`  - [${d._sourceFile}] "${d.name}" (${d.office}, mode: ${d.service_mode ?? 'null'})`);
  }

  const records = markDisambiguation(kept);
  const disambiguatedCount = records.filter((r) => r._wasDisambiguated).length;
  console.log(`\n${disambiguatedCount} record(s) had their name disambiguated with service_mode suffix.`);
  if (disambiguatedCount > 0) {
    console.log('Examples:');
    records
      .filter((r) => r._wasDisambiguated)
      .slice(0, 5)
      .forEach((r) => console.log(`  - "${r.name}" -> "${r._finalName}"`));
  }

  console.log(`\nFinal unique record count to attempt: ${records.length}`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: sample payloads ---');
    records.slice(0, 3).forEach((r, i) => {
      console.log(`\n[${i + 1}] office header: ${r.office}`);
      console.log(JSON.stringify(buildServicePayload(r), null, 2));
    });
    console.log('\nDry run complete. No API calls were made.');
    return;
  }

  const offices = [...new Set(records.map((r) => r.office))];
  console.log(`\nFetching existing services for offices: ${offices.join(', ')}`);
  const existingByOffice = await fetchExistingNamesByOffice(offices);

  const results = {
    attempted: records.length,
    created: 0,
    skipped: 0,
    intakeFieldsCreated: 0,
    errors: [],
  };

  for (const record of records) {
    const office = record.office;
    const finalName = record._finalName;
    const existingNames = existingByOffice.get(office) || new Set();

    if (existingNames.has(finalName)) {
      results.skipped += 1;
      continue;
    }

    try {
      const payload = buildServicePayload(record);
      const created = await apiPost('/api/services', office, payload);
      results.created += 1;
      existingNames.add(finalName); // prevent re-creating within this same run

      const intakeFields = record.intake_fields || [];
      for (const field of intakeFields) {
        try {
          await apiPost(`/api/services/${created.id}/intake-fields`, office, {
            label: field.label,
            field_type: field.field_type,
            is_required: field.is_required,
            display_order: field.display_order,
            dropdown_options: null,
          });
          results.intakeFieldsCreated += 1;
        } catch (fieldErr) {
          results.errors.push({
            service: finalName,
            stage: 'intake_field',
            error: fieldErr.message,
          });
        }
      }
    } catch (err) {
      results.errors.push({ service: finalName, stage: 'service', error: err.message });
    }
  }

  console.log('\n=== Seeding Report ===');
  console.log(`Total attempted:        ${results.attempted}`);
  console.log(`Created (new):          ${results.created}`);
  console.log(`Skipped (already existed): ${results.skipped}`);
  console.log(`Intake fields created:  ${results.intakeFieldsCreated}`);
  console.log(`Errors:                 ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log('\n--- Errors ---');
    results.errors.forEach((e) => console.log(`  [${e.stage}] "${e.service}": ${e.error}`));
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
