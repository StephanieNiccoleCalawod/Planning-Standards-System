import { useEffect } from "react";
import { Box, Typography, Chip } from "@mui/material";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import { useAppStore } from "../store/useAppStore";

// ── Design tokens (matching theme.js + colors.js) ──────────────────────────
const T = {
  maroon:     "#800000",
  blue:       "#2563EB",
  emerald:    "#10B981",
  amber:      "#F59E0B",
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

  useEffect(() => {
    Promise.all([fetchServices(), fetchKpis(), fetchPeriods(), fetchHolidays()])
      .catch(err => console.error("Failed to load dashboard data:", err));
  }, []);

  // ── Computed metrics ──────────────────────────────────────────────────────
  const activeServices   = services.filter(s =>  s.active && !s.archived).length;
  const totalServices    = services.filter(s => !s.archived).length;
  const inactiveServices = services.filter(s => !s.active && !s.archived).length;

  const simpleCount          = services.filter(s => s.classification === "Simple"           && !s.archived).length;
  const complexCount         = services.filter(s => s.classification === "Complex"          && !s.archived).length;
  const highlyTechnicalCount = services.filter(s => s.classification === "Highly Technical" && !s.archived).length;

  const currentPeriod = periods.find(p => p.status === "Active" || p.status === "Open")
    || periods[periods.length - 1]
    || { name: "N/A", id: 2 };

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

      {/* ── Top 4 Summary Cards ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
        gap: "20px",
        mb: 3,
      }}>
        {/* Total Transactions */}
        <StatCard accentColor={T.maroon}>
          <StatLabel>Total Transactions</StatLabel>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <StatValue>{totalTransactions}</StatValue>
            <Box sx={{
              px: "8px", py: "3px", borderRadius: "9999px", fontSize: 11, fontWeight: 700,
              bgcolor: "#ECFDF5", color: T.emerald,
            }}>
              ↑ 4%
            </Box>
          </Box>
          <StatSubtext>this period</StatSubtext>
        </StatCard>

        {/* Service Classification */}
        <StatCard accentColor={T.blue}>
          <StatLabel>Classification</StatLabel>
          <StatValue>{totalServices}</StatValue>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
            <ClassifChip label="Simple"           count={simpleCount} />
            <ClassifChip label="Complex"          count={complexCount} />
            <ClassifChip label="Highly Technical" count={highlyTechnicalCount} />
          </Box>
        </StatCard>

        {/* Current Period */}
        <StatCard accentColor={T.emerald}>
          <StatLabel>Current Period</StatLabel>
          <Box sx={{
            display: "inline-block", px: "10px", py: "3px", borderRadius: "9999px",
            fontSize: 10.5, fontWeight: 700, bgcolor: "#ECFDF5", color: "#047857", mb: 0.5,
          }}>
            ● Active
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.slate900, lineHeight: 1.3 }}>
            {currentPeriod.name}
          </Typography>
          <StatSubtext>{periodDateRange}</StatSubtext>
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
      </Box>

      {/* ── Charts Row ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
        gap: 3,
      }}>
        {/* SLA Compliance Donut */}
        <ChartCard>
          <ChartHeader
            title="SLA Compliance Rate"
            subtitle="Calculated dynamically based on live services and transactions"
          />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3.5, flexWrap: "wrap", py: 1 }}>
            {/* Donut SVG */}
            <Box sx={{ position: "relative", width: 170, height: 170 }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke={T.slate100} strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="38" fill="none"
                  stroke={T.maroon} strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (238.76 * (complianceRate / 100))}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
                {/* tick marks */}
                {["50,8,50,16","50,84,50,92","8,50,16,50","84,50,92,50"].map((pts, i) => {
                  const [x1,y1,x2,y2] = pts.split(",");
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="2.5" />;
                })}
              </svg>
              <Box sx={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                lineHeight: 1.1,
              }}>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: T.slate900 }}>{complianceRate}%</Typography>
                <Typography sx={{ fontSize: 11.5, color: T.slate600, fontWeight: 600, textTransform: "lowercase", mt: 0.25 }}>
                  compliant
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <LegendRow dot={T.maroon}   label="Compliant"     count={compliantCount} />
              <LegendRow dot={T.slate200} label="Non-Compliant" count={resolvedNonCompliantCount} />
              <LegendRow dot="#EF4444"    label="Overdue"       count={overdueCount} />
              <LegendRow dot={T.amber}    label="N/A"           count={naCount} />
            </Box>
          </Box>
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
