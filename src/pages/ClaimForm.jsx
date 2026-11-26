import React, { useState } from 'react';
import {
  Alert, Box, Button, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PageHeader from '../components/PageHeader.jsx';
import { ConfirmDialog, ReceiptDialog } from '../components/Dialogs.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getCategories, getClaim } from '../services/dataStore.js';
import { saveClaim } from '../services/claimService.js';
import { canEditClaim } from '../services/permissions.js';
import { calcTotal, firstError, hasErrors, validateClaim } from '../services/validators.js';
import { MAX_RECEIPT_BYTES, RECEIPT_THRESHOLD } from '../services/constants.js';
import { todayISO } from '../utils/dates.js';
import { formatINR, uid } from '../utils/format.js';

const newRow = () => ({ id: uid('row'), categoryId: '', description: '', expenseDate: '', amount: '', receipt: null });

export default function ClaimForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, act, notify } = useApp();
  const existing = id ? getClaim(id) : null;
  const categories = getCategories();

  const [form, setForm] = useState(() =>
    existing
      ? { id: existing.id, title: existing.title, claimDate: existing.claimDate, purpose: existing.purpose, items: existing.items.map((i) => ({ ...i })) }
      : { title: '', claimDate: todayISO(), purpose: '', items: [newRow()] },
  );
  const [attempted, setAttempted] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [preview, setPreview] = useState(null);

  if (id && !existing) return <Alert severity="error">Claim not found.</Alert>;
  if (existing && !canEditClaim(existing, user)) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 560 }} data-testid="not-editable">
        <Alert severity="warning">
          {existing.status === 'Paid'
            ? 'Paid claims cannot be modified.'
            : `This claim is ${existing.status}. Only your own Draft claims can be edited.`}
        </Alert>
        <Button component={RouterLink} to={`/claims/${existing.id}`} variant="contained" sx={{ alignSelf: 'flex-start' }}>View claim</Button>
      </Stack>
    );
  }

  const errors = validateClaim(form, categories, { submit: attempted });
  const total = calcTotal(form.items);
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateRow = (rowId, patch) => setForm((f) => ({ ...f, items: f.items.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) }));
  const removeRow = (rowId) => setForm((f) => ({ ...f, items: f.items.filter((r) => r.id !== rowId) }));
  const addRow = () => setForm((f) => ({ ...f, items: [...f.items, newRow()] }));

  async function onFile(rowId, file) {
    if (!file) return;
    if (file.size > MAX_RECEIPT_BYTES) return notify(`Receipt must be ${MAX_RECEIPT_BYTES / 1024} KB or smaller`, 'error');
    if (!/^(image\/|application\/pdf)/.test(file.type)) return notify('Only image or PDF receipts are allowed', 'error');
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    updateRow(rowId, { receipt: { name: file.name, type: file.type, dataUrl } });
    return undefined;
  }

  function save(submit) {
    if (submit) setAttempted(true);
    const check = validateClaim(form, categories, { submit });
    if (hasErrors(check)) {
      notify(firstError(check), 'error');
      return;
    }
    const claim = act(() => saveClaim(user.id, form, { submit }), submit ? 'Claim submitted for approval' : 'Draft saved');
    if (claim) navigate(`/claims/${claim.id}`);
  }

  const activeCats = (current) => categories.filter((c) => c.active !== false || c.id === current);

  return (
    <>
      <PageHeader title={existing ? `Edit claim ${existing.refNo}` : 'Create expense claim'} subtitle="Add the expenses you want reimbursed" />

      {existing?.rejectionComment && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="rejection-banner">
          Previously rejected: “{existing.rejectionComment}”
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Claim details</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' } }}>
          <TextField label="Claim reference number" value={existing?.refNo || 'Auto-generated on save'} disabled />
          <TextField label="Employee name" value={user.name} disabled inputProps={{ 'data-testid': 'employee-name' }} />
          <TextField label="Department" value={user.department} disabled inputProps={{ 'data-testid': 'department' }} />
          <TextField label="Claim title *" value={form.title} onChange={(e) => setField('title', e.target.value)} error={!!errors.title && (attempted || form.title !== '')} helperText={errors.title} inputProps={{ 'data-testid': 'claim-title' }} />
          <TextField label="Claim date *" type="date" value={form.claimDate} onChange={(e) => setField('claimDate', e.target.value)} error={!!errors.claimDate} helperText={errors.claimDate} slotProps={{ inputLabel: { shrink: true } }} inputProps={{ 'data-testid': 'claim-date' }} />
          <TextField label="Status" value={existing?.status || 'Draft'} disabled />
          <TextField label="Business purpose *" multiline minRows={2} value={form.purpose} onChange={(e) => setField('purpose', e.target.value)} error={!!errors.purpose} helperText={errors.purpose} sx={{ gridColumn: { md: '1 / -1' } }} inputProps={{ 'data-testid': 'claim-purpose' }} />
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">Expense items</Typography>
          <Button startIcon={<AddIcon />} onClick={addRow} data-testid="add-row">Add expense</Button>
        </Stack>
        {errors.items && <Alert severity="error" sx={{ mb: 1 }} data-testid="items-error">{errors.items}</Alert>}
        <TableContainer>
          <Table size="small" sx={{ minWidth: 960 }} data-testid="items-table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 190 }}>Category *</TableCell>
                <TableCell sx={{ width: 160 }}>Expense date *</TableCell>
                <TableCell>Description *</TableCell>
                <TableCell sx={{ width: 140 }}>Amount (₹) *</TableCell>
                <TableCell sx={{ width: 220 }}>Receipt</TableCell>
                <TableCell sx={{ width: 56 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {form.items.map((r, idx) => {
                const e = errors.rows[r.id] || {};
                const needsReceipt = Number(r.amount) > RECEIPT_THRESHOLD;
                return (
                  <TableRow key={r.id} data-testid="item-row" sx={{ verticalAlign: 'top' }}>
                    <TableCell>
                      <TextField select fullWidth value={r.categoryId} onChange={(ev) => updateRow(r.id, { categoryId: ev.target.value })} error={!!e.categoryId} helperText={e.categoryId} inputProps={{ 'data-testid': `item-category-${idx}` }} SelectProps={{ displayEmpty: true }} data-testid={`item-category-${idx}`}>
                        <MenuItem value="" disabled>Select</MenuItem>
                        {activeCats(r.categoryId).map((c) => (
                          <MenuItem key={c.id} value={c.id}>{c.name} (max {formatINR(c.maxAmount)})</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth type="date" value={r.expenseDate} onChange={(ev) => updateRow(r.id, { expenseDate: ev.target.value })} error={!!e.expenseDate} helperText={e.expenseDate} inputProps={{ max: todayISO(), 'data-testid': `item-date-${idx}` }} />
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth value={r.description} onChange={(ev) => updateRow(r.id, { description: ev.target.value })} error={!!e.description} helperText={e.description} inputProps={{ 'data-testid': `item-desc-${idx}` }} />
                    </TableCell>
                    <TableCell>
                      <TextField fullWidth type="number" value={r.amount} onChange={(ev) => updateRow(r.id, { amount: ev.target.value })} error={!!e.amount} helperText={e.amount} inputProps={{ min: 0, step: '0.01', 'data-testid': `item-amount-${idx}` }} />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5} alignItems="flex-start">
                        {r.receipt ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Button size="small" onClick={() => setPreview(r.receipt)} sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.receipt.name}</Button>
                            <Button size="small" color="error" onClick={() => updateRow(r.id, { receipt: null })}>Remove</Button>
                          </Stack>
                        ) : (
                          <Button size="small" variant="outlined" component="label" startIcon={<AttachFileIcon />} color={e.receipt ? 'error' : 'primary'}>
                            Attach
                            <input hidden type="file" accept="image/*,application/pdf" data-testid={`item-receipt-${idx}`} onChange={(ev) => { onFile(r.id, ev.target.files[0]); ev.target.value = ''; }} />
                          </Button>
                        )}
                        {(e.receipt || (needsReceipt && !r.receipt)) && (
                          <Typography variant="caption" color={e.receipt ? 'error' : 'warning.main'} data-testid={`item-receipt-msg-${idx}`}>
                            {e.receipt || `Receipt required above ${formatINR(RECEIPT_THRESHOLD)}`}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remove row">
                        <IconButton onClick={() => removeRow(r.id)} aria-label="Remove expense row" data-testid={`item-remove-${idx}`}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2, position: 'sticky', bottom: 8, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', boxShadow: 3 }}>
        <Typography variant="h6">
          Total Claim Amount: <span data-testid="total-amount">{formatINR(total)}</span>
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="outlined" onClick={() => save(false)} data-testid="save-draft">Save draft</Button>
          <Button variant="contained" onClick={() => { setAttempted(true); const c = validateClaim(form, categories, { submit: true }); if (hasErrors(c)) notify(firstError(c), 'error'); else setConfirmSubmit(true); }} data-testid="submit-claim">Submit for approval</Button>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit claim?"
        message={`Once submitted you cannot edit this claim. Total ${formatINR(total)} will go to your manager for approval.`}
        confirmText="Submit"
        onClose={() => setConfirmSubmit(false)}
        onConfirm={() => { setConfirmSubmit(false); save(true); }}
      />
      <ReceiptDialog receipt={preview} onClose={() => setPreview(null)} />
    </>
  );
}
