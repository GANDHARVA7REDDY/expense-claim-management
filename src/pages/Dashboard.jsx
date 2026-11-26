import React from 'react';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getCategories, getClaims, getEmployees } from '../services/dataStore.js';
import { visibleClaims, canApproveClaim, canPayClaim } from '../services/permissions.js';
import { categoryTotals, computeStats } from '../services/reportService.js';
import { formatINR } from '../utils/format.js';

const SCOPE_TEXT = {
  Employee: 'Showing your own claims',
  Manager: 'Showing your claims and your team’s claims',
  Finance: 'Showing all submitted claims across the organisation',
};

function StatCard({ label, value, hint, color, to, testId }) {
  const navigate = useNavigate();
  return (
    <Paper
      onClick={to ? () => navigate(to) : undefined}
      sx={{ p: 2, cursor: to ? 'pointer' : 'default', borderLeft: 4, borderLeftColor: color, '&:hover': to ? { boxShadow: 2 } : undefined }}
      data-testid={testId}
    >
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }} data-testid={`${testId}-value`}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

export default function Dashboard() {
  const { user } = useApp();
  const employees = getEmployees();
  const categories = getCategories();
  const claims = visibleClaims(getClaims(), user, employees);
  const stats = computeStats(claims);
  const cats = categoryTotals(claims, categories);
  const max = Math.max(1, ...cats.map((c) => c.amount));
  const toApprove = claims.filter((c) => canApproveClaim(c, user)).length;
  const toPay = claims.filter((c) => canPayClaim(c, user)).length;
  const link = (status) => `/claims?scope=all${status ? `&status=${status}` : ''}`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={SCOPE_TEXT[user.role]}
        actions={
          <Button component={RouterLink} to="/claims/new" variant="contained" data-testid="new-claim-btn">
            New claim
          </Button>
        }
      />

      {toApprove > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button component={RouterLink} to="/approvals" color="inherit" size="small">Review</Button>} data-testid="alert-approvals">
          {toApprove} claim{toApprove > 1 ? 's' : ''} waiting for your approval.
        </Alert>
      )}
      {toPay > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} action={<Button component={RouterLink} to="/finance" color="inherit" size="small">Process</Button>} data-testid="alert-finance">
          {toPay} approved claim{toPay > 1 ? 's' : ''} waiting for payment.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, mb: 3 }}>
        <StatCard testId="stat-total" label="Total Claims" value={stats.total} color="primary.main" to={link()} />
        <StatCard testId="stat-pending" label="Pending Approval" value={stats.pending} hint={formatINR(stats.pendingAmount)} color="warning.main" to={link('Submitted')} />
        <StatCard testId="stat-approved" label="Approved Claims" value={stats.approved} hint={`${formatINR(stats.approvedAmount)} awaiting payment`} color="info.main" to={link('Approved')} />
        <StatCard testId="stat-rejected" label="Rejected Claims" value={stats.rejected} color="error.main" to={link('Rejected')} />
        <StatCard testId="stat-paid" label="Paid Claims" value={stats.paid} color="success.main" to={link('Paid')} />
        <StatCard testId="stat-paid-amount" label="Total Paid Amount" value={formatINR(stats.paidAmount)} color="success.dark" />
      </Box>

      <Paper sx={{ p: 2 }} data-testid="category-chart">
        <Typography variant="h6" sx={{ mb: 2 }}>Expenses by Category</Typography>
        {cats.every((c) => c.amount === 0) ? (
          <Typography color="text.secondary">No submitted expenses yet.</Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1, sm: 3 }, height: 240, borderBottom: 1, borderColor: 'divider', px: 1 }}>
            {cats.map((c) => (
              <Box key={c.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ mb: 0.5 }} data-testid={`bar-value-${c.name}`}>{formatINR(c.amount)}</Typography>
                <Box
                  role="img"
                  aria-label={`${c.name}: ${formatINR(c.amount)}`}
                  sx={{ width: '100%', maxWidth: 80, height: `${Math.max(2, (c.amount / max) * 85)}%`, bgcolor: 'primary.light', borderRadius: '8px 8px 0 0' }}
                />
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 3 }, px: 1, pt: 1 }}>
          {cats.map((c) => (
            <Typography key={c.id} variant="caption" align="center" sx={{ flex: 1 }}>{c.name}</Typography>
          ))}
        </Box>
      </Paper>
    </>
  );
}
