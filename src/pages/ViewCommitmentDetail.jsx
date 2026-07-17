import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Chip,
  Card
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { useAppStore } from "../store/useAppStore";
import PageHeader from "../components/PageHeader";

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

export default function ViewCommitmentDetail({ commitmentId, onBack }) {
  const {
    services,
    kpis,
    periods,
    activeCommitment,
    fetchCommitmentById,
    fetchServices,
    fetchKpis,
    fetchPeriods,
    permissions
  } = useAppStore();

  const [loading, setLoading] = useState(true);

  const canExport = permissions?.canExportOpcr || false;

  useEffect(() => {
    if (commitmentId) {
      setLoading(true);
      Promise.all([
        fetchCommitmentById(commitmentId),
        fetchServices(),
        fetchKpis(),
        fetchPeriods()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [commitmentId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F8FAFC', p: 4 }}>
        <CircularProgress sx={{ color: 'var(--maroon, #580000)' }} />
      </Box>
    );
  }

  const period = periods.find(p => p.id === activeCommitment?.period_id);
  const periodName = period ? period.name : "—";
  const items = activeCommitment?.items || [];

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableHtml = document.getElementById('opcr-table-container')?.innerHTML || '';
    
    const styledTableHtml = tableHtml.replace(/<thead[^>]*>[\s\S]*?<\/thead>/i, `
      <thead>
        <tr>
          <th style="width: 45px; text-align: center;">#</th>
          <th>SERVICE CHARTER</th>
          <th>CLASSIFICATION</th>
          <th>KPI INDICATOR</th>
          <th>CATEGORY</th>
          <th style="text-align: right;">OPCR TARGET VALUE</th>
        </tr>
      </thead>
    `);

    printWindow.document.write(`
      <html>
      <head>
        <title>OPCR Commitment Registry Sheet</title>
        <style>
          body { font-family: 'DM Sans', sans-serif; padding: 32px; color: #1E293B; }
          h2 { color: #800000; margin-bottom: 4px; font-size: 20px; font-weight: 700; text-transform: uppercase; }
          .period { color: #64748B; font-size: 13px; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #CBD5E1; }
          th, td { border: 1px solid #CBD5E1; padding: 12px 14px; text-align: left; font-size: 12px; }
          th { background-color: #580000 !important; color: #ffffff !important; font-weight: 700; }
          td:last-child, th:last-child { text-align: right; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h2>OPCR COMMITMENT REGISTRY SHEET</h2>
        <div class="period">Evaluation Period: ${periodName}</div>
        <table>
          ${styledTableHtml}
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Service Charter', 'Classification', 'KPI Indicator', 'Category', 'OPCR Target Value'];
    const rows = items.map((item, index) => {
      const svc = services.find(s => String(s.id) === String(item.service_id));
      const kpi = kpis.find(k => String(k.id) === String(item.kpi_id));
      const classification = svc?.classification || "Simple";
      const kpiName = kpi?.name || "Target Value";
      const category = kpi?.category || "Timeliness";
      
      const isDuration = kpi ? ((kpi.category === "Timeliness" || kpi.category === "Efficiency") && kpi.unit !== "/ 5") : false;
      let targetValue = "—";
      if (item.target_value !== null && item.target_value !== undefined) {
        if (isDuration) {
          targetValue = formatDuration(item.target_value);
        } else if (kpi?.unit === "/ 5") {
          targetValue = `${parseFloat(item.target_value)} / 5`;
        } else if (kpi?.unit === "%" || kpi?.category === "Quality") {
          targetValue = `${parseFloat(item.target_value)}%`;
        } else {
          targetValue = String(parseFloat(item.target_value));
        }
      }

      const safeName = (svc?.name || '').replace(/"/g, '""');

      return [
        index + 1,
        `"${safeName}"`,
        `"${classification}"`,
        `"${kpiName}"`,
        `"${category}"`,
        `"${targetValue}"`
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OPCR_Commitment_${periodName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Page Header with inline Back button */}
      <PageHeader 
        breadcrumb="Commitments / Details" 
        title={
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '1.1rem' }} />}
            onClick={onBack}
            variant="text"
            size="small"
            sx={{
              color: 'var(--maroon, #580000)',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 0.4,
              px: 0.5,
              minWidth: 0,
              borderRadius: '6px',
              letterSpacing: 0,
              '&:hover': {
                bgcolor: 'rgba(88,0,0,0.07)',
                textDecoration: 'none',
                color: 'var(--maroon, #800000)'
              }
            }}
          >
            Back to Registry
          </Button>
        } 
      />

      {/* Main spreadsheet card */}
      <Card sx={{ borderRadius: '8px', border: '1px solid #E2E8F0', p: 3.5, bgcolor: '#FFFFFF', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', mt: 3 }}>
        
        {/* Detail Info Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            OPCR Commitment Registry Sheet
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--maroon, #580000)', fontWeight: 800, fontSize: '0.8rem', bgcolor: 'var(--maroon-muted, #f2e8e8)', px: 2, py: 0.75, borderRadius: '9999px', border: '1px solid rgba(88,0,0,0.12)' }}>
              Evaluation Period: {periodName}
            </Typography>
            {canExport && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportCSV}
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: 'var(--maroon, #580000)',
                    color: 'var(--maroon, #580000)',
                    '&:hover': { bgcolor: 'rgba(88,0,0,0.04)', borderColor: 'var(--maroon, #580000)' },
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: '32px'
                  }}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportPDF}
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: 'var(--maroon, #580000)',
                    color: 'var(--maroon, #580000)',
                    '&:hover': { bgcolor: 'rgba(88,0,0,0.04)', borderColor: 'var(--maroon, #580000)' },
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: '32px'
                  }}
                >
                  Export PDF
                </Button>
              </>
            )}
          </Box>
        </Box>

        {items.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '8px' }}>
            <Typography color="text.secondary" variant="body2">No commitments defined for this period.</Typography>
          </Paper>
        ) : (
          <TableContainer id="opcr-table-container" component={Paper} sx={{ borderRadius: '8px', border: '1px solid #CBD5E1', boxShadow: 'none', overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650, borderCollapse: 'separate', borderSpacing: 0 }}>
              <TableHead>
                {/* Spreadsheet Column Name Row (No A-F letter headers, index cell is blank) */}
                <TableRow>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    bgcolor: '#580000', 
                    borderRight: '1px solid rgba(255,255,255,0.15)',
                    borderBottom: '1px solid #CBD5E1',
                    width: 45,
                    py: 1.25
                  }} />
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', py: 1.25, px: 2, borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid #CBD5E1', bgcolor: '#580000' }}>SERVICE CHARTER</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', py: 1.25, px: 2, borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid #CBD5E1', bgcolor: '#580000' }}>CLASSIFICATION</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', py: 1.25, px: 2, borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid #CBD5E1', bgcolor: '#580000' }}>KPI INDICATOR</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', py: 1.25, px: 2, borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid #CBD5E1', bgcolor: '#580000' }}>CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff', py: 1.25, px: 2, borderBottom: '1px solid #CBD5E1', bgcolor: '#580000' }} align="right">OPCR TARGET VALUE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => {
                  const svc = services.find(s => String(s.id) === String(item.service_id));
                  const kpi = kpis.find(k => String(k.id) === String(item.kpi_id));
                  
                  const isDuration = kpi ? ((kpi.category === "Timeliness" || kpi.category === "Efficiency") && kpi.unit !== "/ 5") : false;
                  
                  let formattedValue = "—";
                  if (item.target_value !== null && item.target_value !== undefined) {
                    if (isDuration) {
                      formattedValue = formatDuration(item.target_value);
                    } else if (kpi?.unit === "/ 5") {
                      formattedValue = `${parseFloat(item.target_value)} / 5`;
                    } else if (kpi?.unit === "%" || kpi?.category === "Quality") {
                      formattedValue = `${parseFloat(item.target_value)}%`;
                    } else {
                      formattedValue = String(parseFloat(item.target_value));
                    }
                  }

                  // Classification chip styles
                  const cls = svc?.classification || "Simple";
                  let chipStyle = { color: "#10B981", bg: "#ECFDF5", border: "1px solid rgba(16, 185, 129, 0.15)" };
                  if (cls.toLowerCase().includes("technical")) {
                    chipStyle = { color: "#EF4444", bg: "#FEF2F2", border: "1px solid rgba(239, 68, 68, 0.15)" };
                  } else if (cls.toLowerCase().includes("complex")) {
                    chipStyle = { color: "#D97706", bg: "#FFFBEB", border: "1px solid rgba(217, 119, 6, 0.15)" };
                  }

                  const rowNum = idx + 1; // Rows start at 1 on the first item
                  const isLastRow = idx === items.length - 1;

                  // Premium interactive cell style helper
                  const getCellStyle = (extra = {}) => ({
                    py: 1.25,
                    px: 2,
                    borderRight: '1px solid #E2E8F0',
                    borderBottom: isLastRow ? 'none' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'rgba(88, 0, 0, 0.02)',
                      outline: '1.5px solid var(--maroon, #580000)',
                      outlineOffset: '-1.5px',
                      cursor: 'cell',
                      zIndex: 1
                    },
                    ...extra
                  });

                  return (
                    <TableRow 
                      key={idx} 
                      hover
                      sx={{ 
                        '&:hover .row-index-cell': {
                          bgcolor: 'rgba(88, 0, 0, 0.1)',
                          color: 'var(--maroon, #580000)',
                          transition: 'all 0.15s ease'
                        }
                      }}
                    >
                      {/* Row Index Column (1, 2, 3...) */}
                      <TableCell 
                        className="row-index-cell"
                        sx={{ 
                          textAlign: 'center', 
                          bgcolor: 'var(--maroon-muted, #f2e8e8)', 
                          borderRight: '1px solid #CBD5E1',
                          borderBottom: isLastRow ? 'none' : '1px solid #CBD5E1',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          color: 'var(--maroon, #580000)',
                          width: 45,
                          py: 1.25,
                          userSelect: 'none'
                        }}
                      >
                        {rowNum}
                      </TableCell>

                      <TableCell sx={getCellStyle({ fontWeight: 600, color: '#1E293B' })}>
                        {svc?.name || "Unknown Service"}
                      </TableCell>
                      
                      <TableCell sx={getCellStyle()}>
                        <Chip
                          label={cls}
                          size="small"
                          sx={{
                            color: chipStyle.color,
                            bgcolor: chipStyle.bg,
                            border: chipStyle.border,
                            fontWeight: 700,
                            fontSize: "11px",
                            borderRadius: "12px",
                            px: 0.5
                          }}
                        />
                      </TableCell>

                      <TableCell sx={getCellStyle({ color: '#475569', fontWeight: 500 })}>
                        {kpi?.name || "Unknown KPI"}
                      </TableCell>

                      <TableCell sx={getCellStyle()}>
                        <Chip
                          label={kpi?.category || "—"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            ...(kpi?.category === "Timeliness" && { bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.15)' }),
                            ...(kpi?.category === "Quality" && { bgcolor: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.15)' }),
                            ...(kpi?.category === "Efficiency" && { bgcolor: '#ECFDF5', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.15)' })
                          }}
                        />
                      </TableCell>

                      <TableCell align="right" sx={getCellStyle({ fontWeight: 600, color: '#475569', fontSize: '0.875rem', borderRight: 'none' })}>
                        {formattedValue}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
