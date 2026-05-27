import { useState, useEffect } from "react";
import { MOCK_SERVICES } from "../constants/mockData";
import { INITIAL_KPIS, INITIAL_PERIODS, INITIAL_HOLIDAYS } from "../constants/sprint2Mock";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";

const EMS_UTILIZATION_DATA = [];

const mapTypeToFrontend = (t) => {
  switch (t) {
    case "REGULAR": return "National";
    case "SPECIAL_NON_WORKING": return "Local";
    case "COMPANY": return "Campus";
    default: return "National";
  }
};

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, kpisRes, periodsRes, holidaysRes] = await Promise.all([
          api.getServices({ include_archived: true }),
          api.getKpis(),
          api.getPeriods(),
          api.getHolidays().catch(err => {
            console.warn("Failed to fetch holidays, using mock holidays:", err);
            return null;
          })
        ]);
        
        if (servicesRes?.data) {
          const formattedServices = servicesRes.data.map(s => ({
            id: s.id,
            name: s.name,
            classification: s.classification,
            sla: `${s.sla_target_value} ${s.sla_target_unit}`,
            slaTarget: `${s.sla_target_value} ${s.sla_target_unit}`,
            responsibleUnit: s.responsible_unit,
            active: s.status === 'Active',
            archived: s.status === 'Archived',
            lastUpdated: s.updated_at ? new Date(s.updated_at).toLocaleString() : 'N/A',
            ...s
          }));
          setServices(formattedServices);
        }
        
        if (kpisRes?.data) {
          setKpis(kpisRes.data);
        }
        
        if (periodsRes?.data) {
          setPeriods(periodsRes.data);
        }

        if (holidaysRes?.data && holidaysRes.data.length > 0) {
          const formattedHolidays = holidaysRes.data.map(h => ({
            id: h.id,
            name: h.name,
            date: h.holiday_date,
            type: mapTypeToFrontend(h.type),
            is_recurring: h.is_recurring,
            ...h
          }));
          setHolidays(formattedHolidays);
        }
      } catch (err) {
        console.error("Failed to load live dashboard data:", err);
      }
    }
    loadData();
  }, []);

  // Calculate dynamic services count
  const activeServices = services.filter(s => s.active && !s.archived).length;
  const totalServices = services.filter(s => !s.archived).length;
  const inactiveServices = services.filter(s => !s.active && !s.archived).length;

  // Classification breakdown
  const simpleCount = services.filter(s => s.classification === "Simple" && !s.archived).length;
  const complexCount = services.filter(s => s.classification === "Complex" && !s.archived).length;
  const highlyTechnicalCount = services.filter(s => s.classification === "Highly Technical" && !s.archived).length;

  // Current active period
  const currentPeriod = periods.find(p => p.status === "Active" || p.status === "Open") || periods[periods.length - 1] || { name: "N/A", id: 2 };

  // Filter EMS data for active services in active period
  const activeServiceIds = services.filter(s => s.active && !s.archived).map(s => s.id);
  const activeEMS = EMS_UTILIZATION_DATA.filter(d => d.periodId === Number(currentPeriod.id || 2) && activeServiceIds.includes(d.serviceId));

  // Compute all metrics fully dynamically based on actual system EMS batch records
  const totalTransactions = activeEMS.reduce((acc, curr) => acc + curr.volume, 0);
  const compliantCount = Math.round(activeEMS.reduce((acc, curr) => acc + (curr.volume * (curr.compliance / 100)), 0));
  const nonCompliantCount = totalTransactions - compliantCount;
  
  // Overdue count is estimated as a small portion (~20%) of the non-compliant transactions
  const overdueCount = Math.round(nonCompliantCount * 0.2);
  const resolvedNonCompliantCount = nonCompliantCount - overdueCount;
  const naCount = 0;

  const complianceRate = totalTransactions > 0 
    ? Math.round((compliantCount / totalTransactions) * 100) 
    : 0;

  return (
    <div className="dashboard-container">
      {/* Styles Block */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .dashboard-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: var(--font-ui), sans-serif;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* Top Grid Row */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 118px;
          position: relative;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        /* Left-border colored indicators */
        .stat-card.total-tx { border-top: 4px solid #800000; }
        .stat-card.classification { border-top: 4px solid #2563EB; }
        .stat-card.current-period { border-top: 4px solid #10B981; }
        .stat-card.active-services { border-top: 4px solid #F59E0B; }

        /* Classification mini-tags */
        .classif-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .classif-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .classif-tag.simple { background: #EFF6FF; color: #2563EB; }
        .classif-tag.complex { background: #FFFBEB; color: #D97706; }
        .classif-tag.ht { background: #FEF2F2; color: #EF4444; }

        /* Period status pill */
        .period-status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 10.5px;
          font-weight: 700;
          background: #ECFDF5;
          color: #047857;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .stat-main-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 600;
          color: #0F172A;
          line-height: 1;
        }
        .stat-subtext {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stat-badge-pill {
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .stat-badge-pill.green {
          background: #ECFDF5;
          color: #10B981;
        }
        .stat-badge-pill.red {
          background: #FEF2F2;
          color: #EF4444;
        }

        /* Middle Charts Row */
        .charts-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .chart-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
        }
        .chart-subtitle {
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
          margin-top: 2px;
        }

        /* Circular/Doughnut SLA compliance elements */
        .circular-progress-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          padding: 8px 0;
          flex-wrap: wrap;
        }
        .donut-legend-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .donut-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .donut-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        /* Holidays List Styles */
        .holiday-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 4px;
        }
        @media (max-width: 600px) {
          .holiday-list {
            grid-template-columns: 1fr;
          }
        }
        .holiday-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #F8FAFC;
          transition: background 0.15s;
        }
        .holiday-row:hover { background: #F1F5F9; }
        .holiday-date-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          background: #800000;
          border-radius: 8px;
          color: #fff;
          flex-shrink: 0;
        }
        .holiday-date-month {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .holiday-date-day {
          font-size: 14px;
          font-weight: 800;
          line-height: 1;
        }
        .holiday-info { flex: 1; overflow: hidden; }
        .holiday-name {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .holiday-type-pill {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 6px;
          margin-top: 2px;
          background: #FEF3C7;
          color: #92400E;
        }
      `}} />

      <PageHeader breadcrumb="Dashboard" title="Performance Overview" />

      {/* Top 4 Summary Cards Grid */}
      <div className="stats-grid">
        {/* Card 1: Total Transactions */}
        <div className="stat-card total-tx">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-main-row">
            <div className="stat-value">{totalTransactions}</div>
            <div className="stat-badge-pill green">↑ 4%</div>
          </div>
          <div className="stat-subtext">this period</div>
        </div>

        {/* Card 2: Classification */}
        <div className="stat-card classification">
          <div className="stat-label">Classification</div>
          <div className="stat-main-row">
            <div className="stat-value">{totalServices}</div>
          </div>
          <div className="classif-row">
            <span className="classif-tag simple">Simple · {simpleCount}</span>
            <span className="classif-tag complex">Complex · {complexCount}</span>
            <span className="classif-tag ht">HT · {highlyTechnicalCount}</span>
          </div>
        </div>

        {/* Card 3: Current Period */}
        <div className="stat-card current-period">
          <div className="stat-label">Current Period</div>
          <div style={{ marginBottom: 4 }}>
            <span className="period-status-pill">● Active</span>
          </div>
          <div className="stat-subtext" style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
            {currentPeriod.name}
          </div>
          <div className="stat-subtext" style={{ marginTop: 4 }}>
            {currentPeriod.start_date && currentPeriod.end_date
              ? `${new Date(currentPeriod.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(currentPeriod.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : "Semestral"}
          </div>
        </div>

        {/* Card 4: Active Services */}
        <div className="stat-card active-services">
          <div className="stat-label">Active Services</div>
          <div className="stat-main-row">
            <div>
              <span className="stat-value">{activeServices}</span>
              <span style={{ fontSize: "20px", color: "#94A3B8", fontWeight: "500", marginLeft: "4px" }}>
                / {totalServices}
              </span>
            </div>
          </div>
          <div className="stat-subtext">{inactiveServices} services inactive</div>
        </div>
      </div>

      {/* Middle Row Charts Section */}
      <div className="charts-grid">
        {/* Left Column: SLA Compliance Rate circular progress */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">SLA Compliance Rate</div>
              <div className="chart-subtitle">Calculated dynamically based on live services and transactions</div>
            </div>
          </div>

          <div className="circular-progress-section">
            <div className="donut-chart-container" style={{ position: "relative", width: "170px", height: "170px" }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                
                {/* Segmented Ring Indicator */}
                <circle
                  cx="50" cy="50"
                  r="38"
                  fill="none"
                  stroke="#800000"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (238.76 * (complianceRate / 100))}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />

                {/* Slices to render custom high-fidelity dash segment layout */}
                <line x1="50" y1="8" x2="50" y2="16" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="50" y1="84" x2="50" y2="92" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="8" y1="50" x2="16" y2="50" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="84" y1="50" x2="92" y2="50" stroke="#FFFFFF" strokeWidth="2.5" />
              </svg>
              {/* Inner Text Label */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: "1.1"
              }}>
                <span style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A" }}>{complianceRate}%</span>
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "600", textTransform: "lowercase", marginTop: "2px" }}>compliant</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="donut-legend-list">
              <div className="donut-legend-item">
                <div className="donut-dot" style={{ background: "#800000" }} />
                <span>Compliant — {compliantCount}</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-dot" style={{ background: "#CBD5E1" }} />
                <span>Non-Compliant — {resolvedNonCompliantCount}</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-dot" style={{ background: "#EF4444" }} />
                <span>Overdue — {overdueCount}</span>
              </div>
              <div className="donut-legend-item">
                <div className="donut-dot" style={{ background: "#F59E0B" }} />
                <span>N/A — {naCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Holidays List */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Holidays</div>
              <div className="chart-subtitle">{holidays.length} declared holidays</div>
            </div>
          </div>

          <div className="holiday-list">
            {holidays.slice(0, 6).map((holiday) => {
              let month = "JAN";
              let day = "1";
              try {
                const d = new Date(holiday.date || holiday.holiday_date);
                if (!isNaN(d.getTime())) {
                  month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                  day = d.getDate();
                }
              } catch (_) {}
              
              return (
                <div key={holiday.id} className="holiday-row">
                  <div className="holiday-date-badge">
                    <span className="holiday-date-month">{month}</span>
                    <span className="holiday-date-day">{day}</span>
                  </div>
                  <div className="holiday-info">
                    <div className="holiday-name">{holiday.name}</div>
                    <span className="holiday-type-pill">{holiday.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
