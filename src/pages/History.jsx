import React, { useState } from 'react';
import {
  Box, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getClaims, getEmployees, getHistory } from '../services/dataStore.js';
import { visibleClaims, visibleHistory } from '../services/permissions.js';
import { formatDateTime } from '../utils/format.js';

const ACTIONS = ['Created', 'Submitted', 'Approved', 'Rejected', 'Revised', 'Payment recorded'];

export default function History() {
  const { user } = useApp();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const claims = visibleClaims(getClaims(), user, getEmployees());
  const q = search.trim().toLowerCase();

  const rows = visibleHistory(getHistory(), claims)
    .map((h) => ({ ...h, claim: claims.find((c) => c.id === h.claimId) }))
    .filter((h) => !action || h.action === action)
    .filter((h) => !q || h.claim.refNo.toLowerCase().includes(q) || h.claim.title.toLowerCase().includes(q) || h.actorName.toLowerCase().includes(q) || h.comment.toLowerCase().includes(q))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <>
      <PageHeader title="Activity History" subtitle="Submission, approval, rejection and payment activity" />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField label="Search" placeholder="Reference, title, person or comment" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 280 }} inputProps={{ 'data-testid': 'history-search' }} />
          <TextField select label="Activity" value={action} onChange={(e) => setAction(e.target.value)} sx={{ minWidth: 180 }} data-testid="history-action">
            <MenuItem value="">All activity</MenuItem>
            {ACTIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table size="small" data-testid="history-table">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell><TableCell>Claim</TableCell><TableCell>Activity</TableCell><TableCell>Status change</TableCell><TableCell>By</TableCell><TableCell>Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No activity found.</Typography></TableCell></TableRow>}
            {rows.map((h) => (
              <TableRow key={h.id} hover data-testid="history-row">
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(h.timestamp)}</TableCell>
                <TableCell><RouterLink to={`/claims/${h.claim.id}`}>{h.claim.refNo}</RouterLink></TableCell>
                <TableCell>{h.action}</TableCell>
                <TableCell>{h.toStatus ? <StatusChip status={h.toStatus} /> : '—'}</TableCell>
                <TableCell>{h.actorName}</TableCell>
                <TableCell>{h.comment || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
