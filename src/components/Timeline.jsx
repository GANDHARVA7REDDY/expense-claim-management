import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatDateTime } from '../utils/format.js';
import StatusChip from './StatusChip.jsx';

const DOT = {
  Draft: 'grey.500',
  Submitted: 'warning.main',
  Approved: 'info.main',
  Rejected: 'error.main',
  Paid: 'success.main',
};

/** Vertical activity timeline. `events` are history entries. */
export default function Timeline({ events }) {
  if (!events.length) return <Typography color="text.secondary">No activity yet.</Typography>;
  return (
    <Box data-testid="timeline">
      {events.map((e, i) => (
        <Box key={e.id} sx={{ display: 'flex', gap: 2, pb: i === events.length - 1 ? 0 : 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: DOT[e.toStatus] || 'grey.500', mt: 0.7 }} />
            {i < events.length - 1 && <Box sx={{ flex: 1, width: 2, bgcolor: 'divider', mt: 0.5 }} />}
          </Box>
          <Box>
            <Typography variant="subtitle2" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {e.action}
              {e.toStatus && <StatusChip status={e.toStatus} />}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {e.actorName} · {formatDateTime(e.timestamp)}
            </Typography>
            {e.comment && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                “{e.comment}”
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
