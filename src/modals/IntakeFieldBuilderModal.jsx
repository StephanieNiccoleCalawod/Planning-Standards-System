import { useState } from "react";
import Toggle from "../components/Toggle";

export default function IntakeFieldBuilderModal({ service, onClose, onSave }) {
  const initialFields = service?.intakeFields || [];

  const [fields, setFields] = useState(initialFields);
  
  // State for form adding / editing a field
  const [editingFieldId, setEditingFieldId] = useState(null); // Null means adding new field
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("Text");
  const [required, setRequired] = useState(true);
  const [dropdownOptions, setDropdownOptions] = useState(""); // Comma separated options for dropdowns
  
  const [errors, setErrors] = useState({});

  // Reset form states
  const resetForm = () => {
    setEditingFieldId(null);
    setLabel("");
    setFieldType("Text");
    setRequired(true);
    setDropdownOptions("");
    setErrors({});
  };

  const handleEditClick = (field) => {
    setEditingFieldId(field.id);
    setLabel(field.label);
    setFieldType(field.type);
    setRequired(field.required);
    setDropdownOptions(field.options ? field.options.join(", ") : "");
    setErrors({});
  };

  const handleAddField = () => {
    const e = {};
    if (!label.trim()) e.label = true;
    if (fieldType === "Dropdown" && !dropdownOptions.trim()) e.dropdownOptions = true;

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const optionsArray = fieldType === "Dropdown" 
      ? dropdownOptions.split(",").map(o => o.trim()).filter(Boolean)
      : undefined;

    if (editingFieldId !== null) {
      // Edit mode
      setFields(prev => prev.map(f => f.id === editingFieldId ? {
        ...f,
        label,
        type: fieldType,
        required,
        options: optionsArray,
      } : f));
    } else {
      // Add mode
      const newField = {
        id: Date.now(),
        label,
        type: fieldType,
        required,
        options: optionsArray,
        displayOrder: fields.length + 1,
      };
      setFields(prev => [...prev, newField]);
    }

    resetForm();
  };

  const handleDeleteField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id).map((f, index) => ({
      ...f,
      displayOrder: index + 1,
    })));
  };

  const handleMove = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...fields];
    
    // Swap items
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Re-assign display orders
    const ordered = updated.map((f, i) => ({ ...f, displayOrder: i + 1 }));
    setFields(ordered);
  };

  const handleSaveAll = () => {
    if (onSave) {
      onSave({
        ...service,
        intakeFields: fields,
      });
    }
    onClose();
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
      {/* Dynamic Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .builder-modal-card {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 760px;
          max-height: 92vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          font-family: var(--font-ui), sans-serif;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          animation: slideUpBuilder 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUpBuilder {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .builder-header {
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .builder-title {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 24px;
          font-weight: 500;
          color: #0F172A;
          margin: 0;
        }
        .builder-subtitle {
          font-size: 12px;
          color: #64748B;
          margin-top: 2px;
          font-weight: 500;
        }

        .builder-body-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          flex: 1;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .builder-body-grid {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
          .builder-fields-panel {
            max-height: 300px;
          }
        }

        /* Left fields list panel */
        .builder-fields-panel {
          padding: 24px;
          border-right: 1px solid #E2E8F0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .field-builder-item {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.15s ease;
        }
        .field-builder-item:hover {
          border-color: #CBD5E1;
          background: #F1F5F9;
        }
        .field-item-drag-order {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .order-arrow-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748B;
          font-size: 10px;
        }
        .order-arrow-btn:hover:not(:disabled) {
          background: #F1F5F9;
          color: #1E293B;
        }
        .order-arrow-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .field-item-details {
          flex: 1;
          min-width: 0;
        }
        .field-item-label {
          font-weight: 600;
          color: #1E293B;
          font-size: 13px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .field-item-meta {
          font-size: 11px;
          color: #64748B;
          font-weight: 500;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .req-tag-pill {
          background: #FEF2F2;
          color: #EF4444;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .field-item-actions {
          display: flex;
          gap: 6px;
        }
        .item-action-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          transition: all 0.15s ease;
        }
        .item-action-icon-btn.edit-btn:hover {
          background: #F1F5F9;
          border-color: #800000;
          color: #800000;
        }
        .item-action-icon-btn.delete-btn:hover {
          background: #FEF2F2;
          border-color: #EF4444;
          color: #EF4444;
        }

        /* Right form panel */
        .builder-form-panel {
          padding: 24px;
          background: #FAFAFA;
          overflow-y: auto;
        }
        .builder-form-title {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .builder-field-box {
          margin-bottom: 14px;
        }
        .builder-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }
        .builder-input:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }
        .builder-input.error-input {
          border-color: #EF4444;
        }

        .builder-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
          cursor: pointer;
          font-family: inherit;
        }

        .builder-footer {
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background: #F8FAFC;
        }

        .btn-builder-ghost {
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-builder-ghost:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .btn-builder-maroon {
          padding: 9px 20px;
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
        .btn-builder-maroon:hover {
          background: #990000;
          box-shadow: 0 4px 8px rgba(128, 0, 0, 0.2);
        }
      ` }} />

      <div className="builder-modal-card">
        {/* Header */}
        <div className="builder-header">
          <div>
            <h3 className="builder-title">Intake Field Builder</h3>
            <div className="builder-subtitle">Define required forms fields for: {service?.name}</div>
          </div>
          <button 
            style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Body Grid */}
        <div className="builder-body-grid">
          {/* Left panel: Fields list */}
          <div className="builder-fields-panel">
            {fields.length > 0 ? (
              fields.map((field, index) => (
                <div key={field.id} className="field-builder-item">
                  {/* Up Down arrows */}
                  <div className="field-item-drag-order">
                    <button
                      className="order-arrow-btn"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                    >
                      ▲
                    </button>
                    <button
                      className="order-arrow-btn"
                      disabled={index === fields.length - 1}
                      onClick={() => handleMove(index, "down")}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Label details */}
                  <div className="field-item-details">
                    <div className="field-item-label" title={field.label}>
                      {field.label}
                    </div>
                    <div className="field-item-meta">
                      <span>Type: {field.type}</span>
                      <span>•</span>
                      <span>Order: {field.displayOrder}</span>
                      {field.required && <span className="req-tag-pill">REQUIRED</span>}
                    </div>
                  </div>

                  {/* Edit/Delete Actions */}
                  <div className="field-item-actions">
                    <button 
                      className="item-action-icon-btn edit-btn"
                      onClick={() => handleEditClick(field)}
                      title="Edit intake field"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button 
                      className="item-action-icon-btn delete-btn"
                      onClick={() => handleDeleteField(field.id)}
                      title="Remove intake field"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#64748B", fontSize: "13px", padding: "40px 10px", border: "1.5px dashed #E2E8F0", borderRadius: "8px" }}>
                No custom intake fields defined yet.
                <br />
                Use the form on the right to add fields!
              </div>
            )}
          </div>

          {/* Right panel: Add/Edit form */}
          <div className="builder-form-panel">
            <h4 className="builder-form-title">
              {editingFieldId !== null ? "Edit Intake Field" : "Add Intake Field"}
            </h4>

            {/* Field Label */}
            <div className="builder-field-box">
              <label className="modal-label" style={{ fontSize: "11px" }}>FIELD LABEL *</label>
              <input
                placeholder="e.g. Reference Slip Number"
                value={label}
                className={`builder-input ${errors.label ? "error-input" : ""}`}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setErrors(prev => ({ ...prev, label: false }));
                }}
              />
            </div>

            {/* Field Type */}
            <div className="builder-field-box">
              <label className="modal-label" style={{ fontSize: "11px" }}>FIELD TYPE</label>
              <select
                className="builder-select"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                <option value="Text">Text Input</option>
                <option value="Number">Number Input</option>
                <option value="Date">Date Selector</option>
                <option value="Dropdown">Dropdown Selector</option>
                <option value="Checkbox">Checkbox Indicator</option>
              </select>
            </div>

            {/* Dropdown options (only visible if dropdown selected) */}
            {fieldType === "Dropdown" && (
              <div className="builder-field-box">
                <label className="modal-label" style={{ fontSize: "11px" }}>
                  DROPDOWN OPTIONS (comma separated) *
                </label>
                <input
                  placeholder="e.g. Option 1, Option 2, Option 3"
                  value={dropdownOptions}
                  className={`builder-input ${errors.dropdownOptions ? "error-input" : ""}`}
                  onChange={(e) => {
                    setDropdownOptions(e.target.value);
                    setErrors(prev => ({ ...prev, dropdownOptions: false }));
                  }}
                />
              </div>
            )}

            {/* Required Indicator Toggle */}
            <div className="builder-field-box" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
              <Toggle checked={required} onChange={() => setRequired(p => !p)} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>REQUIRED FIELD</span>
            </div>

            {/* Actions for local add/edit */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {editingFieldId !== null && (
                <button className="btn-builder-ghost" style={{ flex: 1 }} onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button 
                className="btn-builder-maroon" 
                style={{ flex: 1, background: editingFieldId !== null ? "#1E293B" : "#800000" }} 
                onClick={handleAddField}
              >
                {editingFieldId !== null ? "Update Field" : "Add Field"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="builder-footer">
          <button className="btn-builder-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn-builder-maroon" onClick={handleSaveAll}>
            Save All Fields
          </button>
        </div>
      </div>
    </div>
  );
}
