import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  CircularProgress,
  Chip
} from "@mui/material";
import { useAppStore } from "../store/useAppStore";
import ConfirmModal from "./ConfirmModal";

const steps = ["Setup Period", "Select Services", "Define Targets & Lock"];

export default function CommitmentWizardModal({ open, onClose, commitmentId, readOnly }) {
  const {
    periods,
    services,
    kpis,
    commitments,
    activeCommitment,
    fetchPeriods,
    fetchServices,
    fetchKpis,
    fetchCommitments,
    fetchCommitmentById,
    createCommitmentDraft,
    updateCommitmentDraft,
    lockCommitment,
  } = useAppStore();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [kpiTargets, setKpiTargets] = useState({}); // { kpiId: value }
  
  const [draftId, setDraftId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Initialize data
  useEffect(() => {
    if (open) {
      setLoading(true);
      const promises = [
        fetchPeriods(),
        fetchServices(),
        fetchKpis()
      ];
      if (commitmentId) {
        promises.push(fetchCommitmentById(commitmentId));
      } else {
        promises.push(fetchCommitments({ status: 'Draft' }));
      }
      Promise.all(promises).then(() => setLoading(false));
    }
  }, [open, commitmentId]);

  // Load draft or selected commitment if it exists — only once on initial open
  const hasLoadedDraft = React.useRef(false);
  useEffect(() => {
    if (!open) {
      hasLoadedDraft.current = false; // Reset when modal closes
      return;
    }
    if (hasLoadedDraft.current || loading) return;
    
    if (commitmentId) {
      if (activeCommitment && String(activeCommitment.id) === String(commitmentId)) {
        hasLoadedDraft.current = true;
        setDraftId(activeCommitment.id);
        setSelectedPeriod(activeCommitment.period_id);
        const sIds = [...new Set(activeCommitment.items?.map(i => i.service_id) || [])];
        setSelectedServices(sIds);
        
        const targets = {};
        activeCommitment.items?.forEach(i => {
          if (i.target_value !== null && i.target_value !== undefined) {
            targets[i.kpi_id] = i.target_value;
          }
        });
        setKpiTargets(targets);
      }
    } else if (commitments.length > 0 || periods.length > 0) {
      hasLoadedDraft.current = true;
      const draft = commitments.find(c => c.status === "Draft");
      if (draft) {
        setDraftId(draft.id);
        setSelectedPeriod(draft.period_id);
        const sIds = [...new Set(draft.items?.map(i => i.service_id) || [])];
        setSelectedServices(sIds);
        
        const targets = {};
        draft.items?.forEach(i => {
          if (i.target_value !== null && i.target_value !== undefined) {
            targets[i.kpi_id] = i.target_value;
          }
        });
        setKpiTargets(targets);
      } else {
        // Auto-select active period if no draft
        const activePeriod = periods.find(p => p.status === "Active" || p.status === "Open");
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id);
        }
      }
    }
  }, [open, loading, commitmentId, activeCommitment, commitments, periods]);

  // Auto-save disabled by user request

  const saveDraft = async () => {
    if (!selectedPeriod) return;
    
    setAutoSaveStatus("Saving Draft...");
    
    // Build items array based on selected services and their kpis
    const items = [];
    selectedServices.forEach(sId => {
      const serviceKpis = kpis.filter(k => String(k.service_id) === String(sId) && k.active);
      serviceKpis.forEach(k => {
        items.push({
          service_id: sId,
          kpi_id: k.id,
          target_value: kpiTargets[k.id] ? Number(kpiTargets[k.id]) : null,
          unit: k.unit === "%" ? "PERCENT" : (k.unit === " Days" ? "DAYS" : "COUNT")
        });
      });
    });

    try {
      if (draftId) {
        await updateCommitmentDraft(draftId, { items });
      } else {
        const newDraft = await createCommitmentDraft({
          period_id: selectedPeriod,
          items
        });
        setDraftId(newDraft.id);
      }
      setAutoSaveStatus("Draft Saved");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    } catch (err) {
      console.error("Save draft failed", err);
      setAutoSaveStatus("Save Failed");
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleToggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleTargetChange = (kpiId, value) => {
    setKpiTargets(prev => ({ ...prev, [kpiId]: value }));
  };

  const handleLock = async () => {
    try {
      await lockCommitment(draftId);
      setShowLockConfirm(false);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to lock commitment.");
      setShowLockConfirm(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  const displayPeriods = periods.filter(p => p.status === "Active" || p.status === "Open" || p.id === selectedPeriod);
  const availableServices = services.filter(s => {
    if (selectedServices.includes(s.id)) return true; // Always show selected services
    if (!s.active) return false;
    // Check if flagged N/A for the currently selected period
    if (selectedPeriod && Array.isArray(s.naFlags) && s.naFlags.some(f => String(f.period_id) === String(selectedPeriod))) {
      return false;
    }
    return true;
  });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3, minHeight: '600px' } }}>
        <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
          OPCR Commitment Wizard
          {autoSaveStatus && (
            <Typography variant="caption" sx={{ float: 'right', color: autoSaveStatus === 'Save failed' ? 'error.main' : 'text.secondary', mt: 1 }}>
              {autoSaveStatus}
            </Typography>
          )}
        </DialogTitle>

        <Box sx={{ width: '100%', p: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <DialogContent sx={{ bgcolor: '#F8FAFC', p: 3 }}>
          {activeStep === 0 && (
            <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1E293B', fontWeight: 600 }}>Select Evaluation Period</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                You can only create commitments for an currently Active evaluation period.
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Evaluation Period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                disabled={!!draftId || readOnly}
              >
                {displayPeriods.length === 0 && (
                  <MenuItem disabled value="">No active periods available</MenuItem>
                )}
                {displayPeriods.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
              {draftId && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Continuing from an existing draft. Period selection is locked.
                </Typography>
              )}
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#1E293B', fontWeight: 600 }}>Select Services</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Select the services your office will commit to for this period. Services flagged as N/A are hidden.
              </Typography>
              
              <Paper sx={{ maxHeight: 350, overflow: 'auto', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <List dense>
                  {availableServices.length === 0 ? (
                    <ListItem><ListItemText primary="No active applicable services found." /></ListItem>
                  ) : (
                    availableServices.map((svc) => {
                      const labelId = `checkbox-list-label-${svc.id}`;
                      return (
                        <ListItem key={svc.id} disablePadding sx={{ borderBottom: '1px solid #F1F5F9' }}>
                          <Button 
                            onClick={() => !readOnly && handleToggleService(svc.id)} 
                            fullWidth 
                            disabled={readOnly}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5, color: 'inherit', textTransform: 'none' }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={selectedServices.includes(svc.id)}
                                tabIndex={-1}
                                disableRipple
                                disabled={readOnly}
                                inputProps={{ 'aria-labelledby': labelId }}
                              />
                            </ListItemIcon>
                            <ListItemText 
                              id={labelId} 
                              primary={<Typography sx={{ fontWeight: 500 }}>{svc.name}</Typography>} 
                              secondary={<Typography variant="caption" color="text.secondary">{svc.classification}</Typography>}
                            />
                          </Button>
                        </ListItem>
                      );
                    })
                  )}
                </List>
              </Paper>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#1E293B', fontWeight: 600 }}>Define Targets</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Set the target values for each KPI. All targets must be greater than 0 before locking. Drafts are auto-saved.
              </Typography>
              
              {selectedServices.length === 0 ? (
                <Typography color="error">No services selected. Go back to Step 2.</Typography>
              ) : (
                <Box sx={{ maxHeight: 380, overflow: 'auto' }}>
                  {selectedServices.map(sId => {
                    const svc = services.find(s => s.id === sId);
                    const serviceKpis = kpis.filter(k => String(k.service_id) === String(sId) && k.active);
                    
                    if (serviceKpis.length === 0) return null;
                    
                    return (
                      <Paper key={sId} sx={{ p: 2, mb: 2, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                        <Typography sx={{ fontWeight: 600, color: '#0F172A', mb: 2 }}>{svc?.name}</Typography>
                        {serviceKpis.map(kpi => (
                          <Box key={kpi.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{kpi.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {kpi.category} • Target Unit: {kpi.unit}
                              </Typography>
                            </Box>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="0"
                              value={kpiTargets[kpi.id] || ""}
                              onChange={(e) => handleTargetChange(kpi.id, e.target.value)}
                              disabled={readOnly}
                              sx={{ width: 120, ml: 2 }}
                              InputProps={{
                                endAdornment: kpi.unit === "%" ? <Typography variant="caption" sx={{ ml: 1 }}>%</Typography> : null
                              }}
                            />
                          </Box>
                        ))}
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={onClose} color="inherit" sx={{ mr: 'auto' }}>
            Close
          </Button>
          
          {activeStep > 0 && !readOnly && (
            <Button
              variant="outlined"
              onClick={saveDraft}
              sx={{
                color: '#800000',
                borderColor: '#800000',
                '&:hover': {
                  bgcolor: 'rgba(128, 0, 0, 0.04)',
                  borderColor: '#990000',
                  color: '#990000'
                },
                fontWeight: 600
              }}
            >
              Save as Draft
            </Button>
          )}
          
          <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
            Back
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext} 
              disabled={activeStep === 0 && !selectedPeriod}
              sx={{ bgcolor: '#800000', '&:hover': { bgcolor: '#990000' } }}
            >
              Next
            </Button>
          ) : !readOnly ? (
            <Button 
              variant="contained" 
              color="success" 
              onClick={() => setShowLockConfirm(true)}
              disabled={selectedServices.length === 0}
            >
              Lock & Submit
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      {showLockConfirm && (
        <ConfirmModal
          open={showLockConfirm}
          title="Lock Commitment?"
          body="Are you sure you want to lock and submit this commitment? Once locked, it cannot be edited, and it will serve as the official basis for the evaluation period."
          confirmLabel="Yes, Lock & Submit"
          onConfirm={handleLock}
          onCancel={() => setShowLockConfirm(false)}
        />
      )}
    </>
  );
}
