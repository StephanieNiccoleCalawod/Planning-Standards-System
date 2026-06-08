import { useEffect, useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

// ── Design tokens (matching theme.js + colors.js) ──────────────────────────
const T = {
  maroon:     "#800000",
  blue:       "#2563EB",
  emerald:    "#10B981",
  amber:      "#F59E0B",
  purple:     "#8B5CF6",
  slate50:    "#F8FAFC",
  slate100:   "#F1F5F9",
  slate200:   "#E2E8F0",
  slate400:   "#94A3B8",
  slate600:   "#475569",
  slate900:   "#0F172A",
  white:      "#FFFFFF",
};

// ── Small reusable atoms ────────────────────────────────────────────────────
function StatCard({ accentColor, children }) {
  return (
    <Box sx={{
      bgcolor: T.white,
      borderRadius: 2,
      border: `1px solid ${T.slate200}`,
      borderTop: `4px solid ${accentColor}`,
      p: "20px 24px",
      minHeight: 118,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxSizing: "border-box",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      transition: "all 0.2s ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
    }}>
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
      borderRadius: 2,
      border: `1px solid ${T.slate200}`,
      p: 3,
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
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

// ── Classification mini-chip ────────────────────────────────────────────────
const CLASSIF_COLORS = {
  Simple:           { bg: "#EFF6FF", color: T.blue },
  Complex:          { bg: "#FFFBEB", color: "#D97706" },
  "Highly Technical": { bg: "#FEF2F2", color: "#EF4444" },
};

function ClassifChip({ label, count }) {
  const { bg, color } = CLASSIF_COLORS[label] || { bg: T.slate100, color: T.slate600 };
  return (
    <Box component="span" sx={{
      fontSize: 11, fontWeight: 700, px: "8px", py: "2px",
      borderRadius: "6px", bgcolor: bg, color,
    }}>
      {label === "Highly Technical" ? "HT" : label} · {count}
    </Box>
  );
}

// ── Donut legend row ────────────────────────────────────────────────────────
function LegendRow({ dot, label, count }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, fontWeight: 600, color: "#334155" }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
        {label} — {count}
      </Typography>
    </Box>
  );
}

// ── Holiday row ─────────────────────────────────────────────────────────────
const HOLIDAY_TYPE_COLORS = {
  REGULAR:              { bg: "#FEF2F2", color: "#B91C1C", label: "National" },
  SPECIAL_NON_WORKING:  { bg: "#FFFBEB", color: "#92400E", label: "Local" },
  COMPANY:              { bg: "#EFF6FF", color: "#1D4ED8", label: "Campus" },
  National:             { bg: "#FEF2F2", color: "#B91C1C", label: "National" },
  Local:                { bg: "#FFFBEB", color: "#92400E", label: "Local" },
  Campus:               { bg: "#EFF6FF", color: "#1D4ED8", label: "Campus" },
};

function HolidayRow({ holiday }) {
  let month = "JAN", day = "1";
  try {
    const d = new Date(holiday.date || holiday.holiday_date);
    if (!isNaN(d.getTime())) {
      month = d.toLocaleString("default", { month: "short" }).toUpperCase();
      day = d.getDate();
    }
  } catch (_) {}

  const typeStyle = HOLIDAY_TYPE_COLORS[holiday.type] || { bg: "#F3F4F6", color: "#6B7280", label: holiday.type };

  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.25,
      p: "8px 10px", borderRadius: 2, bgcolor: T.slate50,
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
  const { services, fetchServices, kpis, fetchKpis, periods, fetchPeriods, holidays, fetchHolidays } = useAppStore();
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    Promise.all([fetchServices(), fetchKpis(), fetchPeriods(), fetchHolidays(), api.getDashboardSummary().then(setSummaryData)])
      .catch(err => console.error("Failed to load dashboard data:", err));
  }, []);

  // ── Computed metrics ──────────────────────────────────────────────────────
  const totalServices    = services.filter(s => !s.archived).length;
  const activeServices   = summaryData ? summaryData.active_services_count : 0;
  const inactiveServices = totalServices - activeServices;
  const naFlaggedServicesCount = services.filter(s => s.naFlag && !s.archived).length;

  const totalKpis = kpis.length;
  const activeKpis = kpis.filter(k => k.active).length;
  const inactiveKpis = totalKpis - activeKpis;

  const simpleCount          = services.filter(s => s.classification === "Simple"           && !s.archived).length;
  const complexCount         = services.filter(s => s.classification === "Complex"          && !s.archived).length;
  const highlyTechnicalCount = services.filter(s => s.classification === "Highly Technical" && !s.archived).length;

  const activePeriod = summaryData?.current_period || summaryData?.active_period || null;
  const currentPeriod = activePeriod || { name: "No active evaluation period", id: null };
  const commitmentStatus = summaryData?.commitment_status || "Not Started";

  const activeServiceIds = services.filter(s => s.active && !s.archived).map(s => s.id);
  const activeEMS = EMS_UTILIZATION_DATA.filter(d =>
    d.periodId === Number(currentPeriod.id || 2) && activeServiceIds.includes(d.serviceId)
  );

  const totalTransactions       = activeEMS.reduce((a, c) => a + c.volume, 0);
  const compliantCount          = Math.round(activeEMS.reduce((a, c) => a + (c.volume * c.compliance / 100), 0));
  const nonCompliantCount       = totalTransactions - compliantCount;
  const overdueCount            = Math.round(nonCompliantCount * 0.2);
  const resolvedNonCompliantCount = nonCompliantCount - overdueCount;
  const naCount                 = 0;
  const complianceRate          = totalTransactions > 0 ? Math.round((compliantCount / totalTransactions) * 100) : 0;

  const periodDateRange = currentPeriod.start_date && currentPeriod.end_date
    ? `${new Date(currentPeriod.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(currentPeriod.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "Semestral";

  // KPI counts by category for donut chart
  const activeKpisList = kpis.filter(k => k.active);
  const timelinessCount = activeKpisList.filter(k => k.category === "Timeliness").length;
  const qualityCount    = activeKpisList.filter(k => k.category === "Quality").length;
  const efficiencyCount = activeKpisList.filter(k => k.category === "Efficiency").length;
  const totalActiveKpis = activeKpisList.length;

  const circumference = 238.76;
  const lenTimeliness = totalActiveKpis > 0 ? (timelinessCount / totalActiveKpis) * circumference : 0;
  const lenQuality = totalActiveKpis > 0 ? (qualityCount / totalActiveKpis) * circumference : 0;
  const lenEfficiency = totalActiveKpis > 0 ? (efficiencyCount / totalActiveKpis) * circumference : 0;

  // Group holidays by name for a clean, non-repetitive Dashboard view
  const uniqueHolidays = [];
  holidays.forEach(h => {
    const nameLower = h.name.toLowerCase();
    const existing = uniqueHolidays.find(u => u.name.toLowerCase() === nameLower && u.type === h.type);
    if (!existing) {
      uniqueHolidays.push(h);
    }
  });

  // Upcoming unique holidays sorted chronologically by month and day
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
    <Box sx={{ p: 4, bgcolor: T.slate50, minHeight: "100vh", fontFamily: "Outfit, sans-serif" }}>
      <PageHeader breadcrumb="Dashboard" title="Performance Overview" />

      {/* ── Top Summary Cards ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        gap: "20px",
        mb: 3,
      }}>
        {/* Current Period */}
        <StatCard accentColor={T.emerald}>
          <StatLabel>Current Period</StatLabel>
          {activePeriod ? (
            <>
              <Box sx={{
                display: "inline-block", px: "10px", py: "3px", borderRadius: "9999px",
                fontSize: 10.5, fontWeight: 700, bgcolor: "#ECFDF5", color: "#047857", mb: 0.5,
              }}>
                ● Active
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.slate900, lineHeight: 1.3 }}>
                {activePeriod.name}
              </Typography>
              <StatSubtext>{periodDateRange}</StatSubtext>
            </>
          ) : (
            <>
              <Box sx={{
                display: "inline-block", px: "10px", py: "3px", borderRadius: "9999px",
                fontSize: 10.5, fontWeight: 700, bgcolor: T.slate100, color: T.slate600, mb: 0.5,
              }}>
                ● Inactive
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.slate400, lineHeight: 1.3 }}>
                No active evaluation period
              </Typography>
              <StatSubtext>N/A</StatSubtext>
            </>
          )}
        </StatCard>

        {/* Active Services */}
        <StatCard accentColor={T.amber}>
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
        <StatCard accentColor={T.maroon}>
          <StatLabel>KPI Standards</StatLabel>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <StatValue>{activeKpis}</StatValue>
            <Typography sx={{ fontSize: 20, color: T.slate400, fontWeight: 500 }}>
              / {totalKpis}
            </Typography>
          </Box>
          <StatSubtext>{inactiveKpis} KPIs inactive</StatSubtext>
        </StatCard>

        {/* N/A Flagged Services */}
        <StatCard accentColor={T.slate600}>
          <StatLabel>N/A Flagged Services</StatLabel>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <StatValue>{naFlaggedServicesCount}</StatValue>
            <Typography sx={{ fontSize: 20, color: T.slate400, fontWeight: 500 }}>
              / {totalServices}
            </Typography>
          </Box>
          <StatSubtext>services flagged N/A</StatSubtext>
        </StatCard>
      </Box>

      {/* ── Charts Row ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
        gap: 3,
      }}>
        {/* KPI Targets by Category Donut */}
        <ChartCard>
          <ChartHeader
            title="KPI Targets by Category"
            subtitle="Distribution of active Key Performance Indicator (KPI) targets"
          />
          {totalActiveKpis > 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3.5, flexWrap: "wrap", py: 1 }}>
              {/* Donut SVG */}
              <Box sx={{ position: "relative", width: 170, height: 170 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke={T.slate100} strokeWidth="8" />
                  {lenTimeliness > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke={T.blue} strokeWidth="8"
                      strokeDasharray={`${lenTimeliness} ${circumference - lenTimeliness}`}
                      strokeDashoffset={0}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                    />
                  )}
                  {lenQuality > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke={T.amber} strokeWidth="8"
                      strokeDasharray={`${lenQuality} ${circumference - lenQuality}`}
                      strokeDashoffset={-lenTimeliness}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                    />
                  )}
                  {lenEfficiency > 0 && (
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke={T.emerald} strokeWidth="8"
                      strokeDasharray={`${lenEfficiency} ${circumference - lenEfficiency}`}
                      strokeDashoffset={-(lenTimeliness + lenQuality)}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                    />
                  )}
                </svg>
                <Box sx={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  lineHeight: 1.1,
                }}>
                  <Typography sx={{ fontSize: 28, fontWeight: 700, color: T.slate900 }}>{totalActiveKpis}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: T.slate600, fontWeight: 600, textTransform: "lowercase", mt: 0.25 }}>
                    active KPIs
                  </Typography>
                </Box>
              </Box>

              {/* Legend */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <LegendRow dot={T.blue}     label="Timeliness (SLA)" count={timelinessCount} />
                <LegendRow dot={T.amber}    label="Quality"          count={qualityCount} />
                <LegendRow dot={T.emerald}  label="Efficiency"       count={efficiencyCount} />
              </Box>
            </Box>
          ) : (
            <Box sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4.5,
              px: 3,
              textAlign: "center"
            }}>
              <Box sx={{ color: T.slate400, mb: 2 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                  <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                </svg>
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: T.slate900, mb: 0.5 }}>
                No active KPI targets defined
              </Typography>
              <Typography sx={{ fontSize: 12, color: T.slate600, maxWidth: 300, lineHeight: 1.5 }}>
                Define KPI standards first in the KPI Management section to visualize targets.
              </Typography>
            </Box>
          )}
        </ChartCard>

        {/* Holidays List */}
        <ChartCard>
          <ChartHeader
            title="Holidays"
            subtitle={`${uniqueHolidays.length} declared holiday${uniqueHolidays.length !== 1 ? "s" : ""}`}
          />
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1,
          }}>
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map(h => <HolidayRow key={h.id} holiday={h} />)
            ) : (
              <Typography sx={{ fontSize: 13, color: T.slate400, gridColumn: "1 / -1", textAlign: "center", py: 4 }}>
                No holidays declared yet.
              </Typography>
            )}
          </Box>
        </ChartCard>
      </Box>
    </Box>
  );
}
