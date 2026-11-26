import React, { useState } from 'react';
import {
  Box, Button, MenuItem, Paper, TextField, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ClaimTable from '../components/ClaimTable.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getClaims, getEmployees } from '../services/dataStore.js';
import { visibleClaims, canEditClaim } from '../services/permissions.js';
import { ROLES, STATUS } from '../services/constants.js';
import { employeeName } from '../utils/lookup.js';

export default function Claims() {
  const { user } = useApp();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const employees = getEmployees();

  const canSeeOthers = user.role !== ROLES.EMPLOYEE;
  const scope = canSeeOthers && params.get('scope') === 'all' ? 'all' : 'mine';
  const status = params.get('status') || '';

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  let claims = scope === 'all' ? visibleClaims(getClaims(), user, employees) : getClaims().filter((c) => c.employeeId === user.id);
  const q = search.trim().toLowerCase();
  claims = claims
    .filter((c) => !status || c.status === status)
    .filter((c) => !q || c.refNo.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || employeeName(employees, c.employeeId).toLowerCase().includes(q))
    .filter((c) => !from || c.claimDate >= from)
    .filter((c) => !to || c.claimDate <= to)
    .sort((a, b) => (b.claimDate + b.refNo).localeCompare(a.claimDate + a.refNo));

  const scopeLabel = user.role === ROLES.FINANCE ? 'All claims' : 'Team claims';

  return (
    <>
      <PageHeader
        title={scope === 'all' ? scopeLabel : 'My Claims'}
        subtitle="Search, filter and track expense claims"
        actions={<Button component={RouterLink} to="/claims/new" variant="contained" data-testid="new-claim-btn">New claim</Button>}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {canSeeOthers && (
            <ToggleButtonGroup size="small" exclusive value={scope} onChange={(_, v) => v && update('scope', v === 'all' ? 'all' : '')} data-testid="scope-toggle">
              <ToggleButton value="mine">My claims</ToggleButton>
              <ToggleButton value="all">{scopeLabel}</ToggleButton>
            </ToggleButtonGroup>
          )}
          <TextField label="Search" placeholder="Reference, title or employee" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} inputProps={{ 'data-testid': 'search-input' }} />
          <TextField select label="Status" value={status} onChange={(e) => update('status', e.target.value)} sx={{ minWidth: 150 }} data-testid="status-filter">
            <MenuItem value="">All statuses</MenuItem>
            {Object.values(STATUS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} inputProps={{ 'data-testid': 'date-from' }} />
          <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} inputProps={{ 'data-testid': 'date-to' }} />
          <Button onClick={() => { setSearch(''); setFrom(''); setTo(''); setParams({}, { replace: true }); }}>Clear</Button>
        </Box>
      </Paper>

      <ClaimTable
        claims={claims}
        employees={employees}
        showEmployee={scope === 'all'}
        emptyText="No claims match your filters."
        renderActions={(c) => (
          <Button size="small" component={RouterLink} to={canEditClaim(c, user) ? `/claims/${c.id}/edit` : `/claims/${c.id}`}>
            {canEditClaim(c, user) ? 'Edit' : 'View'}
          </Button>
        )}
      />
    </>
  );
}
