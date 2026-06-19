import { useEffect, useState } from "react";
import { Box, Typography, Chip, Alert } from "@mui/material";
import PageHeader from "../components/PageHeader";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

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
function StatCard({ accentColor, children }) {
  return (
    <Box sx={{
      bgcolor: T.white,
      borderRadius: "8px",
      border: `1px solid ${T.slate200}`,
      p: "20px 24px",
      pt: "24px",
      minHeight: 118,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxSizing: "border-box",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.2s ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    }}>
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
      border: `1px solid ${T.slate200}`,
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

// ── Classification mini-chip ────────────────────────────────────────────────
const CLASSIF_COLORS = {
  Simple: { bg: "#EFF6FF", color: T.blue },
  Complex: { bg: "#FFFBEB", color: "#D97706" },
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
  REGULAR: { bg: "#FEF2F2", color: "#B91C1C", label: "National" },
  SPECIAL_NON_WORKING: { bg: "#FFFBEB", color: "#92400E", label: "Local" },
  COMPANY: { bg: "#EFF6FF", color: "#1D4ED8", label: "Campus" },
  National: { bg: "#FEF2F2", color: "#B91C1C", label: "National" },
  Local: { bg: "#FFFBEB", color: "#92400E", label: "Local" },
  Campus: { bg: "#EFF6FF", color: "#1D4ED8", label: "Campus" },
};

function HolidayRow({ holiday }) {
  let month = "JAN", day = "1";
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
  const { services, fetchServices, kpis, fetchKpis, periods, fetchPeriods, holidays, fetchHolidays } = useAppStore();
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    // Run each call independently so one failure doesn't prevent the others from loading
    fetchServices().catch(err => console.error('Dashboard: fetchServices failed', err));
    fetchKpis().catch(err => console.error('Dashboard: fetchKpis failed', err));
    fetchPeriods().catch(err => console.error('Dashboard: fetchPeriods failed', err));
    fetchHolidays().catch(err => console.error('Dashboard: fetchHolidays failed', err));
    api.getDashboardSummary()
      .then(setSummaryData)
      .catch(err => console.error('Dashboard: getDashboardSummary failed', err));
  }, []);

  // ── Computed metrics ──────────────────────────────────────────────────────
  const totalServices = services.filter(s => !s.archived).length;
  // Prefer the API summary count; fall back to counting active services from the local store
  const activeServices = summaryData
    ? summaryData.active_services_count
    : services.filter(s => s.active && !s.archived).length;
  const inactiveServices = totalServices - activeServices;
  const naFlaggedServicesCount = services.filter(s => s.naFlag && !s.archived).length;

  const totalKpis = kpis.length;
  const activeKpis = kpis.filter(k => k.active).length;
  const inactiveKpis = totalKpis - activeKpis;

  const simpleCount = services.filter(s => getArtaClassification(s) === "Simple" && !s.archived).length;
  const complexCount = services.filter(s => getArtaClassification(s) === "Complex" && !s.archived).length;
  const highlyTechnicalCount = services.filter(s => getArtaClassification(s) === "Highly Technical" && !s.archived).length;

  // Prefer API summary period; fall back to the periods store (Open/Active period)
  const activePeriod =
    summaryData?.current_period ||
    summaryData?.active_period ||
    periods.find(p => p.status === 'Active' || p.status === 'Open') ||
    null;
  const currentPeriod = activePeriod || { name: "No active evaluation period", id: null };
  const commitmentStatus = summaryData?.commitment_status || "Not Started";

  const activeServiceIds = services.filter(s => s.active && !s.archived).map(s => s.id);
  const activeEMS = EMS_UTILIZATION_DATA.filter(d =>
    d.periodId === Number(currentPeriod.id || 2) && activeServiceIds.includes(d.serviceId)
  );



  const periodDateRange = currentPeriod.start_date && currentPeriod.end_date
    ? `${new Date(currentPeriod.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(currentPeriod.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "Semestral";

  // KPI counts by category for donut chart
  const activeKpisList = kpis.filter(k => k.active);
  const timelinessCount = activeKpisList.filter(k => k.category === "Timeliness").length;
  const qualityCount = activeKpisList.filter(k => k.category === "Quality").length;
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
    <Box sx={{ p: 4, bgcolor: T.slate50, minHeight: "100vh", fontFamily: '"DM Sans", sans-serif' }}>
      <PageHeader breadcrumb="Dashboard" title="Performance Overview" subtitle="Monitor key metrics, track commitments, and view performance insights at a glance." />

      <Alert
        severity="warning"
        sx={{
          mb: 3,
          borderRadius: "8px",
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
        {/* SLA Compliance by Service Category */}
        <ChartCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: T.slate900, fontFamily: '"DM Sans", sans-serif' }}>
              SLA Compliance by Service Category
            </Typography>
            <Chip
              label="Current Period"
              size="small"
              sx={{
                bgcolor: "#FEF2F2",
                color: "#580000",
                fontWeight: 700,
                fontSize: "0.72rem",
                border: "1px solid rgba(88, 0, 0, 0.15)",
                fontFamily: '"DM Sans", sans-serif'
              }}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {[
              {
                category: "ADMIN SYSTEM",
                items: [
                  { name: "Medical Services", value: 96, color: "#580000" },
                  { name: "Dental Services", value: 91, color: "#580000" },
                  { name: "General Clearance", value: 89, color: "#580000" },
                  { name: "Facility Reservations", value: 99, color: "#10B981" },
                ]
              },
              {
                category: "ACADEMIC SYSTEM",
                items: [
                  { name: "Subject Adding / Dropping", value: 88, color: "#580000" },
                  { name: "Grade Corrections", value: 74, color: "#C8960C" },
                ]
              },
              {
                category: "STUDENT SYSTEM",
                items: [
                  { name: "Transcript of Records", value: 93, color: "#580000" },
                  { name: "Graduation Application", value: 85, color: "#580000" },
                ]
              }
            ].map((section, idx) => (
              <Box key={section.category} sx={{ display: "flex", flexDirection: "column" }}>
                {idx > 0 && <Box sx={{ borderBottom: "1px solid #E2E8F0", my: 2 }} />}
                <Typography sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.slate400,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 1.5,
                  fontFamily: '"DM Sans", sans-serif'
                }}>
                  {section.category}
                </Typography>
                {section.items.map((item) => (
                  <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.25, "&:last-child": { mb: 0 } }}>
                    <Typography sx={{
                      width: 180,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#334155",
                      flexShrink: 0,
                      fontFamily: '"DM Sans", sans-serif',
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {item.name}
                    </Typography>
                    <Box sx={{ flex: 1, height: 6, bgcolor: "#F1F5F9", borderRadius: 3, position: "relative" }}>
                      <Box sx={{ width: `${item.value}%`, height: "100%", bgcolor: item.color, borderRadius: 3 }} />
                    </Box>
                    <Typography sx={{
                      width: 36,
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 700,
                      color: item.color,
                      fontFamily: '"DM Sans", sans-serif'
                    }}>
                      {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </ChartCard>

        {/* Transactions vs Target Chart */}
        <ChartCard>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: T.slate900, fontFamily: '"DM Sans", sans-serif' }}>
                Transactions vs Target
              </Typography>
              <Typography sx={{ fontSize: 12, color: T.slate400, fontWeight: 500, mt: 0.25, fontFamily: '"DM Sans", sans-serif' }}>
                Per service · Q1 2026
              </Typography>
            </Box>

            {/* Legend */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: "#580000" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#64748B", fontFamily: '"DM Sans", sans-serif' }}>Actual</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: "#E2E8F0" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#64748B", fontFamily: '"DM Sans", sans-serif' }}>Target</Typography>
              </Box>
            </Box>
          </Box>

          {/* SVG Bar Chart */}
          <Box sx={{ width: "100%", overflow: "hidden", flex: 1, display: "flex", alignItems: "center" }}>
            <Box sx={{ width: "100%", position: "relative" }}>
              <svg width="100%" viewBox="0 0 500 350" fill="none" style={{ display: "block" }}>
                {/* Grid Lines */}
                {[60, 117.5, 175, 232.5, 290].map((yVal) => (
                  <line
                    key={yVal}
                    x1="20"
                    y1={yVal}
                    x2="480"
                    y2={yVal}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray={yVal === 290 ? "none" : "4 4"}
                  />
                ))}

                {/* G1: Medical */}
                <rect x="52" y="129" width="20" height="165" rx="4" fill="#580000" />
                <rect x="76" y="101.4" width="20" height="192.6" rx="4" fill="#E2E8F0" />

                {/* G2: Dental */}
                <rect x="140" y="175" width="20" height="119" rx="4" fill="#580000" />
                <rect x="164" y="110.6" width="20" height="183.4" rx="4" fill="#E2E8F0" />

                {/* G3: Doc Cert */}
                <rect x="228" y="96.8" width="20" height="197.2" rx="4" fill="#580000" />
                <rect x="252" y="96.8" width="20" height="197.2" rx="4" fill="#E2E8F0" />

                {/* G4: Library */}
                <rect x="316" y="147.4" width="20" height="146.6" rx="4" fill="#580000" />
                <rect x="340" y="119.8" width="20" height="174.2" rx="4" fill="#E2E8F0" />

                {/* G5: Activity */}
                <rect x="404" y="198" width="20" height="96" rx="4" fill="#580000" />
                <rect x="428" y="140.5" width="20" height="153.5" rx="4" fill="#E2E8F0" />

                {/* White Cover-up block to flatten bottom rounded corners of the bars */}
                <rect x="20" y="290" width="460" height="8" fill="#FFFFFF" />

                {/* Ground line drawn on top */}
                <line x1="20" y1="290" x2="480" y2="290" stroke="#CBD5E1" strokeWidth="2" />

                {/* Labels */}
                <text x="74" y="315" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Medical</text>
                <text x="162" y="315" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Dental</text>
                <text x="250" y="315" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Doc Cert</text>
                <text x="338" y="315" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Library</text>
                <text x="426" y="315" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Activity</text>
              </svg>
            </Box>
          </Box>
        </ChartCard>

        {/* Holidays List */}
        <Box sx={{ gridColumn: "1 / -1" }}>
          <ChartCard>
            <ChartHeader
              title="Holidays"
              subtitle={`${uniqueHolidays.length} declared holiday${uniqueHolidays.length !== 1 ? "s" : ""}`}
            />
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: 1.5,
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
    </Box>
  );
}
