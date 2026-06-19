import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreHoriz as MoreHorizIcon,
  Lock as LockIcon,
  EditNote as DraftIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  AssignmentTurnedIn as RegistryIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import CommitmentWizardModal from "../modals/CommitmentWizardModal";
import ViewCommitmentDetail from "./ViewCommitmentDetail";
import ResultModal from "../modals/ResultModal";

export default function OPCRCommitments() {
  const {
    commitments,
    periods,
    fetchCommitments,
    fetchPeriods,
    userRole,
    permissions,
  } = useAppStore();

  const [showWizard, setShowWizard] = useState(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState(null);
  const [wizardReadOnly, setWizardReadOnly] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [viewCommitmentId, setViewCommitmentId] = useState(null);
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCommitment, setSelectedCommitment] = useState(null);

  const handleMenuOpen = (event, commitment) => {
    setAnchorEl(event.currentTarget);
    setSelectedCommitment(commitment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    if (selectedCommitment) {
      setSelectedCommitmentId(selectedCommitment.id);
      setWizardReadOnly(false);
      setShowWizard(true);
    }
    handleMenuClose();
  };

  const handleViewClick = () => {
    if (selectedCommitment) {
      setViewCommitmentId(selectedCommitment.id);
      setShowViewDetails(true);
    }
    handleMenuClose();
  };

  // Only OPCR Evaluator can write commitments
  const canWriteCommitments = permissions?.canWriteCommitments || false;

  // Determine if a locked commitment already exists for the active period
  const activePeriod = periods.find(p => p.status === 'Active' || p.status === 'Open');
  const lockedCommitmentForActivePeriod = activePeriod
    ? commitments.find(c => String(c.period_id) === String(activePeriod.id) && c.status === 'Locked')
    : null;
  const isCreateBlocked = canWriteCommitments && !!lockedCommitmentForActivePeriod;

  useEffect(() => {
    fetchPeriods();
    fetchCommitments();
  }, []);

  const getPeriodName = (periodId) => {
    const p = periods.find(p => p.id === periodId);
    return p ? p.name : "Unknown Period";
  };

  const filteredCommitments = commitments.filter(c => {
    const periodName = getPeriodName(c.period_id).toLowerCase();
    const status = c.status.toLowerCase();
    return periodName.includes(searchQuery.toLowerCase()) || status.includes(searchQuery.toLowerCase());
  });

  if (showViewDetails && viewCommitmentId) {
    return (
      <ViewCommitmentDetail
        commitmentId={viewCommitmentId}
        onBack={() => {
          setShowViewDetails(false);
          setViewCommitmentId(null);
        }}
      />
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <PageHeader breadcrumb="Commitments" title="OPCR Commitments" subtitle="View and manage your office performance commitment reports." />

      {/* Search Card */}
      <Card sx={{ p: 2, mb: 3, borderRadius: "8px", border: '1px solid #E2E8F0', boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Search period..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="disabled" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: 240,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: '#ffffff',
              }
            }}
          />
          {canWriteCommitments && (
            <Tooltip
              title={
                isCreateBlocked
                  ? `A locked commitment already exists for "${activePeriod?.name}". Only one commitment per period is allowed.`
                  : ""
              }
              arrow
              disableHoverListener={!isCreateBlocked}
            >
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  disabled={isCreateBlocked}
                  onClick={() => {
                    setSelectedCommitmentId(null);
                    setWizardReadOnly(false);
                    setShowWizard(true);
                  }}
                  sx={{ bgcolor: isCreateBlocked ? undefined : '#800000', '&:hover': { bgcolor: '#990000' }, borderRadius: 2, py: 1, px: 2.5, fontWeight: 600, textTransform: 'none'}}
                >
                  Create / Edit Commitment
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Card>

      {/* Main Table Card */}
      <Card sx={{ borderRadius: "8px", border: '1px solid #E2E8F0', mb: 3, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#580000', '& .MuiTableCell-root': { py: 1.5, whiteSpace: 'nowrap' } }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', pl: 3 }}>PERIOD</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>LAST UPDATED</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', width: 140 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCommitments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {searchQuery ? "No commitments match your search query." : "No commitments found. Click \"Create / Edit Commitment\" to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommitments.map((c) => {
                  const updatedFmt = new Date(c.updated_at || c.created_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                  });
                  const isLocked = c.status === "Locked";
                  const period = periods.find(p => p.id === c.period_id);
                  const periodName = period ? period.name : "Unknown Period";
                  const periodDates = period
                    ? `${new Date(period.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(period.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "";
                  const cycleType = period ? period.type : "";

                  return (
                    <TableRow
                      key={c.id}
                      hover
                      sx={{
                        borderLeft: `4px solid ${isLocked ? '#10B981' : '#F59E0B'}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(248, 250, 252, 0.8)',
                          transform: 'translateX(2px)'
                        },
                        '& .MuiTableCell-root': {
                          py: 2,
                          borderBottom: '1px solid #CBD5E1',
                          boxShadow: 'inset 0 -1.5px 0 0 rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            bgcolor: isLocked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isLocked ? '#10B981' : '#F59E0B'
                          }}>
                            <CalendarIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>
                                {periodName}
                              </Typography>
                              {cycleType && (
                                <Chip
                                  label={cycleType}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    bgcolor: '#F1F5F9',
                                    color: '#475569',
                                    borderRadius: '4px'
                                  }}
                                />
                              )}
                            </Box>
                            {periodDates && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                                {periodDates}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.status}
                          size="small"
                          icon={
                            isLocked
                              ? <LockIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} />
                              : <DraftIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} />
                          }
                          sx={{
                            bgcolor: isLocked ? '#ECFDF5' : '#FFFBEB',
                            color: isLocked ? '#059669' : '#D97706',
                            border: isLocked ? '1px solid rgba(5, 150, 105, 0.15)' : '1px solid rgba(217, 119, 6, 0.15)',
                            fontWeight: 700,
                            px: 1,
                            '& .MuiChip-icon': {
                              color: 'inherit'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <TimeIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                          <Typography sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {updatedFmt}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Actions" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, c)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                bgcolor: '#F1F5F9',
                              },
                              width: 32,
                              height: 32
                            }}
                          >
                            <MoreHorizIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {showWizard && (
        <CommitmentWizardModal
          open={showWizard}
          commitmentId={selectedCommitmentId}
          readOnly={wizardReadOnly}
          onClose={(saved) => {
            setShowWizard(false);
            setSelectedCommitmentId(null);
            setWizardReadOnly(false);
            fetchCommitments();
            if (saved === true) {
              setResultModal({
                show: true,
                type: "success",
                title: "Draft Saved Successfully!",
                message: "Your commitment draft has been saved successfully."
              });
            } else if (saved === 'locked') {
              setResultModal({
                show: true,
                type: "success",
                title: "Commitment Locked & Submitted!",
                message: "Your commitment has been locked and submitted successfully."
              });
            }
          }}
        />
      )}
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionProps={{
          onExited: () => setSelectedCommitment(null)
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: {
              minWidth: 180,
              borderRadius: 2,
              mt: 0.5,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
              '& .MuiMenuItem-root': {
                py: 1.2,
                px: 2,
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleViewClick}>
          <VisibilityIcon sx={{ mr: 1.5, color: '#0284c7', fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>View Commitment</Typography>
        </MenuItem>

        {selectedCommitment && !(selectedCommitment.status === "Locked") && canWriteCommitments && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleEditClick}>
              <EditIcon sx={{ mr: 1.5, color: '#800000', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Edit Draft</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {resultModal.show && (
        <ResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(prev => ({ ...prev, show: false }))}
        />
      )}
    </Box>
  );
}
