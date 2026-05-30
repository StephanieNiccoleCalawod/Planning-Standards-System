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
  Snackbar,
  Alert,
  Pagination,
  Tooltip,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";
import ResultModal from "../modals/ResultModal";
import KPIModal from "../modals/KPIModal";
import ToggleStatusModal from "../modals/ToggleStatusModal";

const CATEGORY_INDICATORS = {
  Timeliness: { color: "#2563EB", bg: "#EFF6FF", label: "Timeliness" },
  Quality: { color: "#D97706", bg: "#FFFBEB", label: "Quality" },
  Efficiency: { color: "#10B981", bg: "#ECFDF5", label: "Efficiency" },
};

const formatDuration = (totalMinutes) => {
  if (!totalMinutes || isNaN(totalMinutes)) return "0m";
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = Math.round(totalMinutes % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
};

export default function KPIStandards() {
  const {
    services,
    fetchServices,
    kpis,
    fetchKpis,
    createKpi,
    updateKpi,
    deleteKpi
  } = useAppStore();

  // UI states
  const [activeTab, setActiveTab] = useState(0); // 0: active, 1: deactivated
  const [showAdd, setShowAdd] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Timeliness");
  const [target, setTarget] = useState("");
  const [targetDays, setTargetDays] = useState("");
  const [targetHours, setTargetHours] = useState("");
  const [targetMins, setTargetMins] = useState("");
  const [unit, setUnit] = useState(" Days");
  const [serviceId, setServiceId] = useState("");
  const [errors, setErrors] = useState({});

  const [deactivatingKpi, setDeactivatingKpi] = useState(null);
  const [activatingKpi, setActivatingKpi] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "" });

  const triggerSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchServices();
    fetchKpis();
  }, []);

  const handleOpenAdd = () => {
    setName("");
    setCategory("Timeliness");
    setTarget("");
    setTargetDays("");
    setTargetHours("");
    setTargetMins("");
    setUnit(" Days");
    setServiceId("");
    setErrors({});
    setEditingKpi(null);
    setShowAdd(true);
  };

  const handleOpenEdit = (kpi) => {
    setName(kpi.name);
    setCategory(kpi.category);
    setTarget(Number(kpi.target_value));

    if (kpi.category === "Timeliness" || kpi.category === "Efficiency") {
      const totalMins = Number(kpi.target_value) || 0;
      const d = Math.floor(totalMins / 1440);
      const h = Math.floor((totalMins % 1440) / 60);
      const m = Math.round(totalMins % 60);
      setTargetDays(d || "");
      setTargetHours(h || "");
      setTargetMins(m || "");
    } else {
      setTargetDays("");
      setTargetHours("");
      setTargetMins("");
    }

    setUnit(kpi.unit);
    setServiceId(kpi.service_id || "");
    setErrors({});
    setEditingKpi(kpi);
    setShowAdd(false);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditingKpi(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const err = {};
    if (!name.trim()) err.name = true;
    if (!serviceId) err.serviceId = true;

    const isTimeCategory = category === "Timeliness" || category === "Efficiency";
    const hasTimeValue = targetDays.toString().trim() || targetHours.toString().trim() || targetMins.toString().trim();
    if (isTimeCategory && !hasTimeValue) err.target = true;
    if (!isTimeCategory && !target.toString().trim()) err.target = true;

    if (Object.keys(err).length > 0) {
      setErrors(err);
      triggerSnackbar("Please fill in all required fields.", "error");
      return;
    }

    let backendCategory = "EFFICIENCY";
    if (category === "Timeliness") backendCategory = "COMPLIANCE";
    else if (category === "Quality") backendCategory = "CUSTOMER";

    let backendUnit = "COUNT";
    let finalTargetValue = 0;

    if (category === "Quality") {
      backendUnit = "PERCENT";
      finalTargetValue = Number(target);
    } else {
      backendUnit = "COUNT";
      const d = Number(targetDays) || 0;
      const h = Number(targetHours) || 0;
      const m = Number(targetMins) || 0;
      finalTargetValue = d * 1440 + h * 60 + m;
    }

    const payload = {
      name,
      category: backendCategory,
      target_value: finalTargetValue,
      unit: backendUnit,
      service_id: serviceId || null,
      is_active: editingKpi ? editingKpi.active : true,
    };

    try {
      if (editingKpi) {
        await updateKpi(editingKpi.id, payload);
        setResultModal({
          show: true,
          type: "success",
          title: "KPI Target Updated!",
          message: `The KPI Target for "${name}" has been successfully updated.`,
        });
      } else {
        await createKpi(payload);
        setResultModal({
          show: true,
          type: "success",
          title: "KPI Target Added!",
          message: `The new KPI Target "${name}" has been successfully created.`,
        });
      }
      closeModal();
    } catch (err) {
      console.error(err);
      setResultModal({
        show: true,
        type: "error",
        title: "Operation Failed",
        message: err.message || "Failed to save KPI Target. Please try again.",
      });
    }
  };

  const handleToggleActive = async (id, kName, newStatus) => {
    try {
      await updateKpi(id, { is_active: newStatus });
      triggerSnackbar(`"${kName}" has been ${newStatus ? 'activated' : 'deactivated'}.`, "success");
    } catch (err) {
      console.error(err);
      triggerSnackbar(err.message || `Failed to update status`, "error");
    }
  };

  // Client-side Filters
  const filteredKpis = kpis.filter(k => {
    const isTabMatch = activeTab === 0 ? k.active : !k.active;
    if (!isTabMatch) return false;

    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (services.find(s => s.id === k.service_id)?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || k.category === categoryFilter;
    const matchesService = !serviceFilter || k.service_id === serviceFilter;

    return matchesSearch && matchesCategory && matchesService;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  const showPagination = filteredKpis.length >= 10 || currentPage > 1;
  const totalPages = Math.ceil(filteredKpis.length / rowsPerPage) || 1;
  const paginatedKpis = filteredKpis.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Top Header */}
      <PageHeader breadcrumb="KPI Standards" title="Key Performance Indicators (KPIs) Target" />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => {
          setActiveTab(val);
          setCurrentPage(1);
        }}
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="KPI Standards" sx={{ fontWeight: 700 }} />
        <Tab label="Inactive KPI Standards" sx={{ fontWeight: 700 }} />
      </Tabs>

      {/* Filters Card */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search KPI name or service..."
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            InputProps={{
              startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
            }}
            sx={{ width: 240 }}
          />

          <TextField
            select
            label="All Categories"
            size="small"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="Timeliness">Timeliness</MenuItem>
            <MenuItem value="Quality">Quality</MenuItem>
            <MenuItem value="Efficiency">Efficiency</MenuItem>
          </TextField>

          <TextField
            select
            label="All Linked Services"
            size="small"
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
            sx={{ width: 220 }}
          >
            <MenuItem value="">All Linked Services</MenuItem>
            {services.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ ml: 'auto' }}
          >
            Add KPI Target
          </Button>
        </Box>
      </Card>

      {/* Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC', '& .MuiTableCell-root': { py: 1.5, whiteSpace: 'nowrap' } }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', width: '250px' }}>KPI NAME</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>CATEGORY</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>TARGET VALUE</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>LINKED SERVICE</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', width: 140 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedKpis.length > 0 ? (
              paginatedKpis.map((kpi) => (
                <TableRow
                  key={kpi.id}
                  hover
                  sx={{
                    opacity: kpi.active ? 1 : 0.6,
                    '& .MuiTableCell-root': {
                      py: 1.5,
                      borderBottom: '1px solid #CBD5E1',
                      boxShadow: 'inset 0 -1.5px 0 0 rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.2, color: 'text.primary', mb: 0 }}>
                      {kpi.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kpi.category}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        ...(kpi.category === "Timeliness" && { bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.15)' }),
                        ...(kpi.category === "Quality" && { bgcolor: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.15)' }),
                        ...(kpi.category === "Efficiency" && { bgcolor: '#ECFDF5', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.15)' })
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary", fontSize: '0.875rem' }}>
                    {kpi.category === "Quality" ? `${Number(kpi.target_value)}%` : formatDuration(kpi.target_value)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                    {services.find(s => s.id === kpi.service_id)?.name || "Unlinked Service"}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Edit KPI Target" arrow>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(kpi)}
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
                      {kpi.active ? (
                        <Tooltip title="Deactivate KPI Target" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeactivatingKpi(kpi)}
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
                        <Tooltip title="Activate KPI Target" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setActivatingKpi(kpi)}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No KPI targets found matching your active filter criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Section */}
      {showPagination && totalPages > 1 && (
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

      {/* ── Add / Edit KPI Modal ── */}
      <KPIModal
        open={!!(showAdd || editingKpi)}
        editingKpi={editingKpi}
        services={services}
        name={name} setName={setName}
        category={category} setCategory={setCategory}
        target={target} setTarget={setTarget}
        targetDays={targetDays} setTargetDays={setTargetDays}
        targetHours={targetHours} setTargetHours={setTargetHours}
        targetMins={targetMins} setTargetMins={setTargetMins}
        unit={unit} setUnit={setUnit}
        serviceId={serviceId} setServiceId={setServiceId}
        errors={errors} setErrors={setErrors}
        onSave={handleSave}
        onClose={closeModal}
      />

      {/* ── Deactivate KPI Confirmation ── */}
      <ToggleStatusModal
        open={!!deactivatingKpi}
        isActivate={false}
        entityLabel="KPI Target"
        itemName={deactivatingKpi?.name || ''}
        bodyExtra="Deactivating this target excludes it from current performance audits, scores, and active charts in the Dashboard."
        onConfirm={() => {
          handleToggleActive(deactivatingKpi.id, deactivatingKpi.name, false);
          setDeactivatingKpi(null);
        }}
        onCancel={() => setDeactivatingKpi(null)}
      />

      {/* ── Activate KPI Confirmation ── */}
      <ToggleStatusModal
        open={!!activatingKpi}
        isActivate={true}
        entityLabel="KPI Target"
        itemName={activatingKpi?.name || ''}
        bodyExtra="Activating this KPI will include it in active audits, evaluations, and metrics computation for this period."
        onConfirm={() => {
          handleToggleActive(activatingKpi.id, activatingKpi.name, true);
          setActivatingKpi(null);
        }}
        onCancel={() => setActivatingKpi(null)}
      />

      {/* Snackbar alerts */}
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

      {/* Result Modal Feedback */}
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
