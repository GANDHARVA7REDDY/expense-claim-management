import { STATUS, ROLES } from './constants.js';
import {
  getClaims, saveClaims, getHistory, saveHistory, getPayments, savePayments,
  getCategories, getEmployee,
} from './dataStore.js';
import { RuleError } from './errors.js';
import { todayISO } from '../utils/dates.js';
import { uid } from '../utils/format.js';
import { canEditClaim, canApproveClaim, canReviseClaim, canPayClaim, isOwner } from './permissions.js';
import { validateClaim, hasErrors, firstError, calcTotal } from './validators.js';

const nowISO = () => new Date().toISOString();

function requireUser(userId) {
  const user = getEmployee(userId);
  if (!user) throw new RuleError('Unknown user');
  return user;
}

function requireClaim(claims, id) {
  const claim = claims.find((c) => c.id === id);
  if (!claim) throw new RuleError('Claim not found');
  return claim;
}

/** EXP-<year>-<4 digit counter>, derived from the highest existing number for that year. */
export function nextRefNo(claims, date = new Date()) {
  const prefix = `EXP-${date.getFullYear()}-`;
  const max = claims
    .filter((c) => c.refNo.startsWith(prefix))
    .reduce((m, c) => Math.max(m, parseInt(c.refNo.slice(prefix.length), 10) || 0), 0);
  return prefix + String(max + 1).padStart(4, '0');
}

function pushHistory(history, claim, action, from, to, actor, comment = '') {
  history.push({
    id: uid('H'),
    claimId: claim.id,
    action,
    fromStatus: from,
    toStatus: to,
    actorId: actor.id,
    actorName: actor.name,
    comment,
    timestamp: nowISO(),
  });
}

function explainNotEditable(claim) {
  if (claim.status === STATUS.PAID) return 'Paid claims cannot be modified.';
  return `${claim.status} claims cannot be edited. Only Draft claims can be changed.`;
}

function normalizeItems(items) {
  return (items || []).map((r) => ({
    id: r.id || uid('I'),
    categoryId: r.categoryId || '',
    description: (r.description || '').trim(),
    expenseDate: r.expenseDate || '',
    amount: Number(r.amount) || 0,
    receipt: r.receipt || null,
  }));
}

function applySubmit(claim, user, history) {
  if (!user.managerId) {
    throw new RuleError('No approving manager is assigned to you, so this claim cannot be submitted.');
  }
  claim.status = STATUS.SUBMITTED;
  claim.approverId = user.managerId;
  claim.submittedAt = nowISO();
  claim.rejectionComment = null;
  pushHistory(history, claim, 'Submitted', STATUS.DRAFT, STATUS.SUBMITTED, user);
}

/**
 * Create or update a Draft claim, optionally submitting it in the same step.
 * input: { id?, title, claimDate, purpose, items[] }
 */
export function saveClaim(userId, input, { submit = false } = {}) {
  const user = requireUser(userId);
  const errors = validateClaim(input, getCategories(), { submit });
  if (hasErrors(errors)) throw new RuleError(firstError(errors), errors);

  const claims = getClaims();
  const history = getHistory();
  const ts = nowISO();
  let claim;

  if (input.id) {
    claim = requireClaim(claims, input.id);
    if (!isOwner(claim, user)) throw new RuleError('You can only edit your own claims.');
    if (!canEditClaim(claim, user)) throw new RuleError(explainNotEditable(claim));
  } else {
    claim = {
      id: uid('C'),
      refNo: nextRefNo(claims),
      employeeId: user.id,
      status: STATUS.DRAFT, // every new claim starts as Draft
      approverId: null,
      rejectionComment: null,
      createdAt: ts,
    };
    claims.push(claim);
    pushHistory(history, claim, 'Created', null, STATUS.DRAFT, user);
  }

  claim.title = input.title.trim();
  claim.claimDate = input.claimDate || todayISO();
  claim.purpose = (input.purpose || '').trim();
  claim.items = normalizeItems(input.items);
  claim.totalAmount = calcTotal(claim.items); // always computed, never typed
  claim.updatedAt = ts;

  if (submit) applySubmit(claim, user, history);

  saveClaims(claims);
  saveHistory(history);
  return claim;
}

/** Submit an already-saved Draft claim. */
export function submitClaim(userId, claimId) {
  const user = requireUser(userId);
  const claims = getClaims();
  const history = getHistory();
  const claim = requireClaim(claims, claimId);
  if (!isOwner(claim, user)) throw new RuleError('You can only submit your own claims.');
  if (!canEditClaim(claim, user)) throw new RuleError(explainNotEditable(claim));

  const errors = validateClaim(claim, getCategories(), { submit: true });
  if (hasErrors(errors)) throw new RuleError(`Cannot submit: ${firstError(errors)}`, errors);

  applySubmit(claim, user, history);
  claim.updatedAt = nowISO();
  saveClaims(claims);
  saveHistory(history);
  return claim;
}

function requireReviewable(claim, user, verb) {
  if (user.role !== ROLES.MANAGER) throw new RuleError(`Only managers can ${verb} claims.`);
  if (claim.status !== STATUS.SUBMITTED) throw new RuleError(`Only Submitted claims can be ${verb}d.`);
  if (claim.employeeId === user.id) throw new RuleError(`You cannot ${verb} your own claim.`);
  if (!canApproveClaim(claim, user)) throw new RuleError(`This claim is not assigned to you for review.`);
}

export function approveClaim(userId, claimId) {
  const user = requireUser(userId);
  const claims = getClaims();
  const history = getHistory();
  const claim = requireClaim(claims, claimId);
  requireReviewable(claim, user, 'approve');

  claim.status = STATUS.APPROVED;
  claim.approvedAt = nowISO();
  claim.updatedAt = claim.approvedAt;
  pushHistory(history, claim, 'Approved', STATUS.SUBMITTED, STATUS.APPROVED, user);
  saveClaims(claims);
  saveHistory(history);
  return claim;
}

export function rejectClaim(userId, claimId, comment) {
  const user = requireUser(userId);
  const claims = getClaims();
  const history = getHistory();
  const claim = requireClaim(claims, claimId);
  requireReviewable(claim, user, 'reject');
  const text = (comment || '').trim();
  if (!text) throw new RuleError('A rejection comment is required.', { comment: 'Rejection comment is required' });

  claim.status = STATUS.REJECTED;
  claim.rejectionComment = text;
  claim.rejectedAt = nowISO();
  claim.updatedAt = claim.rejectedAt;
  pushHistory(history, claim, 'Rejected', STATUS.SUBMITTED, STATUS.REJECTED, user, text);
  saveClaims(claims);
  saveHistory(history);
  return claim;
}

/** Rejected -> Draft, so the employee can edit and resubmit. */
export function reviseClaim(userId, claimId) {
  const user = requireUser(userId);
  const claims = getClaims();
  const history = getHistory();
  const claim = requireClaim(claims, claimId);
  if (!canReviseClaim(claim, user)) throw new RuleError('Only the owner can revise a Rejected claim.');

  claim.status = STATUS.DRAFT;
  claim.updatedAt = nowISO();
  pushHistory(history, claim, 'Revised', STATUS.REJECTED, STATUS.DRAFT, user, 'Returned to Draft for revision');
  saveClaims(claims);
  saveHistory(history);
  return claim;
}

export function recordPayment(userId, claimId, { paymentRef, paymentDate }) {
  const user = requireUser(userId);
  if (user.role !== ROLES.FINANCE) throw new RuleError('Only Finance can record payments.');
  const claims = getClaims();
  const history = getHistory();
  const payments = getPayments();
  const claim = requireClaim(claims, claimId);

  if (claim.status === STATUS.PAID) throw new RuleError('Paid claims cannot be modified.');
  if (!canPayClaim(claim, user)) throw new RuleError('Only Approved claims can be processed for payment.');

  const errors = {};
  const ref = (paymentRef || '').trim();
  if (!ref) errors.paymentRef = 'Payment reference number is required';
  else if (payments.some((p) => p.paymentRef.toLowerCase() === ref.toLowerCase())) {
    errors.paymentRef = 'This payment reference has already been used';
  }
  if (!paymentDate) errors.paymentDate = 'Payment date is required';
  else if (paymentDate > todayISO()) errors.paymentDate = 'Payment date cannot be in the future';
  if (Object.keys(errors).length) throw new RuleError(Object.values(errors)[0], errors);

  const ts = nowISO();
  payments.push({
    id: uid('P'),
    claimId: claim.id,
    paymentRef: ref,
    paymentDate,
    amount: claim.totalAmount,
    paidBy: user.id,
    recordedAt: ts,
  });
  claim.status = STATUS.PAID;
  claim.paidAt = ts;
  claim.updatedAt = ts;
  pushHistory(history, claim, 'Payment recorded', STATUS.APPROVED, STATUS.PAID, user, `Payment reference ${ref}`);
  savePayments(payments);
  saveClaims(claims);
  saveHistory(history);
  return claim;
}
