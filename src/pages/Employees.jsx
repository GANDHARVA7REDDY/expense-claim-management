import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
} from '@mui/material';
import PageHeader from '../components/PageHeader.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getEmployees } from '../services/dataStore.js';
import { saveEmployee } from '../services/masterDataService.js';
import { canManageMasterData } from '../services/permissions.js';
import { ROLES } from '../services/constants.js';
import { RuleError } from '../services/errors.js';

const EMPTY = { name: '', email: '', department: '', role: 'Employee', managerId: '' };

function EmployeeDialog({ open, initial, onClose }) {
  const { user, employees, refresh, notify } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial, managerId: initial.managerId || '' } : EMPTY);
      setErrors({});
    }
  }, [open, initial]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    try {
      saveEmployee(user.id, form);
      refresh();
      notify(initial ? 'Employee updated' : 'Employee added');
      onClose();
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      setErrors(e.errors || {});
      if (!e.errors) notify(e.message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit employee' : 'Add employee'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name *" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} inputProps={{ 'data-testid': 'emp-name' }} />
          <TextField label="Email *" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} inputProps={{ 'data-testid': 'emp-email' }} />
          <TextField label="Department *" value={form.department} onChange={set('department')} error={!!errors.department} helperText={errors.department} inputProps={{ 'data-testid': 'emp-dept' }} />
          <TextField select label="Role *" value={form.role} onChange={set('role')} error={!!errors.role} helperText={errors.role} data-testid="emp-role">
            {Object.values(ROLES).map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField select label="Approving manager" value={form.managerId} onChange={set('managerId')} error={!!errors.managerId} helperText={errors.managerId || 'Claims from this employee are approved by this manager'} data-testid="emp-manager">
            <MenuItem value="">None</MenuItem>
            {employees.filter((e) => e.role === ROLES.MANAGER && e.id !== form.id).map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} data-testid="emp-save">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Employees() {
  const { user } = useApp();
  const [dialog, setDialog] = useState({ open: false, initial: null });
  const employees = getEmployees();
  const editable = canManageMasterData(user);
  const nameOf = (id) => employees.find((e) => e.id === id)?.name || '—';

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Sample employee directory"
        actions={editable && <Button variant="contained" onClick={() => setDialog({ open: true, initial: null })} data-testid="add-employee">Add employee</Button>}
      />
      {!editable && <Alert severity="info" sx={{ mb: 2 }}>View only. Finance can add and edit employees.</Alert>}
      <TableContainer component={Paper}>
        <Table size="small" data-testid="employees-table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Department</TableCell><TableCell>Role</TableCell><TableCell>Approving manager</TableCell>
              {editable && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id} hover data-testid="employee-row">
                <TableCell>{e.id}</TableCell><TableCell>{e.name}</TableCell><TableCell>{e.email}</TableCell><TableCell>{e.department}</TableCell><TableCell>{e.role}</TableCell><TableCell>{e.managerId ? nameOf(e.managerId) : '—'}</TableCell>
                {editable && <TableCell align="right"><Button size="small" onClick={() => setDialog({ open: true, initial: e })} data-testid={`edit-${e.id}`}>Edit</Button></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EmployeeDialog open={dialog.open} initial={dialog.initial} onClose={() => setDialog({ open: false, initial: null })} />
    </>
  );
}
