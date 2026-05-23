import Badge from "../components/Badge";
import Btn from "../components/Btn";
import { COLORS } from "../constants/colors";

export default function TransactionDetailModal({ tx, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, width: "100%",
        maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: COLORS.compliantBg, color: COLORS.compliant, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18,
          }}>✓</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>Transaction Detail</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
              {tx.id} · {tx.service}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>CLIENT NAME</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{tx.client}</div>
          </div>
          <div />
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>TIME IN</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>9:04 AM</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>TIME OUT</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>9:38 AM</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>PROCESSING TIME</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{tx.processing}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>SLA RESULT</div>
            <Badge status={tx.sla} />
          </div>
        </div>

        {/* Remarks */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>REMARKS</div>
          <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>
            Patient presented valid PUP ID. Consultation completed within the SLA window. Prescription issued.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="secondary" onClick={onClose}>Export PDF</Btn>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}
