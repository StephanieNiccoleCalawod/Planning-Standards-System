import { create } from "zustand";
import { api } from "../services/api";

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
    case "Yearly":
    case "Annual": return "Annual";
    default: return "Semestral";
  }
};

const mapPeriodTypeToBackend = (t) => {
  switch (t) {
    case "Quarterly": return "Quarterly";
    case "Semestral": return "Semester";
    case "Annual": return "Yearly";
    default: return "Semester";
  }
};

const mapPeriodStatusToFrontend = (s) => {
  return s === "Open" ? "Active" : "Closed";
};

export const useAppStore = create((set, get) => ({
  // State Slices
  services: [],
  kpis: [],
  periods: [],
  holidays: [],
  slaRules: [],
  commitments: [],
  activeCommitment: null,
  userRole: localStorage.getItem('PSS_MOCK_ROLE') || 'Admin',

  // Loading States
  loadingServices: false,
  loadingKpis: false,
  loadingPeriods: false,
  loadingHolidays: false,
  loadingSlaRules: false,
  loadingCommitments: false,

  // Services CRUD Actions
  fetchServices: async () => {
    set({ loadingServices: true });
    try {
      const res = await api.getServices({ include_archived: true });
      const servicesArray = Array.isArray(res) ? res : (res?.data || []);
      const storedReferrals = JSON.parse(localStorage.getItem('service_referrals') || '{}');

      const formatted = servicesArray.map(s => {
        const formattedSla = formatSlaTarget(s);

        // Read referral from API response; fall back to localStorage/heuristic for old records
        let referral;
        if (s.with_referral) {
          // Map backend enum values to frontend values
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
          expectedOutput: s.expected_output || ''
        };
      });

      set({ services: formatted, loadingServices: false });
    } catch (err) {
      set({ loadingServices: false });
      console.error("useAppStore.fetchServices failed:", err);
      throw err;
    }
  },

  createService: async (payload) => {
    try {
      const res = await api.createService(payload);
      await get().fetchServices();
      return res;
    } catch (err) {
      console.error("useAppStore.createService failed:", err);
      throw err;
    }
  },

  updateService: async (id, payload) => {
    try {
      const res = await api.updateService(id, payload);
      await get().fetchServices();
      return res;
    } catch (err) {
      console.error("useAppStore.updateService failed:", err);
      throw err;
    }
  },

  activateService: async (id) => {
    try {
      const res = await api.activateService(id);
      await get().fetchServices();
      return res;
    } catch (err) {
      console.error("useAppStore.activateService failed:", err);
      throw err;
    }
  },

  deactivateService: async (id) => {
    try {
      const res = await api.deactivateService(id);
      await get().fetchServices();
      return res;
    } catch (err) {
      console.error("useAppStore.deactivateService failed:", err);
      throw err;
    }
  },

  archiveService: async (id) => {
    try {
      const res = await api.archiveService(id);
      await get().fetchServices();
      return res;
    } catch (err) {
      console.error("useAppStore.archiveService failed:", err);
      throw err;
    }
  },

  // Intake Fields Custom Save Callback (updates store locally)
  updateServiceIntakeFieldsLocal: (updatedSvc) => {
    set(state => ({
      services: state.services.map(s => s.id === updatedSvc.id ? { ...s, ...updatedSvc } : s)
    }));
  },

  // KPIs CRUD Actions
  fetchKpis: async () => {
    set({ loadingKpis: true });
    try {
      const res = await api.getKpis({ include_inactive: true });
      const kpisArray = res?.data || [];

      const formatted = kpisArray.map(k => ({
        ...k,
        category: k.category === "COMPLIANCE" ? "Timeliness" : k.category === "CUSTOMER" ? "Quality" : "Efficiency",
        target_value: k.target_value,
        unit: k.unit === "PERCENT" ? "%" : k.unit === "DAYS" ? " Days" : " Mins",
        service_id: k.service_id,
        active: k.is_active
      }));

      set({ kpis: formatted, loadingKpis: false });
    } catch (err) {
      set({ loadingKpis: false });
      console.error("useAppStore.fetchKpis failed:", err);
      throw err;
    }
  },

  createKpi: async (payload) => {
    try {
      const res = await api.createKpi(payload);
      await get().fetchKpis();
      return res;
    } catch (err) {
      console.error("useAppStore.createKpi failed:", err);
      throw err;
    }
  },

  updateKpi: async (id, payload) => {
    try {
      const res = await api.updateKpi(id, payload);
      await get().fetchKpis();
      return res;
    } catch (err) {
      console.error("useAppStore.updateKpi failed:", err);
      throw err;
    }
  },

  deleteKpi: async (id) => {
    try {
      const res = await api.deleteKpi(id);
      await get().fetchKpis();
      return res;
    } catch (err) {
      console.error("useAppStore.deleteKpi failed:", err);
      throw err;
    }
  },

  // SLA Rules CRUD Actions
  fetchSlaRules: async () => {
    set({ loadingSlaRules: true });
    try {
      const res = await api.getSlaRules();
      set({ slaRules: res || [], loadingSlaRules: false });
      return res;
    } catch (err) {
      set({ loadingSlaRules: false });
      console.error("useAppStore.fetchSlaRules failed:", err);
      throw err;
    }
  },

  updateSlaRule: async (id, payload) => {
    try {
      const res = await api.updateSlaRule(id, payload);
      await get().fetchSlaRules();
      return res;
    } catch (err) {
      console.error("useAppStore.updateSlaRule failed:", err);
      throw err;
    }
  },

  createSlaRule: async (payload) => {
    try {
      const res = await api.createSlaRule(payload);
      await get().fetchSlaRules();
      return res;
    } catch (err) {
      console.error("useAppStore.createSlaRule failed:", err);
      throw err;
    }
  },

  restoreSlaVersion: async (id, versionId) => {
    try {
      const res = await api.restoreSlaVersion(id, versionId);
      await get().fetchSlaRules();
      return res;
    } catch (err) {
      console.error("useAppStore.restoreSlaVersion failed:", err);
      throw err;
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
          // fallback to display year
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

      set({ holidays: formatted, loadingHolidays: false });
    } catch (err) {
      set({ loadingHolidays: false });
      console.error("useAppStore.fetchHolidays failed:", err);
      throw err;
    }
  },

  createHoliday: async (payload) => {
    try {
      const res = await api.createHoliday(payload);
      await get().fetchHolidays();
      return res;
    } catch (err) {
      console.error("useAppStore.createHoliday failed:", err);
      throw err;
    }
  },

  updateHoliday: async (id, payload) => {
    try {
      const res = await api.updateHoliday(id, payload);
      await get().fetchHolidays();
      return res;
    } catch (err) {
      console.error("useAppStore.updateHoliday failed:", err);
      throw err;
    }
  },

  deleteHoliday: async (id) => {
    try {
      const res = await api.deleteHoliday(id);
      await get().fetchHolidays();
      return res;
    } catch (err) {
      console.error("useAppStore.deleteHoliday failed:", err);
      throw err;
    }
  },

  // Evaluation Periods CRUD Actions
  fetchPeriods: async () => {
    set({ loadingPeriods: true });
    try {
      const res = await api.getPeriods();
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
          return 3; // Closed / Completed
        };
        const priorityA = getPriority(a.status);
        const priorityB = getPriority(b.status);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // If both are Queued, sort ascending (closest start date first)
        if (a.status === "Queued") {
          return new Date(a.start_date) - new Date(b.start_date);
        }
        // Otherwise (Closed/Completed or Active), sort descending (latest first)
        return new Date(b.start_date) - new Date(a.start_date);
      });

      set({ periods: sorted, loadingPeriods: false });
    } catch (err) {
      set({ loadingPeriods: false });
      console.error("useAppStore.fetchPeriods failed:", err);
      throw err;
    }
  },

  createPeriod: async (payload) => {
    try {
      const res = await api.createPeriod(payload);
      await get().fetchPeriods();
      return res;
    } catch (err) {
      console.error("useAppStore.createPeriod failed:", err);
      throw err;
    }
  },

  updatePeriod: async (id, payload) => {
    try {
      const res = await api.updatePeriod(id, payload);
      await get().fetchPeriods();
      return res;
    } catch (err) {
      console.error("useAppStore.updatePeriod failed:", err);
      throw err;
    }
  },

  closePeriod: async (id) => {
    try {
      const res = await api.closePeriod(id);
      await get().fetchPeriods();
      return res;
    } catch (err) {
      console.error("useAppStore.closePeriod failed:", err);
      throw err;
    }
  },

  deletePeriod: async (id) => {
    try {
      const res = await api.deletePeriod(id);
      await get().fetchPeriods();
      return res;
    } catch (err) {
      console.error("useAppStore.deletePeriod failed:", err);
      throw err;
    }
  },

  // Commitments Actions
  fetchCommitments: async (params = {}) => {
    set({ loadingCommitments: true });
    try {
      const res = await api.getCommitments(params);
      const data = res?.data || [];
      set({ commitments: data, loadingCommitments: false });
    } catch (err) {
      set({ loadingCommitments: false });
      console.error("useAppStore.fetchCommitments failed:", err);
      throw err;
    }
  },

  fetchCommitmentById: async (id) => {
    set({ loadingCommitments: true });
    try {
      const res = await api.getCommitmentById(id);
      set({ activeCommitment: res, loadingCommitments: false });
      return res;
    } catch (err) {
      set({ loadingCommitments: false });
      console.error("useAppStore.fetchCommitmentById failed:", err);
      throw err;
    }
  },

  createCommitmentDraft: async (payload) => {
    try {
      const res = await api.createCommitment(payload);
      set({ activeCommitment: res });
      await get().fetchCommitments();
      return res;
    } catch (err) {
      console.error("useAppStore.createCommitmentDraft failed:", err);
      throw err;
    }
  },

  updateCommitmentDraft: async (id, payload) => {
    try {
      const res = await api.updateCommitment(id, payload);
      set({ activeCommitment: res });
      await get().fetchCommitments();
      return res;
    } catch (err) {
      console.error("useAppStore.updateCommitmentDraft failed:", err);
      throw err;
    }
  },

  lockCommitment: async (id) => {
    try {
      const res = await api.lockCommitment(id);
      set({ activeCommitment: res });
      await get().fetchCommitments();
      return res;
    } catch (err) {
      console.error("useAppStore.lockCommitment failed:", err);
      throw err;
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

  setUserRole: (role) => {
    localStorage.setItem('PSS_MOCK_ROLE', role);
    set({ userRole: role });
    // Reload to apply new auth headers
    window.location.reload();
  },
}));
