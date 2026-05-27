import { useState, useEffect } from "react";
import { api } from "../services/api";
import PageHeader from "../components/PageHeader";
import ResultModal from "../modals/ResultModal";

const CATEGORY_INDICATORS = {
  Timeliness: { color: "#2563EB", bg: "#EFF6FF", label: "Timeliness" },
  Quality: { color: "#D97706", bg: "#FFFBEB", label: "Quality" },
  Efficiency: { color: "#10B981", bg: "#ECFDF5", label: "Efficiency" },
};

export default function KPIStandards() {
  const [services, setServices] = useState([]);
  const [kpis, setKpis] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState("active"); // "active" vs "deactivated"
  const [showAdd, setShowAdd] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  
  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Timeliness");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("%");
  const [serviceId, setServiceId] = useState("");
  const [errors, setErrors] = useState({});

  const [deactivatingKpi, setDeactivatingKpi] = useState(null);
  const [activatingKpi, setActivatingKpi] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [resultModal, setResultModal] = useState({ show: false, type: "success", title: "", message: "" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchKpisAndServices = async () => {
    try {
      const [svcRes, kpiRes] = await Promise.all([
        api.getServices({ include_archived: false }),
        api.getKpis({ include_inactive: true }),
      ]);
      
      if (svcRes?.data) {
        setServices(svcRes.data);
      }
      
      if (kpiRes?.data) {
        // Map backend KPI schema to frontend properties
        const formatted = kpiRes.data.map(k => ({
          id: k.id,
          name: k.name,
          category: k.category === "TIMELINESS" ? "Timeliness" : k.category === "QUALITY" ? "Quality" : "Efficiency",
          target_value: k.target_value,
          unit: k.unit,
          service_id: k.service_id,
          active: k.is_active,
          ...k
        }));
        setKpis(formatted);
      }
    } catch (err) {
      console.error("Failed to load KPIs & services:", err);
    }
  };

  useEffect(() => {
    fetchKpisAndServices();
  }, []);

  const handleOpenAdd = () => {
    setName("");
    setCategory("Timeliness");
    setTarget("");
    setUnit("%");
    setServiceId("");
    setErrors({});
    setEditingKpi(null);
    setShowAdd(true);
  };

  const handleOpenEdit = (kpi) => {
    setName(kpi.name);
    setCategory(kpi.category);
    setTarget(kpi.target_value);
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
    if (!target.toString().trim()) err.target = true;
    if (!serviceId) err.serviceId = true;

    if (Object.keys(err).length > 0) {
      setErrors(err);
      triggerToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      name,
      category: category.toUpperCase(), // TIMELINESS, QUALITY, EFFICIENCY
      target_value: Number(target),
      unit,
      service_id: Number(serviceId),
      is_active: editingKpi ? editingKpi.active : true,
    };

    try {
      if (editingKpi) {
        await api.updateKpi(editingKpi.id, payload);
        setResultModal({
          show: true,
          type: "success",
          title: "KPI Target Updated!",
          message: `The KPI Target for "${name}" has been successfully updated.`,
        });
      } else {
        await api.createKpi(payload);
        setResultModal({
          show: true,
          type: "success",
          title: "KPI Target Added!",
          message: `The new KPI Target "${name}" has been successfully created.`,
        });
      }
      closeModal();
      await fetchKpisAndServices();
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

  const handleDelete = async (id, kName) => {
    try {
      await api.deleteKpi(id);
      triggerToast(`"${kName}" deleted successfully.`, "success");
      await fetchKpisAndServices();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || "Failed to delete KPI Target.", "error");
    }
  };

  const handleToggleActive = async (id, kName, newStatus) => {
    try {
      await api.updateKpi(id, { is_active: newStatus });
      triggerToast(`"${kName}" has been ${newStatus ? 'activated' : 'deactivated'}.`, "success");
      await fetchKpisAndServices();
    } catch (err) {
      console.error(err);
      triggerToast(err.message || `Failed to update status`, "error");
    }
  };

  // Dynamic Client-side Filters
  const filteredKpis = kpis.filter(k => {
    const isTabMatch = activeTab === "active" ? k.active : !k.active;
    if (!isTabMatch) return false;

    const matchesSearch = k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (services.find(s => s.id === k.service_id)?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || k.category === categoryFilter;
    const matchesService = !serviceFilter || k.service_id === Number(serviceFilter);

    return matchesSearch && matchesCategory && matchesService;
  });

  // Pagination Math
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  const showPagination = filteredKpis.length >= 10 || currentPage > 1;
  const totalPages = Math.ceil(filteredKpis.length / rowsPerPage) || 1;
  const paginatedKpis = filteredKpis.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Metrics
  const statTotal = kpis.length;
  const statTimeliness = kpis.filter(k => k.category === "Timeliness" && k.active).length;
  const statQuality = kpis.filter(k => k.category === "Quality" && k.active).length;
  const statEfficiency = kpis.filter(k => k.category === "Efficiency" && k.active).length;

  return (
    <div className="kpi-standards-container">
      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .kpi-standards-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: var(--font-ui), sans-serif;
          background: #F8FAFC;
          min-height: 100vh;
        }

        /* Top Header Row with Breadcrumb */
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
        .page-title {
          font-family: var(--font-display, 'DM Serif Display', Georgia, serif);
          font-size: 34px;
          font-weight: 500;
          color: #0F172A;
          margin: 0 0 24px 0;
        }
        .period-pill {
          background: #FEF2F2;
          color: #800000;
          border: 1px solid rgba(128, 0, 0, 0.1);
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        /* Metrics */
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
          line-height: 1.1;
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

        /* Tabs Navigation */
        .catalogue-tabs {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1.5px solid #E2E8F0;
          padding-bottom: 2px;
        }
        .catalogue-tab-btn {
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          padding: 8px 12px;
          position: relative;
          transition: color 0.15s ease;
        }
        .catalogue-tab-btn:hover {
          color: #0F172A;
        }
        .catalogue-tab-btn.active {
          color: #800000;
        }
        .catalogue-tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -3.5px;
          left: 0;
          right: 0;
          height: 3px;
          background: #800000;
          border-radius: 999px;
        }

        /* Filter Controls */
        .filter-controls-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          padding: 16px 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
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
          pointer-events: none;
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
          transition: all 0.15s ease;
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
          font-family: inherit;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          transition: all 0.15s ease;
          min-width: 180px;
        }
        .custom-filter-dropdown:hover {
          border-color: #CBD5E1;
        }
        .custom-filter-dropdown:focus {
          border-color: #800000;
          box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.08);
        }

        /* Action Buttons */
        .action-reset-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .action-reset-btn:hover {
          background: #E2E8F0;
          color: #334155;
        }
        .action-add-btn {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #800000; /* Deep Maroon */
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.15s ease;
          box-shadow: 0 2px 4px rgba(128, 0, 0, 0.15);
        }
        .action-add-btn:hover {
          background: #990000;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(128, 0, 0, 0.2);
        }

        /* Table */
        .table-scroller {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          overflow-x: auto;
          margin-bottom: 20px;
        }
        .premium-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
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

        /* Badges & Tags */
        .cat-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 600;
          border: 1.5px solid transparent;
        }
        .cat-tag.timeliness {
          background: #EFF6FF;
          color: #2563EB;
          border-color: rgba(37, 99, 235, 0.12);
        }
        .cat-tag.quality {
          background: #FFFBEB;
          color: #D97706;
          border-color: rgba(217, 119, 6, 0.12);
        }
        .cat-tag.efficiency {
          background: #ECFDF5;
          color: #10B981;
          border-color: rgba(16, 185, 129, 0.12);
        }

        .target-pill {
          background: #F8FAFC;
          border: 1.5px solid #CBD5E1;
          color: #1E293B;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 6px;
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
        .action-table-btn.deactivate-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
          background: #FEF2F2;
        }
        .action-table-btn.activate-btn:hover {
          border-color: #10B981;
          color: #10B981;
          background: #ECFDF5;
        }

        /* Modals & Overlays */
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
          max-width: 440px;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          box-sizing: border-box;
          animation: slideUpModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-title-text {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 24px;
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
        .label-star {
          color: #EF4444;
          margin-left: 2px;
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
          padding: 9px 18px;
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
          padding: 9px 18px;
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

        /* Toast Alert */
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
      ` }} />

      {/* Top Header Row with Breadcrumb */}
      <PageHeader breadcrumb="KPI Standards" title="Key Performance Indicators (KPIs) Target" />



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
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            className="action-reset-btn"
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("");
              setServiceFilter("");
              setCurrentPage(1);
            }}
          >
            Reset
          </button>
          <button className="action-add-btn" onClick={handleOpenAdd}>
            Add KPI Target
          </button>
        </div>
      </div>

      {/* KPI Standards Table */}
      <div className="table-scroller">
        <table className="premium-data-table">
          <thead>
            <tr>
              <th style={{ width: "300px" }}>KEY PERFORMANCE INDICATOR (KPI) ↓</th>
              <th>CATEGORY</th>
              <th>TARGET STANDARD</th>
              <th>LINKED SERVICE CHARTER</th>
              <th style={{ textAlign: "center", width: "240px" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedKpis.length > 0 ? (
              paginatedKpis.map((kpi) => (
                <tr key={kpi.id} style={{ opacity: kpi.active ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 600, color: "#0F172A" }}>{kpi.name}</td>
                  <td>
                    <span className={`cat-tag ${kpi.category.toLowerCase()}`}>
                      {kpi.category}
                    </span>
                  </td>
                  <td>
                    <span className="target-pill">
                      {kpi.target_value}{kpi.unit}
                    </span>
                  </td>
                  <td style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>
                    {services.find(s => s.id === kpi.service_id)?.name || "Unlinked Service"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-button-group">
                      <button
                        className="action-table-btn edit-btn"
                        onClick={() => handleOpenEdit(kpi)}
                      >
                        Edit
                      </button>
                      {kpi.active ? (
                        <button
                          className="action-table-btn deactivate-btn"
                          onClick={() => setDeactivatingKpi(kpi)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="action-table-btn activate-btn"
                          onClick={() => setActivatingKpi(kpi)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="action-table-btn deactivate-btn"
                        style={{ border: "1px solid #CBD5E1", color: "#64748B" }}
                        onClick={() => handleDelete(kpi.id, kpi.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: "14px", fontWeight: 500 }}>
                  No KPI targets found matching your active filter criteria.
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
            <h3 className="modal-title-text">
              {editingKpi ? "Edit KPI Standard Target" : "Define KPI Standard Target"}
            </h3>

            {/* KPI Target Name */}
            <div className="field-group">
              <label className="modal-label">
                KPI Target Name <span className="label-star">*</span>
              </label>
              <input
                placeholder="e.g. Processing time for Graduation Clearance"
                required
                value={name}
                className={`modal-input ${errors.name ? "input-error" : ""}`}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(prev => ({ ...prev, name: false }));
                }}
              />
              {errors.name && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  KPI Name is required.
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="field-group">
              <label className="modal-label">Measurement Category *</label>
              <select
                className="custom-filter-dropdown"
                style={{ width: "100%" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Timeliness">Timeliness (SLA / Processing Duration)</option>
                <option value="Quality">Quality Graded standard (Satisfaction)</option>
                <option value="Efficiency">Efficiency (Completion Volume Rate)</option>
              </select>
            </div>

            {/* Target & Unit */}
            <div className="field-group" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
              <div>
                <label className="modal-label">
                  Target Value <span className="label-star">*</span>
                </label>
                <input
                  placeholder="e.g. 95 or 10"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={target}
                  className={`modal-input ${errors.target ? "input-error" : ""}`}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    setErrors(prev => ({ ...prev, target: false }));
                  }}
                />
              </div>
              <div>
                <label className="modal-label">Standard Unit *</label>
                <select
                  className="custom-filter-dropdown"
                  style={{ width: "100%" }}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="%">Percentage (%)</option>
                  <option value=" Days">Working Days</option>
                  <option value=" Mins">Minutes</option>
                  <option value=" Hours">Hours</option>
                </select>
              </div>
            </div>

            {/* Linked Service */}
            <div className="field-group">
              <label className="modal-label">
                Link to Service Charter <span className="label-star">*</span>
              </label>
              <select
                className={`custom-filter-dropdown ${errors.serviceId ? "input-error" : ""}`}
                style={{ width: "100%" }}
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setErrors(prev => ({ ...prev, serviceId: false }));
                }}
              >
                <option value="">Select Service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.serviceId && (
                <div style={{ color: "#EF4444", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                  Please link a Service Charter.
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button
                type="button"
                className="btn-cancel-ghost"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save-maroon">
                {editingKpi ? "Save Changes" : "Define KPI"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deactivate Warning Confirmation Modal */}
      {deactivatingKpi && (
        <div className="modal-overlay">
          <div className="form-modal-card" style={{ maxWidth: 420 }}>
            <h3 className="modal-title-text" style={{ fontSize: "20px", marginBottom: 14 }}>
              Deactivate KPI Target?
            </h3>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#475569", margin: "0 0 24px 0" }}>
              Are you sure you want to deactivate <strong style={{ color: "#800000" }}>"{deactivatingKpi.name}"</strong>?
              <br /><br />
              Deactivating this target excludes it from current performance audits, scores, and active charts in the Dashboard.
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

      {/* Activate Confirmation Modal */}
      {activatingKpi && (
        <div className="modal-overlay">
          <div className="form-modal-card" style={{ maxWidth: 420 }}>
            <h3 className="modal-title-text" style={{ fontSize: "20px", marginBottom: 14 }}>
              Activate KPI Target?
            </h3>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#475569", margin: "0 0 24px 0" }}>
              Are you sure you want to activate <strong style={{ color: "#10B981" }}>"{activatingKpi.name}"</strong>?
              <br /><br />
              Activating this KPI will include it in active audits, evaluations, and metrics computation for this period.
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

      {/* Result Modal Feedback */}
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
