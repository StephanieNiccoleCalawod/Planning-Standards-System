import { useState, useEffect } from "react";
import { COLORS } from "../constants/colors";
import { api } from "../services/api";

export default function PageHeader({ breadcrumb, title }) {
  const [activePeriod, setActivePeriod] = useState("Jan — Jun 2026 Period");

  useEffect(() => {
    async function loadActivePeriod() {
      try {
        const res = await api.getPeriods();
        if (res?.data) {
          const active = res.data.find(p => p.status === "Active" || p.status === "Open");
          if (active) {
            setActivePeriod(active.name);
          }
        }
      } catch (err) {
        console.error("Failed to load active period in PageHeader:", err);
      }
    }
    loadActivePeriod();
  }, []);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: COLORS.muted }}>
          Home / <span style={{ color: COLORS.text, fontWeight: 500 }}>{breadcrumb}</span>
        </div>
        <div style={{
          background: "#fff", border: `1px solid ${COLORS.border}`,
          borderRadius: 20, padding: "5px 14px",
          fontSize: 12, fontWeight: 500,
        }}>
          {activePeriod}
        </div>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 400, color: COLORS.text, letterSpacing: "normal", marginBottom: 22 }}>
        {title}
      </h1>
    </div>
  );
}
