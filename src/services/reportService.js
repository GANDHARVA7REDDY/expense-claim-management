import { STATUS } from './constants.js';

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

export function computeStats(claims) {
  const by = (st) => claims.filter((c) => c.status === st);
  return {
    total: claims.length,
    draft: by(STATUS.DRAFT).length,
    pending: by(STATUS.SUBMITTED).length,
    approved: by(STATUS.APPROVED).length,
    rejected: by(STATUS.REJECTED).length,
    paid: by(STATUS.PAID).length,
    pendingAmount: sum(by(STATUS.SUBMITTED), (c) => c.totalAmount),
    approvedAmount: sum(by(STATUS.APPROVED), (c) => c.totalAmount),
    paidAmount: sum(by(STATUS.PAID), (c) => c.totalAmount),
  };
}

/** Expense totals per category over submitted-or-later claims (drafts are not yet expenses). */
export function categoryTotals(claims, categories) {
  const live = claims.filter((c) => c.status !== STATUS.DRAFT);
  return categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      amount: sum(live, (c) => sum(c.items.filter((i) => i.categoryId === cat.id), (i) => i.amount)),
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * filters: { employeeId, categoryId, status, from, to }  (from/to compare against claimDate, inclusive)
 */
export function buildReport(claims, filters, { employees, categories }) {
  const f = filters || {};
  const rows = [];
  for (const c of claims) {
    if (f.employeeId && c.employeeId !== f.employeeId) continue;
    if (f.status && c.status !== f.status) continue;
    if (f.from && c.claimDate < f.from) continue;
    if (f.to && c.claimDate > f.to) continue;
    const items = f.categoryId ? c.items.filter((i) => i.categoryId === f.categoryId) : c.items;
    if (f.categoryId && items.length === 0) continue;
    rows.push({ claim: c, items, amount: sum(items, (i) => i.amount) });
  }

  const group = (keyFn, labelFn) => {
    const m = new Map();
    for (const r of rows) {
      const k = keyFn(r);
      const e = m.get(k) || { key: k, label: labelFn(k), count: 0, amount: 0 };
      e.count += 1;
      e.amount += r.amount;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.amount - a.amount);
  };

  const byCategory = categories
    .map((cat) => ({
      key: cat.id,
      label: cat.name,
      amount: sum(rows, (r) => sum(r.items.filter((i) => i.categoryId === cat.id), (i) => i.amount)),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    rows,
    total: sum(rows, (r) => r.amount),
    byEmployee: group((r) => r.claim.employeeId, (id) => employees.find((e) => e.id === id)?.name ?? id),
    byStatus: group((r) => r.claim.status, (s) => s),
    byCategory,
  };
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function reportToCSV(rows, employees) {
  const head = ['Reference', 'Title', 'Employee', 'Department', 'Claim Date', 'Status', 'Amount'];
  const lines = [head.map(csvCell).join(',')];
  for (const r of rows) {
    const emp = employees.find((e) => e.id === r.claim.employeeId);
    lines.push(
      [r.claim.refNo, r.claim.title, emp?.name, emp?.department, r.claim.claimDate, r.claim.status, r.amount]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}
