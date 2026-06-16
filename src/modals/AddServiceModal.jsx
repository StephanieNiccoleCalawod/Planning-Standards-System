import { useState } from "react";
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
  Alert
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export default function AddServiceModal({ onClose, onAdd, onEdit, onNext, service }) {
  const isEditing = !!service;

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
  const [responsibleUnit, setResponsibleUnit] = useState(service && service.responsibleUnit ? service.responsibleUnit : "");
  const [intakeDocuments, setIntakeDocuments] = useState(service && service.intakeDocuments ? service.intakeDocuments : "");
  const [stepsTimeline, setStepsTimeline] = useState(service && service.stepsTimeline ? service.stepsTimeline : "");
  const [expectedOutput, setExpectedOutput] = useState(service && service.expectedOutput ? service.expectedOutput : "");
  const [withReferral, setWithReferral] = useState(
    service && service.withReferral !== undefined
      ? (service.withReferral === true ? "with" : service.withReferral === false ? "without" : service.withReferral)
      : "with"
  );
  const [active, setActive] = useState(service ? service.active : true);
  
  const [showSlaWarning, setShowSlaWarning] = useState(false);
  const [pendingServiceData, setPendingServiceData] = useState(null);
  
  const [errors, setErrors] = useState({});

  const handleSave = () => {
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

    // Smart automatic classification based on SLA target (ARTA guidelines)
    let classification = "Simple";
    if (slaDays.trim()) {
      const days = parseInt(slaDays);
      if (days > 7) {
        classification = "Highly Technical";
      } else if (days > 3) {
        classification = "Complex";
      } else {
        classification = "Simple";
      }
    }

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
      classification,
      slaTarget,
      sla: slaTarget,
      responsibleUnit: responsibleUnit.trim() || "Registrar Office - Caloocan",
      active,
      withReferral,
      intakeDocuments,
      stepsTimeline,
      expectedOutput,
      lastUpdated: formattedDate,
    };

    // Intercept SLA target changes for warning confirmation
    if (isEditing && service.slaTarget !== slaTarget && !showSlaWarning) {
      setPendingServiceData(targetData);
      setShowSlaWarning(true);
      return;
    }

    if (isEditing) {
      if (onEdit) {
        onEdit(pendingServiceData || targetData);
      }
      onClose();
    } else {
      const newSvcData = {
        serviceName,
        classification,
        slaTarget,
        responsibleUnit: responsibleUnit.trim() || "Registrar Office - Caloocan",
        active,
        withReferral,
        intakeDocuments,
        stepsTimeline,
        expectedOutput,
        lastUpdated: formattedDate,
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
    <Dialog open onClose={onClose} sx={{ '& .MuiDialog-paper': { maxWidth: '500px', width: '100%', borderRadius: 2.5 } }}>
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
              color="primary"
              onClick={() => {
                if (onEdit && pendingServiceData) {
                  onEdit(pendingServiceData);
                }
                onClose();
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
              variant="outlined"
              size="small"
              sx={{ mt: 1, '& .MuiFormLabel-asterisk': { color: '#ef4444' } }}
            />

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
              placeholder="Registrar Office - Caloocan"
              required
              fullWidth
              value={responsibleUnit}
              error={!!errors.responsibleUnit}
              helperText={errors.responsibleUnit}
              onChange={(e) => {
                setResponsibleUnit(e.target.value);
                clearError("responsibleUnit");
              }}
              variant="outlined"
              size="small"
              sx={{ '& .MuiFormLabel-asterisk': { color: '#ef4444' } }}
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

            {/* Bottom Form flex row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              {/* Referral Radio Group */}
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Referral status
                </FormLabel>
                <RadioGroup
                  row
                  value={withReferral}
                  onChange={(e) => setWithReferral(e.target.value)}
                >
                  <FormControlLabel 
                    value="with" 
                    control={<Radio size="medium" />} 
                    label={<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>with referral</Typography>} 
                  />
                  <FormControlLabel 
                    value="without" 
                    control={<Radio size="medium" />} 
                    label={<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>without referral</Typography>} 
                  />
                  <FormControlLabel 
                    value="n/a" 
                    control={<Radio size="medium" />} 
                    label={<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>not applicable</Typography>} 
                  />
                </RadioGroup>
              </FormControl>

              {/* Toggle Switch */}
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
              color="primary"
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
