import { useState, useEffect } from "react";
import { api } from "../services/api";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TYPE_CONFIG = {
  National: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "National" },
  Local:    { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Local" },
  Campus:   { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Campus" },
};

const mapTypeToBackend = (t) => {
  switch (t) {
    case "National": return "REGULAR";
    case "Local": return "SPECIAL_NON_WORKING";
    case "Campus": return "COMPANY";
    default: return "REGULAR";
  }
};

const mapTypeToFrontend = (t) => {
  switch (t) {
    case "REGULAR": return "National";
    case "SPECIAL_NON_WORKING": return "Local";
    case "COMPANY": return "Campus";
    default: return "National";
  }
};

export default function HolidayCalendar() {
  const today = new Date();
  const [holidays, setHolidays] = useState([]);
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const [name, setName]             = useState("");
  const [date, setDate]             = useState("");
  const [type, setType]             = useState("National");
  const [isRecurring, setIsRecurring] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, kind = "success") => {
    setToast({ show: true, message, type: kind });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
  };

  const fetchHolidays = async () => {
    try {
      const res = await api.getHolidays();
      if (res?.data) {
        const formatted = res.data.map(h => ({
          id: h.id,
          name: h.name,
          date: h.holiday_date,
          type: mapTypeToFrontend(h.type),
          is_recurring: h.is_recurring,
          ...h
        }));
        setHolidays(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* ── navigation ── */
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  /* ── calendar math ── */
  const daysInMonth   = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekday  = new Date(currentYear, currentMonth, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const pad = n => String(n).padStart(2, "0");
  const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

  const holidayMap = {};
  holidays.forEach(h => {
    if (!holidayMap[h.date]) holidayMap[h.date] = [];
    holidayMap[h.date].push(h);
  });

  /* ── modal helpers ── */
  const openAdd = (preDate = "") => {
    setName(""); setDate(preDate || toKey(currentYear, currentMonth, today.getDate()));
    setType("National"); setIsRecurring(false); setEditingHoliday(null);
    setShowModal(true);
  };
  const openEdit = h => {
    setName(h.name); setDate(h.date); setType(h.type);
    setIsRecurring(h.is_recurring || false); setEditingHoliday(h);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingHoliday(null); };

  const handleSave = async e => {
    e.preventDefault();
    if (!name.trim() || !date) { triggerToast("Name and date are required.", "error"); return; }
    const dup = holidays.some(h => h.date === date && h.id !== editingHoliday?.id);
    if (dup) { triggerToast(`A holiday already exists on ${date}.`, "error"); return; }

    const payload = {
      name,
      holiday_date: date,
      type: mapTypeToBackend(type),
      is_recurring: isRecurring
    };

    try {
      if (editingHoliday) {
        await api.updateHoliday(editingHoliday.id, payload);
        triggerToast("Holiday updated successfully.", "success");
      } else {
        await api.createHoliday(payload);
        if (isRecurring) {
          triggerToast("Recurring holiday encoded for 5 years.", "success");
        } else {
          triggerToast("Holiday encoded successfully.", "success");
        }
      }
      closeModal();
      await fetchHolidays();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || "Failed to save holiday.", "error");
    }
  };

  const handleDelete = async (id, hName) => {
    try {
      await api.deleteHoliday(id);
      triggerToast(`"${hName}" deleted successfully.`, "success");
      closeModal();
      await fetchHolidays();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || "Failed to delete holiday.", "error");
    }
  };

  /* ── sidebar holidays for selected date ── */
  const selectedKey = selectedDate
    ? toKey(currentYear, currentMonth, selectedDate)
    : null;
  const selectedHolidays = selectedKey ? (holidayMap[selectedKey] || []) : [];
  const monthHolidays = holidays.filter(h => {
    const d = new Date(h.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  /* ── build calendar cells ── */
  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, type: "prev" });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: "cur" });
  while (cells.length < 42) cells.push({ day: cells.length - daysInMonth - firstWeekday + 1, type: "next" });

  const isToday = d => d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Page Header ── */}
      <div style={S.pageHeader}>
        <div>
          <p style={S.breadcrumb}>Home / <span style={S.breadcrumbActive}>Holiday Calendar</span></p>
          <h1 style={S.pageTitle}>Holiday Calendar</h1>
        </div>
        <button className="hc-btn-primary" onClick={() => openAdd()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Holiday
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div style={S.layout}>

        {/* ══ Calendar Panel ══ */}
        <div style={S.calPanel}>
          {/* Calendar Header */}
          <div style={S.calHeader}>
            <div style={S.calHeaderLeft}>
              <span style={S.calMonthLabel}>{MONTHS[currentMonth]}</span>
              <span style={S.calYearLabel}>{currentYear}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="hc-nav-btn" onClick={prevMonth} aria-label="Previous month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="hc-nav-btn" onClick={nextMonth} aria-label="Next month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {/* Type Legend */}
          <div style={S.legendRow}>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <div key={k} style={S.legendItem}>
                <span style={{ ...S.legendDot, background: v.color }} />
                <span style={S.legendText}>{v.label}</span>
              </div>
            ))}
          </div>

          {/* Day Headers */}
          <div style={S.dayHeaderGrid}>
            {DAY_LABELS.map(d => (
              <div key={d} style={S.dayHeaderCell}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={S.calGrid}>
            {cells.map((cell, idx) => {
              const isCur = cell.type === "cur";
              const key   = isCur ? toKey(currentYear, currentMonth, cell.day) : null;
              const hols  = key ? (holidayMap[key] || []) : [];
              const isSel = isCur && selectedDate === cell.day;
              const isTod = isCur && isToday(cell.day);
              const isSun = idx % 7 === 0;

              return (
                <div
                  key={`${cell.type}-${idx}`}
                  className={[
                    "hc-cell",
                    !isCur  ? "hc-cell-dim"       : "",
                    isSel   ? "hc-cell-selected"   : "",
                    isTod && !isSel ? "hc-cell-today"    : "",
                    hols.length && isCur ? "hc-cell-has-holiday" : "",
                  ].join(" ")}
                  onClick={() => isCur && setSelectedDate(cell.day)}
                >
                  <span className="hc-day-num" style={isSun && isCur && !isSel ? { color: "#DC2626" } : {}}>
                    {cell.day}
                  </span>

                  {/* Holiday indicators */}
                  {hols.length > 0 && (
                    <div style={S.dotRow}>
                      {hols.slice(0, 3).map((h, i) => (
                        <span
                          key={i}
                          style={{ ...S.dot, background: TYPE_CONFIG[h.type]?.color || "#888" }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Holiday name chip (show on larger cells) */}
                  {hols.length > 0 && isCur && (
                    <div style={S.chipStack}>
                      {hols.slice(0, 2).map((h, i) => (
                        <span
                          key={i}
                          style={{
                            ...S.chip,
                            background: TYPE_CONFIG[h.type]?.bg || "#F1F5F9",
                            color: TYPE_CONFIG[h.type]?.color || "#555",
                            borderColor: TYPE_CONFIG[h.type]?.border || "#E2E8F0",
                          }}
                        >
                          {h.name.length > 14 ? h.name.slice(0, 13) + "…" : h.name}
                        </span>
                      ))}
                      {hols.length > 2 && (
                        <span style={{ ...S.chip, background: "#F1F5F9", color: "#64748B", borderColor: "#E2E8F0" }}>
                          +{hols.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ Sidebar Panel ══ */}
        <div style={S.sidebar}>

          {/* Selected Day Detail */}
          {selectedDate ? (
            <div style={S.sideSection}>
              <div style={S.sideSectionHeader}>
                <div>
                  <p style={S.sideSectionSub}>Selected Date</p>
                  <p style={S.sideSectionTitle}>
                    {MONTHS[currentMonth]} {selectedDate}, {currentYear}
                  </p>
                </div>
                <button
                  className="hc-btn-sm-outline"
                  onClick={() => openAdd(toKey(currentYear, currentMonth, selectedDate))}
                >
                  + Add
                </button>
              </div>

              {selectedHolidays.length > 0 ? (
                <div style={S.holidayList}>
                  {selectedHolidays.map(h => (
                    <div key={h.id} style={S.holidayItem}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{
                          ...S.holidayTypeBadge,
                          background: TYPE_CONFIG[h.type]?.bg,
                          color: TYPE_CONFIG[h.type]?.color,
                          border: `1px solid ${TYPE_CONFIG[h.type]?.border}`,
                        }}>{h.type}</span>
                        <div>
                          <p style={S.holidayName}>{h.name}</p>
                          {h.is_recurring && (
                            <p style={S.holidayMeta}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                              Recurring Annual
                            </p>
                          )}
                        </div>
                      </div>
                      <button className="hc-edit-btn" onClick={() => openEdit(h)} title="Edit">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={S.emptyDay}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p style={S.emptyDayText}>No holidays on this date</p>
                  <button className="hc-btn-sm-ghost" onClick={() => openAdd(toKey(currentYear, currentMonth, selectedDate))}>
                    Encode one
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={S.sideSection}>
              <div style={S.pickDatePrompt}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.4">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={S.pickDateText}>Click a date to see its holidays</p>
              </div>
            </div>
          )}

          {/* Month Summary */}
          <div style={S.sideSection}>
            <p style={S.sideSectionTitle}>{MONTHS[currentMonth]} Holidays</p>
            <p style={S.sideSectionCount}>{monthHolidays.length} holiday{monthHolidays.length !== 1 ? "s" : ""} this month</p>

            {monthHolidays.length > 0 ? (
              <div style={S.holidayList}>
                {monthHolidays.map(h => {
                  const d = new Date(h.date);
                  return (
                    <div key={h.id} style={S.holidayItem}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          ...S.dateBadge,
                          background: TYPE_CONFIG[h.type]?.color || "#888",
                        }}>
                          <span style={S.dateBadgeDay}>{d.getDate()}</span>
                          <span style={S.dateBadgeMo}>{MONTHS[d.getMonth()].slice(0,3).toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={S.holidayName}>{h.name}</p>
                          <p style={S.holidayMeta}>{h.type}{h.is_recurring ? " · Recurring" : ""}</p>
                        </div>
                      </div>
                      <button className="hc-edit-btn" onClick={() => openEdit(h)} title="Edit">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={S.emptyDay}>
                <p style={S.emptyDayText}>No holidays this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Modal ══ */}
      {showModal && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#800000" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h2 style={S.modalTitle}>{editingHoliday ? "Edit Holiday" : "Encode Holiday"}</h2>
                <p style={S.modalSub}>Fill in the details below</p>
              </div>
              <button style={S.modalClose} onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={S.modalBody}>
                <div style={S.field}>
                  <label style={S.label}>Holiday Name *</label>
                  <input
                    className="hc-input"
                    type="text"
                    placeholder="e.g. Independence Day"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Date *</label>
                  <input
                    className="hc-input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Holiday Type *</label>
                  <select className="hc-input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="National">National Holiday</option>
                    <option value="Local">Local Holiday</option>
                    <option value="Campus">Campus / Office Holiday</option>
                  </select>
                </div>

                <label style={S.checkRow}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: "#800000", cursor: "pointer" }}
                  />
                  <span style={S.checkLabel}>Recurring Annual Holiday</span>
                  <span style={S.checkHint}>(auto-encodes for 5 years)</span>
                </label>
              </div>

              <div style={S.modalFooter}>
                {editingHoliday && (
                  <button
                    type="button"
                    className="hc-btn-danger"
                    onClick={() => handleDelete(editingHoliday.id, editingHoliday.name)}
                  >
                    Delete
                  </button>
                )}
                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                  <button type="button" className="hc-btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="hc-btn-primary">
                    {editingHoliday ? "Save Changes" : "Encode Holiday"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast.show && (
        <div className={`hc-toast hc-toast-${toast.type}`}>
          <span className={`hc-toast-icon hc-toast-icon-${toast.type}`}>
            {toast.type === "success" ? "✔" : "✖"}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Inline Style Objects
══════════════════════════════════════════════ */
const S = {
  page: {
    padding: "28px 32px",
    background: "#F8FAFC",
    minHeight: "100vh",
    fontFamily: "var(--font-ui, 'DM Sans', sans-serif)",
    boxSizing: "border-box",
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  breadcrumb: { fontSize: 12, color: "#94A3B8", margin: "0 0 4px 0", fontWeight: 500 },
  breadcrumbActive: { color: "#475569", fontWeight: 600 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#1E293B", margin: 0 },

  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 20,
    alignItems: "start",
  },

  /* Calendar */
  calPanel: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  calHeader: {
    background: "linear-gradient(135deg, #7A0000 0%, #5a0000 100%)",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calHeaderLeft: { display: "flex", alignItems: "baseline", gap: 8 },
  calMonthLabel: { fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" },
  calYearLabel:  { fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.7)" },

  legendRow: {
    display: "flex",
    gap: 20,
    padding: "12px 24px",
    borderBottom: "1px solid #F1F5F9",
    background: "#FAFAFA",
  },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  legendText: { fontSize: 12, fontWeight: 600, color: "#64748B" },

  dayHeaderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    padding: "10px 12px 4px",
    borderBottom: "1px solid #F1F5F9",
  },
  dayHeaderCell: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#94A3B8",
    letterSpacing: "0.5px",
    padding: "2px 0",
  },

  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    padding: "8px 12px 16px",
    gap: 2,
  },

  dotRow: {
    display: "flex",
    justifyContent: "center",
    gap: 2,
    marginTop: 2,
  },
  dot: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },

  chipStack: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    width: "100%",
    marginTop: 3,
  },
  chip: {
    fontSize: 9.5,
    fontWeight: 600,
    padding: "1px 5px",
    borderRadius: 4,
    border: "1px solid",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.5,
  },

  /* Sidebar */
  sidebar: { display: "flex", flexDirection: "column", gap: 16 },
  sideSection: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sideSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sideSectionSub:   { fontSize: 11, color: "#94A3B8", fontWeight: 600, margin: 0, letterSpacing: "0.3px" },
  sideSectionTitle: { fontSize: 14, fontWeight: 700, color: "#1E293B", margin: "0 0 2px 0" },
  sideSectionCount: { fontSize: 12, color: "#64748B", margin: "0 0 12px 0" },

  pickDatePrompt: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "24px 0",
    textAlign: "center",
  },
  pickDateText: { fontSize: 13, color: "#94A3B8", margin: 0 },

  emptyDay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "20px 0",
    textAlign: "center",
  },
  emptyDayText: { fontSize: 12, color: "#94A3B8", margin: 0 },

  holidayList: { display: "flex", flexDirection: "column", gap: 8 },
  holidayItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #F1F5F9",
    background: "#FAFAFA",
    gap: 8,
  },
  holidayTypeBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 999,
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  holidayName: { fontSize: 13, fontWeight: 600, color: "#1E293B", margin: 0 },
  holidayMeta: {
    fontSize: 11,
    color: "#94A3B8",
    margin: "2px 0 0 0",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },

  dateBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
  },
  dateBadgeDay: { fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 },
  dateBadgeMo:  { fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.5px" },

  /* Modal */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "20px 24px",
    borderBottom: "1px solid #F1F5F9",
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    background: "#FFF1F2",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0 },
  modalSub:   { fontSize: 12, color: "#94A3B8", margin: "2px 0 0 0" },
  modalClose: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    padding: 4,
    display: "flex",
  },
  modalBody:   { padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #F1F5F9",
    display: "flex",
    alignItems: "center",
  },

  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.5px", textTransform: "uppercase" },

  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    padding: "10px 12px",
    background: "#F8FAFC",
    borderRadius: 8,
    border: "1px solid #E2E8F0",
  },
  checkLabel: { fontSize: 13, fontWeight: 600, color: "#334155" },
  checkHint:  { fontSize: 11, color: "#94A3B8" },
};

/* ══════════════════════════════════════════════
   Global CSS (injected via <style>)
══════════════════════════════════════════════ */
const CSS = `
  .hc-cell {
    min-height: 90px;
    padding: 8px 6px 6px;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: background 0.12s, box-shadow 0.12s;
    box-sizing: border-box;
  }
  .hc-cell:hover:not(.hc-cell-dim):not(.hc-cell-selected) {
    background: #F1F5F9;
  }
  .hc-cell-dim {
    opacity: 0.28;
    pointer-events: none;
  }
  .hc-cell-today .hc-day-num {
    background: #FEE2E2;
    color: #800000 !important;
    font-weight: 700;
  }
  .hc-cell-selected {
    background: linear-gradient(135deg, #7A0000, #5a0000) !important;
    box-shadow: 0 4px 12px rgba(122,0,0,0.3);
  }
  .hc-cell-selected .hc-day-num {
    color: #fff !important;
    background: rgba(255,255,255,0.15) !important;
  }
  .hc-cell-selected .hc-chip { filter: brightness(0) invert(1) opacity(0.9); }

  .hc-day-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    flex-shrink: 0;
    transition: background 0.12s, color 0.12s;
  }

  .hc-nav-btn {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: rgba(255,255,255,0.9);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .hc-nav-btn:hover { background: rgba(255,255,255,0.22); }

  .hc-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, #7A0000, #5a0000);
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 10px 18px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(122,0,0,0.3);
  }
  .hc-btn-primary:hover { opacity: 0.9; box-shadow: 0 4px 14px rgba(122,0,0,0.35); }

  .hc-btn-ghost {
    background: #fff;
    border: 1.5px solid #E2E8F0;
    color: #64748B;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
  }
  .hc-btn-ghost:hover { background: #F8FAFC; }

  .hc-btn-sm-outline {
    background: #FFF5F5;
    border: 1px solid rgba(128,0,0,0.15);
    color: #800000;
    border-radius: 7px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
    white-space: nowrap;
  }
  .hc-btn-sm-outline:hover { background: #FEE2E2; }

  .hc-btn-sm-ghost {
    background: none;
    border: none;
    color: #800000;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
  }

  .hc-btn-danger {
    background: #EF4444;
    border: none;
    color: #fff;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
  }
  .hc-btn-danger:hover { background: #DC2626; }

  .hc-input {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid #E2E8F0;
    border-radius: 8px;
    font-size: 13.5px;
    color: #1E293B;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #fff;
  }
  .hc-input:focus {
    border-color: #800000;
    box-shadow: 0 0 0 3px rgba(128,0,0,0.08);
  }

  .hc-edit-btn {
    width: 28px;
    height: 28px;
    background: #FFF5F5;
    border: 1px solid rgba(128,0,0,0.15);
    color: #800000;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .hc-edit-btn:hover { background: #FEE2E2; }

  .hc-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #fff;
    border-radius: 10px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #1E293B;
    z-index: 9999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    border: 1px solid #E2E8F0;
    animation: hcSlideIn 0.25s ease-out;
  }
  .hc-toast-success { border-left: 4px solid #10B981; }
  .hc-toast-error   { border-left: 4px solid #EF4444; }

  .hc-toast-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #fff;
    flex-shrink: 0;
  }
  .hc-toast-icon-success { background: #10B981; }
  .hc-toast-icon-error   { background: #EF4444; }

  @keyframes hcSlideIn {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  @media (max-width: 960px) {
    .holiday-calendar-container { grid-template-columns: 1fr; }
  }
`;
