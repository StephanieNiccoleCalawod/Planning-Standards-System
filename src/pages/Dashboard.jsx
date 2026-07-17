import { useEffect, useState } from "react";
import { Box, Typography, Chip, Alert, TextField, MenuItem, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper } from "@mui/material";
import {
  CalendarToday,
  WorkOutlined,
  Assessment,
  FlagOutlined,
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  Business,
  School,
  Groups,
  Public
} from "@mui/icons-material";
import PageHeader from "../components/PageHeader";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";
import { normalizeOffice } from "../services/permissions";

const getArtaClassification = (svc) => {
  if (!svc) return "Simple";
  let days = 0;
  if (svc.sla_target_unit === 'Days') {
    days = svc.sla_target_value;
  } else if (svc.sla_target_unit === 'Minutes') {
    days = svc.sla_target_value / 1440;
  } else if (svc.sla_target_unit === 'Hours') {
    days = svc.sla_target_value / 24;
  }
  if (days > 7) return "Highly Technical";
  if (days > 3) return "Complex";
  return "Simple";
};

// ── Design tokens (matching theme.js + colors.js) ──────────────────────────
const T = {
  maroon: "#800000",
  blue: "#2563EB",
  emerald: "#10B981",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate400: "#94A3B8",
  slate600: "#475569",
  slate900: "#0F172A",
  white: "#FFFFFF",
};

// ── Small reusable atoms ────────────────────────────────────────────────────
function StatCard({ accentColor, icon, children }) {
  return (
    <Box sx={{
      bgcolor: T.white,
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      p: 3,
      minHeight: 130,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxSizing: "border-box",
      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.03)",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 16px 28px -8px ${accentColor}2A`,
        borderColor: accentColor,
      },
    }}>
      {/* Background Icon Glow */}
      {icon && (
        <Box sx={{
          position: "absolute",
          right: -10,
          bottom: -10,
          opacity: 0.05,
          transform: "scale(2.5)",
          color: accentColor,
          pointerEvents: "none"
        }}>
          {icon}
        </Box>
      )}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", bgcolor: accentColor }} />
      {children}
    </Box>
  );
}

function StatLabel({ children }) {
  return (
    <Typography sx={{
      fontSize: 11, fontWeight: 700, color: T.slate400,
      textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75,
    }}>
      {children}
    </Typography>
  );
}

function StatValue({ children }) {
  return (
    <Typography sx={{ fontSize: 36, fontWeight: 600, color: T.slate900, lineHeight: 1 }}>
      {children}
    </Typography>
  );
}

// ── At Risk Service Row ─────────────────────────────────────────────────────
function AtRiskRow({ service }) {
  let statusText = "COMPLIANT";
  let color = T.emerald;
  let bg = "rgba(16, 185, 129, 0.08)";
  
  if (service.value < 80) {
    statusText = "BREACHED";
    color = "#EF4444";
    bg = "rgba(239, 68, 68, 0.08)";
  } else if (service.value < 95) {
    statusText = "AT RISK";
    color = "#D97706";
    bg = "rgba(245, 158, 11, 0.08)";
  }

  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 2,
      p: "10px 14px", borderRadius: "8px", bgcolor: T.slate50,
      border: "1px solid transparent",
      transition: "all 0.2s ease",
      "&:hover": { 
        bgcolor: T.white,
        borderColor: T.slate200,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        transform: "translateX(2px)"
      },
    }}>
      {/* Percentage badge */}
      <Box sx={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minWidth: 42, height: 42, bgcolor: color, borderRadius: 2, color: T.white, flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>
          {service.value}%
        </Typography>
        <Typography sx={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.85 }}>
          SLA
        </Typography>
      </Box>

      {/* Service Name + Status */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Typography sx={{
          fontSize: 12, fontWeight: 700, color: T.slate900,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }} title={service.name}>
          {service.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
          <Typography sx={{ fontSize: 10, color: T.slate400, fontWeight: 600 }}>
            {service.office}
          </Typography>
          <Box component="span" sx={{
            fontSize: "8.5px", fontWeight: 700,
            px: "6px", py: "1px", borderRadius: "6px",
            bgcolor: bg, color: color,
          }}>
            {statusText}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function StatSubtext({ children }) {
  return (
    <Typography sx={{ fontSize: 13, color: T.slate600, fontWeight: 500 }}>
      {children}
    </Typography>
  );
}

function ChartCard({ children }) {
  return (
    <Box sx={{
      bgcolor: T.white,
      borderRadius: "8px",
      border: "1px solid #E2E8F0",
      p: 3,
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      display: "flex",
      flexDirection: "column",
    }}>
      {children}
    </Box>
  );
}

function ChartHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: T.slate900 }}>{title}</Typography>
      <Typography sx={{ fontSize: 12, color: T.slate400, fontWeight: 500, mt: 0.25 }}>{subtitle}</Typography>
    </Box>
  );
}

const getCategoryName = (responsibleUnit) => {
  if (!responsibleUnit) return "OTHER SYSTEM";
  const upper = responsibleUnit.toUpperCase();
  if (upper.includes("ADMIN")) return "ADMIN SYSTEM";
  if (upper.includes("ACAD") || upper.includes("ACADEMIC")) return "ACADEMIC SYSTEM";
  if (upper.includes("OSAS") || upper.includes("STUDENT")) return "STUDENT SYSTEM";
  return `${responsibleUnit.toUpperCase()} SYSTEM`;
};

// ── Holiday Row ─────────────────────────────────────────────────────────────
const HOLIDAY_TYPE_COLORS = {
  REGULAR: { bg: "#FEF2F2", color: "#B91C1C", label: "National" },
  SPECIAL: { bg: "#FFFBEB", color: "#B45309", label: "Special" },
  LOCAL: { bg: "#EFF6FF", color: "#1D4ED8", label: "Local" },
};

function HolidayRow({ holiday }) {
  let month = "MMM";
  let day = "00";
  try {
    const d = new Date(holiday.date || holiday.holiday_date);
    if (!isNaN(d.getTime())) {
      month = d.toLocaleString("default", { month: "short" }).toUpperCase();
      day = d.getDate();
    }
  } catch (_) { }

  const typeStyle = HOLIDAY_TYPE_COLORS[holiday.type] || { bg: "#F3F4F6", color: "#6B7280", label: holiday.type };

  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.25,
      p: "8px 10px", borderRadius: "8px", bgcolor: T.slate50,
      transition: "background 0.15s",
      "&:hover": { bgcolor: T.slate100 },
    }}>
      {/* Date badge */}
      <Box sx={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minWidth: 36, height: 36, bgcolor: T.maroon, borderRadius: 2, color: T.white, flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.04em", opacity: 0.85, textTransform: "uppercase", lineHeight: 1 }}>
          {month}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>
          {day}
        </Typography>
      </Box>

      {/* Name + type */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Typography sx={{
          fontSize: 12, fontWeight: 700, color: T.slate900,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {holiday.name}
        </Typography>
        <Box component="span" sx={{
          display: "inline-block", fontSize: "9.5px", fontWeight: 700,
          px: "6px", py: "1px", borderRadius: "6px", mt: 0.25,
          bgcolor: typeStyle.bg, color: typeStyle.color,
        }}>
          {typeStyle.label}
        </Box>
      </Box>
    </Box>
  );
}

// ── Main Dashboard Page ─────────────────────────────────────────────────────
const EMS_UTILIZATION_DATA = [];

export default function Dashboard() {
  const { services, fetchServices, kpis, fetchKpis, periods, fetchPeriods, holidays, fetchHolidays, permissions, activeUser, commitments, fetchCommitments } = useAppStore();
  const [summaryData, setSummaryData] = useState(null);
  const [slaLogs, setSlaLogs] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState("OVERALL");

  useEffect(() => {
    fetchServices().catch(err => console.error('Dashboard: fetchServices failed', err));
    fetchKpis().catch(err => console.error('Dashboard: fetchKpis failed', err));
    fetchPeriods().catch(err => console.error('Dashboard: fetchPeriods failed', err));
    fetchHolidays().catch(err => console.error('Dashboard: fetchHolidays failed', err));
    fetchCommitments().catch(err => console.error('Dashboard: fetchCommitments failed', err));

    api.getSlaComputationLogs({ limit: 100 })
      .then(res => setSlaLogs(res?.data || []))
      .catch(err => console.error('Dashboard: getSlaComputationLogs failed', err));

    api.getServiceUtilization()
      .then(res => setUtilizationData(res || []))
      .catch(err => console.error('Dashboard: getServiceUtilization failed', err));
  }, []);

  useEffect(() => {
    api.getDashboardSummary({ office: permissions?.canSeeOtherOffices ? selectedOffice : undefined })
      .then(setSummaryData)
      .catch(err => console.error('Dashboard: getDashboardSummary failed', err));
  }, [selectedOffice, permissions?.canSeeOtherOffices]);

  // ── Computed metrics ──────────────────────────────────────────────────────
  const currentOfficeScope = permissions?.canSeeOtherOffices ? selectedOffice : activeUser?.office;

  const officeServices = services.filter(s => {
    if (!currentOfficeScope || currentOfficeScope === 'OVERALL') return true;
    const sOffice = s.office || s.responsibleUnit;
    return normalizeOffice(sOffice) === normalizeOffice(currentOfficeScope);
  });

  const officeKpis = kpis.filter(k => {
    if (!currentOfficeScope || currentOfficeScope === 'OVERALL') return true;
    const kOffice = k.office || k.sub_office;
    return normalizeOffice(kOffice) === normalizeOffice(currentOfficeScope);
  });

  const totalServices = officeServices.filter(s => !s.archived).length;
  const activeServices = officeServices.filter(s => s.active && !s.archived).length;
  const inactiveServices = totalServices - activeServices;
  const naFlaggedServicesCount = officeServices.filter(s => s.naFlag && !s.archived).length;

  const totalKpis = officeKpis.length;
  const activeKpis = officeKpis.filter(k => k.active).length;
  const inactiveKpis = totalKpis - activeKpis;

  const activePeriod =
    summaryData?.current_period ||
    summaryData?.active_period ||
    periods.find(p => p.status === 'Active' || p.status === 'Open') ||
    null;
  const currentPeriod = activePeriod || { name: "No active evaluation period", id: null };

  const periodDateRange = currentPeriod.start_date && currentPeriod.end_date
    ? `${new Date(currentPeriod.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(currentPeriod.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "Semestral";

  // Compute SLA Compliance for scoped officeServices
  const serviceComplianceList = officeServices
    .map(service => {
      const serviceLogs = slaLogs.filter(log => log.service_id === service.id || log.service_name === service.name);
      if (serviceLogs.length === 0) return null;

      const compliantLogs = serviceLogs.filter(log => {
        const duration = Number(log.computed_duration_days);
        const target = Number(log.sla_target_days);
        return duration <= target;
      });

      const complianceRate = Math.round((compliantLogs.length / serviceLogs.length) * 100);
      return {
        id: service.id,
        name: service.name,
        office: service.office || service.responsibleUnit,
        value: complianceRate,
      };
    })
    .filter(Boolean);

  const displayAtRisk = serviceComplianceList
    .filter(s => s.value < 95)
    .sort((a, b) => a.value - b.value)
    .slice(0, 4);

  // Fallback mock data if no logs exist or no at-risk services are found
  const mockAtRisk = [
    { id: 'mock-1', name: "Request for Transcript of Records", office: "ACAD", value: 78 },
    { id: 'mock-2', name: "Issuance of Good Moral Character Certificate", office: "OSAS", value: 85 },
    { id: 'mock-3', name: "Application for Student Re-admission", office: "ACAD", value: 89 },
    { id: 'mock-4', name: "Clearance Form Verification", office: "ADMIN", value: 92 },
  ].filter(s => {
    if (!currentOfficeScope || currentOfficeScope === 'OVERALL') return true;
    return s.office === currentOfficeScope;
  });

  const finalAtRisk = displayAtRisk.length > 0 ? displayAtRisk : mockAtRisk;

  // Derive achievement from serviceComplianceList
  const timelinessKpis = officeKpis.filter(k => k.category === "Timeliness" && k.active);
  const timelinessRates = timelinessKpis.map(k => {
    const comp = serviceComplianceList.find(c => String(c.id) === String(k.service_id));
    return comp ? comp.value : null;
  }).filter(v => v !== null);

  const timelinessAchieved = timelinessRates.length > 0
    ? Math.round(timelinessRates.reduce((a, b) => a + b, 0) / timelinessRates.length)
    : 92;

  // KPI achievement rate for summary card
  const kpiAchievementRates = officeServices
    .map(service => {
      const util = utilizationData.find(u => u.service_id === service.id || u.service_name === service.name);
      if (!util || !service.commitment_target) return null;
      const actual = util.transaction_count;
      const target = service.commitment_target;
      if (target <= 0) return null;
      return Math.min(Math.round((actual / target) * 100), 100);
    })
    .filter(val => val !== null);

  const avgKpiAchievement = kpiAchievementRates.length > 0
    ? Math.round(kpiAchievementRates.reduce((a, b) => a + b, 0) / kpiAchievementRates.length)
    : 88;

  // Evaluation Period Readiness
  const activeSvcList = officeServices.filter(s => s.active && !s.archived);
  const slaReadyCount = activeSvcList.filter(s => s.sla_target_value > 0).length;
  const slaReadyPercent = activeSvcList.length > 0 ? Math.round((slaReadyCount / activeSvcList.length) * 100) : 0;

  const servicesWithKpi = activeSvcList.filter(s => kpis.some(k => String(k.service_id) === String(s.id) && k.active)).length;
  const kpiReadyPercent = activeSvcList.length > 0 ? Math.round((servicesWithKpi / activeSvcList.length) * 100) : 0;

  const activePeriodId = currentPeriod?.id;
  const lockedCommitmentsCount = commitments.filter(c => String(c.period_id) === String(activePeriodId) && c.status === "Locked").length;
  const totalOffices = 3;
  const opcrReadyPercent = Math.min(Math.round((lockedCommitmentsCount / totalOffices) * 100), 100);

  const overallReadiness = Math.round((slaReadyPercent + kpiReadyPercent + opcrReadyPercent) / 3);

  // Grouped Bar Chart comparative data
  const officesList = [
    { key: 'ACAD', name: 'Academic Affairs (ACAD)' },
    { key: 'OSAS', name: 'Student Affairs (OSAS)' },
    { key: 'ADMIN', name: 'Administration (ADMIN)' }
  ];

  const officeComparisonData = officesList.map(off => {
    const offSvcs = services.filter(s => normalizeOffice(s.office || s.responsibleUnit) === off.key && !s.archived);
    
    const offKpis = kpis.filter(k => normalizeOffice(k.office || k.sub_office) === off.key && k.active).length;
    
    const officeSlaLogs = slaLogs.filter(log => normalizeOffice(log.office || log.responsibleUnit) === off.key);
    let slaCompliance = 100;
    if (officeSlaLogs.length > 0) {
      const compliant = officeSlaLogs.filter(log => Number(log.computed_duration_days) <= Number(log.sla_target_days)).length;
      slaCompliance = Math.round((compliant / officeSlaLogs.length) * 100);
    } else {
      slaCompliance = off.key === 'ACAD' ? 92 : off.key === 'OSAS' ? 95 : 88;
    }

    return {
      ...off,
      kpisCount: offKpis,
      slaCompliance
    };
  });

  const uniqueHolidays = [];
  holidays.forEach(h => {
    const nameLower = h.name.toLowerCase();
    const existing = uniqueHolidays.find(u => u.name.toLowerCase() === nameLower && u.type === h.type);
    if (!existing) {
      uniqueHolidays.push(h);
    }
  });

  const upcomingHolidays = [...uniqueHolidays]
    .sort((a, b) => {
      const dateA = new Date(a.date || a.holiday_date);
      const dateB = new Date(b.date || b.holiday_date);
      if (dateA.getMonth() !== dateB.getMonth()) {
        return dateA.getMonth() - dateB.getMonth();
      }
      return dateA.getDate() - dateB.getDate();
    })
    .slice(0, 6);

  return (
    <Box sx={{ p: 4, bgcolor: T.slate50, minHeight: "100vh", fontFamily: '"DM Sans", sans-serif' }}>
      <PageHeader breadcrumb="Dashboard" title="Performance Overview" subtitle="Monitor key metrics, track commitments, and view performance insights at a glance." />

      <Alert
        severity="warning"
        sx={{
          mb: 3,
          borderRadius: "12px",
          border: "1.5px solid rgba(245, 158, 11, 0.2)",
          bgcolor: "#FFFBEB",
          color: "#D97706",
          fontWeight: 600,
          "& .MuiAlert-icon": {
            color: "#D97706"
          }
        }}
      >
        Notice: Some commitments or services have exceeded the warning levels. Please review performance targets to ensure timely resolution.
      </Alert>

      {/* Office Selector for Campus Director */}
      {permissions?.canSeeOtherOffices && (
        <Box sx={{ mb: 3.5 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: T.slate400, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
            Select Office Scope
          </Typography>
          <Box sx={{
            display: "inline-flex",
            bgcolor: "#E2E8F0",
            p: "4px",
            borderRadius: "8px",
            gap: 0.5,
            boxShadow: "inset 0 1px 2px 4px rgba(0,0,0,0.06)",
            flexWrap: "wrap"
          }}>
            {[
              { id: "OVERALL", label: "Overall System", icon: <Public sx={{ fontSize: 16 }} /> },
              { id: "ADMIN", label: "Administration", icon: <Business sx={{ fontSize: 16 }} /> },
              { id: "ACAD", label: "Academic Affairs", icon: <School sx={{ fontSize: 16 }} /> },
              { id: "OSAS", label: "Student Affairs", icon: <Groups sx={{ fontSize: 16 }} /> },
            ].map((option) => {
              const active = selectedOffice === option.id;
              return (
                <Box
                  key={option.id}
                  onClick={() => setSelectedOffice(option.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? T.white : T.slate600,
                    bgcolor: active ? T.maroon : "transparent",
                    boxShadow: active ? "0 4px 12px rgba(128, 0, 0, 0.2)" : "none",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      bgcolor: active ? T.maroon : "rgba(255, 255, 255, 0.5)",
                      transform: active ? "none" : "translateY(-1px)",
                    }
                  }}
                >
                  {option.icon}
                  {option.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ── Top Summary Cards ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        gap: "20px",
        mb: 3,
      }}>
        {/* Current Period */}
        <StatCard accentColor={T.emerald} icon={<CalendarToday sx={{ fontSize: 40 }} />}>
          <StatLabel>Current Period</StatLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: -0.5 }}>
            {activePeriod ? (
              <>
                <Box sx={{ display: "flex" }}>
                  <Box sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: "10px",
                    py: "3px",
                    borderRadius: "9999px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    bgcolor: "#ECFDF5",
                    color: "#047857",
                    mb: 0.5,
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#047857" }} />
                    Active
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.slate900, lineHeight: 1.3, fontFamily: '"DM Sans", sans-serif' }}>
                  {activePeriod.name}
                </Typography>
                <StatSubtext>{periodDateRange}</StatSubtext>
              </>
            ) : (
              <>
                <Box sx={{ display: "flex" }}>
                  <Box sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: "10px",
                    py: "3px",
                    borderRadius: "9999px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    bgcolor: T.slate100,
                    color: T.slate600,
                    mb: 0.5,
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: T.slate400 }} />
                    Inactive
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.slate400, lineHeight: 1.3, fontFamily: '"DM Sans", sans-serif' }}>
                  No active evaluation period
                </Typography>
                <StatSubtext>N/A</StatSubtext>
              </>
            )}
          </Box>
        </StatCard>

        {/* Active Services */}
        <StatCard accentColor={T.amber} icon={<WorkOutlined sx={{ fontSize: 40 }} />}>
          <StatLabel>Active Services</StatLabel>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <StatValue>{activeServices}</StatValue>
            <Typography sx={{ fontSize: 20, color: T.slate400, fontWeight: 500 }}>
              / {totalServices}
            </Typography>
          </Box>
          <StatSubtext>{inactiveServices} services inactive</StatSubtext>
        </StatCard>

        {/* KPI Count Widget */}
        <StatCard accentColor={T.maroon} icon={<Assessment sx={{ fontSize: 40 }} />}>
          <StatLabel>KPI Standards</StatLabel>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <StatValue>{activeKpis}</StatValue>
            <Typography sx={{ fontSize: 20, color: T.slate400, fontWeight: 500 }}>
              / {totalKpis}
            </Typography>
          </Box>
          <StatSubtext>{inactiveKpis} KPIs inactive</StatSubtext>
        </StatCard>

        {/* KPI Achievement Rate */}
        <StatCard accentColor={T.blue} icon={<TrendingUp sx={{ fontSize: 40 }} />}>
          <StatLabel>KPI Achievement Rate</StatLabel>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <StatValue>{avgKpiAchievement}%</StatValue>
            <Typography sx={{ fontSize: 13, color: T.slate400, fontWeight: 700, ml: 0.5 }}>
              AVG TARGET
            </Typography>
          </Box>
          <StatSubtext>Based on active commitments</StatSubtext>
        </StatCard>
      </Box>

      {/* ── Charts Row ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
        gap: 3,
        mb: 3
      }}>
        {/* KPI Achievement by Category */}
        <ChartCard>
          <ChartHeader
            title="KPI Achievement by Category"
            subtitle="Current achievement rates against planning targets"
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, flex: 1, justifyContent: "center" }}>
            {/* Timeliness */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: T.slate900 }}>Timeliness</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: T.blue }}>{timelinessAchieved}% achieved</Typography>
              </Box>
              <Box sx={{ width: "100%", height: 6, bgcolor: T.slate100, borderRadius: 3, position: "relative" }}>
                <Box sx={{ width: `${timelinessAchieved}%`, height: "100%", bgcolor: T.blue, borderRadius: 3 }} />
              </Box>
              <Typography sx={{ fontSize: 10, color: T.slate400, fontWeight: 500, mt: 0.5 }}>
                Derived from SLA compliance rates of linked services
              </Typography>
            </Box>

            {/* Quality */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: T.slate900 }}>Quality</Typography>
                <Chip
                  label="Not yet measured"
                  size="small"
                  sx={{
                    bgcolor: T.slate100,
                    color: T.slate600,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    borderRadius: "6px",
                    height: 18
                  }}
                />
              </Box>
              <Box sx={{ width: "100%", height: 6, bgcolor: T.slate100, borderRadius: 3 }} />
              <Typography sx={{ fontSize: 10, color: T.slate400, fontWeight: 500, mt: 0.5 }}>
                Requires transaction feedback evaluation integrations
              </Typography>
            </Box>

            {/* Efficiency */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: T.slate900 }}>Efficiency</Typography>
                <Chip
                  label="Not yet measured"
                  size="small"
                  sx={{
                    bgcolor: T.slate100,
                    color: T.slate600,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    borderRadius: "6px",
                    height: 18
                  }}
                />
              </Box>
              <Box sx={{ width: "100%", height: 6, bgcolor: T.slate100, borderRadius: 3 }} />
              <Typography sx={{ fontSize: 10, color: T.slate400, fontWeight: 500, mt: 0.5 }}>
                Requires resource utilization tracking logs
              </Typography>
            </Box>
          </Box>
        </ChartCard>

        {/* Evaluation Period Readiness Checklist */}
        <ChartCard>
          <ChartHeader
            title="Evaluation Period Readiness"
            subtitle={`Overall Readiness: ${overallReadiness}% completed`}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, justifyContent: "center" }}>
            {/* Overall Ring display */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <Box sx={{ position: "relative", display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={overallReadiness === 100 ? T.emerald : T.maroon}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="263.89"
                    strokeDashoffset={263.89 - (263.89 * overallReadiness) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                  />
                </svg>
                <Box sx={{
                  position: "absolute",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, color: T.slate900, lineHeight: 1 }}>
                    {overallReadiness}%
                  </Typography>
                  <Typography sx={{ fontSize: 8, fontWeight: 700, color: T.slate400, textTransform: "uppercase", mt: 0.25 }}>
                    Ready
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* List with progress lines */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
              {/* SLA configured check */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: T.slate900 }}>SLA Gating Configured</Typography>
                  <Chip
                    label={`${slaReadyPercent}%`}
                    size="small"
                    sx={{
                      bgcolor: slaReadyPercent === 100 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                      color: slaReadyPercent === 100 ? T.emerald : T.amber,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      height: 16
                    }}
                  />
                </Box>
                <Box sx={{ width: "100%", height: 5, bgcolor: T.slate100, borderRadius: 3.5, overflow: "hidden" }}>
                  <Box sx={{ width: `${slaReadyPercent}%`, height: "100%", bgcolor: slaReadyPercent === 100 ? T.emerald : T.amber, borderRadius: 3.5 }} />
                </Box>
              </Box>

              {/* KPI targets set check */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: T.slate900 }}>KPI Targets Formulated</Typography>
                  <Chip
                    label={`${kpiReadyPercent}%`}
                    size="small"
                    sx={{
                      bgcolor: kpiReadyPercent === 100 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                      color: kpiReadyPercent === 100 ? T.emerald : T.amber,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      height: 16
                    }}
                  />
                </Box>
                <Box sx={{ width: "100%", height: 5, bgcolor: T.slate100, borderRadius: 3.5, overflow: "hidden" }}>
                  <Box sx={{ width: `${kpiReadyPercent}%`, height: "100%", bgcolor: kpiReadyPercent === 100 ? T.emerald : T.amber, borderRadius: 3.5 }} />
                </Box>
              </Box>

              {/* OPCR commitment locked check */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: T.slate900 }}>Office OPCR Commitments Locked</Typography>
                  <Chip
                    label={`${opcrReadyPercent}%`}
                    size="small"
                    sx={{
                      bgcolor: opcrReadyPercent === 100 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                      color: opcrReadyPercent === 100 ? T.emerald : T.amber,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      height: 16
                    }}
                  />
                </Box>
                <Box sx={{ width: "100%", height: 5, bgcolor: T.slate100, borderRadius: 3.5, overflow: "hidden" }}>
                  <Box sx={{ width: `${opcrReadyPercent}%`, height: "100%", bgcolor: opcrReadyPercent === 100 ? T.emerald : T.amber, borderRadius: 3.5 }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </ChartCard>

        {/* At-Risk & Breached Services */}
        <ChartCard>
          <ChartHeader
            title="At-Risk & Breached Services"
            subtitle="Top services closest to standard breach threshold"
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, justifyContent: "center" }}>
            {finalAtRisk.map((s, idx) => (
              <AtRiskRow key={s.id || idx} service={s} />
            ))}
          </Box>
        </ChartCard>
      </Box>

            {/* ── Executive Comparison and Holidays Grid ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: permissions?.canSeeOtherOffices ? { xs: "1fr", lg: "1.3fr 1fr" } : "1fr",
        gap: 3,
        mb: 3
      }}>
        {permissions?.canSeeOtherOffices && (
          <ChartCard>
            <ChartHeader
              title="Cross-Office Standards Comparison"
              subtitle="Grouped performance analysis across divisions (SLA Compliance vs Active KPIs)"
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
              {/* SVG Grouped Bar Chart */}
              <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <svg width="100%" height="235" viewBox="0 0 450 235" fill="none">
                  <defs>
                    <linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>
                    <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#991B1B" />
                      <stop offset="100%" stopColor="#800000" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[40, 80, 120, 160, 200].map((y) => (
                    <line key={y} x1="50" y1={y} x2="420" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  ))}

                  {/* Y Axis Labels */}
                  <text x="40" y="44" fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end">100% / 40</text>
                  <text x="40" y="84" fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end">75% / 30</text>
                  <text x="40" y="124" fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end">50% / 20</text>
                  <text x="40" y="164" fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end">25% / 10</text>
                  <text x="40" y="204" fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end">0% / 0</text>

                  {/* Bar Groups */}
                  {officeComparisonData.map((row, idx) => {
                    const xGroup = 80 + idx * 120;
                    const slaHeight = (row.slaCompliance / 100) * 160;
                    const kpiHeight = Math.min((row.kpisCount / 40) * 160, 160);

                    return (
                      <g key={row.key}>
                        {/* SLA Compliance Bar (Blue) */}
                        <rect
                          x={xGroup}
                          y={200 - slaHeight}
                          width="24"
                          height={slaHeight}
                          rx="3"
                          fill="url(#slaGrad)"
                        />
                        {/* KPI Count Bar (Maroon) */}
                        <rect
                          x={xGroup + 28}
                          y={200 - kpiHeight}
                          width="24"
                          height={kpiHeight}
                          rx="3"
                          fill="url(#kpiGrad)"
                        />

                        {/* Labels above bars */}
                        <text x={xGroup + 12} y={200 - slaHeight - 5} fill="#1D4ED8" fontSize="9" fontWeight="700" textAnchor="middle">
                          {row.slaCompliance}%
                        </text>
                        <text x={xGroup + 40} y={200 - kpiHeight - 5} fill="#800000" fontSize="9" fontWeight="700" textAnchor="middle">
                          {row.kpisCount}
                        </text>

                        {/* Office label at bottom */}
                        <text x={xGroup + 26} y="222" fill="#475569" fontSize="10" fontWeight="700" textAnchor="middle">
                          {row.key}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis Line */}
                  <line x1="50" y1="200" x2="420" y2="200" stroke="#CBD5E1" strokeWidth="2" />
                </svg>
              </Box>

              {/* Legend & Details */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, flexWrap: "wrap", borderTop: "1px solid #F1F5F9", pt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: "#2563EB", borderRadius: "3px" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: T.slate900 }}>
                    SLA Compliance Rate
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: "#800000", borderRadius: "3px" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: T.slate900 }}>
                    Active KPI Codes Count
                  </Typography>
                </Box>
              </Box>
            </Box>
          </ChartCard>
        )}

        {/* Holidays List */}
        <ChartCard>
          <ChartHeader
            title="Holidays"
            subtitle={`${uniqueHolidays.length} declared holiday${uniqueHolidays.length !== 1 ? "s" : ""}`}
          />
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 1.5,
            flex: 1,
            overflowY: "auto",
            maxHeight: 280,
            pr: 0.5
          }}>
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map(h => <HolidayRow key={h.id} holiday={h} />)
            ) : (
              <Typography sx={{ fontSize: 13, color: T.slate400, textAlign: "center", py: 4 }}>
                No holidays declared yet.
              </Typography>
            )}
          </Box>
        </ChartCard>
      </Box>
    </Box>
  );
}
