import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Toggle from "../components/Toggle";
import Btn from "../components/Btn";
import SelectInput from "../components/SelectInput";
import AddServiceModal from "../modals/AddServiceModal";
import DeactivateModal from "../modals/DeactivateModal";
import { MOCK_SERVICES } from "../constants/mockData";
import { COLORS } from "../constants/colors";
import { api } from "../services/api";

export default function Services() {
  const [services, setServices] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deactivating, setDeactivating] = useState(null);

  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchServices = async () => {
    try {
      const res = await api.getServices({ include_archived: false });
      if (res) {
        // Map backend structures to simple frontend values
        const formatted = res.map(s => ({
          id: s.id,
          name: s.name,
          classification: s.classification,
          sla: s.sla_target_value ? `${s.sla_target_value} ${s.sla_target_unit === 'Days' ? 'Days' : 'Minutes'}` : s.sla,
          active: s.status === 'ACTIVE' || s.is_active === true || s.active === true || s.status === 'Active',
          ...s
        }));
        setServices(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch services list:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggle = async (id) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    if (svc.active) {
      setDeactivating(svc);
    } else {
      try {
        await api.activateService(id);
        await fetchServices();
      } catch (err) {
        console.error("Failed to activate service:", err);
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    try {
      await api.deactivateService(deactivating.id);
      setDeactivating(null);
      await fetchServices();
    } catch (err) {
      console.error("Failed to deactivate service:", err);
    }
  };

  const handleAddService = async (newSvc) => {
    try {
      const slaValue = parseInt(newSvc.slaTarget.match(/\d+/)?.[0] || 0);
      const slaUnit = newSvc.slaTarget.includes("Day") ? "Days" : "Minutes";
      const payload = {
        name: newSvc.serviceName,
        classification: newSvc.classification,
        sla_target_value: slaValue,
        sla_target_unit: slaUnit,
        responsible_unit: newSvc.responsibleUnit,
        required_documents: newSvc.intakeDocuments ? newSvc.intakeDocuments.split("\n").filter(Boolean) : [],
        processing_steps: newSvc.stepsTimeline ? newSvc.stepsTimeline.split("\n").filter(Boolean) : [],
        expected_output: newSvc.expectedOutput,
      };
      await api.createService(payload);
      await fetchServices();
    } catch (err) {
      console.error("Failed to add service record:", err);
    }
  };

  // Filtering Logic
  const filteredData = services.filter(svc => {
    const matchesSearch = svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.id.toString().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || svc.classification.toUpperCase() === typeFilter.toUpperCase();
    const matchesStatus = !statusFilter || (statusFilter === "active" ? svc.active : !svc.active);
    return matchesSearch && matchesType && matchesStatus;
  });

  const showPagination = filteredData.length >= 20;
  const rowsPerPage = 10;
  const totalPages = showPagination ? Math.ceil(filteredData.length / rowsPerPage) : 1;
  const paginatedData = showPagination
    ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredData;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      document.getElementById("services-table-container")?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", minHeight: "100vh", boxSizing: "border-box" }}>
      {showAdd && (
        <AddServiceModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAddService}
        />
      )}
      {deactivating && (
        <DeactivateModal
          service={deactivating}
          onConfirm={confirmDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}

      <PageHeader breadcrumb="Service Registry" title="Service Registry" />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            placeholder=" Search by service..."
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            style={{ width: "100%", padding: "9px 14px 9px 34px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>SERVICE TYPE</div>
          <SelectInput value={typeFilter} onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)} options={[
            { value: "", label: "All Services" },
            { value: "SIMPLE", label: "Simple" },
            { value: "COMPLEX", label: "Complex" },
            { value: "HIGHLY TECHNICAL", label: "Highly Technical" },
          ]} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>STATUS</div>
          <SelectInput value={statusFilter} onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)} options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          <Btn onClick={() => { setSearchQuery(""); setTypeFilter(""); setStatusFilter(""); setCurrentPage(1); }}>Reset</Btn>
        </div>
        <Btn onClick={() => setShowAdd(true)} style={{ marginLeft: "auto" }}>Add Service</Btn>
      </div>

      {/* Table Container with Fixed Height / Scroll */}
      <div
        id="services-table-container"
        style={{
          background: "#fff",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          overflow: "auto",
          flex: 1,
          minHeight: 0
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["NO.", "SERVICE NAME", "CLASSIFICATION", "SLA", "ACTIVE", "ACTIONS"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.muted, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((svc, i) => (
                <tr key={svc.id} style={{
                  borderBottom: i < paginatedData.length - 1 ? `1px solid ${COLORS.border}` : "none",
                  opacity: svc.active ? 1 : 0.5,
                }}>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: COLORS.muted }}>{i + 1 + (currentPage - 1) * rowsPerPage}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: svc.active ? COLORS.text : COLORS.muted }}>{svc.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 600, color: COLORS.muted }}>{svc.classification}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{svc.sla}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <Toggle checked={svc.active} onChange={() => handleToggle(svc.id)} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: 32, textAlign: "center", color: COLORS.muted, fontSize: 14 }}>No services found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Visibility Rule */}
      {showPagination && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 16 }}>
          {/* Previous Button */}
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            style={{
              width: 34, height: 34, borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              background: "#fff",
              color: currentPage === 1 ? COLORS.muted : COLORS.text,
              fontSize: 13, cursor: currentPage === 1 ? "default" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >‹</button>

          {/* Page Numbers */}
          {getPageNumbers().map((p, i) => (
            <button
              key={i}
              disabled={p === "..."}
              onClick={() => typeof p === "number" && handlePageChange(p)}
              style={{
                width: 34, height: 34, borderRadius: 6,
                border: `1px solid ${COLORS.border}`,
                background: p === currentPage ? COLORS.accent : "#fff",
                color: p === currentPage ? "#fff" : COLORS.text,
                fontSize: 13, cursor: p === "..." ? "default" : "pointer",
                fontWeight: p === currentPage ? 600 : 400,
              }}
            >{p}</button>
          ))}

          {/* Next Button */}
          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            style={{
              width: 34, height: 34, borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              background: "#fff",
              color: currentPage === totalPages ? COLORS.muted : COLORS.text,
              fontSize: 13, cursor: currentPage === totalPages ? "default" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >›</button>
        </div>
      )}
    </div>
  );
}
