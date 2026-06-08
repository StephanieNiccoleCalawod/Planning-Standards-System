import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  MenuItem,
  Box
} from '@mui/material';

/**
 * KPIModal – Add / Edit KPI Standard Target dialog.
 *
 * Props:
 *   open           – boolean (showAdd || !!editingKpi)
 *   editingKpi     – kpi object when editing, null when adding
 *   services       – array of available services for the linked-service select
 *
 *   // form field state (all lifted to parent)
 *   name / setName
 *   category / setCategory
 *   target / setTarget
 *   targetDays / setTargetDays
 *   targetHours / setTargetHours
 *   targetMins / setTargetMins
 *   unit / setUnit
 *   serviceId / setServiceId
 *   errors / setErrors
 *
 *   onSave  – form submit handler (receives event)
 *   onClose – cancel handler
 */
export default function KPIModal({
  open,
  editingKpi,
  services,
  name, setName,
  category, setCategory,
  target, setTarget,
  targetDays, setTargetDays,
  targetHours, setTargetHours,
  targetMins, setTargetMins,
  unit, setUnit,
  serviceId, setServiceId,
  errors, setErrors,
  onSave,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDialog-paper': { maxWidth: '480px', width: '100%', borderRadius: 2.5 } }}
    >
      <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.35rem', pb: 1 }}>
        {editingKpi ? 'Edit KPI Standard Target' : 'Define KPI Standard Target'}
      </DialogTitle>

      <form onSubmit={onSave}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* KPI Name */}
          <TextField
            label="KPI Target Name"
            placeholder="e.g. Processing time for Graduation Clearance"
            required
            fullWidth
            value={name}
            error={!!errors.name}
            helperText={errors.name || ''}
            onChange={(e) => {
              setName(e.target.value);
              setErrors(prev => ({ ...prev, name: '' }));
            }}
            variant="outlined"
            size="small"
          />

          {/* Category Select */}
          <TextField
            select
            label="Measurement Category"
            required
            fullWidth
            value={category}
            onChange={(e) => {
              const newCat = e.target.value;
              setCategory(newCat);
              setErrors({});
              if (newCat === 'Quality') {
                setUnit('%');
              } else {
                if (unit === '%') setUnit(' Days');
              }
            }}
            size="small"
          >
            <MenuItem value="Timeliness">Timeliness (SLA / Processing Duration)</MenuItem>
            <MenuItem value="Quality">Quality Graded standard (Satisfaction)</MenuItem>
            <MenuItem value="Efficiency">Efficiency (Completion Volume Rate)</MenuItem>
          </TextField>

          {/* Target Values */}
          {category === 'Quality' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Target Value"
                placeholder="e.g. 95"
                type="number"
                inputProps={{ step: 'any', min: 0, max: 100 }}
                required
                value={target}
                error={!!errors.target}
                helperText={errors.target || ''}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setErrors(prev => ({ ...prev, target: '' }));
                }}
                size="small"
              />
              <TextField
                label="Unit"
                value="%"
                InputProps={{ readOnly: true }}
                disabled
                size="small"
                sx={{ bgcolor: '#F1F5F9', border: 'none', borderRadius: 1 }}
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                TARGET VALUE *
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                <TextField
                  label="Days"
                  placeholder="Days"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={targetDays}
                  error={!!errors.target}
                  onChange={(e) => {
                    setTargetDays(e.target.value);
                    setErrors(prev => ({ ...prev, target: '' }));
                  }}
                  size="small"
                />
                <TextField
                  label="Hours"
                  placeholder="Hours"
                  type="number"
                  inputProps={{ min: 0, max: 23 }}
                  value={targetHours}
                  error={!!errors.target}
                  onChange={(e) => {
                    setTargetHours(e.target.value);
                    setErrors(prev => ({ ...prev, target: '' }));
                  }}
                  size="small"
                />
                <TextField
                  label="Mins"
                  placeholder="Mins"
                  type="number"
                  inputProps={{ min: 0, max: 59 }}
                  value={targetMins}
                  error={!!errors.target}
                  onChange={(e) => {
                    setTargetMins(e.target.value);
                    setErrors(prev => ({ ...prev, target: '' }));
                  }}
                  size="small"
                />
              </Box>
              {errors.target && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 500 }}>
                  {errors.target}
                </Typography>
              )}
            </Box>
          )}

          {/* Linked Service */}
          <TextField
            select
            label="Link to Service Charter"
            required
            fullWidth
            value={serviceId}
            error={!!errors.serviceId}
            helperText={errors.serviceId || ''}
            onChange={(e) => {
              setServiceId(e.target.value);
              setErrors(prev => ({ ...prev, serviceId: '' }));
            }}
            size="small"
          >
            <MenuItem value="">Select Service...</MenuItem>
            {services.filter(s => s.active || String(s.id) === String(serviceId)).map(s => {
              const withRef = s.withReferral?.toLowerCase();
              const refLabel = withRef === 'without' ? '(Without Referral)' :
                               withRef === 'n/a' ? '(Not Applicable)' : '(With Referral)';
              return (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} {refLabel}
                </MenuItem>
              );
            })}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {editingKpi ? 'Save Changes' : 'Define KPI'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
