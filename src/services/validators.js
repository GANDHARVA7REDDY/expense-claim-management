import { RECEIPT_THRESHOLD } from './constants.js';
import { todayISO } from '../utils/dates.js';
import { formatINR } from '../utils/format.js';

/**
 * Validates a claim form/record.
 *  - Value rules (amount > 0, no future dates, category cap) always apply to whatever is filled in.
 *  - "Required" rules and the receipt rule apply only when `submit` is true,
 *    so employees can save partial drafts.
 * Returns { title?, claimDate?, purpose?, items?, rows: { [rowId]: { field: message } } }
 */
export function validateClaim(input, categories, { submit = false, today = todayISO() } = {}) {
  const errors = { rows: {} };
  const items = input.items || [];

  if (!input.title || !input.title.trim()) errors.title = 'Claim title is required';
  if (submit) {
    if (!input.claimDate) errors.claimDate = 'Claim date is required';
    if (!input.purpose || !input.purpose.trim()) errors.purpose = 'Business purpose is required';
    if (items.length === 0) errors.items = 'Add at least one expense item before submitting';
  }

  for (const r of items) {
    const e = {};
    const cat = categories.find((c) => c.id === r.categoryId);
    const raw = r.amount === '' || r.amount == null ? null : Number(r.amount);

    if (!r.categoryId) {
      if (submit) e.categoryId = 'Select a category';
    } else if (!cat) {
      e.categoryId = 'Unknown category';
    }

    if (!r.expenseDate) {
      if (submit) e.expenseDate = 'Expense date is required';
    } else if (r.expenseDate > today) {
      e.expenseDate = 'Expense date cannot be in the future';
    }

    if (submit && (!r.description || !r.description.trim())) e.description = 'Description is required';

    if (raw === null || Number.isNaN(raw)) {
      if (submit) e.amount = 'Amount is required';
    } else if (raw <= 0) {
      e.amount = 'Amount must be greater than 0';
    } else {
      if (cat && cat.maxAmount && raw > cat.maxAmount) {
        e.amount = `Exceeds ${cat.name} limit of ${formatINR(cat.maxAmount)}`;
      }
      if (submit && raw > RECEIPT_THRESHOLD && !r.receipt) {
        e.receipt = `Receipt required for expenses above ${formatINR(RECEIPT_THRESHOLD)}`;
      }
    }

    if (Object.keys(e).length) errors.rows[r.id] = e;
  }
  return errors;
}

export const hasErrors = (errors) =>
  !!(errors.title || errors.claimDate || errors.purpose || errors.items || Object.keys(errors.rows || {}).length);

export function firstError(errors) {
  const top = errors.title || errors.claimDate || errors.purpose || errors.items;
  if (top) return top;
  for (const rowId of Object.keys(errors.rows || {})) {
    const vals = Object.values(errors.rows[rowId]);
    if (vals.length) return vals[0];
  }
  return 'Validation failed';
}

export const calcTotal = (items) =>
  (items || []).reduce((sum, r) => {
    const n = Number(r.amount);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
