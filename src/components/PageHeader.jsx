import { useState, useEffect, useRef } from "react";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../store/useAppStore";

export default function PageHeader({ breadcrumb, title, action }) {
  const { periods, fetchPeriods, userRole } = useAppStore();
  const [activePeriod, setActivePeriod] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

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
      } else {
        setActivePeriod("");
      }
    } else {
      setActivePeriod("");
    }
  }, [periods]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = userRole === "Staff" ? "S" : "A";
  const displayName = userRole === "Staff" ? "Staff User" : "Admin User";
  const displayRole = userRole === "Staff" ? "Staff" : "Administrative System";

  return (
    <>
      {/* Sticky Breadcrumb Row */}
      <div className="sticky-breadcrumb-row">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ color: breadcrumb === "Dashboard" ? "#580000" : "#64748B", fontWeight: breadcrumb === "Dashboard" ? 600 : 500 }}>
            Dashboard
          </span>
          {breadcrumb !== "Dashboard" && (
            <>
              <span style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1 }}>›</span>
              <span style={{ color: "#580000", fontWeight: 600 }}>{breadcrumb}</span>
            </>
          )}
        </div>

        {/* Right side: period badge + notification + profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {activePeriod && (
            <div className="active-period-badge">
              {activePeriod}
            </div>
          )}

          {/* Center/Middle of period badge and profile: Notification Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen(n => !n)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: notifOpen ? "rgba(0,0,0,0.07)" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = notifOpen ? "rgba(0,0,0,0.07)" : "transparent"}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Badge */}
              <span style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#000000",
                border: "2px solid #F8FAFC",
              }} />
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: -40,
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                width: 300,
                zIndex: 999,
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Notifications</span>
                  <span style={{ fontSize: 11, color: "#000000", fontWeight: 600, cursor: "pointer" }}>Mark all read</span>
                </div>

                {/* Notification Items */}
                {[
                  { icon: "📋", title: "New commitment draft saved", time: "2 min ago", unread: true },
                  { icon: "📅", title: "Evaluation period is now active", time: "1 hr ago", unread: true },
                  { icon: "✅", title: "KPI standards updated", time: "Yesterday", unread: false },
                ].map((n, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: 10,
                    padding: "12px 16px",
                    borderBottom: i < 2 ? "1px solid #F8FAFC" : "none",
                    background: n.unread ? "rgba(0,0,0,0.02)" : "#fff",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = n.unread ? "rgba(0,0,0,0.02)" : "#fff"}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: n.unread ? 600 : 500, color: "#1E293B", lineHeight: 1.4 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{n.time}</div>
                    </div>
                    {n.unread && (
                      <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#000000", flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                ))}

                {/* Footer */}
                <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 12, color: "#000000", fontWeight: 600, cursor: "pointer" }}>See all notifications</span>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                borderRadius: 999,
                padding: "4px 10px 4px 4px",
                cursor: "pointer",
                transition: "background 0.15s",
                backgroundColor: profileOpen ? "rgba(128,0,0,0.06)" : "transparent",
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(128,0,0,0.05)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = profileOpen ? "rgba(128,0,0,0.06)" : "transparent"}
            >
              {/* Avatar */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--gold, #C8960C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ textAlign: "left", lineHeight: 1.25 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{displayName}</div>
                <div style={{ fontSize: 10, color: "#800000", fontWeight: 500 }}>{displayRole}</div>
              </div>
              {/* Chevron */}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#800000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: 2 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                minWidth: 180,
                zIndex: 999,
                overflow: "hidden",
              }}>

                {/* Settings */}
                <button
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #F1F5F9",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1E293B",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>

                {/* Logout */}
                <button
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#800000",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(128,0,0,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#800000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
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

