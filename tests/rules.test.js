import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { setBackend, memoryBackend } from '../src/services/storage.js';
import {
  resetDemoData, ensureSeeded, getClaims, getClaim, getHistory, getPayments,
  getEmployees, getCategories, getEmployee,
} from '../src/services/dataStore.js';
import {
  saveClaim, submitClaim, approveClaim, rejectClaim, reviseClaim, recordPayment, nextRefNo,
} from '../src/services/claimService.js';
import { saveEmployee, saveCategory } from '../src/services/masterDataService.js';
import { RuleError } from '../src/services/errors.js';
import {
  canAccess, visibleClaims, canApproveClaim, canPayClaim, canEditClaim,
} from '../src/services/permissions.js';
import { computeStats, categoryTotals, buildReport, reportToCSV } from '../src/services/reportService.js';
import { todayISO } from '../src/utils/dates.js';
import { formatINR } from '../src/utils/format.js';

const day = (n) => todayISO(new Date(Date.now() + n * 86400000));
const item = (o = {}) => ({
  id: `r${Math.random().toString(36).slice(2, 8)}`,
  categoryId: 'CAT01',
  description: 'Taxi',
  expenseDate: day(-1),
  amount: 500,
  receipt: null,
  ...o,
});
const receipt = { name: 'r.png', type: 'image/png', dataUrl: 'data:image/png;base64,AA==' };
const claimInput = (o = {}) => ({
  title: 'Test claim',
  claimDate: day(0),
  purpose: 'Business trip',
  items: [item()],
  ...o,
});
const throwsRule = (fn, re) =>
  assert.throws(fn, (e) => e instanceof RuleError && (!re || re.test(e.message)), `expected RuleError ${re ?? ''}`);

beforeEach(() => {
  setBackend(memoryBackend());
  resetDemoData();
});

describe('Claim creation (TC-CLM)', () => {
  test('new claim starts as Draft with an auto-generated reference number', () => {
    const c = saveClaim('E005', claimInput());
    assert.equal(c.status, 'Draft');
    assert.match(c.refNo, /^EXP-\d{4}-\d{4}$/);
    assert.equal(c.employeeId, 'E005');
  });

  test('reference numbers are unique and increment', () => {
    const a = saveClaim('E005', claimInput());
    const b = saveClaim('E005', claimInput());
    assert.notEqual(a.refNo, b.refNo);
    assert.equal(nextRefNo([{ refNo: 'EXP-2026-0009' }], new Date(2026, 5, 1)), 'EXP-2026-0010');
    assert.equal(nextRefNo([], new Date(2027, 0, 1)), 'EXP-2027-0001');
  });

  test('total is calculated automatically from items (sample: 1200+450+2500+350 = 4500)', () => {
    const c = saveClaim('E005', claimInput({
      items: [
        item({ amount: 1200, receipt }),
        item({ categoryId: 'CAT03', amount: 450 }),
        item({ categoryId: 'CAT02', amount: 2500, receipt }),
        item({ categoryId: 'CAT04', amount: 350 }),
      ],
    }));
    assert.equal(c.totalAmount, 4500);
  });

  test('a supplied total is ignored (cannot be tampered with)', () => {
    const c = saveClaim('E005', { ...claimInput(), totalAmount: 999999 });
    assert.equal(c.totalAmount, 500);
  });

  test('a draft can be saved with no items, but submit needs at least one item', () => {
    const d = saveClaim('E005', claimInput({ items: [] }));
    assert.equal(d.totalAmount, 0);
    throwsRule(() => saveClaim('E005', claimInput({ items: [] }), { submit: true }), /at least one expense item/i);
  });

  test('title is required', () => {
    throwsRule(() => saveClaim('E005', claimInput({ title: '  ' })), /title/i);
  });

  test('business purpose and claim date are required to submit', () => {
    throwsRule(() => saveClaim('E005', claimInput({ purpose: '' }), { submit: true }), /purpose/i);
    throwsRule(() => saveClaim('E005', claimInput({ claimDate: '' }), { submit: true }), /date/i);
  });

  test('expense amount must be greater than zero', () => {
    throwsRule(() => saveClaim('E005', claimInput({ items: [item({ amount: 0 })] })), /greater than 0/);
    throwsRule(() => saveClaim('E005', claimInput({ items: [item({ amount: -50 })] })), /greater than 0/);
  });

  test('expense date cannot be in the future (today is allowed)', () => {
    throwsRule(() => saveClaim('E005', claimInput({ items: [item({ expenseDate: day(1) })] })), /future/i);
    assert.doesNotThrow(() => saveClaim('E005', claimInput({ items: [item({ expenseDate: day(0) })] })));
  });

  test('category maximum eligible amount is enforced', () => {
    throwsRule(() => saveClaim('E005', claimInput({ items: [item({ categoryId: 'CAT03', amount: 1001 })] })), /limit/i);
    assert.doesNotThrow(() => saveClaim('E005', claimInput({ items: [item({ categoryId: 'CAT03', amount: 1000 })] })));
  });

  test('receipt is mandatory above Rs 1,000 on submit (exactly 1,000 is fine)', () => {
    throwsRule(
      () => saveClaim('E005', claimInput({ items: [item({ amount: 1001 })] }), { submit: true }),
      /receipt/i,
    );
    assert.doesNotThrow(() => saveClaim('E005', claimInput({ items: [item({ amount: 1000 })] }), { submit: true }));
    assert.doesNotThrow(() => saveClaim('E005', claimInput({ items: [item({ amount: 1001, receipt })] }), { submit: true }));
  });

  test('receipt is not needed just to save a draft', () => {
    assert.doesNotThrow(() => saveClaim('E005', claimInput({ items: [item({ amount: 3000 })] })));
  });

  test('creating and submitting writes Created and Submitted history entries', () => {
    const c = saveClaim('E005', claimInput(), { submit: true });
    const acts = getHistory().filter((h) => h.claimId === c.id).map((h) => h.action);
    assert.deepEqual(acts, ['Created', 'Submitted']);
    assert.equal(c.status, 'Submitted');
    assert.equal(c.approverId, 'E002');
  });

  test('a user with no assigned manager cannot submit', () => {
    throwsRule(() => saveClaim('E001', claimInput(), { submit: true }), /manager/i);
  });
});

describe('Editing rules (TC-EDT)', () => {
  test('owner can edit a Draft: add and remove rows recalculates the total', () => {
    const c = saveClaim('E005', claimInput({ items: [item({ amount: 100 }), item({ amount: 200 })] }));
    assert.equal(c.totalAmount, 300);
    const edited = saveClaim('E005', { ...claimInput({ items: [c.items[0]] }), id: c.id });
    assert.equal(edited.totalAmount, 100);
    assert.equal(edited.items.length, 1);
  });

  test('submitted claims cannot be edited by the employee', () => {
    const c = saveClaim('E005', claimInput(), { submit: true });
    throwsRule(() => saveClaim('E005', { ...claimInput(), id: c.id }), /cannot be edited/i);
  });

  test('another employee cannot edit someone else\'s draft', () => {
    const c = saveClaim('E005', claimInput());
    throwsRule(() => saveClaim('E006', { ...claimInput(), id: c.id }), /your own/i);
  });

  test('submitClaim on a saved draft validates the stored data', () => {
    const c = saveClaim('E005', claimInput({ items: [item({ amount: 2000 })] })); // no receipt
    throwsRule(() => submitClaim('E005', c.id), /receipt/i);
    saveClaim('E005', { ...claimInput({ items: [item({ amount: 2000, receipt })] }), id: c.id });
    assert.equal(submitClaim('E005', c.id).status, 'Submitted');
  });
});

describe('Manager approval (TC-APR)', () => {
  test('assigned manager approves a Submitted claim', () => {
    const c = approveClaim('E002', 'C002');
    assert.equal(c.status, 'Approved');
    assert.ok(getHistory().some((h) => h.claimId === 'C002' && h.action === 'Approved' && h.actorId === 'E002'));
  });

  test('manager cannot approve their own claim', () => {
    // C010 belongs to E002 and is Submitted (assigned to E001)
    throwsRule(() => approveClaim('E002', 'C010'), /own claim/i);
    assert.equal(getClaim('C010').status, 'Submitted');
  });

  test('director can approve a manager\'s claim', () => {
    assert.equal(approveClaim('E001', 'C010').status, 'Approved');
  });

  test('a manager who is not assigned to the claim cannot approve it', () => {
    throwsRule(() => approveClaim('E003', 'C002'), /not assigned/i);
  });

  test('employee and finance cannot approve or reject', () => {
    throwsRule(() => approveClaim('E005', 'C003'), /manager/i);
    throwsRule(() => approveClaim('E004', 'C003'), /manager/i);
    throwsRule(() => rejectClaim('E004', 'C003', 'no'), /manager/i);
  });

  test('only Submitted claims can be approved', () => {
    throwsRule(() => approveClaim('E002', 'C006'), /Submitted/); // already Approved
    throwsRule(() => approveClaim('E002', 'C001'), /Submitted/); // Draft
  });

  test('rejection comment is mandatory', () => {
    throwsRule(() => rejectClaim('E002', 'C002', ''), /comment/i);
    throwsRule(() => rejectClaim('E002', 'C002', '   '), /comment/i);
    assert.equal(getClaim('C002').status, 'Submitted');
  });

  test('rejection stores the comment and writes history', () => {
    const c = rejectClaim('E002', 'C002', 'Hotel bill missing');
    assert.equal(c.status, 'Rejected');
    assert.equal(c.rejectionComment, 'Hotel bill missing');
    const h = getHistory().filter((x) => x.claimId === 'C002').pop();
    assert.equal(h.action, 'Rejected');
    assert.equal(h.comment, 'Hotel bill missing');
  });

  test('rejected claim can be revised, edited and resubmitted', () => {
    rejectClaim('E002', 'C002', 'Fix hotel dates');
    assert.equal(reviseClaim('E005', 'C002').status, 'Draft');
    const existing = getClaim('C002');
    assert.ok(canEditClaim(existing, getEmployee('E005')));
    saveClaim('E005', { id: 'C002', title: existing.title, claimDate: existing.claimDate, purpose: existing.purpose, items: existing.items });
    assert.equal(submitClaim('E005', 'C002').status, 'Submitted');
    const acts = getHistory().filter((h) => h.claimId === 'C002').map((h) => h.action);
    assert.deepEqual(acts, ['Created', 'Submitted', 'Rejected', 'Revised', 'Submitted']);
  });

  test('only the owner can revise a rejected claim; only Rejected claims can be revised', () => {
    throwsRule(() => reviseClaim('E005', 'C007'), /owner/i); // C007 belongs to E006
    throwsRule(() => reviseClaim('E006', 'C003'), /owner|Rejected/i);
  });
});

describe('Finance processing (TC-FIN)', () => {
  const pay = { paymentRef: 'PAY-2026-0100', paymentDate: day(0) };

  test('finance records payment for an Approved claim', () => {
    const c = recordPayment('E004', 'C005', pay);
    assert.equal(c.status, 'Paid');
    const p = getPayments().find((x) => x.claimId === 'C005');
    assert.equal(p.paymentRef, 'PAY-2026-0100');
    assert.equal(p.amount, 450);
    assert.ok(getHistory().some((h) => h.claimId === 'C005' && h.action === 'Payment recorded'));
  });

  test('payment reference and payment date are mandatory', () => {
    throwsRule(() => recordPayment('E004', 'C005', { paymentRef: '', paymentDate: day(0) }), /reference/i);
    throwsRule(() => recordPayment('E004', 'C005', { paymentRef: 'X1', paymentDate: '' }), /date/i);
    assert.equal(getClaim('C005').status, 'Approved');
  });

  test('payment date cannot be in the future and references must be unique', () => {
    throwsRule(() => recordPayment('E004', 'C005', { paymentRef: 'X1', paymentDate: day(2) }), /future/i);
    throwsRule(() => recordPayment('E004', 'C005', { paymentRef: 'pay-2026-0001', paymentDate: day(0) }), /already been used/i);
  });

  test('only Approved claims can be processed', () => {
    for (const id of ['C001', 'C002', 'C007']) {
      throwsRule(() => recordPayment('E004', id, pay), /Approved/);
    }
  });

  test('only Finance can record payments', () => {
    throwsRule(() => recordPayment('E002', 'C005', pay), /Finance/);
    throwsRule(() => recordPayment('E008', 'C005', pay), /Finance/);
  });

  test('paid claims cannot be modified (edit, re-pay, revise, approve, reject)', () => {
    recordPayment('E004', 'C005', pay);
    throwsRule(() => saveClaim('E008', { ...claimInput(), id: 'C005' }), /Paid claims cannot be modified/);
    throwsRule(() => recordPayment('E004', 'C005', { paymentRef: 'NEW-1', paymentDate: day(0) }), /Paid claims cannot be modified/);
    throwsRule(() => reviseClaim('E008', 'C005'));
    throwsRule(() => approveClaim('E003', 'C005'));
    throwsRule(() => rejectClaim('E003', 'C005', 'late'));
  });

  test('full lifecycle records every status change in history', () => {
    const c = saveClaim('E005', claimInput(), { submit: true });
    approveClaim('E002', c.id);
    recordPayment('E004', c.id, pay);
    const rows = getHistory().filter((h) => h.claimId === c.id);
    assert.deepEqual(rows.map((r) => `${r.fromStatus}>${r.toStatus}`), [
      'null>Draft', 'Draft>Submitted', 'Submitted>Approved', 'Approved>Paid',
    ]);
    assert.ok(rows.every((r) => r.actorId && r.timestamp));
  });
});

describe('Persistence (TC-PER)', () => {
  test('saved data is still there on a fresh read (refresh simulation)', () => {
    const c = saveClaim('E005', claimInput({ title: 'Persist me' }));
    assert.equal(getClaims().find((x) => x.id === c.id).title, 'Persist me');
  });

  test('ensureSeeded does not overwrite existing data', () => {
    saveClaim('E005', claimInput({ title: 'Keep me' }));
    const before = getClaims().length;
    ensureSeeded();
    assert.equal(getClaims().length, before);
  });

  test('ensureSeeded loads demo data on an empty store; reset restores it', () => {
    setBackend(memoryBackend());
    ensureSeeded();
    assert.equal(getClaims().length, 15);
    saveClaim('E005', claimInput());
    resetDemoData();
    assert.equal(getClaims().length, 15);
  });

  test('uses the documented localStorage keys', () => {
    const store = memoryBackend();
    setBackend(store);
    resetDemoData();
    for (const k of ['expense_employees', 'expense_categories', 'expense_claims', 'expense_history', 'expense_payments']) {
      assert.notEqual(store.getItem(k), null, k);
    }
  });
});

describe('Roles and visibility (TC-ROLE)', () => {
  const claimsFor = (id) => {
    const emps = getEmployees();
    return visibleClaims(getClaims(), emps.find((e) => e.id === id), emps);
  };

  test('employee sees only their own claims (including drafts)', () => {
    const v = claimsFor('E005');
    assert.ok(v.length > 0);
    assert.ok(v.every((c) => c.employeeId === 'E005'));
  });

  test('drafts are private to the owner', () => {
    for (const id of ['E002', 'E004', 'E006']) assert.ok(!claimsFor(id).some((c) => c.id === 'C001'));
  });

  test('manager sees own claims and direct reports; not other teams', () => {
    const v = claimsFor('E002');
    assert.ok(v.some((c) => c.employeeId === 'E006'));
    assert.ok(v.some((c) => c.employeeId === 'E002'));
    assert.ok(!v.some((c) => c.employeeId === 'E007'));
  });

  test('finance sees all non-draft claims', () => {
    const v = claimsFor('E004');
    assert.equal(v.filter((c) => c.status === 'Draft').length, 0);
    assert.equal(v.length, 14);
  });

  test('module access matrix', () => {
    const emps = Object.fromEntries(getEmployees().map((e) => [e.id, e]));
    assert.equal(canAccess(emps.E005, 'approvals'), false);
    assert.equal(canAccess(emps.E005, 'finance'), false);
    assert.equal(canAccess(emps.E005, 'employees'), false);
    assert.equal(canAccess(emps.E002, 'approvals'), true);
    assert.equal(canAccess(emps.E002, 'finance'), false);
    assert.equal(canAccess(emps.E004, 'finance'), true);
    assert.equal(canAccess(emps.E004, 'approvals'), false);
    for (const f of ['dashboard', 'claims', 'reports', 'history']) {
      for (const id of ['E005', 'E002', 'E004']) assert.equal(canAccess(emps[id], f), true);
    }
  });

  test('action permissions', () => {
    const c10 = getClaim('C010');
    assert.equal(canApproveClaim(c10, getEmployee('E002')), false); // own claim
    assert.equal(canApproveClaim(c10, getEmployee('E001')), true);
    assert.equal(canPayClaim(getClaim('C005'), getEmployee('E004')), true);
    assert.equal(canPayClaim(getClaim('C005'), getEmployee('E002')), false);
  });
});

describe('Master data (TC-MST)', () => {
  test('finance can add and edit employees; others cannot', () => {
    const e = saveEmployee('E004', { name: 'Test User', email: 't@example.com', department: 'HR', role: 'Employee', managerId: 'E002' });
    assert.match(e.id, /^E\d{3}$/);
    assert.equal(getEmployees().length, 9);
    saveEmployee('E004', { ...e, department: 'People' });
    assert.equal(getEmployee(e.id).department, 'People');
    throwsRule(() => saveEmployee('E002', { name: 'X', email: 'x@example.com', department: 'D', role: 'Employee' }), /Finance/);
  });

  test('employee validation: required fields, email format, manager must be a Manager', () => {
    throwsRule(() => saveEmployee('E004', { name: '', email: 'bad', department: '', role: '' }));
    throwsRule(() => saveEmployee('E004', { name: 'A', email: 'a@example.com', department: 'D', role: 'Employee', managerId: 'E005' }), /highlighted/);
  });

  test('finance can add categories; names are unique and cap must be positive', () => {
    const c = saveCategory('E004', { name: 'Training', maxAmount: 3000 });
    assert.equal(getCategories().length, 7);
    assert.equal(c.active, true);
    throwsRule(() => saveCategory('E004', { name: 'travel', maxAmount: 100 }), /highlighted/);
    throwsRule(() => saveCategory('E004', { name: 'Zero', maxAmount: 0 }), /highlighted/);
    throwsRule(() => saveCategory('E005', { name: 'Nope', maxAmount: 10 }), /Finance/);
  });

  test('changing a category cap is applied to later claims', () => {
    saveCategory('E004', { id: 'CAT03', name: 'Food', maxAmount: 300, active: true });
    throwsRule(() => saveClaim('E005', claimInput({ items: [item({ categoryId: 'CAT03', amount: 450 })] })), /limit/i);
  });
});

describe('Seed data, dashboard and reports (TC-DSH / TC-RPT)', () => {
  test('seed has 8 employees across all three roles, 6 categories, 15 claims', () => {
    const emps = getEmployees();
    assert.equal(emps.length, 8);
    for (const r of ['Employee', 'Manager', 'Finance']) assert.ok(emps.some((e) => e.role === r));
    assert.equal(getCategories().length, 6);
    assert.equal(getClaims().length, 15);
  });

  test('seed integrity: totals match items, paid claims have payments, every claim has history', () => {
    for (const c of getClaims()) {
      assert.equal(c.totalAmount, c.items.reduce((s, i) => s + i.amount, 0), c.refNo);
      assert.ok(getHistory().some((h) => h.claimId === c.id), c.refNo);
      if (c.status === 'Paid') assert.ok(getPayments().some((p) => p.claimId === c.id), c.refNo);
      for (const i of c.items) if (i.amount > 1000) assert.ok(i.receipt, `${c.refNo} needs receipt`);
    }
  });

  test('dashboard stats for finance', () => {
    const emps = getEmployees();
    const v = visibleClaims(getClaims(), getEmployee('E004'), emps);
    const s = computeStats(v);
    assert.deepEqual([s.total, s.pending, s.approved, s.rejected, s.paid], [14, 5, 4, 2, 3]);
    const paidTotal = getPayments().reduce((sum, p) => sum + p.amount, 0);
    assert.equal(s.paidAmount, paidTotal);
  });

  test('dashboard stats change after a workflow action', () => {
    const emps = getEmployees();
    const before = computeStats(visibleClaims(getClaims(), getEmployee('E004'), emps));
    approveClaim('E002', 'C002');
    const after = computeStats(visibleClaims(getClaims(), getEmployee('E004'), emps));
    assert.equal(after.pending, before.pending - 1);
    assert.equal(after.approved, before.approved + 1);
  });

  test('Indian rupee formatting', () => {
    assert.equal(formatINR(125000), '₹1,25,000');
    assert.equal(formatINR(4500), '₹4,500');
  });

  test('category totals are sorted high to low and exclude drafts', () => {
    const t = categoryTotals(getClaims(), getCategories());
    for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].amount >= t[i].amount);
    const travel = t.find((x) => x.name === 'Travel').amount;
    // C001 (draft, Travel 800) must not be counted
    const all = getClaims().filter((c) => c.status !== 'Draft')
      .flatMap((c) => c.items).filter((i) => i.categoryId === 'CAT01').reduce((s, i) => s + i.amount, 0);
    assert.equal(travel, all);
  });

  test('report filters: employee, category, status and date range', () => {
    const ctx = { employees: getEmployees(), categories: getCategories() };
    const claims = visibleClaims(getClaims(), getEmployee('E004'), ctx.employees);
    assert.ok(buildReport(claims, { employeeId: 'E007' }, ctx).rows.every((r) => r.claim.employeeId === 'E007'));
    assert.ok(buildReport(claims, { status: 'Paid' }, ctx).rows.every((r) => r.claim.status === 'Paid'));
    const internet = buildReport(claims, { categoryId: 'CAT04' }, ctx);
    assert.ok(internet.rows.length > 0 && internet.byCategory.length === 1);
    const ranged = buildReport(claims, { from: '2026-11-01', to: '2026-11-30' }, ctx);
    assert.ok(ranged.rows.every((r) => r.claim.claimDate >= '2026-11-01' && r.claim.claimDate <= '2026-11-30'));
    const everything = buildReport(claims, {}, ctx);
    assert.equal(everything.total, everything.byStatus.reduce((s, x) => s + x.amount, 0));
    assert.equal(everything.total, everything.byEmployee.reduce((s, x) => s + x.amount, 0));
  });

  test('CSV export escapes commas and quotes', () => {
    const emps = getEmployees();
    const csv = reportToCSV(
      [{ claim: { refNo: 'EXP-1', title: 'A, "B"', employeeId: 'E005', claimDate: '2026-11-01', status: 'Draft' }, amount: 10 }],
      emps,
    );
    assert.match(csv.split('\n')[1], /"A, ""B"""/);
    assert.equal(csv.split('\n')[0].split(',').length, 7);
  });
});
