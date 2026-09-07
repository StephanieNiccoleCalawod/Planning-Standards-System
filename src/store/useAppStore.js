import { create } from "zustand";
import { api } from "../services/api";
import { getUserRoleFromToken, decodeCurrentUser, encodeMockToken, PREDEFINED_MOCK_USERS } from "../services/auth";
import { getPermissions } from "../services/permissions";

// Helper functions for SLA target formatting
const formatSlaTarget = (s) => {
    if (!s.sla_target_value) return "—";
    if (s.sla_target_unit === 'Days') return `${s.sla_target_value}d`;
    if (s.sla_target_unit === 'Minutes') {
        const total = s.sla_target_value;
        const d = Math.floor(total / 1440);
        const h = Math.floor((total % 1440) / 60);
        const m = Math.round(total % 60);
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        return parts.join(" ");
    }
    return `${s.sla_target_value} ${s.sla_target_unit}`;
};

const determineReferral = (s, storedReferrals) => {
    const defaultReferral = (() => {
        if (s.name.toLowerCase().includes('clearance') || s.name.toLowerCase().includes('proposal') || s.name.toLowerCase().includes('grades')) {
            return 'without';
        } else if (s.name.toLowerCase().includes('card') || s.name.toLowerCase().includes('accreditation') || s.name.toLowerCase().includes('grase')) {
            return 'with';
        } else {
            const charCodeSum = s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return charCodeSum % 3 === 0 ? 'with' : charCodeSum % 3 === 1 ? 'without' : 'n/a';
        }
    })();
    return storedReferrals[s.id] || storedReferrals[s.name] || defaultReferral;
};

// Map Holiday helper functions
const mapHolidayTypeToFrontend = (t) => {
    switch (t) {
        case "REGULAR": return "National";
        case "SPECIAL_NON_WORKING": return "Local";
        case "COMPANY": return "Campus";
        default: return "National";
    }
};

const mapHolidayTypeToBackend = (t) => {
    switch (t) {
        case "National": return "REGULAR";
        case "Local": return "SPECIAL_NON_WORKING";
        case "Campus": return "COMPANY";
        default: return "REGULAR";
    }
};

// Map Period helper functions
const mapPeriodTypeToFrontend = (t) => {
    switch (t) {
        case "Quarterly": return "Quarterly";
        case "Semester": return "Semestral";
        case "SEMI_ANNUAL": return "Semestral";
        case "BI_ANNUAL": return "Bi-Annual";
        case "Yearly":
        case "Annual": return "Annual";
        default: return "Semestral";
    }
};

const mapPeriodTypeToBackend = (t) => {
    switch (t) {
        case "Quarterly": return "Quarterly";
        case "Semestral": return "Semester";
        case "Bi-Annual": return "BI_ANNUAL";
        case "Annual": return "Yearly";
        default: return "Semester";
    }
};

const mapPeriodStatusToFrontend = (s) => {
    return s === "Open" ? "Active" : "Closed";
};

// Local Storage & Mock Fallback Defaults
const getCached = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

const setCached = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`[useAppStore] Failed to cache ${key}:`, e);
    }
};

const DEFAULT_SERVICE_MODES = [
    { id: 'sm-1', name: 'Walk-in', description: 'In-person transactions at campus offices', is_active: true, created_at: new Date().toISOString() },
    { id: 'sm-2', name: 'Online', description: 'Services delivered through digital portals or email', is_active: true, created_at: new Date().toISOString() },
    { id: 'sm-3', name: 'Courier', description: 'Delivery or submission via postal/courier services', is_active: true, created_at: new Date().toISOString() },
    { id: 'sm-4', name: 'Hybrid', description: 'Combination of online submission and physical pickup', is_active: true, created_at: new Date().toISOString() },
];

const DEFAULT_SERVICES = [
    {
        id: 'svc-1',
        name: 'Issuance of Transcript of Records (TOR)',
        classification: 'Complex',
        slaTarget: '3d',
        sla: '3d',
        sla_target_value: 3,
        sla_target_unit: 'Days',
        responsibleUnit: 'Academic Office',
        responsible_unit: 'Academic Office',
        active: true,
        status: 'ACTIVE',
        naFlags: [],
        naFlag: false,
        archived: false,
        withReferral: 'without',
        lastUpdated: '03/01/26 09:30',
        intakeDocuments: 'Duly Accomplished Clearance Form\nOfficial Receipt of Payment\n1x1 ID Picture',
        stepsTimeline: 'Step 1: Document Verification\nStep 2: Payment Verification\nStep 3: Printing & Signatures\nStep 4: Release',
        processing_steps: ['Step 1: Document Verification', 'Step 2: Payment Verification', 'Step 3: Printing & Signatures', 'Step 4: Release'],
        expectedOutput: 'Official Transcript of Records',
        modes: [{ id: 'sm-1', name: 'Walk-in' }, { id: 'sm-2', name: 'Online' }],
        mode_ids: ['sm-1', 'sm-2'],
    },
    {
        id: 'svc-2',
        name: 'Application for Graduation & Academic Evaluation',
        classification: 'Highly Technical',
        slaTarget: '7d',
        sla: '7d',
        sla_target_value: 7,
        sla_target_unit: 'Days',
        responsibleUnit: 'Academic Office',
        responsible_unit: 'Academic Office',
        active: true,
        status: 'ACTIVE',
        naFlags: [],
        naFlag: false,
        archived: false,
        withReferral: 'with',
        lastUpdated: '03/02/26 14:15',
        intakeDocuments: 'Curriculum Checklist\nBirth Certificate (PSA)\nCertificate of Candidacy',
        stepsTimeline: 'Step 1: Course Audit\nStep 2: Department Endorsement\nStep 3: Dean Approval\nStep 4: Final Conferment List',
        processing_steps: ['Step 1: Course Audit', 'Step 2: Department Endorsement', 'Step 3: Dean Approval', 'Step 4: Final Conferment List'],
        expectedOutput: 'Graduation Clearance Certificate',
        modes: [{ id: 'sm-1', name: 'Walk-in' }, { id: 'sm-2', name: 'Online' }],
        mode_ids: ['sm-1', 'sm-2'],
    },
    {
        id: 'svc-3',
        name: 'Issuance of Certificate of Good Moral Character',
        classification: 'Simple',
        slaTarget: '1d',
        sla: '1d',
        sla_target_value: 1,
        sla_target_unit: 'Days',
        responsibleUnit: 'OSAS',
        responsible_unit: 'OSAS',
        active: true,
        status: 'ACTIVE',
        naFlags: [],
        naFlag: false,
        archived: false,
        withReferral: 'without',
        lastUpdated: '03/03/26 11:00',
        intakeDocuments: 'Student ID\nAffidavit of No Disciplinary Record\nReceipt',
        stepsTimeline: 'Step 1: Student Record Check\nStep 2: Director Sign-off\nStep 3: Release',
        processing_steps: ['Step 1: Student Record Check', 'Step 2: Director Sign-off', 'Step 3: Release'],
        expectedOutput: 'Certificate of Good Moral Character',
        modes: [{ id: 'sm-1', name: 'Walk-in' }, { id: 'sm-2', name: 'Online' }],
        mode_ids: ['sm-1', 'sm-2'],
    },
    {
        id: 'svc-4',
        name: 'Student Organization Accreditation & Renewal',
        classification: 'Complex',
        slaTarget: '5d',
        sla: '5d',
        sla_target_value: 5,
        sla_target_unit: 'Days',
        responsibleUnit: 'OSAS',
        responsible_unit: 'OSAS',
        active: true,
        status: 'ACTIVE',
        naFlags: [],
        naFlag: false,
        archived: false,
        withReferral: 'with',
        lastUpdated: '03/04/26 16:45',
        intakeDocuments: 'Constitution and By-Laws\nRoster of Officers & Members\nCalendar of Activities\nFaculty Adviser Endorsement',
        stepsTimeline: 'Step 1: OSAS Evaluation\nStep 2: Campus Director Endorsement\nStep 3: Issuance of Certificate',
        processing_steps: ['Step 1: OSAS Evaluation', 'Step 2: Campus Director Endorsement', 'Step 3: Issuance of Certificate'],
        expectedOutput: 'Certificate of Accreditation',
        modes: [{ id: 'sm-1', name: 'Walk-in' }],
        mode_ids: ['sm-1'],
    },
    {
        id: 'svc-5',
        name: 'Campus Facility and Equipment Reservation',
        classification: 'Simple',
        slaTarget: '2d',
        sla: '2d',
        sla_target_value: 2,
        sla_target_unit: 'Days',
        responsibleUnit: 'Administrative Office',
        responsible_unit: 'Administrative Office',
        active: true,
        status: 'ACTIVE',
        naFlags: [],
        naFlag: false,
        archived: false,
        withReferral: 'without',
        lastUpdated: '03/05/26 10:20',
        intakeDocuments: 'Facility Request Form\nActivity Proposal\nSafety Clearance',
        stepsTimeline: 'Step 1: Availability Check\nStep 2: Administrative Head Approval\nStep 3: Security Notification',
        processing_steps: ['Step 1: Availability Check', 'Step 2: Administrative Head Approval', 'Step 3: Security Notification'],
        expectedOutput: 'Approved Facility Reservation Slip',
        modes: [{ id: 'sm-1', name: 'Walk-in' }, { id: 'sm-2', name: 'Online' }],
        mode_ids: ['sm-1', 'sm-2'],
    },
];

const DEFAULT_KPIS = [
    {
        id: 'kpi-1',
        title: 'SLA Compliance Rate',
        category: 'Timeliness',
        target_value: '95',
        unit: '%',
        office: 'Academic Office',
        active: true,
        is_active: true,
        description: 'Percentage of student requests completed within prescribed SLA.'
    },
    {
        id: 'kpi-2',
        title: 'Citizen Satisfaction Index (CSAT)',
        category: 'Quality',
        target_value: '4.5',
        unit: ' Mins',
        office: 'OSAS',
        active: true,
        is_active: true,
        description: 'Average feedback score from client satisfaction surveys.'
    },
    {
        id: 'kpi-3',
        title: 'Process Turnaround Efficiency',
        category: 'Efficiency',
        target_value: '90',
        unit: '%',
        office: 'Administrative Office',
        active: true,
        is_active: true,
        description: 'Efficiency rating on resource utilization and bottleneck reduction.'
    }
];

const DEFAULT_HOLIDAYS = [
    { id: 'hol-1', name: "New Year's Day", date: '2026-01-01', type: 'National', is_recurring: true },
    { id: 'hol-2', name: 'Araw ng Kagitingan', date: '2026-04-09', type: 'National', is_recurring: true },
    { id: 'hol-3', name: 'Labor Day', date: '2026-05-01', type: 'National', is_recurring: true },
    { id: 'hol-4', name: 'Independence Day', date: '2026-06-12', type: 'National', is_recurring: true },
    { id: 'hol-5', name: 'PUP Caloocan Founding Day', date: '2026-07-15', type: 'Campus', is_recurring: true },
    { id: 'hol-6', name: 'National Heroes Day', date: '2026-08-31', type: 'National', is_recurring: true },
    { id: 'hol-7', name: 'Bonifacio Day', date: '2026-11-30', type: 'National', is_recurring: true },
    { id: 'hol-8', name: 'Christmas Day', date: '2026-12-25', type: 'National', is_recurring: true },
    { id: 'hol-9', name: 'Rizal Day', date: '2026-12-30', type: 'National', is_recurring: true },
];

const DEFAULT_PERIODS = [
    {
        id: 'per-1',
        name: '1st Semester A.Y. 2025-2026',
        period_type: 'Semester',
        type: 'Semestral',
        start_date: '2025-09-01',
        end_date: '2026-01-31',
        status: 'Active',
    },
    {
        id: 'per-2',
        name: '2nd Semester A.Y. 2025-2026',
        period_type: 'Semester',
        type: 'Semestral',
        start_date: '2026-02-15',
        end_date: '2026-06-30',
        status: 'Queued',
    },
    {
        id: 'per-3',
        name: 'Midyear Term 2025',
        period_type: 'Quarterly',
        type: 'Quarterly',
        start_date: '2025-07-01',
        end_date: '2025-08-15',
        status: 'Closed',
    }
];

const DEFAULT_COMMITMENTS = [
    {
        id: 'comm-1',
        title: 'Academic Office OPCR 2025-2026',
        office: 'Academic Office',
        period_id: 'per-1',
        period_name: '1st Semester A.Y. 2025-2026',
        status: 'LOCKED',
        rating: 4.85,
        submitted_by: 'mock_academic_head',
        created_at: '2025-09-10T08:00:00.000Z'
    },
    {
        id: 'comm-2',
        title: 'OSAS OPCR Commitment 2025-2026',
        office: 'OSAS',
        period_id: 'per-1',
        period_name: '1st Semester A.Y. 2025-2026',
        status: 'DRAFT',
        rating: null,
        submitted_by: 'mock_osas_head',
        created_at: '2025-09-12T09:30:00.000Z'
    },
    {
        id: 'comm-3',
        title: 'Administrative Office OPCR 2025-2026',
        office: 'Administrative Office',
        period_id: 'per-1',
        period_name: '1st Semester A.Y. 2025-2026',
        status: 'REVISION_REQUESTED',
        rating: null,
        submitted_by: 'mock_admin_head',
        created_at: '2025-09-14T11:00:00.000Z'
    }
];

// Derive initial user state from whatever token is in localStorage
const _initialUser = decodeCurrentUser();
const _initialRole = _initialUser?.role || 'Admin';
const _initialPermissions = getPermissions(_initialUser);

export const useAppStore = create((set, get) => ({
    // State Slices
    services: getCached('pss_services', DEFAULT_SERVICES),
    kpis: getCached('pss_kpis', DEFAULT_KPIS),
    periods: getCached('pss_periods', DEFAULT_PERIODS),
    holidays: getCached('pss_holidays', DEFAULT_HOLIDAYS),
    slaRules: getCached('pss_sla_rules', []),
    commitments: getCached('pss_commitments', DEFAULT_COMMITMENTS),
    serviceModes: getCached('pss_service_modes', DEFAULT_SERVICE_MODES),
    activeCommitment: null,
    userRole: _initialRole,
    // Active user decoded from the stored token
    activeUser: _initialUser,
    // Derived permissions from the active user
    permissions: _initialPermissions,

    // Loading States
    loadingServices: false,
    loadingKpis: false,
    loadingPeriods: false,
    loadingHolidays: false,
    loadingSlaRules: false,
    loadingCommitments: false,
    loadingServiceModes: false,

    // Services CRUD Actions
    fetchServices: async () => {
        set({ loadingServices: true });
        try {
            const res = await api.getServices({ limit: 100, include_archived: true });
            const servicesArray = Array.isArray(res) ? res : (res?.data || []);
            const storedReferrals = JSON.parse(localStorage.getItem('service_referrals') || '{}');

            const formatted = servicesArray.map(s => {
                const formattedSla = formatSlaTarget(s);
                let referral;
                if (s.with_referral) {
                    const referralMap = { 'With': 'with', 'Without': 'without', 'N/A': 'n/a' };
                    referral = referralMap[s.with_referral] || s.with_referral;
                } else {
                    referral = determineReferral(s, storedReferrals);
                }

                return {
                    ...s,
                    id: s.id,
                    name: s.name,
                    classification: s.classification,
                    slaTarget: formattedSla,
                    sla: formattedSla,
                    responsibleUnit: s.responsible_unit,
                    active: s.status === 'ACTIVE' || s.is_active === true || s.active === true || s.status === 'Active',
                    naFlags: Array.isArray(s.na_flags) ? s.na_flags : [],
                    naFlag: Array.isArray(s.na_flags) && s.na_flags.length > 0,
                    archived: s.archived || s.status === 'ARCHIVED' || s.status === 'Archived',
                    withReferral: referral,
                    lastUpdated: s.updated_at ? (() => {
                        const d = new Date(s.updated_at);
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const yy = String(d.getFullYear()).slice(-2);
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        return `${mm}/${dd}/${yy} ${h}:${m}`;
                    })() : '—',
                    intakeDocuments: s.required_documents ? s.required_documents.join("\n") : '',
                    stepsTimeline: s.processing_steps ? s.processing_steps.join("\n") : '',
                    processing_steps: Array.isArray(s.processing_steps) ? s.processing_steps : [],
                    expectedOutput: s.expected_output || '',
                    modes: Array.isArray(s.modes) ? s.modes : [],
                    mode_ids: Array.isArray(s.modes) ? s.modes.map(m => m.id) : (s.mode_ids || []),
                };
            });

            if (formatted.length > 0) {
                set({ services: formatted, loadingServices: false });
                setCached('pss_services', formatted);
            } else {
                set({ loadingServices: false });
            }
        } catch (err) {
            console.warn('[useAppStore] fetchServices API unavailable, using cached/mock:', err?.message);
            const cached = getCached('pss_services', DEFAULT_SERVICES);
            set({ services: cached, loadingServices: false });
        }
    },

    createService: async (payload) => {
        try {
            const res = await api.createService(payload);
            await get().fetchServices();
            return res;
        } catch (err) {
            console.warn('[useAppStore] createService falling back to local storage:', err?.message);
            const newSvc = {
                id: `svc-${Date.now()}`,
                name: payload.name,
                classification: payload.classification || 'Simple',
                slaTarget: payload.sla_target_value ? `${payload.sla_target_value}${payload.sla_target_unit === 'Days' ? 'd' : 'm'}` : '1d',
                sla: payload.sla_target_value ? `${payload.sla_target_value}${payload.sla_target_unit === 'Days' ? 'd' : 'm'}` : '1d',
                sla_target_value: payload.sla_target_value || 1,
                sla_target_unit: payload.sla_target_unit || 'Days',
                responsibleUnit: payload.responsible_unit || 'Academic Office',
                responsible_unit: payload.responsible_unit || 'Academic Office',
                active: true,
                status: 'ACTIVE',
                naFlags: [],
                naFlag: false,
                archived: false,
                withReferral: payload.with_referral || 'without',
                lastUpdated: 'Just now',
                intakeDocuments: Array.isArray(payload.required_documents) ? payload.required_documents.join('\n') : '',
                stepsTimeline: Array.isArray(payload.processing_steps) ? payload.processing_steps.join('\n') : '',
                processing_steps: Array.isArray(payload.processing_steps) ? payload.processing_steps : [],
                expectedOutput: payload.expected_output || '',
                modes: Array.isArray(payload.mode_ids) ? payload.mode_ids.map(id => ({ id, name: id })) : [],
                mode_ids: payload.mode_ids || [],
            };
            const updated = [newSvc, ...get().services];
            set({ services: updated });
            setCached('pss_services', updated);
            return newSvc;
        }
    },

    updateService: async (id, payload) => {
        try {
            const res = await api.updateService(id, payload);
            await get().fetchServices();
            return res;
        } catch (err) {
            console.warn('[useAppStore] updateService falling back to local storage:', err?.message);
            const updated = get().services.map(s => s.id === id ? { ...s, ...payload, lastUpdated: 'Just now' } : s);
            set({ services: updated });
            setCached('pss_services', updated);
            return { id, ...payload };
        }
    },

    activateService: async (id) => {
        try {
            const res = await api.activateService(id);
            await get().fetchServices();
            return res;
        } catch (err) {
            console.warn('[useAppStore] activateService falling back to local storage:', err?.message);
            const updated = get().services.map(s => s.id === id ? { ...s, active: true, status: 'ACTIVE' } : s);
            set({ services: updated });
            setCached('pss_services', updated);
            return { id, status: 'ACTIVE' };
        }
    },

    deactivateService: async (id) => {
        try {
            const res = await api.deactivateService(id);
            await get().fetchServices();
            return res;
        } catch (err) {
            console.warn('[useAppStore] deactivateService falling back to local storage:', err?.message);
            const updated = get().services.map(s => s.id === id ? { ...s, active: false, status: 'INACTIVE' } : s);
            set({ services: updated });
            setCached('pss_services', updated);
            return { id, status: 'INACTIVE' };
        }
    },

    archiveService: async (id) => {
        try {
            const res = await api.archiveService(id);
            await get().fetchServices();
            return res;
        } catch (err) {
            console.warn('[useAppStore] archiveService falling back to local storage:', err?.message);
            const updated = get().services.map(s => s.id === id ? { ...s, archived: true, status: 'ARCHIVED' } : s);
            set({ services: updated });
            setCached('pss_services', updated);
            return { id, status: 'ARCHIVED' };
        }
    },

    // Intake Fields Custom Save Callback (updates store locally)
    updateServiceIntakeFieldsLocal: (updatedSvc) => {
        set(state => {
            const updated = state.services.map(s => s.id === updatedSvc.id ? { ...s, ...updatedSvc, isNew: false } : s);
            setCached('pss_services', updated);
            return { services: updated };
        });
    },

    // KPIs CRUD Actions
    fetchKpis: async () => {
        set({ loadingKpis: true });
        try {
            const res = await api.getKpis({ limit: 100, include_inactive: true });
            const kpisArray = res?.data || [];

            const formatted = kpisArray.map(k => {
                const val = Number(k.target_value);
                const rawUnit = (k.unit || "").trim().toUpperCase();
                let unit = k.unit || " Mins";
                if (rawUnit === "PERCENT" || rawUnit === "%") unit = "%";
                else if (rawUnit === "DAYS" || rawUnit === "DAY") unit = val === 1 ? " Day" : " Days";
                else if (rawUnit === "HOURS" || rawUnit === "HOUR") unit = val === 1 ? " Hour" : " Hours";
                else if (rawUnit === "MINUTES" || rawUnit === "MIN" || rawUnit === "MINUTE" || rawUnit === "COUNT" || rawUnit === "MINS") unit = val === 1 ? " Min" : " Mins";

                return {
                    ...k,
                    category: k.category === "COMPLIANCE" ? "Timeliness" : k.category === "CUSTOMER" ? "Quality" : "Efficiency",
                    target_value: k.target_value,
                    unit,
                    service_id: k.service_id,
                    active: k.is_active
                };
            });

            if (formatted.length > 0) {
                set({ kpis: formatted, loadingKpis: false });
                setCached('pss_kpis', formatted);
            } else {
                set({ loadingKpis: false });
            }
        } catch (err) {
            console.warn('[useAppStore] fetchKpis API unavailable, using cached/mock:', err?.message);
            const cached = getCached('pss_kpis', DEFAULT_KPIS);
            set({ kpis: cached, loadingKpis: false });
        }
    },

    createKpi: async (payload) => {
        try {
            const res = await api.createKpi(payload);
            await get().fetchKpis();
            return res;
        } catch (err) {
            console.warn('[useAppStore] createKpi falling back to local storage:', err?.message);
            const newKpi = {
                id: `kpi-${Date.now()}`,
                title: payload.title,
                category: payload.category || 'Timeliness',
                target_value: payload.target_value || '100',
                unit: payload.unit || '%',
                office: payload.office || 'Academic Office',
                active: true,
                is_active: true,
                description: payload.description || ''
            };
            const updated = [newKpi, ...get().kpis];
            set({ kpis: updated });
            setCached('pss_kpis', updated);
            return newKpi;
        }
    },

    updateKpi: async (id, payload) => {
        try {
            const res = await api.updateKpi(id, payload);
            await get().fetchKpis();
            return res;
        } catch (err) {
            console.warn('[useAppStore] updateKpi falling back to local storage:', err?.message);
            const updated = get().kpis.map(k => k.id === id ? { ...k, ...payload } : k);
            set({ kpis: updated });
            setCached('pss_kpis', updated);
            return { id, ...payload };
        }
    },

    deleteKpi: async (id) => {
        try {
            const res = await api.deleteKpi(id);
            await get().fetchKpis();
            return res;
        } catch (err) {
            console.warn('[useAppStore] deleteKpi falling back to local storage:', err?.message);
            const updated = get().kpis.filter(k => k.id !== id);
            set({ kpis: updated });
            setCached('pss_kpis', updated);
            return { id };
        }
    },

    // SLA Rules CRUD Actions
    fetchSlaRules: async () => {
        set({ loadingSlaRules: true });
        try {
            const res = await api.getSlaRules();
            set({ slaRules: res || [], loadingSlaRules: false });
            setCached('pss_sla_rules', res || []);
            return res;
        } catch (err) {
            console.warn('[useAppStore] fetchSlaRules API unavailable, using cached:', err?.message);
            const cached = getCached('pss_sla_rules', []);
            set({ slaRules: cached, loadingSlaRules: false });
            return cached;
        }
    },

    updateSlaRule: async (id, payload) => {
        try {
            const res = await api.updateSlaRule(id, payload);
            await get().fetchSlaRules();
            return res;
        } catch (err) {
            console.warn('[useAppStore] updateSlaRule falling back to local storage:', err?.message);
            const updated = get().slaRules.map(r => r.id === id ? { ...r, ...payload } : r);
            set({ slaRules: updated });
            setCached('pss_sla_rules', updated);
            return { id, ...payload };
        }
    },

    createSlaRule: async (payload) => {
        try {
            const res = await api.createSlaRule(payload);
            await get().fetchSlaRules();
            return res;
        } catch (err) {
            console.warn('[useAppStore] createSlaRule falling back to local storage:', err?.message);
            const newRule = { id: `sla-${Date.now()}`, ...payload };
            const updated = [newRule, ...get().slaRules];
            set({ slaRules: updated });
            setCached('pss_sla_rules', updated);
            return newRule;
        }
    },

    restoreSlaVersion: async (id, versionId) => {
        try {
            const res = await api.restoreSlaVersion(id, versionId);
            await get().fetchSlaRules();
            return res;
        } catch (err) {
            console.warn('[useAppStore] restoreSlaVersion falling back:', err?.message);
            return { id, versionId };
        }
    },

    // Holidays CRUD Actions
    fetchHolidays: async (params = {}) => {
        set({ loadingHolidays: true });
        try {
            const res = await api.getHolidays({ limit: 100, ...params });
            const holidaysArray = res?.data || [];
            const displayYear = params.year || new Date().getFullYear();

            const formatted = holidaysArray.map(h => {
                let dateVal = "";
                if (h.month !== undefined && h.day !== undefined && h.month !== null && h.day !== null) {
                    const y = h.year ?? displayYear;
                    const mm = String(h.month).padStart(2, '0');
                    const dd = String(h.day).padStart(2, '0');
                    dateVal = `${y}-${mm}-${dd}`;
                } else if (h.holiday_date) {
                    dateVal = h.holiday_date.split('T')[0];
                } else if (h.date) {
                    dateVal = h.date.split('T')[0];
                } else {
                    dateVal = `${displayYear}-01-01`;
                }

                return {
                    ...h,
                    id: h.id,
                    name: h.name,
                    date: dateVal,
                    type: mapHolidayTypeToFrontend(h.type),
                    is_recurring: h.is_recurring
                };
            });

            if (formatted.length > 0) {
                set({ holidays: formatted, loadingHolidays: false });
                setCached('pss_holidays', formatted);
            } else {
                set({ loadingHolidays: false });
            }
        } catch (err) {
            console.warn('[useAppStore] fetchHolidays API unavailable, using cached/mock:', err?.message);
            const cached = getCached('pss_holidays', DEFAULT_HOLIDAYS);
            set({ holidays: cached, loadingHolidays: false });
        }
    },

    createHoliday: async (payload) => {
        try {
            const res = await api.createHoliday(payload);
            await get().fetchHolidays();
            return res;
        } catch (err) {
            console.warn('[useAppStore] createHoliday falling back to local storage:', err?.message);
            const newHoliday = {
                id: `hol-${Date.now()}`,
                name: payload.name,
                date: payload.holiday_date ? payload.holiday_date.split('T')[0] : (payload.date || '2026-01-01'),
                type: mapHolidayTypeToFrontend(payload.type),
                is_recurring: payload.is_recurring || false
            };
            const updated = [newHoliday, ...get().holidays];
            set({ holidays: updated });
            setCached('pss_holidays', updated);
            return newHoliday;
        }
    },

    updateHoliday: async (id, payload) => {
        try {
            const res = await api.updateHoliday(id, payload);
            await get().fetchHolidays();
            return res;
        } catch (err) {
            console.warn('[useAppStore] updateHoliday falling back to local storage:', err?.message);
            const updated = get().holidays.map(h => h.id === id ? {
                ...h,
                name: payload.name || h.name,
                date: payload.holiday_date ? payload.holiday_date.split('T')[0] : (payload.date || h.date),
                type: payload.type ? mapHolidayTypeToFrontend(payload.type) : h.type,
                is_recurring: payload.is_recurring !== undefined ? payload.is_recurring : h.is_recurring
            } : h);
            set({ holidays: updated });
            setCached('pss_holidays', updated);
            return { id, ...payload };
        }
    },

    deleteHoliday: async (id) => {
        try {
            const res = await api.deleteHoliday(id);
            await get().fetchHolidays();
            return res;
        } catch (err) {
            console.warn('[useAppStore] deleteHoliday falling back to local storage:', err?.message);
            const updated = get().holidays.filter(h => h.id !== id);
            set({ holidays: updated });
            setCached('pss_holidays', updated);
            return { id };
        }
    },

    // Evaluation Periods CRUD Actions
    fetchPeriods: async () => {
        set({ loadingPeriods: true });
        try {
            const res = await api.getPeriods({ limit: 100 });
            const periodsArray = res?.data || [];

            const formatted = periodsArray.map(p => ({
                id: p.id,
                name: p.name,
                type: mapPeriodTypeToFrontend(p.period_type),
                start_date: p.start_date,
                end_date: p.end_date,
                status: mapPeriodStatusToFrontend(p.status),
                ...p
            }));

            const sorted = formatted.sort((a, b) => {
                const getPriority = (status) => {
                    if (status === "Open" || status === "Active") return 1;
                    if (status === "Queued") return 2;
                    return 3;
                };
                const priorityA = getPriority(a.status);
                const priorityB = getPriority(b.status);
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                if (a.status === "Queued") {
                    return new Date(a.start_date) - new Date(b.start_date);
                }
                return new Date(b.start_date) - new Date(a.start_date);
            });

            if (sorted.length > 0) {
                set({ periods: sorted, loadingPeriods: false });
                setCached('pss_periods', sorted);
            } else {
                set({ loadingPeriods: false });
            }
        } catch (err) {
            console.warn('[useAppStore] fetchPeriods API unavailable, using cached/mock:', err?.message);
            const cached = getCached('pss_periods', DEFAULT_PERIODS);
            set({ periods: cached, loadingPeriods: false });
        }
    },

    createPeriod: async (payload) => {
        try {
            const res = await api.createPeriod(payload);
            await get().fetchPeriods();
            return res;
        } catch (err) {
            console.warn('[useAppStore] createPeriod falling back to local storage:', err?.message);
            const newPeriod = {
                id: `per-${Date.now()}`,
                name: payload.name,
                type: mapPeriodTypeToFrontend(payload.period_type || 'Semester'),
                period_type: payload.period_type || 'Semester',
                start_date: payload.start_date,
                end_date: payload.end_date,
                status: 'Active',
            };
            const updated = [newPeriod, ...get().periods];
            set({ periods: updated });
            setCached('pss_periods', updated);
            return newPeriod;
        }
    },

    updatePeriod: async (id, payload) => {
        try {
            const res = await api.updatePeriod(id, payload);
            await get().fetchPeriods();
            return res;
        } catch (err) {
            console.warn('[useAppStore] updatePeriod falling back to local storage:', err?.message);
            const updated = get().periods.map(p => p.id === id ? {
                ...p,
                ...payload,
                type: payload.period_type ? mapPeriodTypeToFrontend(payload.period_type) : p.type
            } : p);
            set({ periods: updated });
            setCached('pss_periods', updated);
            return { id, ...payload };
        }
    },

    closePeriod: async (id) => {
        try {
            const res = await api.closePeriod(id);
            await get().fetchPeriods();
            return res;
        } catch (err) {
            console.warn('[useAppStore] closePeriod falling back to local storage:', err?.message);
            const updated = get().periods.map(p => p.id === id ? { ...p, status: 'Closed' } : p);
            set({ periods: updated });
            setCached('pss_periods', updated);
            return { id, status: 'Closed' };
        }
    },

    deletePeriod: async (id) => {
        try {
            const res = await api.deletePeriod(id);
            await get().fetchPeriods();
            return res;
        } catch (err) {
            console.warn('[useAppStore] deletePeriod falling back to local storage:', err?.message);
            const updated = get().periods.filter(p => p.id !== id);
            set({ periods: updated });
            setCached('pss_periods', updated);
            return { id };
        }
    },

    // Commitments Actions
    fetchCommitments: async (params = {}) => {
        set({ loadingCommitments: true });
        try {
            const res = await api.getCommitments({ limit: 100, ...params });
            const data = res?.data || [];
            if (data.length > 0) {
                set({ commitments: data, loadingCommitments: false });
                setCached('pss_commitments', data);
            } else {
                set({ loadingCommitments: false });
            }
        } catch (err) {
            console.warn('[useAppStore] fetchCommitments API unavailable, using cached/mock:', err?.message);
            const cached = getCached('pss_commitments', DEFAULT_COMMITMENTS);
            set({ commitments: cached, loadingCommitments: false });
        }
    },

    fetchCommitmentById: async (id) => {
        set({ loadingCommitments: true });
        try {
            const res = await api.getCommitmentById(id);
            set({ activeCommitment: res, loadingCommitments: false });
            return res;
        } catch (err) {
            console.warn('[useAppStore] fetchCommitmentById falling back to local commitment:', err?.message);
            const cached = getCached('pss_commitments', DEFAULT_COMMITMENTS);
            const found = cached.find(c => c.id === id) || cached[0];
            set({ activeCommitment: found, loadingCommitments: false });
            return found;
        }
    },

    createCommitmentDraft: async (payload) => {
        try {
            const res = await api.createCommitment(payload);
            set({ activeCommitment: res });
            await get().fetchCommitments();
            return res;
        } catch (err) {
            console.warn('[useAppStore] createCommitmentDraft falling back to local storage:', err?.message);
            const newComm = {
                id: `comm-${Date.now()}`,
                title: payload.title || 'New OPCR Commitment',
                office: payload.office || 'Academic Office',
                period_id: payload.period_id,
                period_name: 'Current Evaluation Period',
                status: 'DRAFT',
                rating: null,
                submitted_by: get().activeUser?.username || 'mock_user',
                created_at: new Date().toISOString()
            };
            const updated = [newComm, ...get().commitments];
            set({ commitments: updated, activeCommitment: newComm });
            setCached('pss_commitments', updated);
            return newComm;
        }
    },

    updateCommitmentDraft: async (id, payload) => {
        try {
            const res = await api.updateCommitment(id, payload);
            set({ activeCommitment: res });
            await get().fetchCommitments();
            return res;
        } catch (err) {
            console.warn('[useAppStore] updateCommitmentDraft falling back to local storage:', err?.message);
            const updated = get().commitments.map(c => c.id === id ? { ...c, ...payload } : c);
            const found = updated.find(c => c.id === id);
            set({ commitments: updated, activeCommitment: found });
            setCached('pss_commitments', updated);
            return found;
        }
    },

    lockCommitment: async (id) => {
        try {
            const res = await api.lockCommitment(id);
            set({ activeCommitment: res });
            await get().fetchCommitments();
            return res;
        } catch (err) {
            console.warn('[useAppStore] lockCommitment falling back to local storage:', err?.message);
            const updated = get().commitments.map(c => c.id === id ? { ...c, status: 'LOCKED' } : c);
            const found = updated.find(c => c.id === id);
            set({ commitments: updated, activeCommitment: found });
            setCached('pss_commitments', updated);
            return found;
        }
    },

    requestRevision: async (id, reason) => {
        try {
            const res = await api.requestRevision(id, reason);
            await get().fetchCommitments();
            return res;
        } catch (err) {
            console.warn('[useAppStore] requestRevision falling back to local storage:', err?.message);
            const updated = get().commitments.map(c => c.id === id ? { ...c, status: 'REVISION_REQUESTED', revision_reason: reason } : c);
            set({ commitments: updated });
            setCached('pss_commitments', updated);
            return { id, status: 'REVISION_REQUESTED', reason };
        }
    },

    clearActiveCommitment: () => set({ activeCommitment: null }),

    sidebarCollapsed: localStorage.getItem('PSS_SIDEBAR_COLLAPSED') === 'true',
    setSidebarCollapsed: (collapsed) => {
        localStorage.setItem('PSS_SIDEBAR_COLLAPSED', collapsed);
        set({ sidebarCollapsed: collapsed });
    },

    sidebarMobileOpen: false,
    setSidebarMobileOpen: (open) => {
        set({ sidebarMobileOpen: open });
    },

    // Service Modes CRUD Actions
    fetchServiceModes: async (includeInactive = false) => {
        set({ loadingServiceModes: true });
        try {
            const res = await api.getServiceModes(includeInactive ? { include_inactive: true } : {});
            const modesArray = Array.isArray(res) ? res : [];
            if (modesArray.length > 0) {
                set({ serviceModes: modesArray, loadingServiceModes: false });
                setCached('pss_service_modes', modesArray);
            } else {
                // If backend returned empty, use cached or default
                const cached = getCached('pss_service_modes', DEFAULT_SERVICE_MODES);
                set({ serviceModes: cached, loadingServiceModes: false });
            }
        } catch (err) {
            console.warn('[useAppStore] fetchServiceModes API unavailable, using cached/mock:', err?.message);
            const cached = getCached('pss_service_modes', DEFAULT_SERVICE_MODES);
            set({ serviceModes: cached, loadingServiceModes: false });
        }
    },

    createServiceMode: async (payload) => {
        try {
            const res = await api.createServiceMode(payload);
            await get().fetchServiceModes(true);
            return res;
        } catch (err) {
            console.warn('[useAppStore] createServiceMode falling back to local storage:', err?.message);
            const newMode = {
                id: `sm-${Date.now()}`,
                name: payload.name,
                description: payload.description || '',
                is_active: true,
                created_at: new Date().toISOString()
            };
            const updated = [newMode, ...get().serviceModes];
            set({ serviceModes: updated });
            setCached('pss_service_modes', updated);
            return newMode;
        }
    },

    updateServiceMode: async (id, payload) => {
        try {
            const res = await api.updateServiceMode(id, payload);
            await get().fetchServiceModes(true);
            return res;
        } catch (err) {
            console.warn('[useAppStore] updateServiceMode falling back to local storage:', err?.message);
            const updated = get().serviceModes.map(m => m.id === id ? {
                ...m,
                name: payload.name !== undefined ? payload.name : m.name,
                description: payload.description !== undefined ? payload.description : m.description,
                updated_at: new Date().toISOString()
            } : m);
            set({ serviceModes: updated });
            setCached('pss_service_modes', updated);
            return { id, ...payload };
        }
    },

    toggleServiceMode: async (id) => {
        try {
            const res = await api.toggleServiceMode(id);
            await get().fetchServiceModes(true);
            return res;
        } catch (err) {
            console.warn('[useAppStore] toggleServiceMode falling back to local storage:', err?.message);
            const updated = get().serviceModes.map(m => m.id === id ? {
                ...m,
                is_active: m.is_active === false ? true : false,
                updated_at: new Date().toISOString()
            } : m);
            set({ serviceModes: updated });
            setCached('pss_service_modes', updated);
            const toggled = updated.find(m => m.id === id);
            return toggled || { id };
        }
    },

    /**
     * Login as one of the predefined mock users (by user object from PREDEFINED_MOCK_USERS).
     * Encodes a base64 token, stores it, and reloads.
     */
    loginAsMockUser: (mockUser) => {
        const claims = {
            userId: mockUser.id,
            username: mockUser.username,
            displayName: mockUser.displayName,
            armsRole: mockUser.armsRole,
            office: mockUser.office,
            isCrossOffice: mockUser.isCrossOffice,
        };
        const token = encodeMockToken(claims);
        localStorage.setItem('pss_token', token);
        window.location.reload();
    },

    /**
     * @deprecated Use loginAsMockUser() instead.
     * Kept for backward compatibility — maps old role strings to a predefined mock user.
     */
    setUserRole: (role) => {
        const userMap = {
            'Staff': PREDEFINED_MOCK_USERS.find(u => u.armsRole === 'STAFF' && u.office === 'ACAD'),
            'OPCREvaluator': PREDEFINED_MOCK_USERS.find(u => u.armsRole === 'OPCR_EVALUATOR'),
            'Admin': PREDEFINED_MOCK_USERS.find(u => u.armsRole === 'SUBSYSTEM_ADMIN' && u.office === 'ACAD'),
        };
        const mockUser = userMap[role] || userMap['Staff'];
        if (mockUser) {
            get().loginAsMockUser(mockUser);
        }
    },
}));