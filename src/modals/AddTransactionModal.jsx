import { useState } from "react";
import Field from "../components/Field";
import Input from "../components/Input";
import SelectInput from "../components/SelectInput";
import Btn from "../components/Btn";
import SchedulingConflictModal from "./SchedulingConflictModal";
import { COLORS } from "../constants/colors";

const SERVICE_OPTIONS = [
  // // Medical - Students
  // { value: "Emergency Medical Consultation — Students", label: "Emergency Medical Consultation — Students" },
  // { value: "Non-Emergency Medical Consultation — Students & Dependents (New Patient)", label: "Non-Emergency Medical Consultation — Students & Dependents (New Patient)" },
  // { value: "Non-Emergency Medical Consultation — Students & Dependents (Follow-up)", label: "Non-Emergency Medical Consultation — Students & Dependents (Follow-up)" },
  // { value: "Follow-up of Students Referred During Enrollment", label: "Follow-up of Students Referred During Enrollment" },
  // { value: "Medical Certificate — Sick Note / Excuse Slip (consulted at PUP clinic)", label: "Medical Certificate — Sick Note / Excuse Slip (consulted at PUP clinic)" },
  // { value: "Medical Certificate — Sick Note / Excuse Slip (consulted outside, with cert)", label: "Medical Certificate — Sick Note / Excuse Slip (consulted outside, with cert)" },
  // { value: "Medical Clearance for Enrollment", label: "Medical Clearance for Enrollment" },
  // { value: "Medical Clearance for Off-Campus Activities", label: "Medical Clearance for Off-Campus Activities" },
  // { value: "Medical Clearance for OJT", label: "Medical Clearance for OJT" },

  // // Medical - Employees
  // { value: "Emergency Medical Consultation — Faculty & Admin (with referral)", label: "Emergency Medical Consultation — Faculty & Admin (with referral)" },
  // { value: "Emergency Medical Consultation — Faculty & Admin (without referral)", label: "Emergency Medical Consultation — Faculty & Admin (without referral)" },
  // { value: "Non-Emergency Medical Consultation — Faculty & Admin (New Patient)", label: "Non-Emergency Medical Consultation — Faculty & Admin (New Patient)" },
  // { value: "Non-Emergency Medical Consultation — Faculty & Admin (Follow-up)", label: "Non-Emergency Medical Consultation — Faculty & Admin (Follow-up)" },
  // { value: "Annual Medical Clearance — Faculty & Admin (with referral)", label: "Annual Medical Clearance — Faculty & Admin (with referral)" },
  // { value: "Annual Medical Clearance — Faculty & Admin (without referral)", label: "Annual Medical Clearance — Faculty & Admin (without referral)" },

  // // Dental
  // { value: "Emergency Dental Consultation — Faculty & Admin (with referral)", label: "Emergency Dental Consultation — Faculty & Admin (with referral)" },
  // { value: "Emergency Dental Consultation — Faculty & Admin (without referral)", label: "Emergency Dental Consultation — Faculty & Admin (without referral)" },
  // { value: "Non-Emergency Dental Consultation — Faculty & Admin (New Patient)", label: "Non-Emergency Dental Consultation — Faculty & Admin (New Patient)" },
  // { value: "Non-Emergency Dental Consultation — Faculty & Admin (Follow-up)", label: "Non-Emergency Dental Consultation — Faculty & Admin (Follow-up)" },
  // { value: "Dental Clearance — Faculty & Admin (with referral)", label: "Dental Clearance — Faculty & Admin (with referral)" },
  // { value: "Dental Clearance — Faculty & Admin (without referral)", label: "Dental Clearance — Faculty & Admin (without referral)" },

  // Administrative
  { value: "Campus Equipment / Materials Borrowing (Circulation Services)", label: "Campus Equipment / Materials Borrowing (Circulation Services)" },
  { value: "Facility Reservation Request", label: "Facility Reservation Request" },
  { value: "Permission to Conduct an Activity (Activity Permit)", label: "Permission to Conduct an Activity (Activity Permit)" },
  { value: "Library Circulation (Borrowing of Library Materials)", label: "Library Circulation (Borrowing of Library Materials)" },
];

const DOC_STATUS_OPTIONS = [
  { value: "Complete", label: "Complete" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "For Compliance", label: "For Compliance" },
];

export default function AddTransactionModal({ onClose }) {
  // ── Common fields ──────────────────────────────────────────────────────────
  const [serviceType, setServiceType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [referralStatus, setReferralStatus] = useState("");
  const [docStatus, setDocStatus] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});

  // ── Library-specific fields ───────────────────────────────────────────────
  const [itemName, setItemName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [dueDate, setDueDate] = useState("");

  // ── Equipment-specific fields ─────────────────────────────────────────────
  const [borrowerSlip, setBorrowerSlip] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [items, setItems] = useState([{ name: "Microphone", qty: "" }, { name: "Projector", qty: "" }, { name: "", qty: "" }]);

  // ── Facility-specific fields ──────────────────────────────────────────────
  const [venue, setVenue] = useState("");
  const [reservedDate, setReservedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [requestingParty, setRequestingParty] = useState("");
  const [activityPermitRef, setActivityPermitRef] = useState("");

  const [showConflict, setShowConflict] = useState(false);

  const isMedicalOrDental = serviceType.includes("Medical") || serviceType.includes("Dental");
  const isEquipment = serviceType.includes("Equipment");
  const isFacility = serviceType.includes("Facility") || serviceType.includes("Activity");
  const isLibrary = serviceType.includes("Library");

  // ── Validation ────────────────────────────────────────────────────────────
  const handleSave = () => {
    const e = {};

    // Always required
    if (!serviceType) e.serviceType = true;
    // Name fields only appear when a service type is selected
    if (serviceType && !firstName.trim()) e.firstName = true;
    if (serviceType && !lastName.trim())  e.lastName  = true;
    // Doc Status only shown for Medical/Dental and Library
    if ((isMedicalOrDental || isLibrary) && !docStatus) e.docStatus = true;
    if (!timeIn)  e.timeIn  = true;
    if (!timeOut) e.timeOut = true;

    // Library
    if (isLibrary) {
      if (!itemName.trim()) e.itemName = true;
      if (!itemCode.trim()) e.itemCode = true;
      if (!dueDate) e.dueDate = true;
    }

    // Equipment
    if (isEquipment) {
      if (!borrowerSlip.trim()) e.borrowerSlip = true;
      if (!expectedReturn) e.expectedReturn = true;
      // At least one item with a name is required
      if (items.every(it => !it.name.trim())) e.items = true;
      // If a name is entered, qty is required — and vice versa
      items.forEach((it, i) => {
        if (it.name.trim() && !String(it.qty).trim()) e[`itemQty_${i}`] = true;
        if (!it.name.trim() && String(it.qty).trim()) e[`itemName_${i}`] = true;
      });
    }

    // Facility
    if (isFacility) {
      if (!venue) e.venue = true;
      if (!reservedDate) e.reservedDate = true;
      if (!startTime) e.startTime = true;
      if (!endTime) e.endTime = true;
      if (!requestingParty.trim()) e.requestingParty = true;
      if (!activityPermitRef.trim()) e.activityPermitRef = true;
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    console.log({ serviceType, firstName, lastName, referralStatus, docStatus, timeIn, timeOut, remarks });
    onClose();
  };

  const clr = (key) => setErrors(prev => ({ ...prev, [key]: false }));

  if (showConflict) return (
    <SchedulingConflictModal
      onChooseDifferent={() => setShowConflict(false)}
      onProceed={onClose}
    />
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", justifyContent: "flex-end",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: 480, height: "100vh",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
        animation: "slideInRight 0.3s ease-out",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "32px 40px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.naBg, color: COLORS.na, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>+</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 400, color: COLORS.text, margin: 0 }}>Add Transaction</h2>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 40px" }}>
          <Field label="Service Type" required>
            <SelectInput
              value={serviceType}
              onChange={e => { setServiceType(e.target.value); clr("serviceType"); }}
              options={SERVICE_OPTIONS}
              error={errors.serviceType}
            />
          </Field>

          {/* ── MEDICAL / DENTAL ───────────────────────────────────────────
          {isMedicalOrDental && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="First Name" required>
                  <Input placeholder="e.g. Juan" value={firstName}
                    onChange={e => { setFirstName(e.target.value); clr("firstName"); }} error={errors.firstName} />
                </Field>
                <Field label="Last Name" required>
                  <Input placeholder="e.g. dela Cruz" value={lastName}
                    onChange={e => { setLastName(e.target.value); clr("lastName"); }} error={errors.lastName} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Referral Status (if applicable)">
                  <SelectInput value={referralStatus}
                    onChange={e => { setReferralStatus(e.target.value); clr("referralStatus"); }}
                    options={[{ value: "with", label: "With Referral" }, { value: "without", label: "Without Referral" }]}
                    placeholder="Select status..." error={errors.referralStatus} />
                </Field>
                <Field label="Doc Status" required>
                  <SelectInput value={docStatus}
                    onChange={e => { setDocStatus(e.target.value); clr("docStatus"); }}
                    options={DOC_STATUS_OPTIONS} placeholder="Select status..." error={errors.docStatus} />
                </Field>
              </div>
            </>
          )} */}

          {/* ── LIBRARY ──────────────────────────────────────────────────── */}
          {isLibrary && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Item Name" required>
                  <Input placeholder="e.g. Data Structures and Algorithm" value={itemName}
                    onChange={e => { setItemName(e.target.value); clr("itemName"); }} error={errors.itemName} />
                </Field>
                <Field label="Item Code" required>
                  <Input placeholder="e.g. lb-1" value={itemCode}
                    onChange={e => { setItemCode(e.target.value); clr("itemCode"); }} error={errors.itemCode} />
                </Field>
              </div>
              <Field label="Due Date" required>
                <Input type="date" value={dueDate}
                  onChange={e => { setDueDate(e.target.value); clr("dueDate"); }} error={errors.dueDate} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="First Name" required>
                  <Input placeholder="e.g. Juan" value={firstName}
                    onChange={e => { setFirstName(e.target.value); clr("firstName"); }} error={errors.firstName} />
                </Field>
                <Field label="Last Name" required>
                  <Input placeholder="e.g. dela Cruz" value={lastName}
                    onChange={e => { setLastName(e.target.value); clr("lastName"); }} error={errors.lastName} />
                </Field>
              </div>
              <Field label="Doc Status" required>
                <SelectInput value={docStatus}
                  onChange={e => { setDocStatus(e.target.value); clr("docStatus"); }}
                  options={DOC_STATUS_OPTIONS} placeholder="Select status..." error={errors.docStatus} />
              </Field>
            </>
          )}

          {/* ── EQUIPMENT ────────────────────────────────────────────────── */}
          {isEquipment && (
            <>
              <Field label="Borrower's Slip No." required>
                <Input placeholder="Borrow Equipment" value={borrowerSlip}
                  onChange={e => { setBorrowerSlip(e.target.value); clr("borrowerSlip"); }} error={errors.borrowerSlip} />
              </Field>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 32px", gap: 8, marginBottom: 6 }}>
                  <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>ITEM/S</label>
                  <label style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>QUANTITY</label>
                  <div></div>
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 32px", gap: 8, marginBottom: 8 }}>
                    <Input placeholder="Enter item name..." value={item.name}
                      onChange={e => {
                        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it));
                        clr(`itemName_${i}`);
                        clr("items");
                      }}
                      error={(errors.items && !item.name.trim()) || errors[`itemName_${i}`]} />
                    <Input type="number" value={item.qty} placeholder="0"
                      onChange={e => {
                        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: e.target.value } : it));
                        clr(`itemQty_${i}`);
                      }}
                      error={errors[`itemQty_${i}`]} />
                    <button type="button" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove item"
                      style={{ width: 32, height: 38, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.nonCompliant, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>-</button>
                  </div>
                ))}
                <Btn variant="primary" onClick={() => setItems(prev => [...prev, { name: "", qty: 0 }])}
                  style={{ fontSize: 12, padding: "7px 14px", background: COLORS.sidebar, marginTop: 4 }}>Add Item/s</Btn>
              </div>
              <Field label="Expected Return" required>
                <Input type="date" value={expectedReturn}
                  onChange={e => { setExpectedReturn(e.target.value); clr("expectedReturn"); }} error={errors.expectedReturn} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="First Name" required>
                  <Input placeholder="e.g. Juan" value={firstName}
                    onChange={e => { setFirstName(e.target.value); clr("firstName"); }} error={errors.firstName} />
                </Field>
                <Field label="Last Name" required>
                  <Input placeholder="e.g. dela Cruz" value={lastName}
                    onChange={e => { setLastName(e.target.value); clr("lastName"); }} error={errors.lastName} />
                </Field>
              </div>
            </>
          )}

          {/* ── FACILITY ─────────────────────────────────────────────────── */}
          {isFacility && (
            <>
              <Field label="Venue" required>
                <SelectInput value={venue} onChange={e => { setVenue(e.target.value); clr("venue"); }} error={errors.venue}
                  options={[{ value: "", label: "Select venue..." }, { value: "avr", label: "Audio Visual Room" }, { value: "gym", label: "Gymnasium" }, { value: "conf", label: "Conference Room" }]} />
              </Field>
              <Field label="Reserved Date" required>
                <Input type="date" value={reservedDate}
                  onChange={e => { setReservedDate(e.target.value); clr("reservedDate"); }} error={errors.reservedDate} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Starting Time" required>
                  <Input type="time" value={startTime}
                    onChange={e => { setStartTime(e.target.value); clr("startTime"); }} error={errors.startTime} />
                </Field>
                <Field label="Ending Time" required>
                  <Input type="time" value={endTime}
                    onChange={e => { setEndTime(e.target.value); clr("endTime"); }} error={errors.endTime} />
                </Field>
              </div>
              <Field label="Requesting Party" required>
                <Input placeholder="e.g. CommITa" value={requestingParty}
                  onChange={e => { setRequestingParty(e.target.value); clr("requestingParty"); }} error={errors.requestingParty} />
              </Field>
              <Field label="Activity Permit Ref" required>
                <Input placeholder="HG" value={activityPermitRef}
                  onChange={e => { setActivityPermitRef(e.target.value); clr("activityPermitRef"); }} error={errors.activityPermitRef} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="First Name" required>
                  <Input placeholder="e.g. Juan" value={firstName}
                    onChange={e => { setFirstName(e.target.value); clr("firstName"); }} error={errors.firstName} />
                </Field>
                <Field label="Last Name" required>
                  <Input placeholder="e.g. dela Cruz" value={lastName}
                    onChange={e => { setLastName(e.target.value); clr("lastName"); }} error={errors.lastName} />
                </Field>
              </div>
            </>
          )}

          {/* ── COMMON BOTTOM FIELDS ──────────────────────────────────────── */}
          <Field label="Remarks">
            <textarea
              placeholder="Enter any additional notes or remarks for this transaction..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8, fontSize: 13,
                minHeight: 100, resize: "vertical",
                boxSizing: "border-box", fontFamily: "inherit",
                outline: "none",
              }}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Time In" required>
              <Input type="time" value={timeIn}
                onChange={e => { setTimeIn(e.target.value); clr("timeIn"); }} error={errors.timeIn} />
            </Field>
            <Field label="Time Out" required>
              <Input type="time" value={timeOut}
                onChange={e => { setTimeOut(e.target.value); clr("timeOut"); }} error={errors.timeOut} />
            </Field>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: 12, padding: "24px 40px 32px", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} style={{ background: COLORS.sidebar, color: "#fff" }}>Add Transaction</Btn>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
