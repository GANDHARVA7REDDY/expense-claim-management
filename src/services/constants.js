export const KEYS = {
  employees: 'expense_employees',
  categories: 'expense_categories',
  claims: 'expense_claims',
  history: 'expense_history',
  payments: 'expense_payments',
  session: 'expense_session',
};

export const ROLES = { EMPLOYEE: 'Employee', MANAGER: 'Manager', FINANCE: 'Finance' };

export const STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
};

// Proposed training rule from the POC document (not an actual policy).
export const RECEIPT_THRESHOLD = 1000;
export const MAX_RECEIPT_BYTES = 300 * 1024;
