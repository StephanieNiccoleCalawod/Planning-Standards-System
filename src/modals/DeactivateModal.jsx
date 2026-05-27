import Btn from "../components/Btn";
import { COLORS } from "../constants/colors";

export default function DeactivateModal({ service, onConfirm, onCancel }) {
  const name = service?.name?.split("—")[0]?.trim() || "This service";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12,
        maxWidth: 420, width: "100%", padding: 28,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Deactivate Service?</div>
        </div>
        <div style={{
          border: `1.5px dashed ${COLORS.border}`,
          borderRadius: 8, padding: 12,
          fontSize: 12, color: COLORS.muted, marginBottom: 14,
        }}>
          ⚠️ This service will be hidden from transaction logging immediately.
        </div>
        <div style={{ fontSize: 13, color: COLORS.text, marginBottom: 24 }}>
          <strong>{name}</strong> will be marked as <strong>Inactive</strong>.
          Existing transaction records will not be affected. This action can be reversed.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}>Deactivate</Btn>
        </div>
      </div>
    </div>
  );
}
