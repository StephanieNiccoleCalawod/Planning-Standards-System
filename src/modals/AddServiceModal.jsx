import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAppStore } from "../store/useAppStore";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Typography,
  Box,
  Alert,
  MenuItem,
  Autocomplete,
  Chip
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export default function AddServiceModal({ onClose, onAdd, onEdit, onNext, service }) {
  const isEditing = service ? !service.isNew : false;

  // Helper to parse SLA Target to extract both days and minutes
  const parseSla = (field) => {
    if (!service || !service[field]) return { days: "", hours: "", minutes: "" };
    const val = service[field];
    const matchDays = val.match(/(\d+)\s*d/i) || val.match(/(\d+)\s*Day/i);
    const matchHours = val.match(/(\d+)\s*h/i) || val.match(/(\d+)\s*Hour/i);
    const matchMins = val.match(/(\d+)\s*m/i) || val.match(/(\d+)\s*Min/i) || val.match(/(\d+)\s*Minute/i);
    return {
      days: matchDays ? matchDays[1] : "",
      hours: matchHours ? matchHours[1] : "",
      minutes: matchMins ? matchMins[1] : ""
    };
  };

  const initialSla = parseSla("slaTarget");

  const [serviceName, setServiceName] = useState(service ? service.name : "");
  const [slaDays, setSlaDays] = useState(initialSla.days);
  const [slaHours, setSlaHours] = useState(initialSla.hours);
  const [slaMinutes, setSlaMinutes] = useState(initialSla.minutes);
  const { activeUser } = useAppStore();

  const getOfficeDisplayName = (officeCode) => {
    switch (officeCode) {
      case 'ACAD':
        return "Academic Affairs";
      case 'OSAS':
        return "OSAS";
      case 'ADMIN':
        return "Administration";
      default:
        return officeCode || "";
    }
  };

  const [responsibleUnit, setResponsibleUnit] = useState(() => {
    if (service && service.responsibleUnit) {
      return service.responsibleUnit;
    }
    return activeUser ? getOfficeDisplayName(activeUser.office) : "";
  });

  useEffect(() => {
    if (!service || service.isNew) {
      if (activeUser) {
        setResponsibleUnit(getOfficeDisplayName(activeUser.office));
      }
    }
  }, [activeUser, service]);
  const [intakeDocuments, setIntakeDocuments] = useState(service && service.intakeDocuments ? service.intakeDocuments : "");
  const [stepsTimeline, setStepsTimeline] = useState(service && service.stepsTimeline ? service.stepsTimeline : "");
  const [expectedOutput, setExpectedOutput] = useState(service && service.expectedOutput ? service.expectedOutput : "");
  const [classification, setClassification] = useState(() => {
    if (service && service.classification) {
      return service.classification;
    }
    return "";
  });
  
  const [selectedModeId, setSelectedModeId] = useState(() => {
    if (service && service.classification && service.classification.trim() !== "") {
      return 'other';
    }
    if (service && Array.isArray(service.modes) && service.modes.length > 0) {
      return service.modes[0].id;
    }
    return '';
  });
  const [availableModes, setAvailableModes] = useState([]);
  const [loadingModes, setLoadingModes] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchModes = async () => {
      setLoadingModes(true);
      try {
        const res = await api.getServiceModes();
        if (isMounted) {
          setAvailableModes(res || []);
        }
      } catch (err) {
        console.error("Failed to load service modes:", err);
      } finally {
        if (isMounted) {
          setLoadingModes(false);
        }
      }
    };
    fetchModes();
    return () => {
      isMounted = false;
    };
  }, []);

  const [active, setActive] = useState(service ? service.active : true);

  const [showSlaWarning, setShowSlaWarning] = useState(false);
  const [pendingServiceData, setPendingServiceData] = useState(null);

  const [errors, setErrors] = useState({});
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    let active = true;
    api.getOffices()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (active) {
          const activeOffices = list.filter(o => o.isActive !== false).map(o => o.name);
          if (responsibleUnit && !activeOffices.includes(responsibleUnit)) {
            activeOffices.push(responsibleUnit);
          }
          setOffices(activeOffices);
        }
      })
      .catch(err => {
        console.error("Failed to load offices", err);
        if (active) {
          setOffices([
            "Quality Assurance",
            "Records Office",
            "Academic Affairs",
            "Laboratory Division",
            "Research Office",
            "Library Services",
            "Alumni Relations",
            "Registrar Office",
            "IT Department",
            "OSAS",
            "Medical Services",
            "Dental Services"
          ]);
        }
      });
    return () => { active = false; };
  }, [responsibleUnit]);

  const handleSave = async () => {
    const e = {};

    const countAlphanumeric = (str) => {
      if (!str) return 0;
      return (str.match(/[a-zA-Z0-9]/g) || []).length;
    };

    if (!serviceName || !serviceName.trim()) {
      e.serviceName = "Service name is required.";
    } else if (serviceName.trim().length < 3) {
      e.serviceName = "Service name must be at least 3 characters.";
    } else if (serviceName.length > 100) {
      e.serviceName = "Service name must not exceed 100 characters.";
    }

    const daysStr = slaDays ? String(slaDays).trim() : "";
    const hoursStr = slaHours ? String(slaHours).trim() : "";
    const minsStr = slaMinutes ? String(slaMinutes).trim() : "";

    if (!daysStr && !hoursStr && !minsStr) {
      e.slaDays = true;
      e.slaHours = true;
      e.slaMinutes = true;
    } else {
      if (daysStr) {
        const daysVal = Number(daysStr);
        if (!/^\d+$/.test(daysStr) || isNaN(daysVal) || daysVal < 0) {
          e.slaDays = "Days must be a non-negative whole number.";
        }
      }

      if (hoursStr) {
        const hoursVal = Number(hoursStr);
        if (!/^\d+$/.test(hoursStr) || isNaN(hoursVal) || hoursVal < 0 || hoursVal > 23) {
          e.slaHours = "Hours must be a whole number between 0 and 23.";
        }
      }

      if (minsStr) {
        const minsVal = Number(minsStr);
        if (!/^\d+$/.test(minsStr) || isNaN(minsVal) || minsVal < 0 || minsVal > 59) {
          e.slaMinutes = "Minutes must be a whole number between 0 and 59.";
        }
      }

      if (!daysStr) {
        if (!hoursStr && !minsStr) {
          e.slaMinutes = "If Working Day is empty, at least Hours or Minutes must be provided.";
        }
      }
    }

    if (!responsibleUnit || !responsibleUnit.trim()) {
      e.responsibleUnit = "Responsible Office/Unit is required.";
    } else if (countAlphanumeric(responsibleUnit) < 3) {
      e.responsibleUnit = "Must contain at least 3 alphanumeric characters.";
    }

    if (intakeDocuments && intakeDocuments.length > 500) {
      e.intakeDocuments = "Required documents list must not exceed 500 characters.";
    }

    if (stepsTimeline) {
      if (stepsTimeline.length > 1000) {
        e.stepsTimeline = "Processing steps must not exceed 1000 characters.";
      } else if (stepsTimeline.trim() !== "" && countAlphanumeric(stepsTimeline) < 3) {
        e.stepsTimeline = "Must contain at least 3 alphanumeric characters.";
      }
    }

    if (expectedOutput) {
      if (expectedOutput.length > 300) {
        e.expectedOutput = "Expected output must not exceed 300 characters.";
      } else if (expectedOutput.trim() !== "" && countAlphanumeric(expectedOutput) < 3) {
        e.expectedOutput = "Must contain at least 3 alphanumeric characters.";
      }
    }

    if (selectedModeId === 'other') {
      if (!classification || !classification.trim()) {
        e.classification = "Please specify the service delivery mode.";
      } else if (classification.length > 150) {
        e.classification = "Service mode must not exceed 150 characters.";
      }
    }

    if (!selectedModeId) {
      e.modeIds = "Service delivery mode is required.";
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    // Determine target SLA string
    let slaTarget = "";
    const daysPart = slaDays.trim() ? `${slaDays}d` : "";
    const hoursPart = slaHours.trim() ? `${slaHours}h` : "";
    const minsPart = slaMinutes.trim() ? `${slaMinutes}m` : "";

    const timeParts = [daysPart, hoursPart, minsPart].filter(Boolean);
    slaTarget = timeParts.length > 0 ? timeParts.join(" ") : "—";

    // Handle classification: prioritize user input, store null if empty (only if 'other' is selected)
    let finalClassification = null;
    if (selectedModeId === 'other') {
      finalClassification = classification && classification.trim() !== "" ? classification.trim() : null;
    }

    // Map single mode ID to an array format expected by the backend
    const finalModeIds = selectedModeId && selectedModeId !== 'other' ? [selectedModeId] : [];

    // Format last updated date and time
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const h = String(today.getHours()).padStart(2, '0');
    const m = String(today.getMinutes()).padStart(2, '0');
    const formattedDate = `${mm}/${dd}/${yy} ${h}:${m}`;

    const targetData = {
      ...service,
      name: serviceName,
      classification: finalClassification,
      slaTarget,
      sla: slaTarget,
      responsibleUnit: responsibleUnit.trim() || "Registrar Office - Caloocan",
      active,
      withReferral: service?.withReferral,
      intakeDocuments,
      stepsTimeline,
      expectedOutput,
      lastUpdated: formattedDate,
      mode_ids: finalModeIds,
    };

    // Intercept SLA target changes for warning confirmation
    if (isEditing && service.slaTarget !== slaTarget && !showSlaWarning) {
      setPendingServiceData(targetData);
      setShowSlaWarning(true);
      return;
    }

    if (isEditing) {
      if (onEdit) {
        try {
          await onEdit(pendingServiceData || targetData);
          onClose();
        } catch (err) {
          console.error("Save service failed:", err);
          // Keep the modal open and exit warning mode if it was active
          setShowSlaWarning(false);
        }
      } else {
        onClose();
      }
    } else {
      const newSvcData = {
        serviceName,
        classification: finalClassification,
        slaTarget,
        responsibleUnit: responsibleUnit.trim() || "Registrar Office - Caloocan",
        active,
        withReferral: undefined,
        intakeDocuments,
        stepsTimeline,
        expectedOutput,
        lastUpdated: formattedDate,
        mode_ids: finalModeIds,
      };
      // If onNext is provided, hand off to the next step (Intake Field Builder)
      if (onNext) {
        onNext(newSvcData);
      } else if (onAdd) {
        onAdd(newSvcData);
        onClose();
      }
    }
  };

  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: false }));
  };

  return (
    <Dialog
      open
      onClose={(e, reason) => {
        if (reason !== "backdropClick") {
          onClose(e, reason);
        }
      }}
      sx={{ '& .MuiDialog-paper': { maxWidth: '500px', width: '100%', borderRadius: 2.5 } }}
    >
      {showSlaWarning ? (
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "#FFFBEB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
              flexShrink: 0,
              border: "1px solid rgba(217, 119, 6, 0.15)"
            }}>
              <WarningAmberRoundedIcon fontSize="medium" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              SLA Change Warning
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.65 }}>
            You are updating the SLA Target for <strong style={{ color: "#800000" }}>"{serviceName}"</strong>.
            <br /><br />
            Changing the SLA Target will officially create a historical version record in the <strong>service_versions</strong> database table to maintain an audit trail under Citizens' Charter guidelines.
          </Typography>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 2,
            p: 2,
            mb: 4
          }}>
            <div>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                Old SLA Target
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {service?.slaTarget || service?.sla || "—"}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled", textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                New SLA Target
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                {pendingServiceData?.slaTarget}
              </Typography>
            </div>
          </Box>

          <DialogActions sx={{ p: 0, gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                setShowSlaWarning(false);
                setPendingServiceData(null);
              }}
            >
              Go Back &amp; Edit
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#15803D',
                '&:hover': { bgcolor: '#166534' }
              }}
              onClick={async () => {
                if (onEdit && pendingServiceData) {
                  try {
                    await onEdit(pendingServiceData);
                    onClose();
                  } catch (err) {
                    console.error("Save service failed after warning:", err);
                    setShowSlaWarning(false);
                  }
                } else {
                  onClose();
                }
              }}
            >
              Confirm &amp; Save SLA
            </Button>
          </DialogActions>
        </Box>
      ) : (
        <>
          <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.35rem', pb: 1 }}>
            {isEditing ? "Edit Service Catalogue" : "Create New Service Catalogue"}
          </DialogTitle>

          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Service Name */}
            <TextField
              label="Official Service Name"
              placeholder="e.g. Processing of Application for Graduation"
              required
              fullWidth
              value={serviceName}
              error={!!errors.serviceName}
              helperText={errors.serviceName}
              onChange={(e) => {
                setServiceName(e.target.value);
                clearError("serviceName");
              }}
              inputProps={{ maxLength: 100 }}
              variant="outlined"
              size="small"
              sx={{ mt: 1, '& .MuiFormLabel-asterisk': { color: '#ef4444' } }}
            />

            {/* Service Delivery Mode (Single-select Dropdown) */}
            <TextField
              select
              label={availableModes.length === 0 ? "No modes configured" : "Service Delivery Mode *"}
              value={selectedModeId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedModeId(val);
                if (val !== 'other') {
                  setClassification('');
                }
                setErrors(prev => ({ ...prev, modeIds: false }));
              }}
              disabled={availableModes.length === 0}
              fullWidth
              size="small"
              error={!!errors.modeIds}
              helperText={errors.modeIds}
              required={availableModes.length > 0}
              sx={{ '& .MuiFormLabel-asterisk': { color: '#ef4444' } }}
            >
              {[...availableModes, { id: 'other', name: 'Other' }].map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Custom Delivery Mode Specification */}
            {selectedModeId === 'other' && (
              <TextField
                label="Please specify"
                placeholder="e.g. Walk-in, Mobile App, Courier"
                required
                fullWidth
                value={classification}
                error={!!errors.classification}
                helperText={errors.classification}
                onChange={(e) => {
                  setClassification(e.target.value);
                  clearError("classification");
                }}
                inputProps={{ maxLength: 150 }}
                variant="outlined"
                size="small"
                sx={{ '& .MuiFormLabel-asterisk': { color: '#ef4444' } }}
              />
            )}

            {/* SLA Inputs */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                SLA TARGETS <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                <TextField
                  label="Working Day (Days)"
                  placeholder="Days"
                  value={slaDays}
                  error={!!errors.slaDays}
                  helperText={typeof errors.slaDays === "string" ? errors.slaDays : ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSlaDays(val);
                    clearError("slaDays");
                    clearError("slaMinutes");
                    clearError("slaHours");
                  }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Hours"
                  placeholder="Hours"
                  value={slaHours}
                  error={!!errors.slaHours}
                  helperText={errors.slaHours}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSlaHours(val);
                    clearError("slaDays");
                    clearError("slaMinutes");
                    clearError("slaHours");
                  }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Mins"
                  placeholder="Mins"
                  value={slaMinutes}
                  error={!!errors.slaMinutes}
                  helperText={typeof errors.slaMinutes === "string" ? errors.slaMinutes : ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSlaMinutes(val);
                    clearError("slaDays");
                    clearError("slaMinutes");
                    clearError("slaHours");
                  }}
                  variant="outlined"
                  size="small"
                />
              </Box>
              {(errors.slaDays || errors.slaHours || errors.slaMinutes) && typeof errors.slaDays !== "string" && typeof errors.slaHours !== "string" && typeof errors.slaMinutes !== "string" && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 500 }}>
                  At least one SLA target (Days, Hours, or Minutes) must be provided.
                </Typography>
              )}
            </Box>

            {/* Responsible Office */}
            <TextField
              label="Responsible Office/Unit"
              required
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              value={responsibleUnit}
              error={!!errors.responsibleUnit}
              helperText={errors.responsibleUnit}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiFormLabel-asterisk': { color: '#ef4444' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8fafc',
                }
              }}
            />


            {/* Steps Timeline */}
            <TextField
              label="Processing Steps Timeline (One per line)"
              placeholder="Receive document, Verify details, Release document"
              multiline
              rows={3}
              fullWidth
              value={stepsTimeline}
              error={!!errors.stepsTimeline}
              helperText={errors.stepsTimeline}
              onChange={(e) => {
                setStepsTimeline(e.target.value);
                clearError("stepsTimeline");
              }}
              variant="outlined"
              size="small"
            />

            {/* Expected Output */}
            <TextField
              label="Expected Output"
              placeholder="Official Document"
              fullWidth
              value={expectedOutput}
              error={!!errors.expectedOutput}
              helperText={errors.expectedOutput}
              onChange={(e) => {
                setExpectedOutput(e.target.value);
                clearError("expectedOutput");
              }}
              variant="outlined"
              size="small"
            />

            {/* Toggle Switch */}
            <Box sx={{ mt: 1 }}>
              <FormControlLabel
                control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} color="primary" />}
                label="ACTIVE"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    letterSpacing: '0.05em'
                  }
                }}
              />
            </Box>


          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={isEditing ? {
                bgcolor: '#15803D',
                '&:hover': { bgcolor: '#166534' }
              } : {
                bgcolor: '#800000',
                '&:hover': { bgcolor: '#990000' }
              }}
              onClick={handleSave}
            >
              {isEditing ? "Save Changes" : "Next"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
