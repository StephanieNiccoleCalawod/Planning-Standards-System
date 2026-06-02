import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  Chip
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Toggle from "../components/Toggle";
import ResultModal from "./ResultModal";

export default function IntakeFieldBuilderModal({ service, onClose, onSave }) {
  const initialFields = service?.intakeFields || [];

  const [fields, setFields] = useState(initialFields);

  // State for form adding / editing a field
  const [editingFieldId, setEditingFieldId] = useState(null); // Null means adding new field
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("Text");
  const [required, setRequired] = useState(true);
  const [dropdownOptions, setDropdownOptions] = useState(""); // Comma separated options for dropdowns

  const [errors, setErrors] = useState({});
  const [resultModal, setResultModal] = useState(null);

  // Reset form states
  const resetForm = () => {
    setEditingFieldId(null);
    setLabel("");
    setFieldType("Text");
    setRequired(true);
    setDropdownOptions("");
    setErrors({});
  };

  const handleEditClick = (field) => {
    setEditingFieldId(field.id);
    setLabel(field.label);
    setFieldType(field.type);
    setRequired(field.required);
    setDropdownOptions(field.options ? field.options.join(", ") : "");
    setErrors({});
  };

  const handleAddField = () => {
    const e = {};
    if (!label.trim()) e.label = true;
    if (fieldType === "Dropdown" && !dropdownOptions.trim()) e.dropdownOptions = true;

    // Duplication Check: Allow same name OR same field type, but NOT both.
    // Meaning if both label AND type match an existing field, it's a duplicate.
    const isDuplicate = fields.some(f => 
      f.label.trim().toLowerCase() === label.trim().toLowerCase() && 
      f.type === fieldType && 
      f.id !== editingFieldId
    );

    if (isDuplicate) {
      setResultModal({
        type: "error",
        title: "Duplicate Field",
        message: `An intake field with the name "${label}" and type "${fieldType}" already exists.`
      });
      return;
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const optionsArray = fieldType === "Dropdown"
      ? dropdownOptions.split(",").map(o => o.trim()).filter(Boolean)
      : undefined;

    if (editingFieldId !== null) {
      // Edit mode
      setFields(prev => prev.map(f => f.id === editingFieldId ? {
        ...f,
        label,
        type: fieldType,
        required,
        options: optionsArray,
      } : f));
    } else {
      // Add mode
      const newField = {
        id: Date.now(),
        label,
        type: fieldType,
        required,
        options: optionsArray,
        displayOrder: fields.length + 1,
      };
      setFields(prev => [...prev, newField]);
    }

    resetForm();
  };

  const handleDeleteField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id).map((f, index) => ({
      ...f,
      displayOrder: index + 1,
    })));
  };

  const handleMove = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...fields];

    // Swap items
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Re-assign display orders
    const ordered = updated.map((f, i) => ({ ...f, displayOrder: i + 1 }));
    setFields(ordered);
  };

  const handleSaveAll = () => {
    if (onSave) {
      onSave({
        ...service,
        intakeFields: fields,
      });
    }
    onClose();
  };

  return (
    <>
      <Dialog
        open
        onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          mx: { xs: 1.5, sm: 'auto' }
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: { xs: '1.2rem', sm: '1.35rem' }, pb: 1 }}>
        <Box>
          Intake Field Builder
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontWeight: 500 }}>
            Define required form fields for: {service?.name}
          </Typography>
        </Box>
      </DialogTitle>

      {/* Body Grid */}
      <DialogContent sx={{ pt: 1, px: { xs: 2, sm: 3 }, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {/* Left panel: Fields list */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              maxHeight: { xs: '360px', md: '420px' },
              ...(fields.length === 0 && { height: '100%', minHeight: '320px' }),
              overflowY: 'auto',
              pr: 0.5
            }}>
              {fields.length > 0 ? (
                fields.map((field, index) => (
                  <Paper
                    key={field.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      borderColor: '#E2E8F0',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: '#CBD5E1',
                        bgcolor: '#F1F5F9'
                      }
                    }}
                  >
                    {/* Up Down arrows */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        sx={{
                          width: 24, height: 24, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: '#fff',
                          '&:hover:not(:disabled)': { bgcolor: '#F1F5F9' }
                        }}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 12, color: '#64748B' }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === fields.length - 1}
                        onClick={() => handleMove(index, "down")}
                        sx={{
                          width: 24, height: 24, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: '#fff',
                          '&:hover:not(:disabled)': { bgcolor: '#F1F5F9' }
                        }}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 12, color: '#64748B' }} />
                      </IconButton>
                    </Box>

                    {/* Label details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        title={field.label}
                        sx={{
                          fontWeight: 700,
                          color: '#1E293B',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {field.label}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Type: {field.type} · Order: {field.displayOrder}
                        </Typography>
                        {field.required && (
                          <Chip
                            label="REQUIRED"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '9px',
                              fontWeight: 700,
                              bgcolor: '#FEF2F2',
                              color: '#EF4444',
                              borderRadius: 1
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Edit/Delete Actions */}
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      <Tooltip title="Edit intake field" arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(field)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'rgba(25, 118, 210, 0.2)',
                              bgcolor: 'rgba(25, 118, 210, 0.04)',
                              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                              width: 28,
                              height: 28,
                              borderRadius: 1.5,
                              color: 'primary.main'
                            }}
                          >
                            <EditIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove intake field" arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteField(field.id)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'rgba(211, 47, 47, 0.2)',
                              bgcolor: 'rgba(211, 47, 47, 0.04)',
                              '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' },
                              width: 28,
                              height: 28,
                              borderRadius: 1.5,
                              color: 'error.main'
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '2px dashed #E2E8F0',
                  borderRadius: 3,
                  bgcolor: '#F8FAFC',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  p: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    bgcolor: '#F1F5F9'
                  }
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94A3B8', marginBottom: '16px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="13" y2="17" />
                  </svg>
                  <Typography sx={{ fontWeight: 600, color: '#475569', mb: 0.5, fontSize: '0.9rem' }}>
                    No Custom Intake Fields Yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', maxWidth: '220px', display: 'block', lineHeight: 1.4 }}>
                    Use the form on the right to define required fields.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right panel: Add/Edit form */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                bgcolor: '#FAFAFA',
                borderRadius: 2,
                borderColor: '#E2E8F0',
                minHeight: { xs: 'auto', md: '320px' },
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#1E293B',
                  mb: 2.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {editingFieldId !== null ? "Edit Intake Field" : "Add Intake Field"}
              </Typography>

              {/* Field Label */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                  FIELD LABEL *
                </Typography>
                <TextField
                  placeholder="e.g. Reference Slip Number"
                  fullWidth
                  size="small"
                  value={label}
                  error={!!errors.label}
                  helperText={errors.label ? "Field label is required." : ""}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setErrors(prev => ({ ...prev, label: false }));
                  }}
                />
              </Box>

              {/* Field Type */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                  FIELD TYPE
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                >
                  <MenuItem value="Text">Text Input</MenuItem>
                  <MenuItem value="Number">Number Input</MenuItem>
                  <MenuItem value="Date">Date Selector</MenuItem>
                  <MenuItem value="Dropdown">Dropdown Selector</MenuItem>
                  <MenuItem value="Checkbox">Checkbox Indicator</MenuItem>
                </TextField>
              </Box>

              {/* Dropdown options */}
              {fieldType === "Dropdown" && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                    DROPDOWN OPTIONS (comma separated) *
                  </Typography>
                  <TextField
                    placeholder="e.g. Option 1, Option 2, Option 3"
                    fullWidth
                    size="small"
                    value={dropdownOptions}
                    error={!!errors.dropdownOptions}
                    helperText={errors.dropdownOptions ? "Dropdown options are required." : ""}
                    onChange={(e) => {
                      setDropdownOptions(e.target.value);
                      setErrors(prev => ({ ...prev, dropdownOptions: false }));
                    }}
                  />
                </Box>
              )}

              {/* Required Indicator Toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, mt: 2.5 }}>
                <Toggle checked={required} onChange={() => setRequired(p => !p)} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
                  REQUIRED FIELD
                </Typography>
              </Box>

              {/* Actions for local add/edit */}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                {editingFieldId !== null && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    onClick={resetForm}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: editingFieldId !== null ? '#1E293B' : '#800000',
                    '&:hover': { bgcolor: editingFieldId !== null ? '#0F172A' : '#990000' },
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                  onClick={handleAddField}
                >
                  {editingFieldId !== null ? "Update Field" : "Add Field"}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} sx={{ px: 3 }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAll}
            sx={{ bgcolor: '#800000', '&:hover': { bgcolor: '#990000' }, px: 4 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Modal for Validation Errors */}
      {resultModal && (
        <ResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(null)}
        />
      )}
    </>
  );
}
