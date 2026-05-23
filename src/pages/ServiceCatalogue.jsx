import { useState } from "react";
import Toggle from "../components/Toggle";
import Btn from "../components/Btn";
import AddServiceModal from "../modals/AddServiceModal";
import DeactivateModal from "../modals/DeactivateModal";
import ArchiveModal from "../modals/ArchiveModal";
import IntakeFieldBuilderModal from "../modals/IntakeFieldBuilderModal";
import { MOCK_SERVICES } from "../constants/mockData";
import { COLORS } from "../constants/colors";

export default function ServiceCatalogue() {
  const [services, setServices] = useState(MOCK_SERVICES);
  const [showAdd, setShowAdd] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [archiveService, setArchiveService] = useState(null);
  const [unarchiveService, setUnarchiveService] = useState(null);
  const [fieldsService, setFieldsService] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const rowsPerPage = 5; // Display 5 rows as shown in the mockup for ideal layout

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleToggle = (id) => {
    const svc = services.find(s => s.id === id);
    if (svc.active) {
      setDeactivating(svc);
      return;
    }
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: true } : s));
    triggerToast("Service activated successfully!", "success");
  };

  const confirmDeactivate = () => {
    setServices(prev => prev.map(s => s.id === deactivating.id ? { ...s, active: false } : s));
    setDeactivating(null);
    triggerToast("Service deactivated successfully!", "success");
  };

  // handleUnarchive is now managed via unarchiveService state and confirmation modal

  const filteredData = services.filter(svc => {
    const matchesSearch = svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.id.toString().includes(searchQuery.toLowerCase()) ||
      (svc.responsibleUnit && svc.responsibleUnit.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesType = !typeFilter || svc.classification === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = svc.active && !svc.archived;
    } else if (statusFilter === "inactive") {
      matchesStatus = !svc.active && !svc.archived;
    } else if (statusFilter === "na") {
      matchesStatus = svc.naFlag && !svc.archived;
    } else if (statusFilter === "archived") {
      matchesStatus = svc.archived;
    } else {
      // Default view when statusFilter is empty: exclude archived
      matchesStatus = !svc.archived;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      document.getElementById("service-catalogue-table")?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
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

  // Helper to determine service document icon styling based on classification
  const getServiceIconDetails = (classification) => {
    switch (classification) {
      case "Highly Technical":
        return { bg: "#FEF2F2", color: "#EF4444" };
      case "Complex":
        return { bg: "#FFFBEB", color: "#F59E0B" };
      case "Simple":
      default:
        return { bg: "#ECFDF5", color: "#10B981" };
    }
  };

  // Dynamic statistics calculated from current services state
  const statTotal = services.length;
  const statActive = services.filter(s => s.active && !s.archived).length;
  const statNa = services.filter(s => s.naFlag).length;
  const statArchived = services.filter(s => s.archived).length;

  return (
    <div className="service-catalogue-container">
      {/* Dynamic Style Block for Clean Media Queries and Micro-animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .service-catalogue-container {
          padding: 32px;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          font-family: var(--font-ui), sans-serif;
          background: #F8FAFC;
        }

        /* Top Breadcrumb and Header */
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
          color: #800000; /* Deep Maroon accent */
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
          letter-spacing: 0.02em;
        }
        .page-title {
          font-family: var(--font-display), 'DM Serif Display', Georgia, serif;
          font-size: 34px;
          font-weight: 500;
          color: #0F172A;
          margin: 0 0 24px 0;
        }

        /* Summary Cards Row */
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
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
          border-color: #CBD5E1;
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
          margin-top: 4px;
        }
        .metric-indicator-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        /* Filter Controls Styling */
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
          flex: 1;
          min-width: 280px;
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

        /* Table Section */
        .table-scroller {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          overflow-x: auto;
          flex: 1;
          min-height: 0;
          margin-bottom: 20px;
        }
        .premium-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 980px;
        }
        .premium-data-table th {
          padding: 14px 20px;
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .premium-data-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          font-size: 13px;
          color: #334155;
        }
        .premium-data-table tr:last-child td {
          border-bottom: none;
        }
        .premium-data-table tbody tr {
          transition: all 0.15s ease;
        }
        .premium-data-table tbody tr:hover {
          background: #F8FAFC;
        }

        /* Service Name Block Style */
        .service-info-flex {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .service-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .service-name-text {
          font-weight: 600;
          color: #0F172A; /* Dark black/slate name */
          font-size: 13.5px;
          margin-bottom: 2px;
        }
        .service-unit-text {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
        }

        /* Classification Pill Badges */
        .class-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid transparent;
        }
        .class-pill.highly-technical {
          background: #FEF2F2;
          color: #EF4444;
          border-color: rgba(239, 68, 68, 0.15);
        }
        .class-pill.complex {
          background: #FFFBEB;
          color: #D97706;
          border-color: rgba(217, 119, 6, 0.15);
        }
        .class-pill.simple {
          background: #ECFDF5;
          color: #10B981;
          border-color: rgba(16, 185, 129, 0.15);
        }

        /* SLA Pill Badge */
        .sla-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid rgba(37, 99, 235, 0.12);
        }

        /* Status Dot Pill Badge */
        .status-dot-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 600;
          background: #ECFDF5;
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.1);
        }
        .status-dot-badge.inactive {
          background: #F1F5F9;
          color: #64748B;
          border-color: rgba(100, 116, 139, 0.1);
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
        }
        .status-dot.inactive {
          background: #94A3B8;
        }

        /* N/A Flag Badge */
        .na-flag-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          background: #F1F5F9;
          color: #64748B;
          border: 1px solid #E2E8F0;
        }

        /* Actions Button Group */
        .action-button-group {
          display: flex;
          gap: 6px;
          justify-content: center;
          align-items: center;
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
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .action-table-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: #F1F5F9;
          color: #94A3B8;
          border-color: #E2E8F0;
          pointer-events: none;
        }
        .action-table-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }
        .action-table-btn.edit-btn:hover {
          border-color: #800000;
          color: #800000;
          background: #FFF5F5;
        }
        .action-table-btn.fields-btn:hover {
          border-color: #0284C7;
          color: #0284C7;
          background: #F0F9FF;
        }
        .action-table-btn.archive-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
          background: #FEF2F2;
        }
        .action-table-btn.restore-btn:hover {
          border-color: #10B981;
          color: #10B981;
          background: #ECFDF5;
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

        /* Responsive Layout Rules */
        @media (max-width: 1024px) {
          .service-catalogue-container {
            padding: 20px;
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }
        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .filter-flex-container {
            flex-direction: column;
            align-items: stretch;
          }
          .custom-filter-dropdown {
            width: 100%;
          }
          .action-add-btn {
            margin-left: 0;
            width: 100%;
            text-align: center;
          }
          .action-reset-btn {
            width: 100%;
            text-align: center;
          }
          .page-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .period-pill {
            align-self: flex-start;
          }
        }
      ` }} />

      {showAdd && (
        <AddServiceModal
          onClose={() => setShowAdd(false)}
          onAdd={(newSvc) => {
            setServices(prev => [
              {
                id: prev.length + 1,
                name: newSvc.serviceName,
                classification: newSvc.classification,
                slaTarget: newSvc.slaTarget,
                sla: newSvc.slaTarget,
                responsibleUnit: newSvc.responsibleUnit,
                active: newSvc.active,
                naFlag: false,
                lastUpdated: newSvc.lastUpdated,
              },
              ...prev
            ]);
            triggerToast("Service created successfully!", "success");
          }}
        />
      )}
      {editingService && (
        <AddServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onEdit={(updatedSvc) => {
            setServices(prev => prev.map(s => s.id === updatedSvc.id ? updatedSvc : s));
            triggerToast("Service updated successfully!", "success");
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
      {archiveService && (
        <ArchiveModal
          mode="archive"
          service={archiveService}
          onCancel={() => setArchiveService(null)}
          onConfirm={() => {
            setServices(prev => prev.map(s => s.id === archiveService.id ? { ...s, active: false, archived: true } : s));
            setArchiveService(null);
            triggerToast("Service archived successfully!", "success");
          }}
        />
      )}
      {unarchiveService && (
        <ArchiveModal
          mode="unarchive"
          service={unarchiveService}
          onCancel={() => setUnarchiveService(null)}
          onConfirm={() => {
            setServices(prev => prev.map(s => s.id === unarchiveService.id ? { ...s, archived: false, active: true } : s));
            setUnarchiveService(null);
            triggerToast("Service unarchived successfully!", "success");
          }}
        />
      )}
      {fieldsService && (
        <IntakeFieldBuilderModal
          service={fieldsService}
          onClose={() => setFieldsService(null)}
          onSave={(updatedSvc) => {
            setServices(prev => prev.map(s => s.id === updatedSvc.id ? updatedSvc : s));
            triggerToast("Intake fields updated successfully!", "success");
          }}
        />
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

      {/* Top Header Row with Breadcrumb & Time Pill */}
      <div className="page-header-row">
        <div className="breadcrumb-text">
          Home / <span>Service</span>
        </div>
        <div className="period-pill">
          Jan — Jun 2026 Period
        </div>
      </div>
      <h1 className="page-title">Service Catalogue</h1>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Services</span>
          <span className="metric-value">{statTotal}</span>
          <span className="metric-subtext">All statuses</span>
          <span className="metric-indicator-bar" style={{ background: "#800000" }} />
        </div>
        <div className="metric-card">
          <span className="metric-label">Active</span>
          <span className="metric-value">{statActive}</span>
          <span className="metric-subtext">In current charter</span>
          <span className="metric-indicator-bar" style={{ background: "#10B981" }} />
        </div>
        <div className="metric-card">
          <span className="metric-label">N/A Flagged</span>
          <span className="metric-value">{statNa}</span>
          <span className="metric-subtext">Excluded this period</span>
          <span className="metric-indicator-bar" style={{ background: "#F59E0B" }} />
        </div>
        <div className="metric-card">
          <span className="metric-label">Archived</span>
          <span className="metric-value">{statArchived}</span>
          <span className="metric-subtext">Decommissioned</span>
          <span className="metric-indicator-bar" style={{ background: "#94A3B8" }} />
        </div>
      </div>

      {/* Filter Controls Bar */}
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
              placeholder="Search service name.."
              value={searchQuery}
              className="search-input-field"
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            />
          </div>
          <select
            className="custom-filter-dropdown"
            value={typeFilter}
            onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
          >
            <option value="">All Classifications</option>
            <option value="Simple">Simple</option>
            <option value="Complex">Complex</option>
            <option value="Highly Technical">Highly Technical</option>
          </select>
          <select
            className="custom-filter-dropdown"
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="na">N/A Flagged</option>
            <option value="archived">Archived</option>
          </select>
          <button
            className="action-reset-btn"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("");
              setStatusFilter("");
              setCurrentPage(1);
            }}
          >
            Reset
          </button>
          <button className="action-add-btn" onClick={() => setShowAdd(true)}>
            Add Service
          </button>
        </div>
      </div>

      {/* Services Table Section */}
      <div className="table-scroller" id="service-catalogue-table">
        <table className="premium-data-table">
          <thead>
            <tr>
              <th style={{ width: "300px" }}>SERVICE NAME ↓</th>
              <th>CLASSIFICATION</th>
              <th>SLA TARGET</th>
              <th>RESPONSIBLE UNIT</th>
              <th>STATUS</th>
              <th>N/A FLAG</th>
              <th>LAST UPDATED</th>
              <th style={{ textAlign: "center", width: "240px" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((svc) => {
                const iconDetails = getServiceIconDetails(svc.classification);
                return (
                  <tr key={svc.id} style={{ opacity: svc.active ? 1 : 0.65 }}>
                    <td>
                      <div>
                        <div className="service-name-text">{svc.name}</div>
                        <div className="service-unit-text">{svc.responsibleUnit || "Administrative"}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`class-pill ${svc.classification === "Highly Technical" ? "highly-technical" : svc.classification === "Complex" ? "complex" : "simple"}`}>
                        {svc.classification}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "600", color: "#334155" }}>
                        {svc.slaTarget || svc.sla}
                      </span>
                    </td>
                    <td>{svc.responsibleUnit || "Quality Assurance"}</td>
                    <td>
                      {/* Clicking the Status Dot Badge toggles status, retaining active toggle system */}
                      <div
                        onClick={() => !svc.archived && handleToggle(svc.id)}
                        className={`status-dot-badge ${svc.archived ? "inactive" : svc.active ? "active" : "inactive"}`}
                        style={{ cursor: svc.archived ? "not-allowed" : "pointer", opacity: svc.archived ? 0.65 : 1 }}
                        title={svc.archived ? "Archived services cannot toggle status" : "Click to toggle status"}
                      >
                        <span className={`status-dot ${svc.active ? "active" : "inactive"}`} />
                        {svc.archived ? "Archived" : svc.active ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td>
                      {svc.naFlag ? (
                        <span className="na-flag-badge">N/A</span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                    <td>{svc.lastUpdated || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <div className="action-button-group">
                        <button
                          className="action-table-btn edit-btn"
                          disabled={svc.archived}
                          onClick={() => setEditingService(svc)}
                          title={svc.archived ? "Archived services cannot be edited" : "Edit Service"}
                        >
                          Edit
                        </button>
                        <button
                          className="action-table-btn fields-btn"
                          disabled={svc.archived}
                          onClick={() => setFieldsService(svc)}
                          title={svc.archived ? "Archived services cannot edit fields" : "Manage Intake Fields"}
                        >
                          Fields
                        </button>
                        {!svc.archived ? (
                          <button
                            className="action-table-btn archive-btn"
                            onClick={() => setArchiveService(svc)}
                            title="Archive Service"
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            className="action-table-btn restore-btn"
                            onClick={() => setUnarchiveService(svc)}
                            title="Restore / Unarchive Service"
                          >
                            Unarchive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: "14px", fontWeight: 500 }}>
                  No services found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Section */}
      {totalPages > 1 && (
        <div className="pagination-container">
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
    </div>
  );
}

