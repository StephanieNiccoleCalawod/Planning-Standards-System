import { useState, useEffect } from "react";
import { COLORS } from "../constants/colors";
import { api } from "../services/api";

export default function PageHeader({ breadcrumb, title, action }) {
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
    <>
      {/* Sticky Breadcrumb Row */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 100, 
        background: "#F8FAFC", 
        paddingTop: 32, 
        marginTop: -32,
        paddingLeft: 32,
        marginLeft: -32,
        paddingRight: 32,
        marginRight: -32,
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        paddingBottom: 12,
        borderBottom: "1px solid #E2E8F0",
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
          Home / <span style={{ color: "#800000", fontWeight: 600 }}>{breadcrumb}</span>
        </div>
        <div style={{
          background: "#FEF2F2", 
          color: "#800000", 
          border: "1px solid rgba(128, 0, 0, 0.1)",
          borderRadius: 9999, 
          padding: "6px 16px",
          fontSize: 11, 
          fontWeight: 700, 
          letterSpacing: "0.02em"
        }}>
          {activePeriod}
        </div>
      </div>

      {/* Non-Sticky Title Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <h1 style={{ 
          fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)", 
          fontSize: 34, 
          fontWeight: 500, 
          color: "#0F172A", 
          margin: 0 
        }}>
          {title}
        </h1>
        {action && <div>{action}</div>}
      </div>
    </>
  );
}
