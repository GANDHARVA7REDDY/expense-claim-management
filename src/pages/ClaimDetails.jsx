import React, { useState } from 'react';
import {
  Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusChip from '../components/StatusChip.jsx';
import Timeline from '../components/Timeline.jsx';
import { ConfirmDialog, PaymentDialog, ReceiptDialog, RejectDialog } from '../components/Dialogs.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getCategories, getClaim, getEmployees, getHistory, getPayments } from '../services/dataStore.js';
import {
  approveClaim, recordPayment, rejectClaim, reviseClaim, submitClaim,
} from '../services/claimService.js';
import {
  canApproveClaim, canEditClaim, canPayClaim, canReviseClaim, canViewClaim,
} from '../services/permissions.js';
import { formatDate, formatINR } from '../utils/format.js';
import { categoryName, employeeDept, employeeName } from '../utils/lookup.js';

function Field({ label, children, testId }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1" component="div" data-testid={testId}>{children}</Typography>
    </Box>
  );
}

export default function ClaimDetails() {
  const { id } = useParams();
  const { user, act } = useApp();
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'pay' | 'submit'
  const [receipt, setReceipt] = useState(null);

  const employees = getEmployees();
  const categories = getCategories();
  const claim = getClaim(id);

  if (!claim || !canViewClaim(claim, user, employees)) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 560 }} data-testid="claim-not-found">
        <Alert severity="error">Claim not found, or you do not have access to it.</Alert>
        <Button component={RouterLink} to="/claims" variant="contained" sx={{ alignSelf: 'flex-start' }}>Back to claims</Button>
      </Stack>
    );
  }

  const history = getHistory().filter((h) => h.claimId === claim.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const payment = getPayments().find((p) => p.claimId === claim.id);
  const isOwn = claim.employeeId === user.id;
  const approverName = employeeName(employees, claim.approverId);

  return (
    <>
      <PageHeader
        title={`${claim.refNo} · ${claim.title}`}
        subtitle={`Submitted by ${employeeName(employees, claim.employeeId)}`}
        actions={
          <>
            {canEditClaim(claim, user) && (
              <>
                <Button component={RouterLink} to={`/claims/${claim.id}/edit`} variant="outlined" data-testid="edit-btn">Edit</Button>
                <Button variant="contained" onClick={() => setDialog('submit')} data-testid="submit-btn">Submit</Button>
              </>
            )}
            {canReviseClaim(claim, user) && <Button variant="contained" onClick={() => act(() => reviseClaim(user.id, claim.id), 'Claim returned to Draft')} data-testid="revise-btn">Revise claim</Button>}
            {canApproveClaim(claim, user) && (
              <>
                <Button variant="outlined" color="error" onClick={() => setDialog('reject')} data-testid="reject-btn">Reject</Button>
                <Button variant="contained" color="success" onClick={() => setDialog('approve')} data-testid="approve-btn">Approve</Button>
              </>
            )}
            {canPayClaim(claim, user) && <Button variant="contained" color="success" onClick={() => setDialog('pay')} data-testid="pay-btn">Record payment</Button>}
          </>
        }
      />

      {claim.status === 'Rejected' && claim.rejectionComment && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="rejection-banner">Rejected: “{claim.rejectionComment}”</Alert>
      )}
      {claim.status === 'Submitted' && isOwn && (
        <Alert severity="info" sx={{ mb: 2 }} data-testid="locked-banner">This claim is waiting for approval by {approverName}. It can no longer be edited.</Alert>
      )}
      {claim.status === 'Submitted' && !canApproveClaim(claim, user) && user.role === 'Manager' && isOwn && (
        <Alert severity="info" sx={{ mb: 2 }} data-testid="own-claim-banner">You cannot approve your own claim. It is assigned to {approverName}.</Alert>
      )}
      {claim.status === 'Paid' && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="paid-banner">
          Paid on {formatDate(payment?.paymentDate)} · Reference {payment?.paymentRef}. Paid claims cannot be modified.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' } }}>
          <Field label="Reference">{claim.refNo}</Field>
          <Field label="Employee">{employeeName(employees, claim.employeeId)}</Field>
          <Field label="Department">{employeeDept(employees, claim.employeeId)}</Field>
          <Field label="Status"><StatusChip status={claim.status} /></Field>
          <Field label="Claim date">{formatDate(claim.claimDate)}</Field>
          <Field label="Approving manager">{claim.approverId ? approverName : '—'}</Field>
          <Field label="Total claim amount" testId="detail-total">{formatINR(claim.totalAmount)}</Field>
          <Field label="Business purpose">{claim.purpose || '—'}</Field>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Expense items</Typography>
        <TableContainer>
          <Table size="small" data-testid="detail-items">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Receipt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {claim.items.length === 0 && <TableRow><TableCell colSpan={5} align="center">No expense items.</TableCell></TableRow>}
              {claim.items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{categoryName(categories, i.categoryId)}</TableCell>
                  <TableCell>{formatDate(i.expenseDate)}</TableCell>
                  <TableCell>{i.description}</TableCell>
                  <TableCell align="right">{formatINR(i.amount)}</TableCell>
                  <TableCell>
                    {i.receipt ? <Button size="small" onClick={() => setReceipt(i.receipt)}>{i.receipt.name}</Button> : <Typography variant="body2" color="text.secondary">None</Typography>}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                <TableCell align="right"><strong>{formatINR(claim.totalAmount)}</strong></TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Approval history</Typography>
        <Timeline events={history} />
      </Paper>

      <ConfirmDialog open={dialog === 'submit'} title="Submit claim?" message={`Once submitted you cannot edit this claim. ${formatINR(claim.totalAmount)} will go to your manager for approval.`} confirmText="Submit" onClose={() => setDialog(null)} onConfirm={() => { setDialog(null); act(() => submitClaim(user.id, claim.id), 'Claim submitted for approval'); }} />
      <ConfirmDialog open={dialog === 'approve'} title="Approve claim?" message={`Approve ${claim.refNo} for ${formatINR(claim.totalAmount)}?`} confirmText="Approve" color="success" onClose={() => setDialog(null)} onConfirm={() => { setDialog(null); act(() => approveClaim(user.id, claim.id), 'Claim approved'); }} />
      <RejectDialog open={dialog === 'reject'} claim={claim} onClose={() => setDialog(null)} onConfirm={(comment) => act(() => rejectClaim(user.id, claim.id, comment), 'Claim rejected')} />
      <PaymentDialog open={dialog === 'pay'} claim={claim} onClose={() => setDialog(null)} onConfirm={(v) => act(() => recordPayment(user.id, claim.id, v), 'Payment recorded')} />
      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}
