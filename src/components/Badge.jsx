import { COLORS } from "../constants/colors";

const statusMap = {
  Complete:       { bg: COLORS.compliantBg,    color: COLORS.compliant,    dot: COLORS.compliant },
  Incomplete:     { bg: COLORS.incompleteBg,   color: COLORS.incomplete,   dot: COLORS.incomplete },
  "N/A":          { bg: COLORS.naBg,            color: COLORS.na,           dot: COLORS.na },
  Compliant:      { bg: COLORS.compliantBg,     color: COLORS.compliant,    dot: COLORS.compliant },
  "Non-Compliant":{ bg: COLORS.nonCompliantBg,  color: COLORS.nonCompliant, dot: COLORS.nonCompliant },
  Overdue:        { bg: COLORS.overdueBg,       color: COLORS.overdue,      dot: COLORS.overdue },
  "For Compliance":{ bg: COLORS.incompleteBg,  color: COLORS.incomplete,   dot: COLORS.incomplete },
};

export default function Badge({ status }) {
  const s = statusMap[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#6B7280" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
