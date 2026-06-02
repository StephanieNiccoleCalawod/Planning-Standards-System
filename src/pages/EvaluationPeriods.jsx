



import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Snackbar,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import Toggle from "../components/Toggle";
import ResultModal from "../modals/ResultModal";

const mapTypeToBackend = (t) => {
  switch (t) {
    case "Quarterly": return "Quarterly";
    case "Semestral": return "Semester";
    case "Annual": return "Yearly";
    default: return "Semester";
  }
};

export default function EvaluationPeriods() {
  const {
    periods,
    fetchPeriods,
    createPeriod,
    closePeriod,
    deletePeriod
  } = useAppStore();

  const [showAdd, setShowAdd] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(null);

  // Add Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("Semestral");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeState, setActiveState] = useState(true);
  const [resultModal, setResultModal] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const activeExists = periods.some(p => p.status === "Active" || p.status === "Open");

  const handleOpenAdd = () => {
    setName("");
    setType("Semestral");
    setStartDate("");
    setEndDate("");
    setActiveState(true);
    setShowAdd(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      setResultModal({
        type: "error",
        title: "Missing Required Fields",
        message: "Please fill out all the required fields (Period Name, Start Date, and End Date)."
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setResultModal({
        type: "error",
        title: "Invalid Dates",
        message: "The end date cannot be earlier than the start date."
      });
      return;
    }

    // The backend automatically determines if it should be Open or Queued based on existing periods.
    // So we don't need to block creation here anymore.

    const payload = {
      name,
      period_type: mapTypeToBackend(type),
      start_date: startDate,
      end_date: endDate,
    };

    try {
      await createPeriod(payload);
      setResultModal({
        type: "success",
        title: "Success",
        message: "Evaluation period created successfully!"
      });
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      setResultModal({
        type: "error",
        title: "Error",
        message: err.message || "Failed to create evaluation period"
      });
    }
  };

  const handleCloseConfirm = async () => {
    if (!closingPeriod) return;
    try {
      await closePeriod(closingPeriod.id);
      setResultModal({
        type: "success",
        title: "Success",
        message: `Evaluation period "${closingPeriod.name}" is now closed.`
      });
      setClosingPeriod(null);
    } catch (err) {
      console.error(err);
      setResultModal({
        type: "error",
        title: "Error",
        message: err.message || "Failed to close evaluation period"
      });
    }
  };

  const handleDelete = async (period, e) => {
    e.stopPropagation();
    try {
      await deletePeriod(period.id);
      setResultModal({
        type: "success",
        title: "Success",
        message: "Evaluation period deleted successfully."
      });
    } catch (err) {
      console.error(err);
      setResultModal({
        type: "error",
        title: "Error",
        message: err.message || "Failed to delete evaluation period"
      });
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Top Header */}
      <PageHeader breadcrumb="Evaluation Periods" title="Evaluation Periods" />

      {/* Main Table Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Schedule Registry
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ bgcolor: '#800000', '&:hover': { bgcolor: '#990000' } }}
          >
            Create Evaluation Period
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>PERIOD NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>CYCLE TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>START DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>END DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', width: 140 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No evaluation periods defined. Click "Create Evaluation Period" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((p) => {
                  const startFmt = new Date(p.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const endFmt = new Date(p.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const isActive = p.status === "Active";

                  return (
                    <TableRow key={p.id} sx={{ opacity: isActive ? 1 : 0.7 }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>{p.name}</TableCell>
                      <TableCell>
                        <Chip label={p.type} size="small" sx={{ bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, borderRadius: 1 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{startFmt}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{endFmt}</TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            bgcolor: isActive ? '#ECFDF5' : '#F1F5F9',
                            color: isActive ? '#059669' : '#64748B',
                            border: isActive ? '1px solid rgba(5, 150, 105, 0.15)' : '1px solid rgba(100, 116, 139, 0.1)',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {isActive ? (
                            <Tooltip title="Close Period">
                              <IconButton
                                size="small"
                                onClick={() => setClosingPeriod(p)}
                                sx={{
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 1.5,
                                  color: '#D97706',
                                  '&:hover': { bgcolor: '#FFFBEB', borderColor: '#D97706' }
                                }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', py: 0.5, px: 1 }}>
                              Completed
                            </Typography>
                          )}
                          <Tooltip title="Delete Period">
                            <IconButton
                              size="small"
                              onClick={(e) => handleDelete(p, e)}
                              sx={{
                                border: '1px solid #CBD5E1',
                                borderRadius: 1.5,
                                color: '#EF4444',
                                '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' }
                              }}
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Period Modal Dialog */}
      <Dialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        sx={{ '& .MuiDialog-paper': { maxWidth: '440px', width: '100%', borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.35rem', pb: 1 }}>
          Create Evaluation Period
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Period Name"
            placeholder="e.g. 1st Semester AY 2026-2027"
            required
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 1 }}
          />

          <TextField
            select
            label="Evaluation Cycle Type"
            required
            fullWidth
            size="small"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <MenuItem value="Quarterly">Quarterly Review Cycle</MenuItem>
            <MenuItem value="Semestral">Semestral Academic Cycle</MenuItem>
            <MenuItem value="Annual">Annual Review Cycle</MenuItem>
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                  START DATE *
                </Typography>
                <TextField
                  type="date"
                  required
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                  END DATE *
                </Typography>
                <TextField
                  type="date"
                  required
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
            <Toggle 
              checked={activeExists ? false : activeState} 
              onChange={() => !activeExists && setActiveState(p => !p)} 
              disabled={activeExists}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, color: activeExists ? "text.disabled" : "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ACTIVE
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
            {activeExists 
              ? "An active period already exists. This new period will be saved as Queued and will automatically open when the current active period is closed."
              : "Only one evaluation period can be active at a time per office profile to maintain data consistency."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: '#800000', '&:hover': { bgcolor: '#990000' }, fontWeight: 600 }}
          >
            Create Period
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Period Confirmation Modal */}
      <Dialog
        open={Boolean(closingPeriod)}
        onClose={() => setClosingPeriod(null)}
        sx={{ '& .MuiDialog-paper': { maxWidth: '420px', width: '100%', borderRadius: 3, p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.35rem', pb: 1 }}>
          Close Period?
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Are you sure you want to close the evaluation period{" "}
            <strong style={{ color: "#800000" }}>"{closingPeriod?.name}"</strong>?
            <br />
            <br />
            Closing an evaluation period is permanent. All associated commitments, scores, and performance appraisals for this period will be archived and locked from active updates.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setClosingPeriod(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleCloseConfirm}
            variant="contained"
            sx={{ bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' }, fontWeight: 600 }}
          >
            Yes, Close Period
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Modal for Success/Error */}
      {resultModal && (
        <ResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(null)}
        />
      )}

    </Box>
  );
}
