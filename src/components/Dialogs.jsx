import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Stack, Box,
} from '@mui/material';
import { todayISO } from '../utils/dates.js';
import { formatINR } from '../utils/format.js';

export function ConfirmDialog({ open, title, message, confirmText = 'Confirm', color = 'primary', onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color={color} onClick={onConfirm}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Rejection requires a comment. onConfirm(comment) returns true when the action succeeded. */
export function RejectDialog({ open, claim, onClose, onConfirm }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setComment('');
      setError('');
    }
  }, [open]);

  const submit = () => {
    if (!comment.trim()) {
      setError('Rejection comment is required');
      return;
    }
    if (onConfirm(comment)) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reject claim {claim?.refNo}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Rejection comment *"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error || 'Explain what the employee needs to fix.'}
          sx={{ mt: 1 }}
          inputProps={{ 'data-testid': 'reject-comment' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={submit} data-testid="confirm-reject">
          Reject claim
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Payment reference and date are mandatory. onConfirm({paymentRef, paymentDate}) returns true on success. */
export function PaymentDialog({ open, claim, onClose, onConfirm }) {
  const [paymentRef, setRef] = useState('');
  const [paymentDate, setDate] = useState(todayISO());
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setRef('');
      setDate(todayISO());
      setErrors({});
    }
  }, [open]);

  const submit = () => {
    const e = {};
    if (!paymentRef.trim()) e.paymentRef = 'Payment reference number is required';
    if (!paymentDate) e.paymentDate = 'Payment date is required';
    else if (paymentDate > todayISO()) e.paymentDate = 'Payment date cannot be in the future';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (onConfirm({ paymentRef, paymentDate })) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Record payment - {claim?.refNo}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            Amount payable: <strong>{formatINR(claim?.totalAmount)}</strong>
          </Box>
          <TextField
            autoFocus
            label="Payment reference number *"
            value={paymentRef}
            onChange={(e) => setRef(e.target.value)}
            error={!!errors.paymentRef}
            helperText={errors.paymentRef}
            inputProps={{ 'data-testid': 'payment-ref' }}
          />
          <TextField
            label="Payment date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setDate(e.target.value)}
            error={!!errors.paymentDate}
            helperText={errors.paymentDate}
            slotProps={{ inputLabel: { shrink: true } }}
            inputProps={{ 'data-testid': 'payment-date' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={submit} data-testid="confirm-payment">
          Record payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReceiptDialog({ receipt, onClose }) {
  return (
    <Dialog open={!!receipt} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{receipt?.name}</DialogTitle>
      <DialogContent>
        {receipt?.type?.startsWith('image/') ? (
          <Box component="img" src={receipt.dataUrl} alt={receipt.name} sx={{ maxWidth: '100%', imageRendering: 'auto' }} />
        ) : receipt ? (
          <Box component="iframe" src={receipt.dataUrl} title={receipt.name} sx={{ width: '100%', height: '70vh', border: 0 }} />
        ) : null}
      </DialogContent>
      <DialogActions>
        {receipt && (
          <Button component="a" href={receipt.dataUrl} download={receipt.name}>
            Download
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
