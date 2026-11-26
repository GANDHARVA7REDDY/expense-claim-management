import React from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StatusChip from './StatusChip.jsx';
import { formatDate, formatINR } from '../utils/format.js';
import { employeeName } from '../utils/lookup.js';

/** Shared claims table. Clicking a row opens the claim details. */
export default function ClaimTable({ claims, employees, showEmployee = true, renderActions, emptyText = 'No claims found.' }) {
  const navigate = useNavigate();
  return (
    <TableContainer component={Paper}>
      <Table size="small" data-testid="claims-table">
        <TableHead>
          <TableRow>
            <TableCell>Reference</TableCell>
            <TableCell>Title</TableCell>
            {showEmployee && <TableCell>Employee</TableCell>}
            <TableCell>Claim date</TableCell>
            <TableCell align="right">Items</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            {renderActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {claims.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">{emptyText}</Typography>
              </TableCell>
            </TableRow>
          )}
          {claims.map((c) => (
            <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/claims/${c.id}`)} data-testid="claim-row">
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{c.refNo}</TableCell>
              <TableCell>{c.title}</TableCell>
              {showEmployee && <TableCell>{employeeName(employees, c.employeeId)}</TableCell>}
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(c.claimDate)}</TableCell>
              <TableCell align="right">{c.items.length}</TableCell>
              <TableCell align="right">{formatINR(c.totalAmount)}</TableCell>
              <TableCell>
                <StatusChip status={c.status} />
              </TableCell>
              {renderActions && (
                <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                  {renderActions(c)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
