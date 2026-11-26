import React, { useState } from 'react';
import {
  Box, Button, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import PageHeader from '../components/PageHeader.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getCategories, getClaims, getEmployees } from '../services/dataStore.js';
import { visibleClaims } from '../services/permissions.js';
import { buildReport, reportToCSV } from '../services/reportService.js';
import { STATUS } from '../services/constants.js';
import { formatDate, formatINR } from '../utils/format.js';
import { employeeName } from '../utils/lookup.js';

function Summary({ title, rows, testId, showCount = true }) {
  return (
    <Paper sx={{ p: 2 }} data-testid={testId}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Table size="small">
        <TableBody>
          {rows.length === 0 && <TableRow><TableCell>No data</TableCell></TableRow>}
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell>{r.label}</TableCell>
              {showCount && <TableCell align="right">{r.count} claim(s)</TableCell>}
              <TableCell align="right">{formatINR(r.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function Reports() {
  const { user } = useApp();
  const [filters, setFilters] = useState({ employeeId: '', categoryId: '', status: '', from: '', to: '' });
  const employees = getEmployees();
  const categories = getCategories();
  const claims = visibleClaims(getClaims(), user, employees);
  const scopedEmployees = employees.filter((e) => claims.some((c) => c.employeeId === e.id));
  const report = buildReport(claims, filters, { employees, categories });
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const exportCsv = () => {
    const blob = new Blob([reportToCSV(report.rows, employees)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Expense reports by employee, category, status and date" actions={<Button variant="outlined" onClick={exportCsv} disabled={!report.rows.length} data-testid="export-csv">Export CSV</Button>} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField select label="Employee" value={filters.employeeId} onChange={set('employeeId')} sx={{ minWidth: 180 }} data-testid="rpt-employee">
            <MenuItem value="">All employees</MenuItem>
            {scopedEmployees.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </TextField>
          <TextField select label="Category" value={filters.categoryId} onChange={set('categoryId')} sx={{ minWidth: 160 }} data-testid="rpt-category">
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={set('status')} sx={{ minWidth: 150 }} data-testid="rpt-status">
            <MenuItem value="">All statuses</MenuItem>
            {Object.values(STATUS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="From" type="date" value={filters.from} onChange={set('from')} slotProps={{ inputLabel: { shrink: true } }} inputProps={{ 'data-testid': 'rpt-from' }} />
          <TextField label="To" type="date" value={filters.to} onChange={set('to')} slotProps={{ inputLabel: { shrink: true } }} inputProps={{ 'data-testid': 'rpt-to' }} />
          <Button onClick={() => setFilters({ employeeId: '', categoryId: '', status: '', from: '', to: '' })}>Clear</Button>
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>
        {report.rows.length} claim(s) · Total <span data-testid="rpt-total">{formatINR(report.total)}</span>
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, mb: 3 }}>
        <Summary testId="rpt-by-employee" title="By employee" rows={report.byEmployee} />
        <Summary testId="rpt-by-category" title="By category" rows={report.byCategory} showCount={false} />
        <Summary testId="rpt-by-status" title="By status" rows={report.byStatus} />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small" data-testid="rpt-table">
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell><TableCell>Title</TableCell><TableCell>Employee</TableCell><TableCell>Claim date</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.rows.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No claims match the selected filters.</TableCell></TableRow>}
            {report.rows.map((r) => (
              <TableRow key={r.claim.id} hover data-testid="rpt-row">
                <TableCell>{r.claim.refNo}</TableCell><TableCell>{r.claim.title}</TableCell><TableCell>{employeeName(employees, r.claim.employeeId)}</TableCell>
                <TableCell>{formatDate(r.claim.claimDate)}</TableCell><TableCell><StatusChip status={r.claim.status} /></TableCell><TableCell align="right">{formatINR(r.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
