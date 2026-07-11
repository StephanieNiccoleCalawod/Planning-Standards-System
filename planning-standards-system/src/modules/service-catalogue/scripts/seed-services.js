/**
 * TT1 — DB Seed: Administrative, Academic, OSAS Services
 * PSS Service Catalogue Microservice (Sprint 4 — BE Dev 1 - Steph)
 *
 * v2 — service_mode fix
 * ----------------------------------------------------------------------
 * The Service entity now has a real `service_mode` column (VARCHAR(150))
 * with a DB-level unique constraint on (office, name, service_mode) —
 * confirmed via service.entity.ts:
 *   @Unique('uq_service_office_name_mode', ['office', 'name', 'service_mode'])
 *   @Column({ type: 'varchar', length: 150, nullable: true }) service_mode
 *
 * This supersedes the v1 workaround, which predated that column and instead
 * mangled the `name` field (appending "— <service_mode>") to fake
 * uniqueness client-side. That's no longer necessary or correct — v2:
 *   - Sends `service_mode` directly in the POST payload
 *   - Leaves `name` clean (only hard-truncated at 100 chars if a raw name
 *     is independently too long — 13 records in the current data are,
 *     regardless of service_mode)
 *   - Dedupes/checks existing records on (office, name, service_mode),
 *     matching the DB's own constraint exactly
 *
 * Everything else from v1 still applies:
 *   - with_referral is derived from service_mode, not parsed from name
 *   - required_documents string -> array parsing
 *   - sla_target_unit sent as "Minutes" (enum-correct casing)
 *   - office/status/created_by are NOT sent in the body — office comes from
 *     the x-office header, created_by from x-actor-id, status defaults
 *     server-side (confirmed via live 400s against the real DTO)
 *   - field_type uppercased for intake fields (CHECKBOX, not checkbox)
 *   - 409 Conflict on POST is treated as "already exists" (skip), since the
 *     GET /api/services listing endpoint has a known pagination bug
 *     (na_flags join + skip/take) that makes it unreliable as a pre-check
 *   - auth headers: x-actor-id / x-office / x-role: Admin (not the
 *     nonexistent x-mock-role / x-mock-office scheme from the original docs)
 *
 * IMPORTANT — before running this against a database that already has the
 * v1-seeded 74 services (mangled names, blank service_mode), clean those up
 * first so this doesn't create 74 *additional* rows alongside the old ones:
 *
 *   DELETE FROM service WHERE created_by = 'system_seed';
 *
 * service_intake_field / service_na_flag / service_version all cascade on
 * delete (onDelete: 'CASCADE'), so this cleanly removes their old intake
 * fields too. Run this once, then run this script fresh.
 *
 * Usage:
 *   node seed-services.js --dry-run     # audit + preview only, no API calls
 *   node seed-services.js               # actually seed against the running API
 *
 * Env vars:
 *   API_BASE   default: http://localhost:3000 (use 3010 for direct access —
 *              see docker-compose.yml port mapping)
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
// 2. Drop exact cross-file duplicates — key is (office, name, service_mode),
//    matching the DB's own unique constraint exactly.
// ---------------------------------------------------------------------------
function dedupeExactOverlaps(records) {
  const seen = new Map();
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
// 3. Truncate name ONLY if it's independently too long (>100 chars) — no
//    suffix-appending anymore, service_mode has its own column now.
// ---------------------------------------------------------------------------
function truncatePlainName(name, maxLen = 100) {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '…';
}

// ---------------------------------------------------------------------------
// 4. with_referral is derived from service_mode, not parsed from the name —
//    zero names in this dataset actually contain "(With Referral)" text.
//    Enum values are With / Without / N/A (not "Non-Referral").
// ---------------------------------------------------------------------------
function deriveWithReferral(serviceMode) {
  if (serviceMode === 'With Referral') return 'With';
  if (serviceMode === 'Without Referral') return 'Without';
  return 'N/A';
}

function parseRequiredDocuments(raw) {
  if (!raw || raw.trim() === '' || raw.trim() === 'No Requirements Needed') {
    return [];
  }
  return raw.split('; ').map((s) => s.trim()).filter(Boolean);
}

const SLA_UNIT = 'Minutes'; // SlaUnit enum — capitalized

// ---------------------------------------------------------------------------
// Build the POST payload. office/status/created_by are NOT included — the
// live API rejects them (office comes from x-office header, created_by from
// x-actor-id, status defaults server-side). service_mode IS now included —
// it's a real column with its own DB uniqueness constraint.
// ---------------------------------------------------------------------------
function buildServicePayload(record) {
  return {
    name: truncatePlainName(record.name),
    service_mode: record.service_mode || undefined, // omit entirely if null/empty, DTO field is optional
    responsible_unit: record.responsible_unit,
    classification: record.classification,
    sla_target_value: Number(record.sla_target_value),
    sla_target_unit: SLA_UNIT,
    processing_steps: record.processing_steps,
    required_documents: parseRequiredDocuments(record.required_documents),
    expected_output: record.expected_output,
    with_referral: deriveWithReferral(record.service_mode),
  };
}

// ---------------------------------------------------------------------------
// Auth headers — the shared JwtAuthGuard trusts these as if forwarded by the
// API Gateway. x-role: Admin has both SERVICES_READ and SERVICES_WRITE.
// ---------------------------------------------------------------------------
function authHeaders(office) {
  return {
    'x-actor-id': 'system_seed',
    'x-actor-username': 'system_seed',
    'x-office': office,
    'x-role': 'Admin',
    'x-arms-role': 'SUBSYSTEM_ADMIN',
    'x-is-cross-office': 'false',
  };
}

async function apiGet(pathname, office) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method: 'GET',
    headers: authHeaders(office),
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
      ...authHeaders(office),
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
    const err = new Error(`POST ${pathname} (${office}) failed: ${res.status} ${JSON.stringify(json)}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Fetch existing services per office — paginated properly (GET /api/services
// defaults to limit=20; looping avoids missing anything beyond page 1).
// Keyed by (name, service_mode) now, matching the real DB constraint.
// ---------------------------------------------------------------------------
async function fetchAllServicesForOffice(office) {
  const all = [];
  let page = 1;
  const limit = 100; // DTO max
  while (true) {
    const res = await apiGet(`/api/services?page=${page}&limit=${limit}`, office);
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    all.push(...list);
    const total = Array.isArray(res) ? list.length : (res?.total ?? list.length);
    if (all.length >= total || list.length === 0) break;
    page += 1;
  }
  return all;
}

function existingKey(name, serviceMode) {
  return [name, serviceMode || null].join('||');
}

async function fetchExistingServicesByOffice(offices) {
  const lookup = new Map(); // office -> Map((name||service_mode) -> id)
  for (const office of offices) {
    const list = await fetchAllServicesForOffice(office);
    const byKey = new Map(list.map((s) => [existingKey(s.name, s.service_mode), s.id]));
    lookup.set(office, byKey);
  }
  return lookup;
}

async function getIntakeFieldCount(serviceId, office) {
  const existing = await apiGet(`/api/services/${serviceId}/intake-fields`, office);
  const list = Array.isArray(existing) ? existing : (existing?.data ?? []);
  return list.length;
}

async function createIntakeFields(serviceId, office, intakeFields, results, label) {
  for (const field of intakeFields) {
    try {
      await apiPost(`/api/services/${serviceId}/intake-fields`, office, {
        label: field.label,
        field_type: (field.field_type || '').toUpperCase(),
        is_required: field.is_required,
        display_order: field.display_order,
        dropdown_options: null,
      });
      results.intakeFieldsCreated += 1;
    } catch (fieldErr) {
      results.errors.push({ service: label, stage: 'intake_field', error: fieldErr.message });
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== TT1 Seed v2 — Service Catalogue (service_mode fix) ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no API calls)' : 'LIVE'}`);
  console.log(`API base: ${API_BASE}\n`);

  const raw = loadRecords();
  console.log(`Loaded ${raw.length} raw records from ${BATCH_FILES.length} files.`);

  const { kept, droppedExactOverlaps } = dedupeExactOverlaps(raw);
  console.log(`Dropped ${droppedExactOverlaps.length} exact cross-file duplicate(s):`);
  for (const d of droppedExactOverlaps) {
    console.log(`  - [${d._sourceFile}] "${d.name}" (${d.office}, mode: ${d.service_mode ?? 'null'})`);
  }

  console.log(`\nFinal unique record count to attempt: ${kept.length}`);

  const longNames = kept.filter((r) => r.name.length > 100);
  if (longNames.length > 0) {
    console.log(`\n${longNames.length} record(s) have a raw name over 100 chars and will be truncated:`);
    longNames.forEach((r) => console.log(`  - "${r.name}" (${r.name.length} chars)`));
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: sample payloads ---');
    kept.slice(0, 3).forEach((r, i) => {
      console.log(`\n[${i + 1}] office header: ${r.office}`);
      console.log(JSON.stringify(buildServicePayload(r), null, 2));
    });
    console.log('\nDry run complete. No API calls were made.');
    return;
  }

  const offices = [...new Set(kept.map((r) => r.office))];
  console.log(`\nFetching existing services for offices: ${offices.join(', ')}`);
  const existingByOffice = await fetchExistingServicesByOffice(offices);

  const results = {
    attempted: kept.length,
    created: 0,
    skipped: 0,
    intakeFieldsCreated: 0,
    intakeFieldsBackfilled: 0,
    errors: [],
  };

  for (const record of kept) {
    const office = record.office;
    const name = truncatePlainName(record.name);
    const label = record.service_mode ? `${name} (${record.service_mode})` : name;
    const officeMap = existingByOffice.get(office) || new Map();
    const intakeFields = record.intake_fields || [];
    const key = existingKey(name, record.service_mode);

    const existingId = officeMap.get(key);
    if (existingId) {
      results.skipped += 1;
      if (intakeFields.length > 0) {
        try {
          const currentCount = await getIntakeFieldCount(existingId, office);
          if (currentCount === 0) {
            await createIntakeFields(existingId, office, intakeFields, results, label);
            results.intakeFieldsBackfilled += 1;
          }
        } catch (err) {
          results.errors.push({ service: label, stage: 'intake_field_check', error: err.message });
        }
      }
      continue;
    }

    try {
      const payload = buildServicePayload(record);
      const created = await apiPost('/api/services', office, payload);
      results.created += 1;
      officeMap.set(key, created.id);

      await createIntakeFields(created.id, office, intakeFields, results, label);
    } catch (err) {
      if (err.status === 409) {
        // DB's own constraint says it already exists — trust that over our
        // (possibly stale/paginated) local lookup.
        results.skipped += 1;
        try {
          const searchRes = await apiGet(`/api/services?search=${encodeURIComponent(name)}&limit=100`, office);
          const list = Array.isArray(searchRes) ? searchRes : (searchRes?.data ?? []);
          const match = list.find((s) => s.name === name && (s.service_mode || null) === (record.service_mode || null));
          if (match && intakeFields.length > 0) {
            const currentCount = await getIntakeFieldCount(match.id, office);
            if (currentCount === 0) {
              await createIntakeFields(match.id, office, intakeFields, results, label);
              results.intakeFieldsBackfilled += 1;
            }
          }
        } catch (lookupErr) {
          results.errors.push({ service: label, stage: 'conflict_lookup', error: lookupErr.message });
        }
      } else {
        results.errors.push({ service: label, stage: 'service', error: err.message });
      }
    }
  }

  console.log('\n=== Seeding Report ===');
  console.log(`Total attempted:        ${results.attempted}`);
  console.log(`Created (new):          ${results.created}`);
  console.log(`Skipped (already existed): ${results.skipped}`);
  console.log(`Intake fields created:  ${results.intakeFieldsCreated}`);
  console.log(`Services backfilled with missing intake fields: ${results.intakeFieldsBackfilled}`);
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