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
      <style dangerouslySetInnerHTML={{ __html: `
        .sticky-breadcrumb-row {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #F8FAFC;
          padding-top: 32px;
          margin-top: -32px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E2E8F0;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-left: 32px;
          margin-left: -32px;
          padding-right: 32px;
          margin-right: -32px;
        }
        .breadcrumb-text {
          font-size: 12px;
          color: #64748B;
          fontWeight: 500;
        }
        .active-period-badge {
          background: #FEF2F2;
          color: #800000;
          border: 1px solid rgba(128, 0, 0, 0.15);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          gap: 16px;
        }
        .title-text {
          font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
          font-size: 26px;
          font-weight: 500;
          color: #0F172A;
          margin: 0;
          line-height: 1.2;
        }
        @media (max-width: 960px) {
          .sticky-breadcrumb-row {
            padding-top: 24px;
            margin-top: -24px;
            padding-left: 24px;
            margin-left: -24px;
            padding-right: 24px;
            margin-right: -24px;
          }
        }
        @media (max-width: 600px) {
          .sticky-breadcrumb-row {
            padding-top: 16px;
            margin-top: -16px;
            padding-left: 16px;
            margin-left: -16px;
            padding-right: 16px;
            margin-right: -16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .title-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .title-text {
            font-size: 20px;
          }
        }
      `}} />

      {/* Sticky Breadcrumb Row */}
      <div className="sticky-breadcrumb-row">
        <div className="breadcrumb-text">
          Home / <span style={{ color: "#800000", fontWeight: 600 }}>{breadcrumb}</span>
        </div>
        <div className="active-period-badge">
          {activePeriod}
        </div>
      </div>

      {/* Non-Sticky Title Row */}
      <div className="title-row">
        <h1 className="title-text">
          {title}
        </h1>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </>
  );
}
