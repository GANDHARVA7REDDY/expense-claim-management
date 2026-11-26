import React, { useState } from 'react';
import { Button, Stack, Tab, Tabs } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ClaimTable from '../components/ClaimTable.jsx';
import { ConfirmDialog, RejectDialog } from '../components/Dialogs.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getClaims, getEmployees, getHistory } from '../services/dataStore.js';
import { approveClaim, rejectClaim } from '../services/claimService.js';
import { canApproveClaim } from '../services/permissions.js';
import { formatINR } from '../utils/format.js';

export default function Approvals() {
  const { user, act } = useApp();
  const [tab, setTab] = useState('pending');
  const [target, setTarget] = useState(null);
  const [mode, setMode] = useState(null); // 'approve' | 'reject'
  const employees = getEmployees();
  const claims = getClaims();

  const pending = claims.filter((c) => canApproveClaim(c, user));
  const reviewedIds = new Set(
    getHistory().filter((h) => h.actorId === user.id && (h.action === 'Approved' || h.action === 'Rejected')).map((h) => h.claimId),
  );
  const reviewed = claims.filter((c) => reviewedIds.has(c.id));

  const close = () => { setMode(null); setTarget(null); };

  return (
    <>
      <PageHeader title="Manager Approvals" subtitle="Review claims assigned to you. You cannot approve your own claims." />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="pending" label={`Pending (${pending.length})`} data-testid="tab-pending" />
        <Tab value="reviewed" label={`Reviewed by me (${reviewed.length})`} data-testid="tab-reviewed" />
      </Tabs>

      {tab === 'pending' ? (
        <ClaimTable
          claims={pending}
          employees={employees}
          emptyText="Nothing is waiting for your approval."
          renderActions={(c) => (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" component={RouterLink} to={`/claims/${c.id}`}>View</Button>
              <Button size="small" color="error" onClick={() => { setTarget(c); setMode('reject'); }} data-testid={`reject-${c.refNo}`}>Reject</Button>
              <Button size="small" variant="contained" color="success" onClick={() => { setTarget(c); setMode('approve'); }} data-testid={`approve-${c.refNo}`}>Approve</Button>
            </Stack>
          )}
        />
      ) : (
        <ClaimTable claims={reviewed} employees={employees} emptyText="You have not reviewed any claims yet." />
      )}

      <ConfirmDialog open={mode === 'approve'} title="Approve claim?" message={target ? `Approve ${target.refNo} for ${formatINR(target.totalAmount)}?` : ''} confirmText="Approve" color="success" onClose={close} onConfirm={() => { act(() => approveClaim(user.id, target.id), 'Claim approved'); close(); }} />
      <RejectDialog open={mode === 'reject'} claim={target} onClose={close} onConfirm={(comment) => act(() => rejectClaim(user.id, target.id, comment), 'Claim rejected')} />
    </>
  );
}
