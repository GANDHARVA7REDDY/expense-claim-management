import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
} from '@mui/material';
import PageHeader from '../components/PageHeader.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getCategories } from '../services/dataStore.js';
import { saveCategory } from '../services/masterDataService.js';
import { canManageMasterData } from '../services/permissions.js';
import { RuleError } from '../services/errors.js';
import { formatINR } from '../utils/format.js';

function CategoryDialog({ open, initial, onClose }) {
  const { user, refresh, notify } = useApp();
  const [form, setForm] = useState({ name: '', maxAmount: '', active: true });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : { name: '', maxAmount: '', active: true });
      setErrors({});
    }
  }, [open, initial]);

  const submit = () => {
    try {
      saveCategory(user.id, form);
      refresh();
      notify(initial ? 'Category updated' : 'Category added');
      onClose();
    } catch (e) {
      if (!(e instanceof RuleError)) throw e;
      setErrors(e.errors || {});
      if (!e.errors) notify(e.message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial ? 'Edit category' : 'Add category'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Category name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={!!errors.name} helperText={errors.name} inputProps={{ 'data-testid': 'cat-name' }} />
          <TextField label="Maximum eligible amount (₹) *" type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} error={!!errors.maxAmount} helperText={errors.maxAmount || 'Applies to each expense item in this category'} inputProps={{ min: 0, 'data-testid': 'cat-max' }} />
          <FormControlLabel control={<Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />} label="Active (available for new expenses)" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} data-testid="cat-save">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Categories() {
  const { user } = useApp();
  const [dialog, setDialog] = useState({ open: false, initial: null });
  const categories = getCategories();
  const editable = canManageMasterData(user);

  return (
    <>
      <PageHeader
        title="Expense Categories"
        subtitle="Categories and the maximum eligible amount per expense item"
        actions={editable && <Button variant="contained" onClick={() => setDialog({ open: true, initial: null })} data-testid="add-category">Add category</Button>}
      />
      {!editable && <Alert severity="info" sx={{ mb: 2 }}>View only. Finance can add and edit categories.</Alert>}
      <TableContainer component={Paper}>
        <Table size="small" data-testid="categories-table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>Category</TableCell><TableCell align="right">Max eligible amount</TableCell><TableCell>Status</TableCell>
              {editable && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id} hover data-testid="category-row">
                <TableCell>{c.id}</TableCell><TableCell>{c.name}</TableCell><TableCell align="right">{formatINR(c.maxAmount)}</TableCell>
                <TableCell><Chip size="small" label={c.active !== false ? 'Active' : 'Inactive'} color={c.active !== false ? 'success' : 'default'} /></TableCell>
                {editable && <TableCell align="right"><Button size="small" onClick={() => setDialog({ open: true, initial: c })} data-testid={`edit-${c.id}`}>Edit</Button></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CategoryDialog open={dialog.open} initial={dialog.initial} onClose={() => setDialog({ open: false, initial: null })} />
    </>
  );
}
