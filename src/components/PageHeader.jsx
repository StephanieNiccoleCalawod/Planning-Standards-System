import { useState, useEffect } from "react";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../store/useAppStore";

export default function PageHeader({ breadcrumb, title, action }) {
  const { periods, fetchPeriods } = useAppStore();
  const [activePeriod, setActivePeriod] = useState("");

  useEffect(() => {
    if (!periods || periods.length === 0) {
      fetchPeriods();
    }
  }, [periods, fetchPeriods]);

  useEffect(() => {
    if (periods && periods.length > 0) {
      const active = periods.find(p => p.status === "Active" || p.status === "Open");
      if (active) {
        if (active.start_date && active.end_date) {
          const formatStr = (d) => {
            const date = new Date(d);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          };
          setActivePeriod(`${formatStr(active.start_date)} — ${formatStr(active.end_date)}`);
        } else {
          setActivePeriod(active.name);
        }
      }
    }
  }, [periods]);

  return (
    <>
      {/* Sticky Breadcrumb Row */}
      <div className="sticky-breadcrumb-row">
        <div className="breadcrumb-text">
          Home / <span style={{ color: "#800000", fontWeight: 600 }}>{breadcrumb}</span>
        </div>
        {activePeriod && (
          <div className="active-period-badge">
            {activePeriod}
          </div>
        )}
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
