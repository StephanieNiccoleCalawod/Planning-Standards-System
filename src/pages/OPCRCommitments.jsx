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
  Tooltip
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import CommitmentWizardModal from "../modals/CommitmentWizardModal";

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

  const isStaff = userRole === 'Staff';

  useEffect(() => {
    fetchPeriods();
    fetchCommitments();
  }, []);

  const getPeriodName = (periodId) => {
    const p = periods.find(p => p.id === periodId);
    return p ? p.name : "Unknown Period";
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <PageHeader breadcrumb="Commitments" title="OPCR Commitments" />

      <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Office Commitments Registry
          </Typography>
          {!isStaff && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowWizard(true)}
              sx={{ bgcolor: '#800000', '&:hover': { bgcolor: '#990000' } }}
            >
              Create / Edit Commitment
            </Button>
          )}
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
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
                    <TableRow key={c.id}>
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
                        <Tooltip title={isLocked || isStaff ? "View Details" : "Edit Draft"}>
                          <IconButton
                            size="small"
                            onClick={() => setShowWizard(true)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'rgba(25, 118, 210, 0.2)',
                              bgcolor: 'rgba(25, 118, 210, 0.04)',
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                              width: 32, height: 32
                            }}
                          >
                            {isLocked || isStaff ? <VisibilityIcon fontSize="small" /> : <EditIcon fontSize="small" />}
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
          readOnly={isStaff}
          onClose={() => {
            setShowWizard(false);
            fetchCommitments();
          }}
        />
      )}
    </Box>
  );
}
