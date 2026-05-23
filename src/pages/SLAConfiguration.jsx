import { useState } from "react";
import { INITIAL_SLA_RULE, INITIAL_SLA_HISTORY } from "../constants/sprint2Mock";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SLAConfiguration() {
  const [workingDays, setWorkingDays] = useState(INITIAL_SLA_RULE.working_days);
  const [startTime, setStartTime] = useState(INITIAL_SLA_RULE.work_start_time);
  const [endTime, setEndTime] = useState(INITIAL_SLA_RULE.work_end_time);
  const [warnThreshold, setWarnThreshold] = useState(INITIAL_SLA_RULE.warn_threshold_pct);
  const [overdueThreshold, setOverdueThreshold] = useState(INITIAL_SLA_RULE.overdue_threshold_pct);

  const [history, setHistory] = useState(INITIAL_SLA_HISTORY);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showConfirm, setShowConfirm] = useState(false);

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleDayToggle = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Called when form submits — validate first then open confirm modal
  const handleSave = (e) => {
    e.preventDefault();

    if (workingDays.length === 0) {
      triggerToast("You must select at least one active working day!", "error");
      return;
    }

    if (!startTime || !endTime) {
      triggerToast("Working hours start and end times must be defined!", "error");
      return;
    }

    // Open confirmation modal instead of saving immediately
    setShowConfirm(true);
  };

  // Called when user confirms inside the modal
  const handleConfirmSave = () => {
    setShowConfirm(false);

    // Format audit history values
    const today = new Date();
    const formattedTime = today.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    // Helper to format days list
    let daysString = "";
    if (workingDays.length === 7) {
      daysString = "Mon-Sun";
    } else if (workingDays.length === 5 && !workingDays.includes("Saturday") && !workingDays.includes("Sunday")) {
      daysString = "Mon-Fri";
    } else {
      daysString = workingDays.map(d => d.slice(0, 3)).join(", ");
    }

    // Helper to format time from HH:MM to 12-hour
    const format12Hour = (timeStr) => {
      const [h, m] = timeStr.split(":");
      const hrs = parseInt(h);
      const ampm = hrs >= 12 ? "PM" : "AM";
      const displayHrs = hrs % 12 || 12;
      return `${displayHrs.toString().padStart(2, "0")}:${m} ${ampm}`;
    };

    const newHistoryEntry = {
      id: Date.now(),
      timestamp: formattedTime,
      actor: "Subsystem Admin",
      working_days: daysString,
      working_hours: `${format12Hour(startTime)} - ${format12Hour(endTime)}`,
      warn_threshold: `${warnThreshold}%`,
      overdue_threshold: `${overdueThreshold}%`
    };

    setHistory(prev => [newHistoryEntry, ...prev]);
    triggerToast("SLA Compliance Rules updated and new version saved successfully!", "success");
  };

  return (
    <div className="sla-config-container">
      {/* Styles Block */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .sla-config-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: var(--font-ui), sans-serif;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* Top Header */
        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E2E8F0;
        }
        .breadcrumb-text {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }
        .breadcrumb-text span {
          color: #800000;
          font-weight: 600;
        }
        .period-pill {
          background: #FEF2F2;
          color: #800000;
          border: 1px solid rgba(128, 0, 0, 0.1);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 11px;
          font-weight: 700;
        }
        .page-title {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 34px;
          font-weight: 500;
          color: #0F172A;
          margin: 0 0 24px 0;
        }

        /* Form Configuration Layout */
        .sla-dashboard-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
        }
        @media (max-width: 1024px) {
          .sla-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .config-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 24px 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .config-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 20px 0;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 12px;
        }

        .field-group {
          margin-bottom: 24px;
        }
        .field-label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 10px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Checkbox day grid */
        .days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .day-checkbox-card {
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          background: #F8FAFC;
        }
        .day-checkbox-card.checked {
          border-color: #800000;
          background: #FFF5F5;
          color: #800000;
          font-weight: 600;
        }
        .day-checkbox-card:hover {
          border-color: #800000;
        }
        .checkbox-circle {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          background: #ffffff;
        }
        .day-checkbox-card.checked .checkbox-circle {
          border-color: #800000;
          background: #800000;
          color: #ffffff;
        }

        /* Time Pickers */
        .hours-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .time-picker-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13.5px;
          outline: none;
          color: #1E293B;
          box-sizing: border-box;
          background: #ffffff;
          font-family: inherit;
        }
        .time-picker-input:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }

        /* Sliders */
        .slider-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .slider-bar-input {
          flex: 1;
          accent-color: #800000;
          cursor: pointer;
        }
        .slider-value-badge {
          background: #FEF2F2;
          color: #800000;
          border: 1px solid rgba(128, 0, 0, 0.15);
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          min-width: 48px;
          text-align: center;
        }

        .btn-submit-maroon {
          padding: 12px 28px;
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(128, 0, 0, 0.15);
          transition: all 0.15s ease;
          width: 100%;
          margin-top: 10px;
        }
        .btn-submit-maroon:hover {
          background: #990000;
          box-shadow: 0 6px 12px rgba(128, 0, 0, 0.2);
        }

        /* Version disclaimer note */
        .save-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-top: 10px;
          padding: 9px 12px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 7px;
          font-size: 11.5px;
          color: #92400E;
          line-height: 1.5;
        }
        .save-disclaimer svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* Confirm Modal Overlay */
        .sla-confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .sla-confirm-modal {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .sla-confirm-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sla-confirm-icon {
          width: 42px;
          height: 42px;
          background: #FFF7ED;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sla-confirm-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }
        .sla-confirm-subtitle {
          font-size: 12px;
          color: #94A3B8;
          margin: 3px 0 0 0;
        }
        .sla-confirm-body {
          padding: 18px 24px;
          font-size: 13.5px;
          color: #475569;
          line-height: 1.65;
        }
        .sla-confirm-body strong {
          color: #1E293B;
        }
        .sla-confirm-notice {
          margin-top: 12px;
          padding: 10px 14px;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 8px;
          font-size: 12px;
          color: #166534;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }
        .sla-confirm-footer {
          padding: 14px 24px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #F1F5F9;
        }
        .sla-btn-cancel {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          color: #64748B;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.12s;
        }
        .sla-btn-cancel:hover { background: #F8FAFC; }
        .sla-btn-confirm {
          background: #800000;
          border: none;
          color: #ffffff;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(128,0,0,0.25);
          transition: background 0.12s, box-shadow 0.12s;
        }
        .sla-btn-confirm:hover {
          background: #990000;
          box-shadow: 0 4px 12px rgba(128,0,0,0.3);
        }

        /* Version History Table */
        .history-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 24px 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .history-table th {
          padding: 12px 16px;
          font-size: 10.5px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
        }
        .history-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 12.5px;
          color: #475569;
        }
        .history-table tr:hover {
          background: #F8FAFC;
        }

        /* Toast Notification Banner */
        .toast-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #ffffff;
          border-left: 4px solid #10B981;
          border-radius: 6px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2000;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 380px;
          border-top: 1px solid #E2E8F0;
          border-right: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .toast-banner.success {
          border-left-color: #10B981;
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
        .toast-icon.success {
          background: #10B981;
        }
        .toast-icon.error {
          background: #EF4444;
        }
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      ` }} />

      {/* Top Header Row with Breadcrumb */}
      <div className="page-header-row">
        <div className="breadcrumb-text">
          Home / <span>SLA Rules</span>
        </div>
        <div className="period-pill">
          Jan — Jun 2026 Period
        </div>
      </div>
      <h1 className="page-title">Service Level Agreement </h1>

      <div className="sla-dashboard-grid">
        {/* Left Form Panel */}
        <form className="config-card" onSubmit={handleSave}>
          <h3 className="config-card-title">Calendar & Hours Definition</h3>

          {/* Working Days Checkboxes */}
          <div className="field-group">
            <label className="field-label">Official Office Working Days</label>
            <div className="days-grid">
              {DAYS_OF_WEEK.map(day => {
                const checked = workingDays.includes(day);
                return (
                  <div
                    key={day}
                    className={`day-checkbox-card ${checked ? "checked" : ""}`}
                    onClick={() => handleDayToggle(day)}
                  >
                    <div className="checkbox-circle">
                      {checked && "✓"}
                    </div>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Working Hours Time Pickers */}
          <div className="field-group hours-row">
            <div>
              <label className="field-label">Work Shift Start Time</label>
              <input
                type="time"
                value={startTime}
                className="time-picker-input"
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Work Shift End Time</label>
              <input
                type="time"
                value={endTime}
                className="time-picker-input"
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Compliance Threshold Warning */}
          <div className="field-group">
            <label className="field-label">SLA Warn Compliance Threshold (%)</label>
            <div className="slider-wrapper">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={warnThreshold}
                className="slider-bar-input"
                onChange={(e) => setWarnThreshold(parseInt(e.target.value))}
              />
              <div className="slider-value-badge">{warnThreshold}%</div>
            </div>
          </div>

          {/* Overdue Threshold */}
          <div className="field-group">
            <label className="field-label">SLA Overdue Violation Mark (%)</label>
            <div className="slider-wrapper">
              <input
                type="range"
                min="100"
                max="150"
                step="10"
                value={overdueThreshold}
                className="slider-bar-input"
                onChange={(e) => setOverdueThreshold(parseInt(e.target.value))}
              />
              <div className="slider-value-badge">{overdueThreshold}%</div>
            </div>
          </div>

          <button type="submit" className="btn-submit-maroon">
            Save &amp; Publish SLA Rules Version
          </button>

          {/* Disclaimer note below the save button */}
          <div className="save-disclaimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Saving creates a <strong>new version</strong> of the SLA rules. This will <strong>not affect</strong> existing transactions or past SLA computations — only future SLA processing will follow the updated configuration.
            </span>
          </div>
        </form>

        {/* Right Info Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="config-card" style={{ background: "#FFFBEB", borderColor: "#F59E0B" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#B45309", fontSize: "14px", fontWeight: "700" }}>SLA Processing Notes</h4>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "#78350F" }}>
              These configurations form the calendar definitions for the <strong>Centralized SLA Computation Engine</strong>.
              <br /><br />
              All SLA computations will automatically exclude holidays and calendar days outside your defined working hours shift. Updating these values publishes a official version record.
            </p>
          </div>

          <div className="config-card">
            <h4 style={{ margin: "0 0 12px 0", color: "#1E293B", fontSize: "14px", fontWeight: "700" }}>Active Configuration Profile</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Days:</span>
                <span style={{ fontWeight: 600, color: "#334155" }}>{workingDays.length} Days Defined</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Hours:</span>
                <span style={{ fontWeight: 600, color: "#334155" }}>{startTime} - {endTime}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Alert Threshold:</span>
                <span style={{ fontWeight: 600, color: "#DC2626" }}>{warnThreshold}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Version Audit History Card */}
      <div className="history-card">
        <h3 className="config-card-title">SLA Target & Rules Version History</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>VERSION ID</th>
                <th>PUBLISHED TIMESTAMP</th>
                <th>CHANGES AUTHOR</th>
                <th>WORKING DAYS</th>
                <th>WORKING HOURS</th>
                <th>WARN COMPLIANCE</th>
                <th>OVERDUE TARGET</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, index) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 700, color: "#0F172A" }}>V{history.length - index}</td>
                  <td style={{ fontWeight: 500 }}>{h.timestamp}</td>
                  <td style={{ fontWeight: 600, color: "#800000" }}>{h.actor}</td>
                  <td>{h.working_days}</td>
                  <td>{h.working_hours}</td>
                  <td style={{ fontWeight: 700, color: "#B45309" }}>{h.warn_threshold}</td>
                  <td style={{ fontWeight: 700, color: "#DC2626" }}>{h.overdue_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="sla-confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="sla-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="sla-confirm-header">
              <div className="sla-confirm-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p className="sla-confirm-title">Confirm SLA Rule Update</p>
                <p className="sla-confirm-subtitle">This action will publish a new configuration version</p>
              </div>
            </div>

            <div className="sla-confirm-body">
              You are about to <strong>save and publish a new version</strong> of the SLA compliance rules.
              The updated settings will apply to <strong>all future SLA computations</strong> only.

              <div className="sla-confirm-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>
                  Existing transactions and previously computed SLA records <strong>will not be affected</strong>. This is a non-destructive versioned update.
                </span>
              </div>
            </div>

            <div className="sla-confirm-footer">
              <button className="sla-btn-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="sla-btn-confirm" onClick={handleConfirmSave}>
                Yes, Publish New Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Toast Alert */}
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
