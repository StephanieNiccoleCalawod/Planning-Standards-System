import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Tabs,
  Tab,
  TextField,
  MenuItem,
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
  Snackbar,
  Alert,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import SettingsIcon from '@mui/icons-material/Settings';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOffIcon from '@mui/icons-material/FlagOutlined';

import PageHeader from "../components/PageHeader";
import AddServiceModal from "../modals/AddServiceModal";
import DeactivateModal from "../modals/DeactivateModal";
import IntakeFieldBuilderModal from "../modals/IntakeFieldBuilderModal";
import ResultModal from "../modals/ResultModal";
import NaFlagModal from "../modals/NaFlagModal";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

const parseSlaTarget = (targetStr) => {
  if (!targetStr) return { days: 0, hours: 0, minutes: 0 };
  const matchDays = targetStr.match(/(\d+)\s*d/i) || targetStr.match(/(\d+)\s*Day/i);
  const matchHours = targetStr.match(/(\d+)\s*h/i) || targetStr.match(/(\d+)\s*Hour/i);
  const matchMins = targetStr.match(/(\d+)\s*m/i) || targetStr.match(/(\d+)\s*Min/i) || targetStr.match(/(\d+)\s*Minute/i);
  return {
    days: matchDays ? parseInt(matchDays[1]) : 0,
    hours: matchHours ? parseInt(matchHours[1]) : 0,
    minutes: matchMins ? parseInt(matchMins[1]) : 0
  };
};

export default function ServiceCatalogue() {
  const {
    services,
    fetchServices,
    createService,
    updateService,
    activateService,
    deactivateService,
    updateServiceIntakeFieldsLocal
  } = useAppStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [fieldsService, setFieldsService] = useState(null);
  const [flaggingService, setFlaggingService] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [resultModal, setResultModal] = useState(null); // { type, title, message }
  const [activeTab, setActiveTab] = useState(0); // 0: services, 1: archived

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const triggerSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchServices();
    useAppStore.getState().fetchPeriods();
  }, []);

  const activePeriod = useAppStore.getState().periods.find(p => p.status === "Active" || p.status === "Open");
  const isStaff = useAppStore.getState().userRole === 'Staff';

  const handleToggle = async (id) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    if (svc.active) {
      setDeactivating(svc);
      return;
    }
    try {
      await activateService(id);
      triggerSnackbar("Service activated successfully!", "success");
    } catch (err) {
      console.error(err);
      triggerSnackbar(err.message || "Failed to activate service", "error");
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    try {
      await deactivateService(deactivating.id);
      triggerSnackbar("Service deactivated successfully!", "success");
      setDeactivating(null);
    } catch (err) {
      console.error(err);
      triggerSnackbar(err.message || "Failed to deactivate service", "error");
    }
  };

  const filteredData = services.filter(svc => {
    const matchesSearch = svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.id.toString().includes(searchQuery.toLowerCase()) ||
      (svc.responsibleUnit && svc.responsibleUnit.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = !typeFilter || svc.classification === typeFilter;

    let matchesStatus = true;
    if (activeTab === 1) {
      matchesStatus = !svc.active;
    } else {
      if (statusFilter === "with") {
        matchesStatus = svc.withReferral === "with" && svc.active;
      } else if (statusFilter === "without") {
        matchesStatus = svc.withReferral === "without" && svc.active;
      } else if (statusFilter === "n/a") {
        matchesStatus = svc.withReferral === "n/a" && svc.active;
      } else {
        matchesStatus = svc.active;
      }
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Top Header */}
      <PageHeader breadcrumb="Service" title="Service Catalogue" />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => {
          setActiveTab(val);
          setStatusFilter(val === 1 ? "inactive" : "");
          setCurrentPage(1);
        }}
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Active Services" sx={{ fontWeight: 700 }} />
        <Tab label="Inactive Services" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Filters card */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search service name..."
            size="small"
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
            }}
            sx={{ width: 240 }}
          />

          <TextField
            select
            label="All Classifications"
            size="small"
            value={typeFilter}
            onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All Classifications</MenuItem>
            <MenuItem value="Simple">Simple</MenuItem>
            <MenuItem value="Complex">Complex</MenuItem>
            <MenuItem value="Highly Technical">Highly Technical</MenuItem>
          </TextField>

          {activeTab === 0 && (
            <TextField
              select
              label="All Referral Statuses"
              size="small"
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              sx={{ width: 180 }}
            >
              <MenuItem value="">All Referral Statuses</MenuItem>
              <MenuItem value="with">With Referral</MenuItem>
              <MenuItem value="without">Without Referral</MenuItem>
              <MenuItem value="n/a">Not Applicable</MenuItem>
            </TextField>
          )}

          {!isStaff && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowAdd(true)}
              sx={{ ml: 'auto' }}
            >
              Add Service
            </Button>
          )}
        </Box>
      </Card>

      {/* Table scroller */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
        <Table sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC', '& .MuiTableCell-root': { py: 1.5, whiteSpace: 'nowrap' } }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', width: 240 }}>SERVICE NAME</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>CLASSIFICATION</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>SLA TARGET</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>RESPONSIBLE UNIT</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>REFERRAL STATUS</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>N/A FLAG</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>LAST UPDATED</TableCell>
              {!isStaff && <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', width: 140 }}>ACTIONS</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((svc) => (
                <TableRow
                  key={svc.id}
                  hover
                  sx={{
                    opacity: svc.active ? 1 : 0.65,
                    '& .MuiTableCell-root': {
                      py: 1.5,
                      borderBottom: '1px solid #CBD5E1',
                      boxShadow: 'inset 0 -1.5px 0 0 rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.2, color: 'text.primary', mb: 0 }}>
                      {svc.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={svc.classification}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        ...(svc.classification === "Highly Technical" && { bgcolor: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.15)' }),
                        ...(svc.classification === "Complex" && { bgcolor: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.15)' }),
                        ...(svc.classification === "Simple" && { bgcolor: '#ECFDF5', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.15)' })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem' }}>
                      {svc.slaTarget || svc.sla}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                      {svc.responsibleUnit || "Quality Assurance"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        svc.withReferral === 'without' ? "Without Referral" :
                        svc.withReferral === 'n/a' ? "Not Applicable" : "With Referral"
                      }
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.725rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        ...(svc.withReferral === "without" ? { 
                          bgcolor: '#F0F9FF', 
                          color: '#0284C7', 
                          border: '1px solid rgba(2, 132, 199, 0.15)' 
                        } : svc.withReferral === "n/a" ? { 
                          bgcolor: '#F1F5F9', 
                          color: '#64748B', 
                          border: '1px solid rgba(100, 116, 139, 0.15)' 
                        } : { 
                          bgcolor: '#FEF2F2', 
                          color: '#9B1C1C', 
                          border: '1px solid rgba(155, 28, 28, 0.15)' 
                        })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {svc.naFlag ? (
                      <Chip label="N/A" size="small" variant="outlined" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: '#F1F5F9' }} />
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {svc.lastUpdated || "—"}
                    </Typography>
                  </TableCell>
                  {!isStaff && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Edit Service" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={svc.archived}
                              onClick={() => setEditingService(svc)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'rgba(25, 118, 210, 0.2)',
                                bgcolor: 'rgba(25, 118, 210, 0.04)',
                                '&:hover': {
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                },
                                width: 30,
                                height: 30
                              }}
                            >
                              <EditIcon sx={{ width: 15, height: 15 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Manage Fields" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="info"
                              disabled={svc.archived}
                              onClick={() => setFieldsService(svc)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'rgba(2, 132, 199, 0.2)',
                                bgcolor: 'rgba(2, 132, 199, 0.04)',
                                '&:hover': {
                                  bgcolor: 'rgba(2, 132, 199, 0.08)',
                                },
                                width: 30,
                                height: 30
                              }}
                            >
                              <SettingsIcon sx={{ width: 15, height: 15 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {svc.active && activePeriod && (
                          <Tooltip title="Flag as N/A" arrow>
                            <span>
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => setFlaggingService(svc)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'rgba(237, 108, 2, 0.2)',
                                  bgcolor: 'rgba(237, 108, 2, 0.04)',
                                  '&:hover': { bgcolor: 'rgba(237, 108, 2, 0.08)' },
                                  width: 30, height: 30
                                }}
                              >
                                <FlagOffIcon sx={{ width: 15, height: 15 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {svc.active ? (
                          <Tooltip title="Deactivate Service" arrow>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeactivating(svc)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'rgba(211, 47, 47, 0.2)',
                                  bgcolor: 'rgba(211, 47, 47, 0.04)',
                                  '&:hover': {
                                    bgcolor: 'rgba(211, 47, 47, 0.08)',
                                  },
                                  width: 30,
                                  height: 30
                                }}
                              >
                                <BlockIcon sx={{ width: 15, height: 15 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Activate Service" arrow>
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={async () => {
                                  try {
                                    await api.activateService(svc.id);
                                    triggerSnackbar("Service activated successfully!", "success");
                                    await fetchServices();
                                  } catch (err) {
                                    console.error(err);
                                    triggerSnackbar(err.message || "Failed to activate service", "error");
                                  }
                                }}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'rgba(46, 125, 50, 0.2)',
                                  bgcolor: 'rgba(46, 125, 50, 0.04)',
                                  '&:hover': {
                                    bgcolor: 'rgba(46, 125, 50, 0.08)',
                                  },
                                  width: 30,
                                  height: 30
                                }}
                              >
                                <CheckCircleIcon sx={{ width: 15, height: 15 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No services found matching your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Container */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      {/* Modals */}
      {showAdd && (
        <AddServiceModal
          onClose={() => setShowAdd(false)}
          onNext={async (newSvc) => {
            try {
              if (!newSvc.serviceName || !newSvc.serviceName.trim()) {
                throw new Error("Service name is required.");
              }
              const { days, hours, minutes } = parseSlaTarget(newSvc.slaTarget);
              let slaValue = 0;
              let slaUnit = "Days";
              if (hours === 0 && minutes === 0) {
                slaValue = days;
                slaUnit = "Days";
              } else {
                slaValue = days * 1440 + hours * 60 + minutes;
                slaUnit = "Minutes";
              }

              // Map frontend referral values to backend enum values
              const referralMap = { 'with': 'With', 'without': 'Without', 'n/a': 'N/A' };

              const payload = {
                name: newSvc.serviceName,
                classification: newSvc.classification,
                sla_target_value: slaValue,
                sla_target_unit: slaUnit,
                responsible_unit: newSvc.responsibleUnit,
                with_referral: referralMap[newSvc.withReferral] || 'With',
                required_documents: [],
                processing_steps: newSvc.stepsTimeline ? newSvc.stepsTimeline.split("\n").filter(Boolean) : [],
                expected_output: newSvc.expectedOutput,
              };

              const createdSvc = await createService(payload);

              // Close the Add form then immediately open Intake Field Builder
              setShowAdd(false);
              // Use the fresh service returned from the store (or build a local stub)
              const freshServices = useAppStore.getState().services;
              const justCreated = freshServices.find(s => s.name === newSvc.serviceName) || {
                id: createdSvc?.id,
                name: newSvc.serviceName,
                intakeFields: [],
              };
              setFieldsService(justCreated);
            } catch (err) {
              console.error(err);
              setResultModal({
                type: "error",
                title: "Failed to Add Service",
                message: err.message || "An unexpected error occurred. Please try again.",
              });
            }
          }}
        />
      )}

      {editingService && (
        <AddServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onEdit={async (updatedSvc) => {
            try {
              const { days, hours, minutes } = parseSlaTarget(updatedSvc.slaTarget);
              let slaValue = 0;
              let slaUnit = "Days";
              if (hours === 0 && minutes === 0) {
                slaValue = days;
                slaUnit = "Days";
              } else {
                slaValue = days * 1440 + hours * 60 + minutes;
                slaUnit = "Minutes";
              }

              // Map frontend referral values to backend enum values
              const referralMap = { 'with': 'With', 'without': 'Without', 'n/a': 'N/A' };

              const payload = {
                name: updatedSvc.name,
                classification: updatedSvc.classification,
                sla_target_value: slaValue,
                sla_target_unit: slaUnit,
                responsible_unit: updatedSvc.responsibleUnit,
                with_referral: referralMap[updatedSvc.withReferral] || 'With',
                required_documents: updatedSvc.intakeDocuments ? updatedSvc.intakeDocuments.split("\n").filter(Boolean) : [],
                processing_steps: updatedSvc.stepsTimeline ? updatedSvc.stepsTimeline.split("\n").filter(Boolean) : [],
                expected_output: updatedSvc.expectedOutput,
              };

              await updateService(updatedSvc.id, payload);
              triggerSnackbar("Service updated successfully!", "success");
            } catch (err) {
              console.error(err);
              triggerSnackbar(err.message || "Failed to update service", "error");
            }
          }}
        />
      )}

      {deactivating && (
        <DeactivateModal
          service={deactivating}
          onConfirm={confirmDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}



      {fieldsService && (
        <IntakeFieldBuilderModal
          service={fieldsService}
          onClose={() => setFieldsService(null)}
          onSave={(updatedSvc) => {
            updateServiceIntakeFieldsLocal(updatedSvc);
            triggerSnackbar("Intake fields updated successfully!", "success");
          }}
        />
      )}

      {flaggingService && (
        <NaFlagModal
          service={flaggingService}
          activePeriod={activePeriod}
          onClose={() => setFlaggingService(null)}
          onConfirm={async (serviceId, periodId, reason) => {
            try {
              await api.createNaFlag(serviceId, { period_id: periodId, reason });
              triggerSnackbar("Service successfully flagged as N/A", "success");
              setFlaggingService(null);
              // Locally update state to show the flag if needed, or re-fetch
              fetchServices();
            } catch (err) {
              triggerSnackbar(err.message || "Failed to flag service", "error");
            }
          }}
        />
      )}

      {resultModal && (
        <ResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(null)}
        />
      )}

      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
