import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Box
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

/**
 * HolidayModal – Add / Edit holiday dialog.
 *
 * Props:
 *   open           – boolean
 *   editingHoliday – holiday object when editing, null when adding
 *   name / setName
 *   date / setDate
 *   type / setType
 *   isRecurring / setIsRecurring
 *   onSave         – form submit handler (receives event)
 *   onClose        – close / cancel handler
 *   onDelete       – called when "Delete" is clicked; passes editingHoliday
 */
export default function HolidayModal({
  open,
  editingHoliday,
  name, setName,
  date, setDate,
  type, setType,
  isRecurring, setIsRecurring,
  onSave,
  onClose,
  onDelete,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.35rem', pb: 1 }}>
        {editingHoliday ? 'Edit Holiday' : 'Encode Holiday'}
      </DialogTitle>

      <form onSubmit={onSave}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Holiday Name"
            placeholder="e.g. Independence Day"
            fullWidth
            required
            size="small"
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{ mt: 1 }}
          />

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
              DATE *
            </Typography>
            <TextField
              type="date"
              fullWidth
              required
              size="small"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </Box>

          <TextField
            select
            label="Holiday Type"
            fullWidth
            required
            size="small"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <MenuItem value="National">National Holiday</MenuItem>
            <MenuItem value="Local">Local Holiday</MenuItem>
            <MenuItem value="Campus">Campus / Office Holiday</MenuItem>
          </TextField>

          <FormControlLabel
            sx={{ alignItems: 'flex-start', mt: 1 }}
            control={
              <Checkbox
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                color="primary"
                sx={{ p: 0.5, mr: 1, '& .MuiSvgIcon-root': { fontSize: 26 } }}
              />
            }
            label={
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                  Recurring Annual Holiday
                </Typography>
                <Typography sx={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, mt: 0.5 }}>
                  Auto-encodes for next 5 years
                </Typography>
              </Box>
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          {editingHoliday && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(editingHoliday)}
              sx={{ mr: 'auto' }}
            >
              Delete
            </Button>
          )}
          <Button variant="outlined" color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {editingHoliday ? 'Save Changes' : 'Encode Holiday'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
