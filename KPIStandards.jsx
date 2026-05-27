import { useState, useEffect } from "react";
import { MOCK_SERVICES } from "../constants/mockData";
import { INITIAL_KPIS } from "../constants/sprint2Mock";
import Toggle from "../components/Toggle";
import ResultModal from "../modals/ResultModal";
import PageHeader from "../components/PageHeader";

export default function KPIStandards() {
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem("pup_services");
    return saved ? JSON.parse(saved) : MOCK_SERVICES;
  });

  const [kpis, setKpis] = useState(() => {
    const saved = localStorage.getItem("pup_kpis");
    return saved ? JSON.parse(saved) : INITIAL_KPIS;
  });

  useEffect(() => {
    localStorage.setItem("pup_kpis", JSON.stringify(kpis));
  }, [kpis]);

  useEffect(() => {
    localStorage.setItem("pup_services", JSON.stringify(services));
  }, [services]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [deactivatingKpi, setDeactivatingKpi] = useState(null);
  const [activatingKpi, setActivatingKpi] = useState(null);

  const [activeTab, setActiveTab] = useState("active"); // "active" or "deactivated"
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "" });

  // Add/Edit Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Timeliness");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("%");
  const [serviceId, setServiceId] = useState("");
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState({});

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleOpenAdd = () => {
    setName("");
    setCategory("Timeliness");
    setTargetValue("");
    setUnit("%");
    // Default to first active service
    const activeSvcs = services.filter(s => !s.archived);
    setServiceId(activeSvcs.length > 0 ? activeSvcs[0].id.toString() : "");
    setActive(true);
    setErrors({});
    setShowAdd(true);
  };

  const handleOpenEdit = (kpi) => {
    setEditingKpi(kpi);
    setName(kpi.name);
    setCategory(kpi.category);
    setTargetValue(kpi.target_value.toString());
    setUnit(kpi.unit);
    setServiceId(kpi.service_id.toString());
    setActive(kpi.active);
    setErrors({});
  };

  const handleSave = (e) => {
    e.preventDefault();
    const err = {};

    const countAlphanumeric = (str) => {
      if (!str) return 0;
      return (str.match(/[a-zA-Z0-9]/g) || []).length;
    };

    if (!name.trim()) {
      err.name = "KPI Name is required.";
    } else if (countAlphanumeric(name) < 3) {
      err.name = "Must contain at least 3 alphanumeric characters.";
    }

    if (!targetValue.trim() || isNaN(targetValue)) err.targetValue = true;
    if (!unit.trim()) err.unit = true;
    if (!serviceId) err.serviceId = true;

    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    // Duplicate check: same name (case-insensitive) on the same service
    const isDuplicate = kpis.some(k =>
      k.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      k.service_id === parseInt(serviceId) &&
      (!editingKpi || k.id !== editingKpi.id)
    );

    if (isDuplicate) {
      setResultModal({
        show: true,
        type: "error",
        title: "Duplicate KPI",
        message: `A KPI named "${name.trim()}" already exists for this service. Please use a unique name or choose a different service.`,
      });
      return;
    }

    const payload = {
      name,
      category,
      target_value: parseFloat(targetValue),
      unit,
      service_id: parseInt(serviceId),
      active,
    };

    if (editingKpi) {
      // Edit
      setKpis(prev => prev.map(k => k.id === editingKpi.id ? { ...k, ...payload } : k));
      setResultModal({
        show: true,
        type: "success",
        title: "KPI Updated",
        message: `"${payload.name}" has been updated successfully.`,
      });
      setEditingKpi(null);
    } else {
      // Add
      const newKpi = {
        id: Date.now(),
        ...payload
      };
      setKpis(prev => [newKpi, ...prev]);
      setResultModal({
        show: true,
        type: "success",
        title: "KPI Defined!",
        message: `"${payload.name}" has been successfully defined as a KPI standard.`,
      });
      setShowAdd(false);
    }
  };


  const handleToggleActive = (id, kpiName, nextState) => {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, active: nextState } : k));
    triggerToast(`"${kpiName}" ${nextState ? "activated" : "deactivated"} successfully!`, "success");
  };

  const filteredKpis = kpis.filter(k => {
    const matchesTab = activeTab === "active" ? k.active : !k.active;
    if (!matchesTab) return false;

    const service = services.find(s => s.id === k.service_id);
    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service && service.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !categoryFilter || k.category === categoryFilter;
    const matchesService = !serviceFilter || k.service_id.toString() === serviceFilter;

    return matchesSearch && matchesCategory && matchesService;
  });

  // Pagination Logic (only active and displayed when there are 20 or more records)
  const showPagination = filteredKpis.length >= 20;
  const rowsPerPage = 10;
  const totalPages = showPagination ? Math.ceil(filteredKpis.length / rowsPerPage) : 1;
  const paginatedKpis = showPagination
    ? filteredKpis.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredKpis;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, "..", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "..", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "..", currentPage, "..", totalPages);
    }
    return pages;
  };

  const getServiceLabel = (id) => {
    const svc = services.find(s => s.id === id);
    return svc ? svc.name : "N/A";
  };

  // Metrics
  const statTotal = kpis.length;
  const statTimeliness = kpis.filter(k => k.category === "Timeliness" && k.active).length;
  const statQuality = kpis.filter(k => k.category === "Quality" && k.active).length;
  const statEfficiency = kpis.filter(k => k.category === "Efficiency" && k.active).length;

  return (
    <div className="kpi-standards-container">
      {/* Styles Block */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .kpi-standards-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: var(--font-ui), sans-serif;
          background: #F8FAFC;
          min-height: 100vh;
        }

        .catalogue-tabs {
          display: flex;
          gap: 24px;
          border-bottom: 1px solid #E2E8F0;
          margin-bottom: 24px;
        }
        .catalogue-tab-btn {
          background: none;
          border: none;
          padding: 10px 4px;
          font-size: 14.5px;
          font-weight: 700;
          color: #64748B;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
          outline: none;
          font-family: inherit;
        }
        .catalogue-tab-btn:hover {
          color: #0F172A;
        }
        .catalogue-tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #800000;
          border-radius: 99px;
        }

        /* Pagination Bar */
        .pagination-container {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }
        .pagination-btn {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          color: #334155;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }
        .pagination-btn:disabled {
          opacity: 0.45;
          cursor: default;
        }
        .pagination-btn.active {
          background: #800000;
          color: #ffffff;
          border-color: #800000;
          font-weight: 700;
        }

        /* Top Header */
        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #E2E8F0;
        }
        .breadcrumb-text {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }
        .breadcrumb-text span {
          color: #800000;
          font-weight: 600;
        }
        .period-pill {
          background: #FEF2F2;
          color: #800000;
          border: 1px solid rgba(128, 0, 0, 0.1);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 11px;
          font-weight: 700;
        }
        .page-title {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 34px;
          font-weight: 500;
          color: #0F172A;
          margin: 0 0 24px 0;
        }

        /* Metrics Row */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          padding: 20px;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
        }
        .metric-label {
          font-size: 10px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 26px;
          font-weight: 700;
          color: #1E293B;
        }
        .metric-subtext {
          font-size: 12px;
          color: #64748B;
        }
        .metric-indicator-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        /* Filters Controls */
        .filter-controls-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .filter-flex-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-search-box {
          position: relative;
          width: 240px;
        }
        .filter-divider {
          width: 1px;
          height: 24px;
          background: #E2E8F0;
          margin: 0 4px;
        }
        .search-icon-svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
        .search-input-field {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          color: #334155;
          box-sizing: border-box;
          background: #F8FAFC;
        }
        .search-input-field:focus {
          border-color: #800000;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }
        .custom-filter-dropdown {
          padding: 10px 36px 10px 14px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13px;
          color: #475569;
          background: #ffffff;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          min-width: 180px;
        }
        .custom-filter-dropdown:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }

        .action-reset-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          cursor: pointer;
        }
        .action-reset-btn:hover {
          background: #E2E8F0;
        }
        .action-add-btn {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-left: auto;
          box-shadow: 0 2px 4px rgba(128, 0, 0, 0.15);
          transition: all 0.15s ease;
        }
        .action-add-btn:hover {
          background: #990000;
          transform: translateY(-1px);
        }

        /* Table */
        .table-scroller {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          overflow-x: auto;
        }
        .premium-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 900px;
        }
        .premium-data-table th {
          padding: 14px 20px;
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
        }
        .premium-data-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 13px;
          color: #334155;
        }
        .premium-data-table tr:hover {
          background: #F8FAFC;
        }

        /* Badges */
        .cat-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .cat-badge.timeliness {
          background: #EFF6FF;
          color: #2563EB;
        }
        .cat-badge.quality {
          background: #FFFBEB;
          color: #D97706;
        }
        .cat-badge.efficiency {
          background: #ECFDF5;
          color: #10B981;
        }

        .action-button-group {
          display: flex;
          gap: 6px;
          justify-content: center;
        }
        .action-table-btn {
          background: #ffffff;
          border: 1px solid #CBD5E1;
          color: #475569;
          font-weight: 600;
          font-size: 11.5px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .action-table-btn:hover {
          background: #F8FAFC;
        }
        .action-table-btn.edit-btn:hover {
          border-color: #800000;
          color: #800000;
          background: #FFF5F5;
        }
        .action-table-btn.delete-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
          background: #FEF2F2;
        }
        .action-table-btn.restore-btn:hover {
          border-color: #10B981;
          color: #10B981;
          background: #ECFDF5;
        }

        /* Form Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          backdrop-filter: blur(2px);
        }
        .form-modal-card {
          background: #ffffff;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          box-sizing: border-box;
          animation: slideUpModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-title-text {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 26px;
          font-weight: 500;
          color: #0F172A;
          margin-bottom: 24px;
        }
        .field-group {
          margin-bottom: 16px;
        }
        .modal-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
          display: block;
        }
        .modal-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          color: #1E293B;
          box-sizing: border-box;
        }
        .modal-input:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }
        .modal-input.input-error {
          border-color: #EF4444;
        }

        .btn-cancel-ghost {
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-cancel-ghost:hover {
          background: #F8FAFC;
        }
        .btn-save-maroon {
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #800000;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-save-maroon:hover {
          background: #990000;
        }

        /* Toast Notification Banner */
        .toast-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #ffffff;
          border-left: 4px solid #10B981;
          border-radius: 6px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2000;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 380px;
          border-top: 1px solid #E2E8F0;
          border-right: 1px solid #E2E8F0;
          border-bottom: 1px solid #E2E8F0;
        }
        .toast-banner.success {
          border-left-color: #10B981;
        }
        .toast-banner.error {
          border-left-color: #EF4444;
        }
        .toast-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #ffffff;
          flex-shrink: 0;
        }
        .toast-icon.success {
          background: #10B981;
        }
        .toast-icon.error {
          background: #EF4444;
        }
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      ` }} />

      <PageHeader breadcrumb="KPI Standards" title="Key Performance Indicator" />

      {/* Tab Navigation */}
      <div className="catalogue-tabs">
        <button
          className={`catalogue-tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("active");
            setCurrentPage(1);
          }}
        >
          KPI Standards
        </button>
        <button
          className={`catalogue-tab-btn ${activeTab === "deactivated" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("deactivated");
            setCurrentPage(1);
          }}
        >
          Deactivated
        </button>
      </div>



      {/* Filters Controls */}
      <div className="filter-controls-card">
        <div className="filter-flex-container">
          <div className="filter-search-box">
            <svg
              className="search-icon-svg"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              placeholder="Search KPI name or service.."
              value={searchQuery}
              className="search-input-field"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="filter-divider" />
          <select
            className="custom-filter-dropdown"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="Timeliness">Timeliness</option>
            <option value="Quality">Quality</option>
            <option value="Efficiency">Efficiency</option>
          </select>
          <select
            className="custom-filter-dropdown"
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Linked Services</option>
            {services.filter(s => !s.archived).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button className="action-add-btn" onClick={handleOpenAdd}>
            Add KPI Target
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-scroller">
        <table className="premium-data-table">
          <thead>
            <tr>
              <th style={{ width: "240px" }}>KPI NAME</th>
              <th>CATEGORY</th>
              <th>TARGET VALUE</th>
              <th>UNIT</th>
              <th>LINKED SERVICE</th>
              <th style={{ textAlign: "center", width: "180px" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedKpis.length > 0 ? (
              paginatedKpis.map((kpi) => (
                <tr key={kpi.id} style={{ opacity: kpi.active ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 600, color: "#0F172A" }}>{kpi.name}</td>
                  <td>
                    <span className={`cat-badge ${kpi.category.toLowerCase()}`}>
                      {kpi.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "#334155" }}>{kpi.target_value}</td>
                  <td style={{ fontWeight: 500, color: "#64748B" }}>{kpi.unit}</td>
                  <td style={{ fontWeight: 600, color: "#475569" }}>{getServiceLabel(kpi.service_id)}</td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-button-group">
                      <button className="action-table-btn edit-btn" onClick={() => handleOpenEdit(kpi)}>
                        Edit
                      </button>
                      {kpi.active ? (
                        <button className="action-table-btn delete-btn" onClick={() => setDeactivatingKpi(kpi)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="action-table-btn restore-btn" onClick={() => setActivatingKpi(kpi)}>
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
                  No KPI Standards defined matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Section */}
      {showPagination && totalPages > 1 && (
        <div className="pagination-container" style={{ marginTop: 20 }}>
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ‹
          </button>
          {getPageNumbers().map((p, i) => (
            <button
              key={i}
              disabled={p === ".."}
              onClick={() => typeof p === "number" && handlePageChange(p)}
              className={`pagination-btn ${p === currentPage ? "active" : ""}`}
            >
              {p}
            </button>
          ))}
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            ›
          </button>
        </div>
      )}

      {/* Add / Edit Modal Dialog */}
      {(showAdd || editingKpi) && (
        <div className="modal-overlay">
          <form className="form-modal-card" onSubmit={handleSave}>
            <h3 className="modal-title-text">{editingKpi ? "Edit KPI Standard" : "Define KPI Standard"}</h3>

            {/* KPI Name */}
            <div className="field-group">
              <label className="modal-label">KPI Name *</label>
              <input
                placeholder="e.g. Transaction completion percentage"
                value={name}
                className={`modal-input ${errors.name ? "input-error" : ""}`}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(prev => ({ ...prev, name: false }));
                }}
              />
              {errors.name && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  {errors.name === true ? "KPI Name is required." : errors.name}
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="field-group">
              <label className="modal-label">Category *</label>
              <select
                className="custom-filter-dropdown"
                style={{ width: "100%" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Timeliness">Timeliness (SLA/Deadlines)</option>
                <option value="Quality">Quality (Customer Satisfaction)</option>
                <option value="Efficiency">Efficiency (Volume/Process Speed)</option>
              </select>
            </div>

            {/* Target Value & Unit Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="field-group">
              <div>
                <label className="modal-label">Target Value *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 95"
                  value={targetValue}
                  className={`modal-input ${errors.targetValue ? "input-error" : ""}`}
                  onChange={(e) => {
                    setTargetValue(e.target.value);
                    setErrors(prev => ({ ...prev, targetValue: false }));
                  }}
                />
              </div>
              <div>
                <label className="modal-label">Unit *</label>
                <input
                  placeholder="e.g. % or Minutes"
                  value={unit}
                  className={`modal-input ${errors.unit ? "input-error" : ""}`}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    setErrors(prev => ({ ...prev, unit: false }));
                  }}
                />
              </div>
            </div>

            {/* Linked Service */}
            <div className="field-group">
              <label className="modal-label">Linked Catalog Service *</label>
              <select
                className="custom-filter-dropdown"
                style={{ width: "100%" }}
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setErrors(prev => ({ ...prev, serviceId: false }));
                }}
              >
                <option value="">Select Service...</option>
                {services.filter(s => !s.archived).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Active Toggle */}
            <div className="field-group" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
              <Toggle checked={active} onChange={() => setActive(p => !p)} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>STANDARD ACTIVE</span>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
              <button
                type="button"
                className="btn-cancel-ghost"
                onClick={() => {
                  setShowAdd(false);
                  setEditingKpi(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save-maroon">
                {editingKpi ? "Save Standard" : "Define KPI"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deactivate KPI Confirmation Modal */}
      {deactivatingKpi && (
        <div className="modal-overlay">
          <div className="form-modal-card" style={{ maxWidth: 420 }}>
            <h3 className="modal-title-text" style={{ fontSize: "20px", marginBottom: 14 }}>Deactivate KPI?</h3>
            <p style={{ fontSize: "13.5px", lineHeight: "1.65", color: "#475569", margin: "0 0 24px 0" }}>
              Are you sure you want to deactivate <strong style={{ color: "#800000" }}>"{deactivatingKpi.name}"</strong>?
              <br /><br />
              This standard target will be marked as Inactive and hidden from active citizens' charter evaluation cycles. This action can be reversed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                className="btn-cancel-ghost"
                onClick={() => setDeactivatingKpi(null)}
              >
                Cancel
              </button>
              <button
                className="btn-save-maroon"
                style={{ background: "#DC2626" }}
                onClick={() => {
                  handleToggleActive(deactivatingKpi.id, deactivatingKpi.name, false);
                  setDeactivatingKpi(null);
                }}
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Activate KPI Confirmation Modal */}
      {activatingKpi && (
        <div className="modal-overlay">
          <div className="form-modal-card" style={{ maxWidth: 420 }}>
            <h3 className="modal-title-text" style={{ fontSize: "20px", marginBottom: 14 }}>Activate KPI?</h3>
            <p style={{ fontSize: "13.5px", lineHeight: "1.65", color: "#475569", margin: "0 0 24px 0" }}>
              Are you sure you want to activate <strong style={{ color: "#800000" }}>"{activatingKpi.name}"</strong>?
              <br /><br />
              This standard target will be restored to Active status and included in citizens' charter evaluation cycles. This action can be reversed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                className="btn-cancel-ghost"
                onClick={() => setActivatingKpi(null)}
              >
                Cancel
              </button>
              <button
                className="btn-save-maroon"
                style={{ background: "#10B981" }}
                onClick={() => {
                  handleToggleActive(activatingKpi.id, activatingKpi.name, true);
                  setActivatingKpi(null);
                }}
              >
                Yes, Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Toast Alert */}
      {toast.show && (
        <div className={`toast-banner ${toast.type}`}>
          <div className={`toast-icon ${toast.type}`}>
            {toast.type === "success" ? "✔" : "✖"}
          </div>
          <div>{toast.message}</div>
        </div>
      )}

      {/* Result Modal — success / error feedback on Define KPI */}
      {resultModal.show && (
        <ResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
