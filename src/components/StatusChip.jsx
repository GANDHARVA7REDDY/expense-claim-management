import React from 'react';
import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../theme.js';

export default function StatusChip({ status, ...rest }) {
  return (
    <Chip
      size="small"
      label={status}
      color={STATUS_COLORS[status] || 'default'}
      variant={status === 'Draft' ? 'outlined' : 'filled'}
      data-testid="status-chip"
      {...rest}
    />
  );
}
