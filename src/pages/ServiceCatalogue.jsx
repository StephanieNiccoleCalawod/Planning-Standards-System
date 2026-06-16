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
  Pagination,
  Menu,
  Divider,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOffIcon from '@mui/icons-material/FlagOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';


import PageHeader from "../components/PageHeader";
import AddServiceModal from "../modals/AddServiceModal";
import IntakeFieldBuilderModal from "../modals/IntakeFieldBuilderModal";
import ResultModal from "../modals/ResultModal";
import NaFlagModal from "../modals/NaFlagModal";
import ToggleStatusModal from "../modals/ToggleStatusModal";

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
    archiveService,
    updateServiceIntakeFieldsLocal,
    kpis,
    fetchKpis,
    commitments,
    fetchCommitments
  } = useAppStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [activating, setActivating] = useState(null);
  const [fieldsService, setFieldsService] = useState(null);
  const [flaggingService, setFlaggingService] = useState(null);


  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [resultModal, setResultModal] = useState(null); // { type, title, message }
  const [activeTab, setActiveTab] = useState(0); // 0: services, 1: archived

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const handleMenuOpen = (event, svc) => {
    setAnchorEl(event.currentTarget);
    setSelectedService(svc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    if (selectedService) {
      setEditingService(selectedService);
    }
    handleMenuClose();
  };

  const handleManageFieldsClick = async () => {
    if (!selectedService) return;
    const svc = selectedService;
    handleMenuClose();
    try {
      const res = await api.getIntakeFields(svc.id);
      const intakeFields = (res || []).map(f => ({
        id: f.id,
        label: f.label,
        type: f.field_type === 'BOOLEAN' || f.field_type === 'CHECKBOX' ? 'Checkbox' : f.field_type.charAt(0).toUpperCase() + f.field_type.slice(1).toLowerCase(),
        required: f.is_required,
        options: f.dropdown_options || [],
        displayOrder: f.display_order
      }));
      setFieldsService({ ...svc, intakeFields: intakeFields.sort((a,b) => a.displayOrder - b.displayOrder) });
    } catch (err) {
      console.error("Failed to load intake fields", err);
      triggerSnackbar("Failed to load intake fields", "error");
      setFieldsService({ ...svc, intakeFields: [] });
    }
  };

  const handleUnflagClick = () => {
    if (selectedService) {
      handleUnflag(selectedService);
    }
    handleMenuClose();
  };

  const handleFlagClick = () => {
    if (selectedService) {
      setFlaggingService(selectedService);
    }
    handleMenuClose();
  };

  const handleDeactivateClick = () => {
    if (selectedService) {
      setDeactivating(selectedService);
    }
    handleMenuClose();
  };

  const handleActivateClick = () => {
    if (selectedService) {
      setActivating(selectedService);
    }
    handleMenuClose();
  };



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
    fetchKpis();
    fetchCommitments();
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
      triggerSnackbar(`Service '${svc.name}' activated successfully!`, "success");
    } catch (err) {
      console.error(err);
      triggerSnackbar(err.message || "Failed to activate service", "error");
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    const serviceName = deactivating.name;
    try {
      await deactivateService(deactivating.id);
      setDeactivating(null);
      setResultModal({
        type: "success",
        title: "Service Deactivated",
        message: `The service "${serviceName}" has been successfully deactivated and is now hidden from transaction logging.`
      });
    } catch (err) {
      console.error(err);
      setDeactivating(null);
      setResultModal({
        type: "error",
        title: "Deactivation Failed",
        message: err.message || `Failed to deactivate the service "${serviceName}".`
      });
    }
  };

  const confirmActivate = async () => {
    if (!activating) return;
    const serviceName = activating.name;
    try {
      await api.activateService(activating.id);
      setActivating(null);
      await fetchServices();
      setResultModal({
        type: "success",
        title: "Service Activated",
        message: `The service "${serviceName}" has been successfully activated and is now available for transaction logging.`
      });
    } catch (err) {
      console.error(err);
      setActivating(null);
      setResultModal({
        type: "error",
        title: "Activation Failed",
        message: err.message || `Failed to activate the service "${serviceName}".`
      });
    }
  };



  const handleUnflag = async (svc) => {
    const flagId = svc.naFlags?.[0]?.id;
    if (!flagId) return;
    try {
      await api.deleteNaFlag(svc.id, flagId);
      triggerSnackbar(`Service '${svc.name}' unflagged successfully!`, "success");
      await fetchServices();
    } catch (err) {
      console.error(err);
      triggerSnackbar(err.message || "Failed to unflag service", "error");
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="disabled" />
                  </InputAdornment>
                ),
              },
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
                      <Tooltip title={svc.naFlags?.[0]?.reason || "Service flagged as N/A for this period."} arrow placement="top">
                        <Chip label="N/A" size="small" variant="outlined" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: '#F1F5F9', cursor: 'help' }} />
                      </Tooltip>
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
                      <Tooltip title="Actions" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, svc)}
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
          onNext={(newSvc) => {
            if (!newSvc.serviceName || !newSvc.serviceName.trim()) {
              setResultModal({
                type: "error",
                title: "Failed to Add Service",
                message: "Service name is required.",
              });
              return;
            }

            // Close the Add form and open Intake Field Builder with local unsaved service metadata
            setShowAdd(false);
            setFieldsService({
              isNew: true,
              name: newSvc.serviceName,
              classification: newSvc.classification,
              slaTarget: newSvc.slaTarget,
              responsibleUnit: newSvc.responsibleUnit,
              active: newSvc.active,
              withReferral: newSvc.withReferral,
              intakeDocuments: newSvc.intakeDocuments,
              stepsTimeline: newSvc.stepsTimeline,
              expectedOutput: newSvc.expectedOutput,
              intakeFields: []
            });
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
              triggerSnackbar(`Service '${updatedSvc.name}' updated successfully!`, "success");
            } catch (err) {
              console.error(err);
              const isDuplicate = err.message && (err.message.includes("exists") || err.message.includes("Conflict") || err.message.includes("unique") || err.message.includes("duplicate"));
              const msg = isDuplicate 
                ? "Failed to save. A service with this name already exists in your office." 
                : (err.message || "Failed to update service");
              triggerSnackbar(msg, "error");
            }
          }}
        />
      )}

      {deactivating && (
        <ToggleStatusModal
          open={Boolean(deactivating)}
          isActivate={false}
          itemName={deactivating.name}
          entityLabel="Service"
          bodyExtra="This service will be hidden from transaction logging immediately."
          onConfirm={confirmDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}

      {activating && (
        <ToggleStatusModal
          open={Boolean(activating)}
          isActivate={true}
          itemName={activating.name}
          entityLabel="Service"
          bodyExtra="This service will be restored to transaction logging immediately."
          onConfirm={confirmActivate}
          onCancel={() => setActivating(null)}
        />
      )}



      {fieldsService && (
        <IntakeFieldBuilderModal
          service={fieldsService}
          onClose={() => setFieldsService(null)}
          onSave={async (updatedSvc) => {
            try {
              let targetServiceId = updatedSvc.id;
              let finalServiceData = updatedSvc;

              if (updatedSvc.isNew) {
                // First, create the service catalogue record
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

                const referralMap = { 'with': 'With', 'without': 'Without', 'n/a': 'N/A' };

                const servicePayload = {
                  name: updatedSvc.name || updatedSvc.serviceName,
                  classification: updatedSvc.classification,
                  sla_target_value: slaValue,
                  sla_target_unit: slaUnit,
                  responsible_unit: updatedSvc.responsibleUnit,
                  with_referral: referralMap[updatedSvc.withReferral] || 'With',
                  required_documents: updatedSvc.intakeDocuments ? updatedSvc.intakeDocuments.split("\n").filter(Boolean) : [],
                  processing_steps: updatedSvc.stepsTimeline ? updatedSvc.stepsTimeline.split("\n").filter(Boolean) : [],
                  expected_output: updatedSvc.expectedOutput,
                };

                const createdSvc = await createService(servicePayload);
                targetServiceId = createdSvc.id;
                finalServiceData = {
                  ...updatedSvc,
                  id: createdSvc.id,
                  name: createdSvc.name,
                };
              }

              const oldFields = updatedSvc.isNew ? [] : (fieldsService.intakeFields || []);
              const newFields = updatedSvc.intakeFields || [];
              const isNew = (id) => typeof id === 'number' || (typeof id === 'string' && id.length < 36 && !id.includes('-'));

              // 1. Delete removed fields (only for existing services)
              if (!updatedSvc.isNew) {
                const toDelete = oldFields.filter(of => !newFields.some(nf => nf.id === of.id));
                for (const f of toDelete) {
                  await api.deleteIntakeField(targetServiceId, f.id);
                }
              }

              // 2. Create or Update fields
              for (const f of newFields) {
                const dto = {
                  label: f.label,
                  field_type: f.type.toUpperCase() === 'CHECKBOX' ? 'BOOLEAN' : f.type.toUpperCase(),
                  is_required: f.required,
                  display_order: f.displayOrder,
                  dropdown_options: f.options || []
                };

                if (updatedSvc.isNew || isNew(f.id)) {
                  await api.createIntakeField(targetServiceId, dto);
                } else {
                  await api.updateIntakeField(targetServiceId, f.id, dto);
                }
              }

              updateServiceIntakeFieldsLocal(finalServiceData);
              setResultModal({
                type: "success",
                title: "Success!",
                message: updatedSvc.isNew ? "Service catalogue and intake fields saved successfully!" : "Intake fields saved successfully to the database."
              });
            } catch (err) {
              console.error(err);
              const isDuplicate = err.message && (err.message.includes("exists") || err.message.includes("Conflict") || err.message.includes("unique") || err.message.includes("duplicate"));
              setResultModal({
                type: "error",
                title: updatedSvc.isNew ? "Failed to Create Service" : "Intake Fields Save Failed",
                message: isDuplicate 
                  ? "Failed to save. A service with this name already exists in your office." 
                  : (err.message || "Failed to save to the database.")
              });
            }
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
              setFlaggingService(null);
              await fetchServices();
              setResultModal({
                type: "success",
                title: "Success",
                message: "Service successfully flagged as N/A."
              });
            } catch (err) {
              setResultModal({
                type: "error",
                title: "Failed to Flag Service",
                message: err.message || "Failed to flag service."
              });
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

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionProps={{
          onExited: () => setSelectedService(null)
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
        <MenuItem onClick={handleEditClick} disabled={selectedService?.archived}>
          <EditIcon sx={{ mr: 1.5, color: '#800000', fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Edit Service</Typography>
        </MenuItem>

        <MenuItem onClick={handleManageFieldsClick} disabled={selectedService?.archived}>
          <DynamicFormIcon sx={{ mr: 1.5, color: '#0284c7', fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Manage Fields</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {selectedService?.active && activePeriod && (
          selectedService.naFlag ? (
            <MenuItem onClick={handleUnflagClick}>
              <FlagIcon sx={{ mr: 1.5, color: '#ed6c02', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Unflag Service</Typography>
            </MenuItem>
          ) : (
            <MenuItem onClick={handleFlagClick}>
              <FlagOffIcon sx={{ mr: 1.5, color: '#ed6c02', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Flag as N/A</Typography>
            </MenuItem>
          )
        )}

        {selectedService?.active ? (
          <MenuItem onClick={handleDeactivateClick}>
            <BlockIcon sx={{ mr: 1.5, color: '#d32f2f', fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Deactivate Service</Typography>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleActivateClick}>
            <CheckCircleIcon sx={{ mr: 1.5, color: '#2e7d32', fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Activate Service</Typography>
          </MenuItem>
        )}


      </Menu>

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
