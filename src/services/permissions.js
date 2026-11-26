import { ROLES, STATUS } from './constants.js';

const { EMPLOYEE, MANAGER, FINANCE } = ROLES;

/** Which roles may open which module. Drives both the menu and the route guard. */
export const FEATURES = {
  dashboard: [EMPLOYEE, MANAGER, FINANCE],
  claims: [EMPLOYEE, MANAGER, FINANCE],
  approvals: [MANAGER],
  finance: [FINANCE],
  employees: [MANAGER, FINANCE],
  categories: [MANAGER, FINANCE],
  reports: [EMPLOYEE, MANAGER, FINANCE],
  history: [EMPLOYEE, MANAGER, FINANCE],
};

export const canAccess = (user, feature) => !!user && (FEATURES[feature] || []).includes(user.role);

export const isOwner = (claim, user) => !!user && claim.employeeId === user.id;

export const canEditClaim = (claim, user) => isOwner(claim, user) && claim.status === STATUS.DRAFT;

export const canApproveClaim = (claim, user) =>
  !!user &&
  user.role === MANAGER &&
  claim.status === STATUS.SUBMITTED &&
  claim.approverId === user.id &&
  claim.employeeId !== user.id;

export const canReviseClaim = (claim, user) => isOwner(claim, user) && claim.status === STATUS.REJECTED;

export const canPayClaim = (claim, user) => !!user && user.role === FINANCE && claim.status === STATUS.APPROVED;

export const canManageMasterData = (user) => !!user && user.role === FINANCE;

/**
 * Draft claims are private to their owner.
 * Manager: own claims + claims of direct reports.  Finance: every non-draft claim.
 */
export function canViewClaim(claim, user, employees) {
  if (!user) return false;
  if (claim.employeeId === user.id) return true;
  if (claim.status === STATUS.DRAFT) return false;
  if (user.role === FINANCE) return true;
  if (user.role === MANAGER) {
    const owner = employees.find((e) => e.id === claim.employeeId);
    return owner?.managerId === user.id || claim.approverId === user.id;
  }
  return false;
}

export const visibleClaims = (claims, user, employees) =>
  claims.filter((c) => canViewClaim(c, user, employees));

export function visibleHistory(history, claims) {
  const ids = new Set(claims.map((c) => c.id));
  return history.filter((h) => ids.has(h.claimId));
}
