import React, { useState } from 'react';
import {
  Button, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ClaimTable from '../components/ClaimTable.jsx';
import { PaymentDialog } from '../components/Dialogs.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getClaims, getEmployees, getPayments } from '../services/dataStore.js';
import { recordPayment } from '../services/claimService.js';
import { canPayClaim } from '../services/permissions.js';
import { formatDate, formatINR } from '../utils/format.js';
import { employeeName } from '../utils/lookup.js';

export default function Finance() {
  const { user, act } = useApp();
  const [tab, setTab] = useState('queue');
  const [target, setTarget] = useState(null);
  const employees = getEmployees();
  const claims = getClaims();
  const queue = claims.filter((c) => canPayClaim(c, user));
  const payments = [...getPayments()].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const queueTotal = queue.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <>
      <PageHeader title="Finance Processing" subtitle={`${queue.length} approved claim(s) awaiting payment · ${formatINR(queueTotal)}`} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="queue" label={`Approved queue (${queue.length})`} data-testid="tab-queue" />
        <Tab value="payments" label={`Payment records (${payments.length})`} data-testid="tab-payments" />
      </Tabs>

      {tab === 'queue' ? (
        <ClaimTable
          claims={queue}
          employees={employees}
          emptyText="No approved claims are waiting for payment."
          renderActions={(c) => (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" component={RouterLink} to={`/claims/${c.id}`}>View</Button>
              <Button size="small" variant="contained" color="success" onClick={() => setTarget(c)} data-testid={`pay-${c.refNo}`}>Record payment</Button>
            </Stack>
          )}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" data-testid="payments-table">
            <TableHead>
              <TableRow>
                <TableCell>Payment reference</TableCell>
                <TableCell>Claim</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Payment date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Paid by</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No payments recorded yet.</Typography></TableCell></TableRow>}
              {payments.map((p) => {
                const claim = claims.find((c) => c.id === p.claimId);
                return (
                  <TableRow key={p.id} hover data-testid="payment-row">
                    <TableCell>{p.paymentRef}</TableCell>
                    <TableCell>{claim ? <RouterLink to={`/claims/${claim.id}`}>{claim.refNo}</RouterLink> : '—'}</TableCell>
                    <TableCell>{claim ? employeeName(employees, claim.employeeId) : '—'}</TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell align="right">{formatINR(p.amount)}</TableCell>
                    <TableCell>{employeeName(employees, p.paidBy)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <PaymentDialog open={!!target} claim={target} onClose={() => setTarget(null)} onConfirm={(v) => act(() => recordPayment(user.id, target.id, v), 'Payment recorded')} />
    </>
  );
}
