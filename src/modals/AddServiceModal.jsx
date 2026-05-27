import { useState } from "react";
import Toggle from "../components/Toggle";
import { COLORS } from "../constants/colors";

export default function AddServiceModal({ onClose, onAdd, onEdit, service }) {
  const isEditing = !!service;

  // Helper to parse SLA Target to extract both days and minutes
  const parseSla = (field) => {
    if (!service || !service[field]) return { days: "", hours: "", minutes: "" };
    const val = service[field];
    const matchDays = val.match(/(\d+)\s*Day/i);
    const matchHours = val.match(/(\d+)\s*Hour/i);
    const matchMins = val.match(/(\d+)\s*Min/i) || val.match(/(\d+)\s*Minute/i);
    return {
      days: matchDays ? matchDays[1] : "",
      hours: matchHours ? matchHours[1] : "",
      minutes: matchMins ? matchMins[1] : ""
    };
  };

  const initialSla = parseSla("slaTarget");

  const [serviceName, setServiceName] = useState(service ? service.name : "");
  const [slaDays, setSlaDays] = useState(initialSla.days);
  const [slaHours, setSlaHours] = useState(initialSla.hours);
  const [slaMinutes, setSlaMinutes] = useState(initialSla.minutes);
  const [responsibleUnit, setResponsibleUnit] = useState(service && service.responsibleUnit ? service.responsibleUnit : "");
  const [stepsTimeline, setStepsTimeline] = useState(service && service.stepsTimeline ? service.stepsTimeline : "");
  const [expectedOutput, setExpectedOutput] = useState(service && service.expectedOutput ? service.expectedOutput : "");
  const [withReferral, setWithReferral] = useState(
    service && service.withReferral !== undefined
      ? (service.withReferral === true ? "with" : service.withReferral === false ? "without" : service.withReferral)
      : "with"
  );
  const [active, setActive] = useState(service ? service.active : true);
  
  const [showSlaWarning, setShowSlaWarning] = useState(false);
  const [pendingServiceData, setPendingServiceData] = useState(null);
  
  const [errors, setErrors] = useState({});

  const handleSave = () => {
    const e = {};

    const countAlphanumeric = (str) => {
      if (!str) return 0;
      return (str.match(/[a-zA-Z0-9]/g) || []).length;
    };

    if (!serviceName.trim()) {
      e.serviceName = "Official Service Name is required.";
    } else if (countAlphanumeric(serviceName) < 3) {
      e.serviceName = "Must contain at least 3 alphanumeric characters.";
    }

    if (!slaDays.trim() && !slaHours.trim() && !slaMinutes.trim()) {
      e.slaDays = true;
      e.slaMinutes = true;
    }

    if (responsibleUnit && responsibleUnit.trim() !== "" && countAlphanumeric(responsibleUnit) < 3) {
      e.responsibleUnit = "Must contain at least 3 alphanumeric characters.";
    }

    if (stepsTimeline && stepsTimeline.trim() !== "" && countAlphanumeric(stepsTimeline) < 3) {
      e.stepsTimeline = "Must contain at least 3 alphanumeric characters.";
    }

    if (expectedOutput && expectedOutput.trim() !== "" && countAlphanumeric(expectedOutput) < 3) {
      e.expectedOutput = "Must contain at least 3 alphanumeric characters.";
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    // Determine target SLA string
    let slaTarget = "";
    const daysPart = slaDays.trim() ? `${slaDays} Day${parseInt(slaDays) > 1 ? "s" : ""}` : "";
    const hoursPart = slaHours.trim() ? `${slaHours} Hour${parseInt(slaHours) > 1 ? "s" : ""}` : "";
    const minsPart = slaMinutes.trim() ? `${slaMinutes} Minute${parseInt(slaMinutes) > 1 ? "s" : ""}` : "";
    
    const timeParts = [daysPart, hoursPart, minsPart].filter(Boolean);
    slaTarget = timeParts.length > 0 ? timeParts.join(" ") : "—";

    // Smart automatic classification based on SLA target
    let classification = "Simple";
    if (slaDays.trim()) {
      const days = parseInt(slaDays);
      if (days >= 30) {
        classification = "Highly Technical";
      } else {
        classification = "Complex";
      }
    }

    // Format last updated date and time
    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let hours = today.getHours();
    const minutes = today.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    const formattedDate = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()} ${formattedTime}`;

    const targetData = {
      ...service,
      name: serviceName,
      classification,
      slaTarget,
      sla: slaTarget,
      responsibleUnit: responsibleUnit.trim() || "Registrar Office - Caloocan",
      active,
      withReferral,
      stepsTimeline,
      expectedOutput,
      lastUpdated: formattedDate,
    };

    // Intercept SLA target changes for warning confirmation (PBI PS003)
    if (isEditing && service.slaTarget !== slaTarget && !showSlaWarning) {
      setPendingServiceData(targetData);
      setShowSlaWarning(true);
      return;
    }

    if (isEditing) {
      if (onEdit) {
        onEdit(pendingServiceData || targetData);
      }
    } else {
      if (onAdd) {
        onAdd({
          serviceName,
          classification,
          slaTarget,
          responsibleUnit: responsibleUnit.trim() || "Registrar Office - Caloocan",
          active,
          withReferral,
          stepsTimeline,
          expectedOutput,
          lastUpdated: formattedDate,
        });
      }
    }

    onClose();
  };

  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: false }));
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
      backdropFilter: "blur(2px)",
    }}>
      {/* Styles Injection for Custom Radio and Switches */}
      <style dangerouslySetInnerHTML={{ __html: `
        .form-modal-card {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 92vh;
          overflow-y: auto;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          font-family: var(--font-ui), sans-serif;
          box-sizing: border-box;
          animation: slideUpModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUpModal {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-title-text {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 26px;
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
        .label-star {
          color: #EF4444;
          margin-left: 2px;
        }

        .input-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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
          transition: all 0.15s ease;
          background: #ffffff;
        }
        .modal-input::placeholder {
          color: #94A3B8;
        }
        .modal-input:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }
        .modal-input.input-error,
        .modal-textarea.input-error {
          border-color: #EF4444;
        }

        .modal-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          color: #1E293B;
          box-sizing: border-box;
          transition: all 0.15s ease;
          background: #ffffff;
          min-height: 64px;
          font-family: inherit;
          resize: vertical;
        }
        .modal-textarea::placeholder {
          color: #94A3B8;
        }
        .modal-textarea:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }

        /* Radio Options */
        .radio-option {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          margin-bottom: 12px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          user-select: none;
        }
        .custom-radio {
          width: 22px;
          height: 22px;
          border: 2px solid #CBD5E1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          background: #ffffff;
        }
        .radio-option:hover .custom-radio {
          border-color: #800000;
        }
        .radio-option.selected .custom-radio {
          border-color: #800000;
          border-width: 2px;
        }
        .radio-dot {
          width: 12px;
          height: 12px;
          background: #800000;
          border-radius: 50%;
          transform: scale(0);
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .radio-option.selected .radio-dot {
          transform: scale(1);
        }

        /* Toggle Active Switch Container */
        .toggle-active-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.05em;
        }

        /* Form Footer Section */
        .form-footer-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 26px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .footer-action-buttons {
          display: flex;
          gap: 10px;
          margin-left: auto;
        }

        .btn-cancel-ghost {
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-cancel-ghost:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .btn-save-maroon {
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 4px rgba(128, 0, 0, 0.15);
        }
        .btn-save-maroon:hover {
          background: #990000;
          box-shadow: 0 4px 8px rgba(128, 0, 0, 0.2);
        }
      ` }} />

      <div className="form-modal-card">
        {showSlaWarning ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#FFFBEB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97706",
                flexShrink: 0,
                border: "1px solid rgba(217, 119, 6, 0.15)"
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", margin: 0 }}>SLA Change Warning</h3>
            </div>

            <div style={{ fontSize: "13.5px", lineHeight: "1.65", color: "#475569", marginBottom: 24 }}>
              You are updating the SLA Target for <span style={{ fontWeight: 700, color: "#800000" }}>"{serviceName}"</span>.
              <br /><br />
              Changing the SLA Target will officially create a historical version record in the **service_versions** database table to maintain an audit trail under Citizens' Charter guidelines.
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: 28
            }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Old SLA Target</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#475569" }}>{service?.slaTarget || service?.sla || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>New SLA Target</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#800000" }}>{pendingServiceData?.slaTarget}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button 
                className="btn-cancel-ghost" 
                onClick={() => {
                  setShowSlaWarning(false);
                  setPendingServiceData(null);
                }}
              >
                Go Back &amp; Edit
              </button>
              <button 
                className="btn-save-maroon" 
                onClick={() => {
                  if (onEdit && pendingServiceData) {
                    onEdit(pendingServiceData);
                  }
                  onClose();
                }}
              >
                Confirm &amp; Save SLA
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="modal-title-text">{isEditing ? "Edit Service Catalogue" : "Create New Service Catalogue"}</h2>

            {/* Service Name Input */}
            <div className="field-group">
              <label className="modal-label">
                Official Service Name <span className="label-star">*</span>
              </label>
              <input
                placeholder="e.g. Processing of Application for Graduation"
                value={serviceName}
                className={`modal-input ${errors.serviceName ? "input-error" : ""}`}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  clearError("serviceName");
                }}
              />
              {errors.serviceName && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.serviceName}
                </div>
              )}
            </div>

            {/* SLA Dual Row */}
            <div className="field-group input-row-grid">
              <div>
                <label className="modal-label">
                  SLA TARGET (WORKING DAY) <span className="label-star">*</span>
                </label>
                 <input
                  placeholder="Days"
                  type="number"
                  min="0"
                  value={slaDays}
                  className={`modal-input ${errors.slaDays ? "input-error" : ""}`}
                  onChange={(e) => {
                    setSlaDays(e.target.value);
                    clearError("slaDays");
                    clearError("slaMinutes");
                  }}
                />
              </div>
              <div>
                <label className="modal-label">
                  SLA TARGET (HOURS &amp; MINUTES) <span className="label-star">*</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Hours"
                    type="number"
                    min="0"
                    value={slaHours}
                    className={`modal-input ${errors.slaMinutes ? "input-error" : ""}`}
                    style={{ flex: 1 }}
                    onChange={(e) => {
                      setSlaHours(e.target.value);
                      clearError("slaDays");
                      clearError("slaMinutes");
                    }}
                  />
                  <input
                    placeholder="Mins"
                    type="number"
                    min="0"
                    max="59"
                    value={slaMinutes}
                    className={`modal-input ${errors.slaMinutes ? "input-error" : ""}`}
                    style={{ flex: 1 }}
                    onChange={(e) => {
                      setSlaMinutes(e.target.value);
                      clearError("slaDays");
                      clearError("slaMinutes");
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Responsible Office */}
            <div className="field-group">
              <label className="modal-label">Responsible Office/Unit</label>
              <input
                placeholder="Registrar Office - Caloocan"
                value={responsibleUnit}
                className={`modal-input ${errors.responsibleUnit ? "input-error" : ""}`}
                onChange={(e) => {
                  setResponsibleUnit(e.target.value);
                  clearError("responsibleUnit");
                }}
              />
              {errors.responsibleUnit && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.responsibleUnit}
                </div>
              )}
            </div>

            {/* Steps Timeline */}
            <div className="field-group">
              <label className="modal-label">Processing Steps Timeline (One per line)</label>
              <textarea
                placeholder="Receive document, Verify details, Release document"
                value={stepsTimeline}
                className={`modal-textarea ${errors.stepsTimeline ? "input-error" : ""}`}
                onChange={(e) => {
                  setStepsTimeline(e.target.value);
                  clearError("stepsTimeline");
                }}
              />
              {errors.stepsTimeline && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.stepsTimeline}
                </div>
              )}
            </div>

            {/* Expected Output */}
            <div className="field-group">
              <label className="modal-label">Expected Output</label>
              <input
                placeholder="Official Document"
                value={expectedOutput}
                className={`modal-input ${errors.expectedOutput ? "input-error" : ""}`}
                onChange={(e) => {
                  setExpectedOutput(e.target.value);
                  clearError("expectedOutput");
                }}
              />
              {errors.expectedOutput && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.expectedOutput}
                </div>
              )}
            </div>

            {/* Bottom Flex controls */}
            <div className="form-footer-flex">
              {/* Left: Custom Radio Buttons */}
              <div>
                <div
                  className={`radio-option ${withReferral === "with" ? "selected" : ""}`}
                  onClick={() => setWithReferral("with")}
                >
                  <div className="custom-radio">
                     <div className="radio-dot" />
                  </div>
                  with referral
                </div>
                <div
                  className={`radio-option ${withReferral === "without" ? "selected" : ""}`}
                  onClick={() => setWithReferral("without")}
                >
                  <div className="custom-radio">
                    <div className="radio-dot" />
                  </div>
                  without referral
                </div>
                <div
                  className={`radio-option ${withReferral === "n/a" ? "selected" : ""}`}
                  onClick={() => setWithReferral("n/a")}
                >
                  <div className="custom-radio">
                    <div className="radio-dot" />
                  </div>
                  not applicable
                </div>
              </div>

              {/* Middle: Active Toggle */}
              <div className="toggle-active-row">
                <Toggle checked={active} onChange={() => setActive(p => !p)} />
                ACTIVE
              </div>

              {/* Right: Actions Buttons */}
              <div className="footer-action-buttons">
                <button className="btn-cancel-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-save-maroon" onClick={handleSave}>
                  {isEditing ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
