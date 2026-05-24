import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { MOCK_SERVICES } from "../constants/mockData";
import { INITIAL_KPIS, INITIAL_PERIODS } from "../constants/sprint2Mock";
import { api } from "../services/api";

// Mock EMS utilization batch data linked to active services
const EMS_UTILIZATION_DATA = [
  {
    periodId: 2, // 2nd Semester AY 2025-2026 (Active)
    serviceId: 1,
    volume: 14,
    compliance: 100,
    avgDuration: "42 Days",
  },
  {
    periodId: 2,
    serviceId: 2,
    volume: 480,
    compliance: 96.5,
    avgDuration: "12 Minutes",
  },
  {
    periodId: 2,
    serviceId: 3,
    volume: 5,
    compliance: 80,
    avgDuration: "11 Days",
  },
  {
    periodId: 2,
    serviceId: 4,
    volume: 820,
    compliance: 98.2,
    avgDuration: "11 Minutes",
  },
  {
    periodId: 2,
    serviceId: 5,
    volume: 1550,
    compliance: 94.2,
    avgDuration: "24 Minutes",
  },
  {
    periodId: 2,
    serviceId: 6,
    volume: 640,
    compliance: 88.5,
    avgDuration: "1 Day 15 Mins",
  },
  {
    periodId: 2,
    serviceId: 7,
    volume: 38,
    compliance: 92.1,
    avgDuration: "5 Days 4 Hours",
  },
  {
    periodId: 2,
    serviceId: 8,
    volume: 110,
    compliance: 99.1,
    avgDuration: "1.2 Hours",
  },
  // Previous Period: 1st Semester AY 2025-2026 (Closed)
  {
    periodId: 1,
    serviceId: 1,
    volume: 12,
    compliance: 100,
    avgDuration: "45 Days",
  },
  {
    periodId: 1,
    serviceId: 2,
    volume: 410,
    compliance: 95.1,
    avgDuration: "13 Minutes",
  },
  {
    periodId: 1,
    serviceId: 4,
    volume: 750,
    compliance: 97.5,
    avgDuration: "12 Minutes",
  },
  {
    periodId: 1,
    serviceId: 5,
    volume: 1420,
    compliance: 93.8,
    avgDuration: "25 Minutes",
  },
  {
    periodId: 1,
    serviceId: 6,
    volume: 590,
    compliance: 91.2,
    avgDuration: "1 Day 20 Mins",
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("planning"); // "planning" (PS016) vs "utilization" (PS017)
  
  // States loaded from backend
  const [services, setServices] = useState(MOCK_SERVICES);
  const [kpis, setKpis] = useState(INITIAL_KPIS);
  const [periods, setPeriods] = useState(INITIAL_PERIODS);

  // Utilization Filter States
  const [selectedPeriod, setSelectedPeriod] = useState(2); // Default to 2nd Semester (Active)
  const [selectedService, setSelectedService] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, kpisRes, periodsRes] = await Promise.all([
          api.getServices({ include_archived: true }),
          api.getKpis(),
          api.getPeriods(),
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
      } catch (err) {
        console.error("Failed to load live dashboard data:", err);
      }
    }
    loadData();
  }, []);

  const activeServices = services.filter(s => s.active && !s.archived);
  const activeKPIs = kpis;
  const currentActivePeriod = periods.find(p => p.status === "Active" || p.status === "Open") || { name: "N/A" };

  // Calculate filtered EMS utilization statistics
  const filteredEMS = EMS_UTILIZATION_DATA.filter(d => {
    const matchPeriod = d.periodId === Number(selectedPeriod);
    const matchService = selectedService === "all" ? true : d.serviceId === Number(selectedService);
    return matchPeriod && matchService;
  });

  const totalVolume = filteredEMS.reduce((acc, curr) => acc + curr.volume, 0);
  const avgCompliance = filteredEMS.length > 0 
    ? (filteredEMS.reduce((acc, curr) => acc + curr.compliance, 0) / filteredEMS.length).toFixed(1)
    : "—";

  return (
    <div className="dashboard-container">
      {/* Styles block */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: var(--font-ui), "DM Sans", sans-serif;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* Top metrics grid precisely matching user's mockup crop */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }

        .metric-card {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-left: 4px solid #800000; /* Deep Maroon Left Border Accent */
          border-radius: 12px;
          padding: 20px 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          height: 128px;
        }
        .metric-card-label {
          font-size: 11px;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-card-value {
          font-size: 28px;
          font-weight: 500;
          color: #1E293B;
          line-height: 1.1;
          margin: 6px 0;
        }
        .metric-card-subtext {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }
        
        /* Soft-blue capsule pill for status */
        .status-pill-blue {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 500;
          background: #E8F0FE;
          color: #1B3A6B;
          padding: 4px 14px;
          border-radius: 99px;
          width: fit-content;
          margin: 6px 0;
          line-height: 1.2;
        }

        /* Tab Switcher */
        .tab-switcher-row {
          display: inline-flex;
          background: rgba(128, 0, 0, 0.04);
          border: 1px solid rgba(128, 0, 0, 0.08);
          border-radius: 99px;
          padding: 6px;
          margin-bottom: 28px;
          width: fit-content;
        }
        .tab-btn {
          border: none;
          background: transparent;
          color: #64748B;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 24px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-btn:hover {
          color: #0F172A;
        }
        .tab-btn.active {
          background: #800000;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(128, 0, 0, 0.25);
        }

        /* Tab 1: Service Commitment Cards Grid */
        .commitments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .commitment-card {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .commitment-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.06);
          border-color: #CBD5E1;
        }
        .comm-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }
        .comm-meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .class-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .class-badge.highly-technical {
          background: #FEF2F2;
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }
        .class-badge.complex {
          background: #FFFBEB;
          color: #D97706;
          border: 1px solid rgba(217, 119, 6, 0.15);
        }
        .class-badge.simple {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }
        .comm-unit-label {
          font-size: 11.5px;
          color: #64748B;
          font-weight: 600;
        }
        
        .comm-kpis-list {
          border-top: 1px solid #F1F5F9;
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .comm-kpi-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .comm-kpi-name {
          color: #475569;
          font-weight: 500;
        }
        .comm-kpi-target {
          font-weight: 700;
          color: #0F172A;
          background: #F8FAFC;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
        }

        /* Tab 2: EMS Filters Grid Layout */
        .utilization-panel {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .filter-bar {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 20px;
          margin-bottom: 28px;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 20px;
        }
        @media (max-width: 600px) {
          .filter-bar {
            grid-template-columns: 1fr;
          }
        }
        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-field label {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-field select {
          padding: 10px 14px;
          font-size: 13.5px;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          outline: none;
          color: #1E293B;
          width: 100%;
          background: #ffffff;
        }
        .filter-field select:focus {
          border-color: #800000;
        }

        /* Analytics Stat Cards Row */
        .util-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .util-overview-card {
          background: rgba(128, 0, 0, 0.02);
          border: 1px solid rgba(128, 0, 0, 0.06);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .util-overview-val {
          font-size: 28px;
          font-weight: 800;
          color: #800000;
          margin-top: 8px;
          line-height: 1;
        }

        /* Comparative Target vs Actual Chart */
        .chart-section {
          margin-bottom: 36px;
        }
        .chart-header {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-left: 4px solid #800000;
          padding-left: 8px;
        }
        .bar-chart-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .bar-chart-row {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .bar-chart-row:hover {
          transform: scale(1.005);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .chart-row-label {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
        }
        .chart-bars-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bar-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bar-inner-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          width: 80px;
          flex-shrink: 0;
        }
        .bar-outer-track {
          flex: 1;
          height: 10px;
          background: #E2E8F0;
          border-radius: 99px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill-indicator {
          height: 100%;
          border-radius: 99px;
          transition: width 0.4s ease;
        }
        .bar-fill-indicator.target {
          background: linear-gradient(90deg, #FCD34D, #C8960C);
          box-shadow: 0 0 8px rgba(200, 150, 12, 0.35);
        }
        .bar-fill-indicator.actual {
          background: linear-gradient(90deg, #EF4444, #800000);
          box-shadow: 0 0 8px rgba(128, 0, 0, 0.35);
        }
        .bar-val-text {
          font-size: 11.5px;
          font-weight: 700;
          color: #1E293B;
          width: 45px;
          text-align: right;
          flex-shrink: 0;
        }

        /* Registry Table */
        .util-table-wrap {
          overflow-x: auto;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .util-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .util-data-table th {
          background: #F8FAFC;
          padding: 12px 18px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #64748B;
          border-bottom: 1.5px solid #E2E8F0;
        }
        .util-data-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #E2E8F0;
          font-size: 13.5px;
          color: #1E293B;
        }
        .util-data-table tr:last-child td {
          border-bottom: none;
        }
        .util-data-table tr:hover td {
          background: rgba(128, 0, 0, 0.01);
        }
        .tag-pill-status {
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .tag-pill-status.compliant {
          background: #E6F4EA;
          color: #137333;
          border: 1px solid rgba(19, 115, 51, 0.12);
        }
        .tag-pill-status.warning {
          background: #FEF7E0;
          color: #B06000;
          border: 1px solid rgba(176, 96, 0, 0.12);
        }
        .tag-pill-status.non-compliant {
          background: #FCE8E6;
          color: #C5221F;
          border: 1px solid rgba(197, 34, 31, 0.12);
        }
      `}} />

      {/* Page Header */}
      <PageHeader breadcrumb="Dashboard" title="Performance Overview Dashboard" />

      {/* Top metrics grid exactly replicating the user's high-fidelity card mockup */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-label">Total Active Services</div>
          <div className="metric-card-value">{activeServices.length}</div>
          <div className="metric-card-subtext">Across all classifications</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Total Active KPIs</div>
          <div className="metric-card-value">31</div>
          <div className="metric-card-subtext">Timeliness · Quality · Volume</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Current Period</div>
          <div className="metric-card-value" style={{ fontFamily: "var(--font-ui)", fontWeight: "500", fontSize: "16px" }}>
            {currentActivePeriod.name}
          </div>
          <div className="metric-card-subtext">
            {currentActivePeriod.start_date && currentActivePeriod.end_date
              ? `${new Date(currentActivePeriod.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(currentActivePeriod.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${currentActivePeriod.period_type || currentActivePeriod.type || "Semestral"}`
              : "Jan 1 – Mar 31, 2026 · Semestral"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Commitment Status</div>
          <div className="status-pill-blue">Locked</div>
          <div className="metric-card-subtext">Submitted Jan 10, 2026</div>
        </div>
      </div>

      {/* Tab Switched Header */}
      <div className="tab-switcher-row">
        <button 
          className={`tab-btn ${activeTab === "planning" ? "active" : ""}`}
          onClick={() => setActiveTab("planning")}
        >
          📋 Committed Targets & KPIs
        </button>
        <button 
          className={`tab-btn ${activeTab === "utilization" ? "active" : ""}`}
          onClick={() => setActiveTab("utilization")}
        >
          📊 EMS Service Utilization
        </button>
      </div>

      {/* Active Tab Panel Body */}
      {activeTab === "planning" ? (
        /* Tab 1: Committed Performance Targets (PS016.2) */
        <div className="commitments-grid">
          {activeServices.map(service => {
            // Find linked KPIs and targets
            const serviceKPIs = kpis.filter(k => k.service_id === service.id);
            
            return (
              <div key={service.id} className="commitment-card">
                <div>
                  <h4 className="comm-header-title">{service.name}</h4>
                  <div className="comm-meta-row">
                    <span className={`class-badge ${service.classification.toLowerCase().replace(" ", "-")}`}>
                      {service.classification}
                    </span>
                    <span className="comm-unit-label">{service.responsibleUnit}</span>
                  </div>
                </div>
                
                <div className="comm-kpis-list">
                  {serviceKPIs.length > 0 ? (
                    serviceKPIs.map(kpi => (
                      <div key={kpi.id} className="comm-kpi-item">
                        <span className="comm-kpi-name">{kpi.name}</span>
                        <span className="comm-kpi-target">{kpi.target_value}{kpi.unit}</span>
                      </div>
                    ))
                  ) : (
                    <div className="comm-kpi-item" style={{ color: "#64748B", fontSize: "11.5px", fontStyle: "italic" }}>
                      No specific KPI definitions linked.
                    </div>
                  )}
                  {/* Default SLA target indicator */}
                  <div className="comm-kpi-item" style={{ borderTop: "1px dashed #F1F5F9", paddingTop: 8, marginTop: 4 }}>
                    <span className="comm-kpi-name" style={{ fontSize: "11.5px", color: "#94A3B8" }}>Citizen's Charter SLA</span>
                    <span className="comm-kpi-target" style={{ fontSize: "11.5px", fontWeight: "600", color: "#800000" }}>{service.sla}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tab 2: EMS Service Utilization & Volumes (PS017) */
        <div className="utilization-panel">
          {/* Filters Row */}
          <div className="filter-bar">
            <div className="filter-field">
              <label>Select Evaluation Period</label>
              <select 
                value={selectedPeriod} 
                onChange={e => setSelectedPeriod(e.target.value)}
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {(p.status === "Active" || p.status === "Open") ? "(Active)" : "(Closed)"}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>Select Service Charter</label>
              <select 
                value={selectedService} 
                onChange={e => setSelectedService(e.target.value)}
              >
                <option value="all">All Service Catalogues</option>
                {activeServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Utilization overview mini summary row */}
          <div className="util-overview-grid">
            <div className="util-overview-card">
              <div className="metric-card-label" style={{ color: "#800000" }}>Total Transactions Ingested</div>
              <div className="util-overview-val">{totalVolume}</div>
              <div className="metric-card-subtext" style={{ marginTop: 4 }}>EMS Inbound Ingestions</div>
            </div>
            
            <div className="util-overview-card">
              <div className="metric-card-label" style={{ color: "#C8960C" }}>Average Compliance Rate</div>
              <div className="util-overview-val" style={{ color: "#C8960C" }}>{avgCompliance}%</div>
              <div className="metric-card-subtext" style={{ marginTop: 4 }}>Actual Graded SLA Outcome</div>
            </div>

            <div className="util-overview-card">
              <div className="metric-card-label" style={{ color: "#1E293B" }}>EMS Batch Integration Source</div>
              <div className="util-overview-val" style={{ fontSize: "18px", marginTop: 8, color: "#1E293B" }}>
                EMS Batch Integration API
              </div>
              <div className="metric-card-subtext" style={{ marginTop: 4 }}>Synced & Ingested Successfully</div>
            </div>
          </div>

          {/* Comparative Target vs Actual Chart (PS017.3 & PS017.4) */}
          <div className="chart-section">
            <h4 className="chart-header">Committed Target vs Actual Compliance Rate Comparison</h4>
            
            {filteredEMS.length > 0 ? (
              <div className="bar-chart-container">
                {filteredEMS.map(item => {
                  const service = activeServices.find(s => s.id === item.serviceId) || { name: "Unknown Service" };
                  
                  // Find committed target for the service. Default is 95% if not defined.
                  const kpi = kpis.find(k => k.service_id === item.serviceId && k.name.includes("SLA"));
                  const targetVal = kpi ? kpi.target_value : 95;

                  return (
                    <div key={item.serviceId} className="bar-chart-row">
                      <div className="chart-row-label">{service.name}</div>
                      
                      <div className="chart-bars-wrap">
                        {/* Target Bar */}
                        <div className="bar-wrapper">
                          <span className="bar-inner-label">Target Goal:</span>
                          <div className="bar-outer-track">
                            <div className="bar-fill-indicator target" style={{ width: `${targetVal}%` }} />
                          </div>
                          <span className="bar-val-text">{targetVal}%</span>
                        </div>

                        {/* Actual Bar */}
                        <div className="bar-wrapper">
                          <span className="bar-inner-label">EMS Actual:</span>
                          <div className="bar-outer-track">
                            <div className="bar-fill-indicator actual" style={{ width: `${item.compliance}%` }} />
                          </div>
                          <span className="bar-val-text" style={{ color: "#800000" }}>{item.compliance}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#64748B", padding: "40px 10px", border: "1.5px dashed #E2E8F0", borderRadius: "12px", fontStyle: "italic", background: "#F8FAFC" }}>
                No batch utilization transactions imported for this configuration.
              </div>
            )}
          </div>

          {/* Registry Table view (PS017.3) */}
          <h4 className="chart-header">EMS Ingested Transaction Registry</h4>
          <div className="util-table-wrap">
            <table className="util-data-table">
              <thead>
                <tr>
                  <th>Service Charter</th>
                  <th>Total Ingested</th>
                  <th>Committed SLA Target</th>
                  <th>EMS Compliance Rate</th>
                  <th>Average Processing</th>
                  <th>Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEMS.length > 0 ? (
                  filteredEMS.map(item => {
                    const service = activeServices.find(s => s.id === item.serviceId) || { name: "Unknown" };
                    const kpi = kpis.find(k => k.service_id === item.serviceId && k.name.includes("SLA"));
                    const targetVal = kpi ? kpi.target_value : 95;
                    
                    // Determine compliance status
                    let statusLabel = "Compliant";
                    let statusClass = "compliant";
                    if (item.compliance < 80) {
                      statusLabel = "Non-Compliant";
                      statusClass = "non-compliant";
                    } else if (item.compliance < targetVal) {
                      statusLabel = "Warning";
                      statusClass = "warning";
                    }

                    return (
                      <tr key={item.serviceId}>
                        <td style={{ fontWeight: "700", color: "#0F172A" }}>{service.name}</td>
                        <td style={{ fontWeight: "600", fontFamily: "monospace" }}>{item.volume} trans</td>
                        <td style={{ fontWeight: "600", color: "#475569" }}>{targetVal}%</td>
                        <td style={{ fontWeight: "800", color: "#800000" }}>{item.compliance}%</td>
                        <td style={{ color: "#64748B", fontWeight: "500" }}>{item.avgDuration}</td>
                        <td>
                          <span className={`tag-pill-status ${statusClass}`}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "#64748B", padding: "24px 0" }}>
                      No transaction records matched the selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
