import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  Button,
  Snackbar,
  Alert,
  Paper,
  Divider
} from '@mui/material';

import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import ResultModal from "../modals/ResultModal";
import ConfirmModal from "../modals/ConfirmModal";
import {
  WarningAmberRounded as WarningAmberRoundedIcon,
  AccessTime as AccessTimeIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  CalendarMonth as CalendarMonthIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SLAConfiguration() {
  const {
    slaRules,
    fetchSlaRules,
    updateSlaRule,
    createSlaRule,
    restoreSlaVersion,
    periods,
    fetchPeriods
  } = useAppStore();

  const [workingDays, setWorkingDays] = useState([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [warnThreshold, setWarnThreshold] = useState(80);
  const [overdueThreshold, setOverdueThreshold] = useState(100);

  const [showConfirm, setShowConfirm] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [activeRuleId, setActiveRuleId] = useState(null);
  const [activePeriodName, setActivePeriodName] = useState("Jan — Jun 2026 Period");
  const [history, setHistory] = useState([]);
  const [expandedVersions, setExpandedVersions] = useState({});

  const toggleVersionExpand = (versionId) => {
    setExpandedVersions(prev => ({
      ...prev,
      [versionId]: !prev[versionId]
    }));
  };

  const triggerSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatDaysList = (type, config) => {
    if (type === "WEEKDAYS") return "Mon-Fri";
    if (type === "MONDAY_TO_SATURDAY") return "Mon-Sat";
    if (type === "CUSTOM" && Array.isArray(config)) {
      const activeDays = config.filter(c => c.is_working).map(c => c.day.slice(0, 3));
      return activeDays.join(", ");
    }
    return "Mon-Fri";
  };

  const format12Hour = (timeStr) => {
    if (!timeStr) return "08:00 AM";
    const [h, m] = timeStr.split(":");
    const hrs = parseInt(h);
    const ampm = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 || 12;
    return `${displayHrs.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const loadData = async () => {
    try {
      // 1. Fetch periods to display active period name
      await fetchPeriods();
      const active = periods.find(p => p.status === "Active" || p.status === "Open");
      if (active) {
        setActivePeriodName(active.name);
      }

      // 2. Fetch active rules & versions
      const res = await fetchSlaRules();
      if (res && res.length > 0) {
        const activeRule = res.find(r => r.is_active === true) || res[0];
        if (activeRule) {
          setActiveRuleId(activeRule.id);
          setWarnThreshold(80);
          setOverdueThreshold(100);
          setStartTime(activeRule.work_start_time.slice(0, 5));
          setEndTime(activeRule.work_end_time.slice(0, 5));

          // workingDays is intentionally left empty as requested by the user,
          // so it forces them to select it manually every time.

          const sortedVersions = Array.isArray(activeRule.versions)
            ? [...activeRule.versions].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
            : [];

          const list = [];

          const activeStart = sortedVersions.length > 0
            ? new Date(sortedVersions[0].changed_at)
            : new Date(activeRule.created_at);

          list.push({
            id: activeRule.id,
            start_date: activeStart,
            end_date: "Present",
            timestamp: activeStart.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            }),
            actor: activeRule.created_by || "System Admin",
            working_days: formatDaysList(activeRule.work_schedule_type, activeRule.work_schedule_config),
            working_hours: `${format12Hour(activeRule.work_start_time)} - ${format12Hour(activeRule.work_end_time)}`,
            warn_threshold: "80%",
            overdue_threshold: "100%",
            is_active_rule: true,
            work_schedule_type: activeRule.work_schedule_type,
            work_schedule_config: activeRule.work_schedule_config,
            work_start_time: activeRule.work_start_time,
            work_end_time: activeRule.work_end_time,
            warn_threshold_pct: activeRule.warn_threshold_pct ?? 80,
            overdue_threshold_pct: activeRule.overdue_threshold_pct ?? 100
          });

          sortedVersions.forEach((v, vIndex) => {
            const vStart = (vIndex === sortedVersions.length - 1)
              ? new Date(activeRule.created_at)
              : new Date(sortedVersions[vIndex + 1].changed_at);

            const vEnd = new Date(v.changed_at);

            list.push({
              id: v.id,
              start_date: vStart,
              end_date: vEnd,
              timestamp: vEnd.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              }),
              actor: v.changed_by || "Subsystem Admin",
              working_days: formatDaysList(v.work_schedule_type, v.work_schedule_config),
              working_hours: `${format12Hour(v.work_start_time)} - ${format12Hour(v.work_end_time)}`,
              warn_threshold: "80%",
              overdue_threshold: "100%",
              is_active_rule: false,
              work_schedule_type: v.work_schedule_type,
              work_schedule_config: v.work_schedule_config,
              work_start_time: v.work_start_time,
              work_end_time: v.work_end_time,
              warn_threshold_pct: v.warn_threshold_pct ?? 80,
              overdue_threshold_pct: v.overdue_threshold_pct ?? 100
            });
          });

          const chronoList = [...list].reverse();

          const configsEqual = (a, b) => {
            if (a.work_schedule_type !== b.work_schedule_type) return false;
            if (a.work_start_time !== b.work_start_time) return false;
            if (a.work_end_time !== b.work_end_time) return false;
            if (a.warn_threshold_pct !== b.warn_threshold_pct) return false;
            if (a.overdue_threshold_pct !== b.overdue_threshold_pct) return false;
            
            const configA = a.work_schedule_config;
            const configB = b.work_schedule_config;
            if (!configA && !configB) return true;
            if (!configA || !configB) return false;
            return JSON.stringify(configA) === JSON.stringify(configB);
          };

          const versionNames = [];
          let nextMajor = 1;

          for (let i = 0; i < chronoList.length; i++) {
            const current = chronoList[i];
            let matchIndex = -1;

            for (let j = 0; j < i; j++) {
              if (configsEqual(current, chronoList[j])) {
                matchIndex = j;
                break;
              }
            }

            if (matchIndex === -1) {
              const name = `${nextMajor}`;
              versionNames.push(name);
              nextMajor++;
            } else {
              const rootName = versionNames[matchIndex];
              let subVersionCount = 0;
              for (let k = 0; k < i; k++) {
                if (versionNames[k] === rootName || versionNames[k].startsWith(`${rootName}.`)) {
                  subVersionCount++;
                }
              }
              const name = `${rootName}.${subVersionCount}`;
              versionNames.push(name);
            }
          }

          for (let i = 0; i < chronoList.length; i++) {
            chronoList[i].version_name = versionNames[i];
          }

          setHistory(chronoList.reverse());
        }
      }
    } catch (err) {
      console.error("Failed to load SLA configuration details:", err);
      setResultModal({
        show: true,
        type: "error",
        title: "Connection Error",
        message: "Unable to establish a connection to the backend database service. Please ensure that the services are online and try again."
      });
    }
  };

  useEffect(() => {
    setWorkingDays([]);
    loadData();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (workingDays.length === 0) {
      setResultModal({
        show: true,
        type: "error",
        title: "No Working Days Selected",
        message: "Please select at least one working day (Calendar Schedule) before publishing these SLA configuration rules. You must configure at least one working day for the active period."
      });
      return;
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      setResultModal({
        show: true,
        type: "error",
        title: "Invalid Daily Shift Hours",
        message: "The Daily Shift Time End must be strictly after the Daily Shift Time Start. Please adjust your hours so that the end time occurs after the start time before publishing these SLA rules."
      });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);

    const isWeekdays = workingDays.length === 5 &&
      workingDays.includes("Monday") &&
      workingDays.includes("Tuesday") &&
      workingDays.includes("Wednesday") &&
      workingDays.includes("Thursday") &&
      workingDays.includes("Friday");

    const isMonToSat = workingDays.length === 6 &&
      workingDays.includes("Monday") &&
      workingDays.includes("Tuesday") &&
      workingDays.includes("Wednesday") &&
      workingDays.includes("Thursday") &&
      workingDays.includes("Friday") &&
      workingDays.includes("Saturday");

    let scheduleType = "CUSTOM";
    let scheduleConfig = null;
    if (isWeekdays) {
      scheduleType = "WEEKDAYS";
    } else if (isMonToSat) {
      scheduleType = "MONDAY_TO_SATURDAY";
    } else {
      scheduleType = "CUSTOM";
      scheduleConfig = DAYS_OF_WEEK.map(day => ({
        day,
        is_working: workingDays.includes(day),
        start: startTime.slice(0, 5),
        end: endTime.slice(0, 5)
      }));
    }

    const payload = {
      work_schedule_type: scheduleType,
      work_schedule_config: scheduleConfig,
      work_start_time: startTime.slice(0, 5),
      work_end_time: endTime.slice(0, 5),
      warn_threshold_pct: 80,
      overdue_threshold_pct: 100
    };

    try {
      if (activeRuleId) {
        await updateSlaRule(activeRuleId, payload);
      } else {
        await createSlaRule(payload);
      }
      setShowConfirm(false);
      setResultModal({
        show: true,
        type: "success",
        title: "Success",
        message: "SLA Compliance Rules updated and new version saved successfully!"
      });
      await loadData();
    } catch (err) {
      console.error("Failed to save SLA configuration:", err);
      setShowConfirm(false);
      setResultModal({
        show: true,
        type: "error",
        title: "SLA Save Failure",
        message: err.message || "Failed to save the SLA configuration rules. Please verify your backend server state and database parameters."
      });
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoringVersion || !activeRuleId) return;
    try {
      await restoreSlaVersion(activeRuleId, restoringVersion.id);
      setRestoringVersion(null);
      setResultModal({
        show: true,
        type: "success",
        title: "Success",
        message: "SLA compliance rules version restored successfully!"
      });
      await loadData();
    } catch (err) {
      console.error("Failed to restore SLA version:", err);
      setRestoringVersion(null);
      setResultModal({
        show: true,
        type: "error",
        title: "Error",
        message: err.message || "Failed to restore SLA compliance rules version"
      });
    }
  };

  const toggleDay = (day) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Top Header */}
      <PageHeader breadcrumb="SLA Rules" title="Service Level Agreement" />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: 4,
        mt: 2,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Left Form Panel */}
        <Card sx={{ alignSelf: 'start', borderRadius: 2, p: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: 'background.paper', width: '100%' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column' }}>
            <Box>
              {/* Working Days */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Working Days (Calendar Schedule) *
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <Chip
                        key={day}
                        label={day.slice(0, 3)}
                        onClick={() => toggleDay(day)}
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          height: '38px',
                          width: '100%',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: isSelected ? 'primary.dark' : '#F1F5F9',
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* Time Pickers */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
                <div className="field">
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    Daily Shift Time Start <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="field-input"
                    style={{
                      padding: '10px 14px',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      width: '100%',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div className="field">
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    Daily Shift Time End <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="field-input"
                    style={{
                      padding: '10px 14px',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      width: '100%',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* SLA Threshold Standards Cards */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SLA Threshold Standards
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
                {/* Warning Card */}
                <Box sx={{
                  borderRadius: 2.5,
                  p: 2,
                  bgcolor: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WarningAmberRoundedIcon sx={{ color: '#EAB308', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Warning Alert Threshold
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#D97706', mb: 0.5, fontFamily: 'Outfit, sans-serif' }}>
                      80%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.4, mb: 2 }}>
                      A warning is triggered when 80% of the SLA window has been consumed.
                    </Typography>
                  </Box>
                  <Box>
                    <Divider sx={{ borderColor: '#FDE68A', mb: 1.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.65rem', fontWeight: 600, color: '#B45309' }}>
                      <AccessTimeIcon sx={{ fontSize: 12 }} />
                      <span>System default — not configurable</span>
                    </Box>
                  </Box>
                </Box>

                {/* Overdue Card */}
                <Box sx={{
                  borderRadius: 2.5,
                  p: 2,
                  bgcolor: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ErrorIcon sx={{ color: '#F87171', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Overdue / Violation Mark
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#EF4444', mb: 0.5, fontFamily: 'Outfit, sans-serif' }}>
                      100%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.4, mb: 2 }}>
                      A transaction is flagged as a violation once 100% of the SLA window has elapsed.
                    </Typography>
                  </Box>
                  <Box>
                    <Divider sx={{ borderColor: '#FCA5A5', mb: 1.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.65rem', fontWeight: 600, color: '#B91C1C' }}>
                      <AccessTimeIcon sx={{ fontSize: 12 }} />
                      <span>System default — not configurable</span>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Disclaimer Alert */}
              <Alert severity="warning" variant="outlined" sx={{ bgcolor: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A', mb: 3 }}>
                Saving creates a new version of the SLA rules. This will not affect existing transactions — only future SLA processing will follow the updated configuration.
              </Alert>
            </Box>

            {/* Submit Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  sx={{
                    bgcolor: '#15803D',
                    '&:hover': { bgcolor: '#166534' },
                    px: 4,
                    py: 1.2,
                    fontWeight: 700
                  }}
                >
                  Save &amp; publish SLA rules version
                </Button>
              </Box>
            </form>
          </Card>

        {/* Right Audit Log / Version History */}
        <Box sx={{ width: '100%' }}>
          <Card sx={{ borderRadius: 2, p: { xs: 2, sm: 3 }, border: '1px solid #E2E8F0', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1.5, borderBottom: '1px solid #F1F5F9' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon fontSize="small" />
                Version History Registry
              </Typography>
              <Chip label={`${history.length} records`} size="small" sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: 'text.secondary' }} />
            </Box>

            {history.length > 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 3, 
                position: 'relative', 
                pl: 3.5,
                maxHeight: '520px',
                overflowY: 'auto',
                pr: 1.5,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#F1F5F9',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#CBD5E1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#94A3B8',
                }
              }}>
                {/* Timeline vertical line */}
                <Box sx={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, bgcolor: '#E2E8F0', zIndex: 1 }} />

                {history.map((item, index) => {
                  const versionNumber = item.version_name;

                  const formatDateStr = (dateVal) => {
                    if (!dateVal) return "N/A";
                    if (typeof dateVal === "string") return dateVal;
                    if (isNaN(dateVal.getTime())) return "N/A";
                    return dateVal.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });
                  };

                  const startDateStr = formatDateStr(item.start_date);
                  const endDateStr = formatDateStr(item.end_date);
                  const dateRangeStr = `${startDateStr} — ${endDateStr}`;

                  const isExpanded = expandedVersions[item.id] !== undefined
                    ? expandedVersions[item.id]
                    : item.is_active_rule;

                  return (
                    <Box key={item.id} sx={{ position: 'relative' }}>
                      {/* Timeline dot */}
                      <Box sx={{
                        position: 'absolute',
                        left: -28,
                        top: 2,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: item.is_active_rule ? '#10B981' : '#ffffff',
                        border: `3px solid ${item.is_active_rule ? '#10B981' : '#CBD5E1'}`,
                        zIndex: 2,
                        boxSizing: 'border-box'
                      }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box 
                            onClick={() => toggleVersionExpand(item.id)}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5, 
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { opacity: 0.8 } 
                            }}
                          >
                            {isExpanded ? (
                              <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            ) : (
                              <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            )}
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              Version {versionNumber}
                            </Typography>
                            {item.is_active_rule && (
                              <Chip label="Active" size="small" color="success" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', ml: 0.5 }} />
                            )}
                          </Box>
                          {!item.is_active_rule && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setRestoringVersion(item)}
                              sx={{
                                color: '#800000',
                                borderColor: '#800000',
                                '&:hover': {
                                  bgcolor: 'rgba(128, 0, 0, 0.04)',
                                  borderColor: '#800000'
                                },
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                borderRadius: 2,
                                py: 0.25,
                                px: 1.5,
                                height: 26
                              }}
                            >
                              Restore
                            </Button>
                          )}
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          Published: {dateRangeStr} • Authorized by: {item.actor}
                        </Typography>

                        {/* Nested detail card */}
                        {isExpanded && (
                          <Paper variant="outlined" sx={{ mt: 1, borderRadius: 1.5, overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.8, py: 1, borderBottom: '1px solid #E2E8F0' }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarMonthIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                Working days
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                                {item.working_days}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.8, py: 1, borderBottom: '1px solid #E2E8F0' }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                Daily shift
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
                                {item.working_hours}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.8, py: 1, borderBottom: '1px solid #E2E8F0' }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WarningAmberRoundedIcon sx={{ fontSize: 13, color: '#D97706' }} />
                                Warning trigger
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>
                                {item.warn_threshold}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.8, py: 1 }}>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ErrorIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                                Overdue / violation
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>
                                {item.overdue_threshold}
                              </Typography>
                            </Box>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 5, color: "text.disabled", fontStyle: "italic", fontSize: "0.8125rem" }}>
                No audit logs captured for the active evaluation period.
              </Box>
            )}
          </Card>
        </Box>
      </Box>


      {/* ── Save Confirmation Modal ── */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm SLA Rule Update"
        subtitle="This action will publish a new configuration version"
        body={
          <>
            You are about to{' '}
            <span style={{ color: '#0F172A', fontWeight: '700' }}>save and publish a new version</span>{' '}
            of the SLA compliance rules. The updated settings will apply to{' '}
            <span style={{ color: '#0F172A', fontWeight: '700' }}>all future SLA computations</span> only.
          </>
        }
        alertText={
          <>
            Existing transactions and previously computed SLA records{' '}
            <span style={{ color: '#14532D', fontWeight: '700' }}>will not be affected</span>. This is a non-destructive versioned update.
          </>
        }
        confirmLabel="Yes, Publish New Version"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />

      {/* ── Restore Confirmation Modal ── */}
      <ConfirmModal
        open={Boolean(restoringVersion)}
        title={`Restore Version ${restoringVersion ? restoringVersion.version_name : ""}?`}
        subtitle="This action will restore a previous configuration version"
        body={
          <>
            Are you sure you want to restore{" "}
            <span style={{ color: '#0F172A', fontWeight: '700' }}>Version {restoringVersion ? restoringVersion.version_name : ""}</span>{" "}
            of the SLA compliance rules?
          </>
        }
        alertText={
          <>
            This will apply the selected version's work schedule, shift, and thresholds to all future computations. The current active settings will be saved as a new version.
          </>
        }
        confirmLabel="Yes, Restore Version"
        onConfirm={handleConfirmRestore}
        onCancel={() => setRestoringVersion(null)}
      />

      {/* Result Modal */}
      {resultModal.show && (
        <ResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Snackbar Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
