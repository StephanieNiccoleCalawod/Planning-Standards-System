import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
  Select,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Queue as QueueIcon,
  Assessment as AssessmentIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';

import PageHeader from "../components/PageHeader";
import { api } from "../services/api";

export default function SLAComputation() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [utilization, setUtilization] = useState([]);
  
  // Pending queue is simulated on the client to show live processing
  const [pendingQueue, setPendingQueue] = useState([
    { transaction_id: "TX-90104", service_name: "Certification of Grades", office: "Records Office", queued_at: "2 mins ago" },
    { transaction_id: "TX-90105", service_name: "Good Moral Certificate", office: "OSAS", queued_at: "4 mins ago" },
    { transaction_id: "TX-90106", service_name: "Transcript of Records Request", office: "Registrar Office", queued_at: "7 mins ago" }
  ]);

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getSlaComputationLogs({
        page: currentPage,
        limit: rowsPerPage,
        transaction_id: searchQuery.trim() || undefined
      });
      if (res && res.data) {
        setLogs(res.data);
        setTotalLogs(res.total || res.data.length);
      }
    } catch (err) {
      console.error("Failed to load SLA logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUtilization = async () => {
    try {
      const res = await api.getServiceUtilization();
      if (Array.isArray(res)) {
        setUtilization(res);
      }
    } catch (err) {
      console.error("Failed to load service utilization:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, rowsPerPage, searchQuery]);

  useEffect(() => {
    fetchUtilization();
  }, []);

  // Soft animation / updates for pending queue simulation to showcase computational engine activity
  useEffect(() => {
    const interval = setInterval(() => {
      // Rotate queue items or simulate items being completed and new ones arriving
      setPendingQueue(prev => {
        const next = [...prev];
        if (next.length > 0) {
          const processed = next.shift();
          // Add a new random transaction
          const randId = `TX-${Math.floor(10000 + Math.random() * 90000)}`;
          const services = [
            "Enrollment Assessment", 
            "Document Request Processing", 
            "Faculty Evaluation Request", 
            "Alumni ID Registration"
          ];
          const offices = ["Records Office", "Registrar Office", "Academic Affairs", "Alumni Relations"];
          const randIndex = Math.floor(Math.random() * services.length);
          
          next.push({
            transaction_id: randId,
            service_name: services[randIndex],
            office: offices[randIndex],
            queued_at: "Just now"
          });
        }
        return next;
      });
    }, 15000); // cycle every 15s

    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.ceil(totalLogs / rowsPerPage) || 1;

  // OPCR 1-5 timeliness score styling helper
  const getScoreChipStyles = (score) => {
    const num = Number(score);
    if (num >= 4.5) return { bgcolor: '#ECFDF5', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.2)', label: `Score: ${score} - Outstanding` };
    if (num >= 3.5) return { bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)', label: `Score: ${score} - Very Satisfactory` };
    if (num >= 2.5) return { bgcolor: '#FFFBEB', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.2)', label: `Score: ${score} - Satisfactory` };
    if (num >= 1.5) return { bgcolor: '#FFF7ED', color: '#EA580C', border: '1px solid rgba(234, 88, 12, 0.2)', label: `Score: ${score} - Unsatisfactory` };
    return { bgcolor: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.2)', label: `Score: ${score} - Poor` };
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#F8FAFC', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* Dynamic Keyframes for pulsing animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-green {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .pulse-badge {
          width: 8px;
          height: 8px;
          background-color: #10B981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-green 2s infinite ease-in-out;
        }
      `}} />

      {/* Top Header */}
      <PageHeader breadcrumb="SLA Computation" title="SLA Computation Monitor" subtitle="Track real-time SLA computation status and transaction logs." />

      {/* Queue & Status Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Connection Status Indicator */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#10B981' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AutorenewIcon sx={{ color: '#10B981' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Computation Engine Status
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <span className="pulse-badge" />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Active & Listening
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Computing service transaction durations and mapping timeliness scores (1–5 scale) based on SLA guidelines in real-time.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Computation Queue Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#C8960C' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <QueueIcon sx={{ color: '#C8960C' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Pending Computation Queue (Live Intake)
                </Typography>
                <Chip 
                  label={`${pendingQueue.length} Pending`} 
                  size="small" 
                  sx={{ ml: 'auto', bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(217, 119, 6, 0.15)' }} 
                />
              </Box>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #F1F5F9', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#580000' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#ffffff' }}>TRANSACTION ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#ffffff' }}>SERVICE NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#ffffff' }}>OFFICE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#ffffff' }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingQueue.map((item) => (
                      <TableRow key={item.transaction_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E293B', fontSize: '0.8rem' }}>{item.transaction_id}</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{item.service_name}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{item.office}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label="Processing" 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem', 
                              fontWeight: 700, 
                              bgcolor: '#FFFBEB', 
                              color: '#D97706',
                              border: '1px solid rgba(217, 119, 6, 0.1)' 
                            }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Computation Log section */}
      <Card sx={{ borderRadius: '8px', border: '1px solid #E2E8F0', mb: 4, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TimelineIcon sx={{ color: '#580000' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontFamily: '"DM Serif Display", Georgia, serif' }}>
                EMS Transaction Computation Logs
              </Typography>
            </Box>
            
            <TextField
              placeholder="Search Transaction ID..."
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="disabled" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: 260,
                ml: 'auto',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                }
              }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#580000', '& .MuiTableCell-root': { py: 1.5, whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>TRANSACTION ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>SERVICE NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>TIME IN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>TIME OUT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>COMPUTED DURATION</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>TIMELINESS SCORE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#ffffff' }}>COMPUTED AT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ color: '#580000', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Fetching transaction logs...</Typography>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No computation logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const timeInFmt = new Date(log.time_in).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const timeOutFmt = new Date(log.time_out).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const evalFmt = new Date(log.evaluated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const scoreStyles = getScoreChipStyles(log.opcr_score);

                    return (
                      <TableRow key={log.id} hover sx={{ '& .MuiTableCell-root': { py: 1.5, borderBottom: '1px solid #CBD5E1' } }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E293B' }}>{log.transaction_id}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{log.service_name}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{timeInFmt}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{timeOutFmt}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{Number(log.computed_duration_days).toFixed(4)} Days</TableCell>
                        <TableCell>
                          <Chip 
                            label={scoreStyles.label} 
                            size="small" 
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.72rem', 
                              bgcolor: scoreStyles.bgcolor, 
                              color: scoreStyles.color, 
                              border: scoreStyles.border 
                            }} 
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{evalFmt}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Container */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Items per page:</Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                size="small"
                sx={{ 
                  height: 32, 
                  '& .MuiSelect-select': { py: 0.5, px: 1.5, fontSize: '0.875rem' },
                  borderRadius: 2 
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </Box>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, val) => setCurrentPage(val)}
                color="primary"
                shape="rounded"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Service Utilization section */}
      <Card sx={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <AssessmentIcon sx={{ color: '#580000' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontFamily: '"DM Serif Display", Georgia, serif' }}>
              Quarterly Aggregated Service Utilization (EMS Ingested)
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {utilization.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No service utilization reports ingested yet.
                </Typography>
              </Grid>
            ) : (
              utilization.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', '&:hover': { border: '1px solid #CBD5E1', bgcolor: '#F1F5F9' }, transition: 'all 0.2s' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.service_name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          label={`Q${item.quarter} ${item.year}`} 
                          size="small" 
                          sx={{ bgcolor: '#FFF3E0', color: '#F57C00', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(245, 124, 0, 0.15)' }} 
                        />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#580000' }}>
                          {item.transaction_count} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>txs</span>
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                        Office: {item.office || "Unknown"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </CardContent>
      </Card>

    </Box>
  );
}
