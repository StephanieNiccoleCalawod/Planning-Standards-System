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
  Divider
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon, MoreVert as MoreVertIcon } from "@mui/icons-material";
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
    userRole
  } = useAppStore();

  const [showWizard, setShowWizard] = useState(false);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState(null);
  const [wizardReadOnly, setWizardReadOnly] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [viewCommitmentId, setViewCommitmentId] = useState(null);
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "" });

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

  const isStaff = userRole === 'Staff';

  // Determine if a locked commitment already exists for the active period
  const activePeriod = periods.find(p => p.status === 'Active' || p.status === 'Open');
  const lockedCommitmentForActivePeriod = activePeriod
    ? commitments.find(c => String(c.period_id) === String(activePeriod.id) && c.status === 'Locked')
    : null;
  const isCreateBlocked = !isStaff && !!lockedCommitmentForActivePeriod;

  useEffect(() => {
    fetchPeriods();
    fetchCommitments();
  }, []);

  const getPeriodName = (periodId) => {
    const p = periods.find(p => p.id === periodId);
    return p ? p.name : "Unknown Period";
  };

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
      <PageHeader breadcrumb="Commitments" title="OPCR Commitments" />

      <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Office Commitments Registry
          </Typography>
          {!isStaff && (
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
                  sx={{ bgcolor: isCreateBlocked ? undefined : '#800000', '&:hover': { bgcolor: '#990000' } }}
                >
                  Create / Edit Commitment
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC', '& .MuiTableCell-root': { py: 1.5, whiteSpace: 'nowrap' } }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>PERIOD</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>LAST UPDATED</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', width: 140 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commitments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No commitments found. Click "Create / Edit Commitment" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                commitments.map((c) => {
                  const updatedFmt = new Date(c.updated_at || c.created_at).toLocaleString("en-US", { 
                    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                  });
                  const isLocked = c.status === "Locked";

                  return (
                    <TableRow 
                      key={c.id}
                      hover
                      sx={{
                        '& .MuiTableCell-root': {
                          py: 1.5,
                          borderBottom: '1px solid #CBD5E1',
                          boxShadow: 'inset 0 -1.5px 0 0 rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>{getPeriodName(c.period_id)}</TableCell>
                      <TableCell>
                        <Chip
                          label={c.status}
                          size="small"
                          sx={{
                            bgcolor: isLocked ? '#ECFDF5' : '#FFFBEB',
                            color: isLocked ? '#059669' : '#D97706',
                            border: isLocked ? '1px solid rgba(5, 150, 105, 0.15)' : '1px solid rgba(217, 119, 6, 0.15)',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.85rem' }}>{updatedFmt}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Actions" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, c)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                              },
                              width: 32,
                              height: 32
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 20 }} />
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

        {selectedCommitment && !(selectedCommitment.status === "Locked" || isStaff) && (
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
