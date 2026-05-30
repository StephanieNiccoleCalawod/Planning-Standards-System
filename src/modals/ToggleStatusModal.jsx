import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

/**
 * ToggleStatusModal – Reusable activate / deactivate confirmation dialog.
 *
 * Props:
 *   open        – boolean
 *   isActivate  – true = "Activate" flow, false = "Deactivate" flow
 *   itemName    – name of the record being toggled (displayed in the body)
 *   entityLabel – label for the entity type, e.g. "KPI Target" (default: "item")
 *   bodyExtra   – optional extra sentence shown below the main confirmation
 *   onConfirm   – called when user confirms the toggle
 *   onCancel    – close / cancel handler
 */
export default function ToggleStatusModal({
  open,
  isActivate = true,
  itemName = '',
  entityLabel = 'item',
  bodyExtra,
  onConfirm,
  onCancel,
}) {
  const titleText = isActivate
    ? `Activate ${entityLabel}?`
    : `Deactivate ${entityLabel}?`;

  const actionColor = isActivate ? '#10B981' : '#DC2626';
  const hoverColor  = isActivate ? '#059669' : '#B91C1C';
  const nameColor   = isActivate ? '#10B981' : '#800000';

  const defaultBody = isActivate
    ? `Are you sure you want to activate`
    : `Are you sure you want to deactivate`;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 500, fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.35rem' }}>{titleText}</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {defaultBody}{' '}
          <strong style={{ color: nameColor }}>"{itemName}"</strong>?
          {bodyExtra && (
            <>
              <br /><br />
              {bodyExtra}
            </>
          )}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{ bgcolor: actionColor, '&:hover': { bgcolor: hoverColor } }}
          onClick={onConfirm}
        >
          {isActivate ? 'Yes, Activate' : 'Yes, Deactivate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
