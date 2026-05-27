import { useState, useEffect } from "react";
import { api } from "../services/api";
import PageHeader from "../components/PageHeader";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SLAConfiguration() {
  const [workingDays, setWorkingDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [warnThreshold, setWarnThreshold] = useState(80);
  const [overdueThreshold, setOverdueThreshold] = useState(95);

  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [activeRuleId, setActiveRuleId] = useState(null);
  const [activePeriodName, setActivePeriodName] = useState("Jan — Jun 2026 Period");
  const [history, setHistory] = useState([]);

  const triggerToast = (message, kind = "success") => {
    setToast({ show: true, message, type: kind });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const formatDaysList = (type, config) => {
    if (type === "WEEKDAYS") return "Mon-Fri";
    if (type === "MONDAY_TO_SATURDAY") return "Mon-Sat";
    if (type === "CUSTOM" && Array.isArray(config)) {
      const activeDays = config.filter(c => c.is_working).map(c => c.day.slice(0, 3));
      return activeDays.join(", ");
    }
    return "Mon-Fri";
  };

  const format12Hour = (timeStr) => {
    if (!timeStr) return "08:00 AM";
    const [h, m] = timeStr.split(":");
    const hrs = parseInt(h);
    const ampm = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 || 12;
    return `${displayHrs.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const loadData = async () => {
    try {
      // 1. Fetch periods to display active period name
      const periodsRes = await api.getPeriods();
      if (periodsRes?.data) {
        const active = periodsRes.data.find(p => p.status === "Active" || p.status === "Open");
        if (active) {
          setActivePeriodName(active.name);
        }
      }

      // 2. Fetch active rules & versions
      const res = await api.getSlaRules();
      if (res && res.length > 0) {
        // The first rule returned is typically the active one
        const activeRule = res.find(r => r.is_active === true) || res[0];
        if (activeRule) {
          setActiveRuleId(activeRule.id);
          setWarnThreshold(activeRule.warn_threshold_pct);
          setOverdueThreshold(activeRule.overdue_threshold_pct);
          setStartTime(activeRule.work_start_time.slice(0, 5));
          setEndTime(activeRule.work_end_time.slice(0, 5));

          // Map work schedule type to workingDays list
          if (activeRule.work_schedule_type === "WEEKDAYS") {
            setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
          } else if (activeRule.work_schedule_type === "MONDAY_TO_SATURDAY") {
            setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
          } else if (activeRule.work_schedule_type === "CUSTOM" && Array.isArray(activeRule.work_schedule_config)) {
            const activeDays = activeRule.work_schedule_config.filter(c => c.is_working).map(c => c.day);
            setWorkingDays(activeDays);
          }

          // Build History registry
          const list = [];
          list.push({
            id: activeRule.id,
            timestamp: new Date(activeRule.updated_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            }),
            actor: activeRule.created_by || "System Admin",
            working_days: formatDaysList(activeRule.work_schedule_type, activeRule.work_schedule_config),
            working_hours: `${format12Hour(activeRule.work_start_time)} - ${format12Hour(activeRule.work_end_time)}`,
            warn_threshold: `${activeRule.warn_threshold_pct}%`,
            overdue_threshold: `${activeRule.overdue_threshold_pct}%`,
            is_active_rule: true
          });

          // Add past versions
          if (Array.isArray(activeRule.versions)) {
            const sortedVersions = [...activeRule.versions].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
            sortedVersions.forEach(v => {
              list.push({
                id: v.id,
                timestamp: new Date(v.changed_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                }),
                actor: v.changed_by || "Subsystem Admin",
                working_days: formatDaysList(v.work_schedule_type, v.work_schedule_config),
                working_hours: `${format12Hour(v.work_start_time)} - ${format12Hour(v.work_end_time)}`,
                warn_threshold: `${v.warn_threshold_pct}%`,
                overdue_threshold: `${v.overdue_threshold_pct}%`,
                is_active_rule: false
              });
            });
          }
          setHistory(list);
        }
      }
    } catch (err) {
      console.error("Failed to load SLA configuration details:", err);
      triggerToast("Error connecting to backend database.", "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWarnChange = (val) => {
    if (val >= overdueThreshold) {
      setWarnThreshold(overdueThreshold - 5);
    } else {
      setWarnThreshold(val);
    }
  };

  const handleOverdueChange = (val) => {
    setOverdueThreshold(val);
    if (warnThreshold >= val) {
      setWarnThreshold(val - 5);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (workingDays.length === 0) {
      triggerToast("Please select at least one working day.", "error");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);

    const isWeekdays = workingDays.length === 5 &&
      workingDays.includes("Monday") &&
      workingDays.includes("Tuesday") &&
      workingDays.includes("Wednesday") &&
      workingDays.includes("Thursday") &&
      workingDays.includes("Friday");

    const isMonToSat = workingDays.length === 6 &&
      workingDays.includes("Monday") &&
      workingDays.includes("Tuesday") &&
      workingDays.includes("Wednesday") &&
      workingDays.includes("Thursday") &&
      workingDays.includes("Friday") &&
      workingDays.includes("Saturday");

    let scheduleType = "CUSTOM";
    let scheduleConfig = null;
    if (isWeekdays) {
      scheduleType = "WEEKDAYS";
    } else if (isMonToSat) {
      scheduleType = "MONDAY_TO_SATURDAY";
    } else {
      scheduleType = "CUSTOM";
      scheduleConfig = DAYS_OF_WEEK.map(day => ({
        day,
        is_working: workingDays.includes(day),
        start: startTime.slice(0, 5),
        end: endTime.slice(0, 5)
      }));
    }

    const payload = {
      work_schedule_type: scheduleType,
      work_schedule_config: scheduleConfig,
      work_start_time: startTime.slice(0, 5),
      work_end_time: endTime.slice(0, 5),
      warn_threshold_pct: parseInt(warnThreshold),
      overdue_threshold_pct: parseInt(overdueThreshold)
    };

    try {
      if (activeRuleId) {
        await api.updateSlaRule(activeRuleId, payload);
      } else {
        await api.createSlaRule(payload);
      }
      triggerToast("SLA Compliance Rules updated and new version saved successfully!", "success");
      await loadData();
    } catch (err) {
      console.error("Failed to save SLA configuration:", err);
      triggerToast(err.message || "Failed to update SLA Rules.", "error");
    }
  };

  const toggleDay = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="sla-rules-container">
      {/* Dynamic Styling Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .sla-rules-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: var(--font-ui), sans-serif;
          background: #F8FAFC;
          min-height: 100vh;
        }

        .sla-dashboard-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 32px;
          margin-top: 8px;
        }
        @media (max-width: 900px) {
          .sla-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .config-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .config-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 24px 0;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 12px;
        }

        .field-group {
          margin-bottom: 24px;
        }
        .field-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: block;
        }

        /* Checkbox list styling */
        .checkbox-flex-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .day-check-badge {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1.5px solid #CBD5E1;
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          user-select: none;
          transition: all 0.15s ease;
          background: #ffffff;
        }
        .day-check-badge:hover {
          border-color: #800000;
          color: #800000;
        }
        .day-check-badge.selected {
          background: #800000;
          border-color: #800000;
          color: #ffffff;
        }

        /* Custom Input fields */
        .time-picker-flex {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .custom-time-input {
          padding: 10px 14px;
          font-size: 13.5px;
          font-weight: 600;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          outline: none;
          color: #1E293B;
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
        }
        .custom-time-input:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }

        /* Slider Controls */
        .slider-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .slider-bar-input {
          flex: 1;
          height: 6px;
          background: #E2E8F0;
          border-radius: 99px;
          outline: none;
          accent-color: #800000;
          cursor: pointer;
        }
        .slider-value-badge {
          width: 48px;
          padding: 4px 0;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: #800000;
          background: #FEF2F2;
          border: 1px solid rgba(128, 0, 0, 0.15);
          border-radius: 6px;
        }

        /* Submit Button */
        .btn-submit-maroon {
          padding: 11px 24px;
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(128, 0, 0, 0.15);
          transition: all 0.15s ease;
        }
        .btn-submit-maroon:hover {
          background: #990000;
          transform: translateY(-1px);
        }
        .save-disclaimer {
          font-size: 11px;
          color: #94A3B8;
          line-height: 1.4;
          margin-top: 14px;
        }

        /* Sidebar Audit Log & Version History */
        .history-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }
        .history-title-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 12px;
        }
        .history-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .version-count-badge {
          background: #F1F5F9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 99px;
        }

        /* Audit Timeline */
        .timeline-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }
        .timeline-line {
          position: absolute;
          left: 7px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: #E2E8F0;
        }
        .timeline-item {
          display: flex;
          gap: 16px;
          position: relative;
        }
        .timeline-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #CBD5E1;
          box-sizing: border-box;
          z-index: 2;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .timeline-item.active .timeline-indicator {
          border-color: #10B981;
          background: #10B981;
        }
        .timeline-item.active .version-label-active {
          display: inline-flex;
        }
        
        .timeline-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .timeline-timestamp {
          font-size: 12px;
          font-weight: 700;
          color: #1E293B;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .version-label-active {
          display: none;
          background: #E6F4EA;
          color: #137333;
          font-size: 9.5px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .timeline-author {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
        }
        .timeline-summary-grid {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
          margin-top: 6px;
        }
        .summary-label {
          color: #64748B;
          font-weight: 500;
        }
        .summary-value {
          color: #334155;
          font-weight: 700;
          text-align: right;
        }

        /* Modal overlay */
        .confirm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          backdrop-filter: blur(1.5px);
        }
        .confirm-modal-card {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 420px;
          padding: 30px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
          animation: hcDeletePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .confirm-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin: 0 0 14px;
        }
        .confirm-modal-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: #475569;
          margin: 0 0 24px;
        }
        .confirm-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Toast banner */
        .toast-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #ffffff;
          border-left: 4px solid #10B981;
          border-radius: 6px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2000;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-banner.error {
          border-left-color: #EF4444;
        }
        .toast-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #ffffff;
          flex-shrink: 0;
        }
        .toast-icon.success { background: #10B981; }
        .toast-icon.error { background: #EF4444; }
      ` }} />

      {/* Top Header Row using dynamic PageHeader */}
      <PageHeader breadcrumb="SLA Rules" title="Service Level Agreement" />

      <div className="sla-dashboard-grid">
        {/* Left Form Panel */}
        <form className="config-card" onSubmit={handleSave}>
          <h3 className="config-title">SLA Compliance Rules Configuration</h3>

          {/* Working Days Select */}
          <div className="field-group">
            <span className="field-label">Working Days (Calendar Schedule) *</span>
            <div className="checkbox-flex-row">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = workingDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`day-check-badge ${isSelected ? "selected" : ""}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time pickers row */}
          <div className="field-group time-picker-flex">
            <div>
              <span className="field-label">Daily Shift Time Start *</span>
              <input
                type="time"
                required
                value={startTime}
                className="custom-time-input"
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <span className="field-label">Daily Shift Time End *</span>
              <input
                type="time"
                required
                value={endTime}
                className="custom-time-input"
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Warning Threshold slider */}
          <div className="field-group">
            <span className="field-label">Warning Alert Threshold Percentage *</span>
            <div className="slider-wrapper">
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={warnThreshold}
                className="slider-bar-input"
                onChange={(e) => handleWarnChange(parseInt(e.target.value))}
              />
              <div className="slider-value-badge">{warnThreshold}%</div>
            </div>
          </div>

          {/* Overdue Threshold slider */}
          <div className="field-group">
            <span className="field-label">Overdue Escalation Threshold Percentage *</span>
            <div className="slider-wrapper">
              <input
                type="range"
                min="95"
                max="100"
                step="1"
                value={overdueThreshold}
                className="slider-bar-input"
                onChange={(e) => handleOverdueChange(parseInt(e.target.value))}
              />
              <div className="slider-value-badge">{overdueThreshold}%</div>
            </div>
          </div>

          {/* Save Action Row - Floated Right like Local */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button type="submit" className="btn-submit-maroon">
              Save &amp; Publish SLA Rules Version
            </button>
          </div>

          {/* Disclaimer note below the save button */}
          <div className="save-disclaimer">
            * Note: Changes will instantly register in the backend database. Creating a new version maintains audit logs that strictly conform to local agency Citizens' Charters.
          </div>
        </form>

        {/* Right Audit Log / Timeline Panel */}
        <div className="history-card">
          <div className="history-title-flex">
            <h3 className="history-card-title">Version History Registry</h3>
            <span className="version-count-badge">{history.length} records</span>
          </div>

          {history.length > 0 ? (
            <div className="timeline-wrapper">
              <div className="timeline-line" />
              {history.map(item => (
                <div key={item.id} className={`timeline-item ${item.is_active_rule ? "active" : ""}`}>
                  <div className="timeline-indicator" />
                  <div className="timeline-details">
                    <div className="timeline-timestamp">
                      {item.timestamp}
                      <span className="version-label-active">Active</span>
                    </div>
                    <div className="timeline-author">Authorized Author: {item.actor}</div>
                    
                    <div className="timeline-summary-grid">
                      <span className="summary-label">Working Days:</span>
                      <span className="summary-value">{item.working_days}</span>
                      <span className="summary-label">Daily Shift:</span>
                      <span className="summary-value">{item.working_hours}</span>
                      <span className="summary-label">Warning Trigger:</span>
                      <span className="summary-value" style={{ color: "#D97706" }}>{item.warn_threshold}</span>
                      <span className="summary-label">Overdue Escalation:</span>
                      <span className="summary-value" style={{ color: "#800000" }}>{item.overdue_threshold}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "#94A3B8", fontStyle: "italic", fontSize: "13px" }}>
              No audit logs captured for the active evaluation period.
            </div>
          )}
        </div>
      </div>

      {/* Save Confirmation Modal Popup */}
      {showConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card" style={{ maxWidth: "520px", padding: "24px" }}>
            
            {/* Header Flex */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}>
              {/* Warning Icon Box */}
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "#FFF7ED",
                border: "1px solid #FFEDD5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EA580C",
                flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <div style={{ flex: 1 }}>
                <h3 className="confirm-modal-title" style={{ fontSize: "19px", fontWeight: "700", color: "#1E293B", margin: "0 0 4px 0" }}>
                  Confirm SLA Rule Update
                </h3>
                <div style={{ fontSize: "12.5px", color: "#94A3B8", fontWeight: "500" }}>
                  This action will publish a new configuration version
                </div>
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: "1px", background: "#F1F5F9", width: "100%", margin: "0 0 20px 0" }} />

            {/* Body Description */}
            <p className="confirm-modal-desc" style={{ fontSize: "14.5px", lineHeight: "1.6", color: "#475569", margin: "0 0 20px 0" }}>
              You are about to <span style={{ color: "#0F172A", fontWeight: "700" }}>save and publish a new version</span> of the SLA compliance rules. The updated settings will apply to <span style={{ color: "#0F172A", fontWeight: "700" }}>all future SLA computations</span> only.
            </p>

            {/* Alert Box (Green check) */}
            <div style={{
              background: "#F0FDF4",
              border: "1.5px solid #BBF7D0",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              marginBottom: "24px"
            }}>
              {/* Green check icon */}
              <div style={{ color: "#15803D", marginTop: "2px", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div style={{ fontSize: "13px", lineHeight: "1.5", color: "#166534" }}>
                Existing transactions and previously computed SLA records <span style={{ color: "#14532D", fontWeight: "700" }}>will not be affected</span>. This is a non-destructive versioned update.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="confirm-modal-footer" style={{ borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
              <button 
                type="button"
                className="btn-cancel-ghost" 
                style={{ padding: "10px 24px", fontSize: "13px", fontWeight: "600", color: "#475569", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#ffffff", cursor: "pointer" }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn-save-maroon" 
                style={{ padding: "10px 24px", fontSize: "13px", fontWeight: "600", color: "#ffffff", borderRadius: "8px", background: "#800000", border: "none", cursor: "pointer", boxShadow: "0 2px 4px rgba(128, 0, 0, 0.15)" }}
                onClick={handleConfirmSave}
              >
                Yes, Publish New Version
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification banner */}
      {toast.show && (
        <div className={`toast-banner ${toast.type}`}>
          <div className={`toast-icon ${toast.type}`}>
            {toast.type === "success" ? "✔" : "✖"}
          </div>
          <div>{toast.message}</div>
        </div>
      )}
    </div>
  );
}
