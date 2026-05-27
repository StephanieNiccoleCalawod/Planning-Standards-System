import Btn from "../components/Btn";
import { COLORS } from "../constants/colors";

export default function SchedulingConflictModal({ onChooseDifferent, onProceed }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1100, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12,
        maxWidth: 420, width: "100%", padding: 28,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Scheduling Conflict</div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>
          This facility has an existing booking for this time slot.
        </div>
        <div style={{
          border: `1.5px dashed ${COLORS.border}`,
          borderRadius: 8, padding: 12,
          fontSize: 12, color: COLORS.muted, marginBottom: 16,
        }}>
          ⚠️ <strong>Audio Visual Room</strong> is already reserved by Office of the Campus Director on May 12, 2026 · 9:00 AM – 11:00 AM
        </div>
        <div style={{ fontSize: 13, color: COLORS.text, marginBottom: 24 }}>
          Do you want to proceed with this reservation anyway, or choose a different time or venue?
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="secondary" onClick={onChooseDifferent}>Choose Different Slot</Btn>
          <Btn onClick={onProceed}>Proceed Anyway</Btn>
        </div>
      </div>
    </div>
  );
}
