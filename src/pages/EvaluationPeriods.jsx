import { useState } from "react";
import { INITIAL_PERIODS } from "../constants/sprint2Mock";

export default function EvaluationPeriods() {
  const [periods, setPeriods] = useState(INITIAL_PERIODS);
  const [showAdd, setShowAdd] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(null);

  // Add Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("Semestral");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeState, setActiveState] = useState(true);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleOpenAdd = () => {
    setName("");
    setType("Semestral");
    setStartDate("");
    setEndDate("");
    setActiveState(true);
    setShowAdd(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      triggerToast("Period name, start, and end dates are required!", "error");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      triggerToast("Start date cannot be after end date!", "error");
      return;
    }

    // Strictly enforce single active period database constraint
    const activeExists = periods.some(p => p.status === "Active");
    if (activeState && activeExists) {
      triggerToast("Unique Constraint Violation: Only one Active evaluation period is allowed at a time!", "error");
      return;
    }

    const newPeriod = {
      id: Date.now(),
      name,
      type,
      start_date: startDate,
      end_date: endDate,
      status: activeState ? "Active" : "Closed"
    };

    setPeriods(prev => [newPeriod, ...prev].sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
    triggerToast("Evaluation period created successfully!", "success");
    setShowAdd(false);
  };

  const handleCloseConfirm = () => {
    if (!closingPeriod) return;
    setPeriods(prev => prev.map(p => p.id === closingPeriod.id ? { ...p, status: "Closed" } : p));
    triggerToast(`Evaluation period "${closingPeriod.name}" is now closed.`, "success");
    setClosingPeriod(null);
  };

  const handleDelete = (period, e) => {
    e.stopPropagation();
    // Simulate DB Conflict (409) if deleting a period with existing commitments
    if (period.status === "Active" || period.id === 1) {
      triggerToast("Conflict (409): Cannot delete period with existing linked commitments & KPI records!", "error");
      return;
    }
    setPeriods(prev => prev.filter(p => p.id !== period.id));
    triggerToast("Evaluation period deleted successfully.", "success");
  };

  // Metrics
  const statActive = periods.find(p => p.status === "Active")?.name || "None Active";
  const statClosed = periods.filter(p => p.status === "Closed").length;
  const statTotal = periods.length;

  return (
    <div className="evaluation-periods-container">
      {/* Styles Block */}
      <style dangerouslySetInnerHTML={{ __html: `
        .evaluation-periods-container {
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

        /* Metrics */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          padding: 20px;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
        }
        .metric-label {
          font-size: 10px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1E293B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .metric-subtext {
          font-size: 12px;
          color: #64748B;
        }
        .metric-indicator-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        /* Card Section Header */
        .periods-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 24px 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .periods-title-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 20px 0;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 12px;
        }
        .periods-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        /* Action buttons */
        .action-add-btn {
          padding: 8px 16px;
          font-size: 12.5px;
          font-weight: 600;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(128, 0, 0, 0.15);
        }
        .action-add-btn:hover {
          background: #990000;
        }

        /* Table */
        .premium-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .premium-data-table th {
          padding: 14px 18px;
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
        }
        .premium-data-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 13px;
          color: #334155;
        }
        .premium-data-table tr:hover {
          background: #F8FAFC;
        }

        /* Badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
        }
        .status-badge.active {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.15);
        }
        .status-badge.closed {
          background: #F1F5F9;
          color: #64748B;
          border: 1px solid rgba(100, 116, 139, 0.1);
        }

        .type-tag-pill {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .action-button-group {
          display: flex;
          gap: 6px;
          justify-content: center;
        }
        .action-table-btn {
          background: #ffffff;
          border: 1px solid #CBD5E1;
          color: #475569;
          font-weight: 600;
          font-size: 11.5px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .action-table-btn:hover {
          background: #F8FAFC;
        }
        .action-table-btn.close-btn:hover {
          border-color: #D97706;
          color: #D97706;
          background: #FFFBEB;
        }
        .action-table-btn.delete-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
          background: #FEF2F2;
        }

        /* Modal Overlays */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          backdrop-filter: blur(2px);
        }
        .form-modal-card {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 440px;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          box-sizing: border-box;
          animation: slideUpModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-title-text {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 24px;
          font-weight: 500;
          color: #0F172A;
          margin-bottom: 24px;
        }
        .field-group {
          margin-bottom: 16px;
        }
        .modal-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
          display: block;
        }
        .modal-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          color: #1E293B;
          box-sizing: border-box;
        }
        .modal-input:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }

        .btn-cancel-ghost {
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-cancel-ghost:hover {
          background: #F8FAFC;
        }
        .btn-save-maroon {
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-save-maroon:hover {
          background: #990000;
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
          Home / <span>Evaluation Periods</span>
        </div>
        <div className="period-pill">
          Jan — Jun 2026 Period
        </div>
      </div>
      <h1 className="page-title">Evaluation Periods CRUD</h1>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Current Active Period</span>
          <span className="metric-value" title={statActive}>{statActive}</span>
          <span className="metric-subtext">Active constraints</span>
          <span className="metric-indicator-bar" style={{ background: "#10B981" }} />
        </div>
        <div className="metric-card">
          <span className="metric-label">Total periods defined</span>
          <span className="metric-value">{statTotal}</span>
          <span className="metric-subtext">All periods defined</span>
          <span className="metric-indicator-bar" style={{ background: "#800000" }} />
        </div>
        <div className="metric-card">
          <span className="metric-label">Closed periods</span>
          <span className="metric-value">{statClosed}</span>
          <span className="metric-subtext">Historical standard reviews</span>
          <span className="metric-indicator-bar" style={{ background: "#94A3B8" }} />
        </div>
      </div>

      {/* Periods Table Card */}
      <div className="periods-card">
        <div className="periods-title-flex">
          <h3 className="periods-card-title">Schedule Registry</h3>
          <button className="action-add-btn" onClick={handleOpenAdd}>
            Create Evaluation Period
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="premium-data-table">
            <thead>
              <tr>
                <th>PERIOD NAME</th>
                <th>CYCLE TYPE</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "center", width: "200px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {periods.map(p => {
                const startFmt = new Date(p.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const endFmt = new Date(p.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const isActive = p.status === "Active";
                
                return (
                  <tr key={p.id} style={{ opacity: isActive ? 1 : 0.7 }}>
                    <td style={{ fontWeight: 700, color: "#1E293B" }}>{p.name}</td>
                    <td>
                      <span className="type-tag-pill">{p.type}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{startFmt}</td>
                    <td style={{ fontWeight: 500 }}>{endFmt}</td>
                    <td>
                      <span className={`status-badge ${p.status.toLowerCase()}`}>
                        <span style={{ 
                          width: 6, height: 6, borderRadius: "50%", 
                          background: isActive ? "#10B981" : "#94A3B8", 
                          display: "inline-block", marginRight: 6 
                        }} />
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="action-button-group">
                        {isActive ? (
                          <button 
                            className="action-table-btn close-btn" 
                            onClick={() => setClosingPeriod(p)}
                            title="Close evaluation period"
                          >
                            Close Period
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", padding: "5px 8px" }}>
                            Completed
                          </span>
                        )}
                        <button 
                          className="action-table-btn delete-btn" 
                          onClick={(e) => handleDelete(p, e)}
                          title="Delete Period"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Period Modal Dialog */}
      {showAdd && (
        <div className="modal-overlay">
          <form className="form-modal-card" onSubmit={handleSave}>
            <h3 className="modal-title-text">Create Evaluation Period</h3>

            {/* Period Name */}
            <div className="field-group">
              <label className="modal-label">Period Name *</label>
              <input
                placeholder="e.g. 1st Semester AY 2026-2027"
                required
                value={name}
                className="modal-input"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Type selector */}
            <div className="field-group">
              <label className="modal-label">Evaluation Cycle Type *</label>
              <select
                className="custom-filter-dropdown"
                style={{ width: "100%" }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Quarterly">Quarterly Review Cycle</option>
                <option value="Semestral">Semestral Academic Cycle</option>
                <option value="Annual">Annual Review Cycle</option>
              </select>
            </div>

            {/* Date Range grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="field-group">
              <div>
                <label className="modal-label">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  className="modal-input"
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="modal-label">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  className="modal-input"
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Active Switch Toggle state */}
            <div className="field-group" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
              <input 
                type="checkbox"
                id="is-active-check"
                checked={activeState}
                style={{ width: "18px", height: "18px", accentColor: "#800000", cursor: "pointer" }}
                onChange={() => setActiveState(p => !p)}
              />
              <label htmlFor="is-active-check" style={{ fontSize: "12.5px", fontWeight: "700", color: "#475569", cursor: "pointer" }}>
                SET STATUS AS ACTIVE
              </label>
            </div>
            
            <p style={{ margin: "4px 0 20px 0", fontSize: "11px", color: "#64748B", lineHeight: "1.4" }}>
              Only one evaluation period can be active at a time per office profile to maintain unique data consistency.
            </p>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button 
                type="button" 
                className="btn-cancel-ghost" 
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save-maroon">
                Create Period
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close Period Confirmation Modal */}
      {closingPeriod && (
        <div className="modal-overlay">
          <div className="form-modal-card" style={{ maxWidth: 420 }}>
            <h3 className="modal-title-text" style={{ fontSize: "20px", marginBottom: 14 }}>Close Period?</h3>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#475569", margin: "0 0 24px 0" }}>
              Are you sure you want to close the evaluation period <strong style={{ color: "#800000" }}>"{closingPeriod.name}"</strong>? 
              <br /><br />
              Closing an evaluation period is permanent. All associated commitments, scores, and performance appraisals for this period will be archived and locked from active updates.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button 
                className="btn-cancel-ghost" 
                onClick={() => setClosingPeriod(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-save-maroon" 
                style={{ background: "#D97706" }} 
                onClick={handleCloseConfirm}
              >
                Yes, Close Period
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
