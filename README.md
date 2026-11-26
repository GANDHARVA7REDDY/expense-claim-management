# ClaimEase – Employee Expense Claim Management (POC)

Frontend-only proof of concept: **React + JavaScript + MUI**, data in **localStorage**, no backend and no real login.
Employees submit expense claims, managers approve or reject them, and Finance records payment.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm test           # business-rule tests (plain Node, no browser needed)
```

## Roles (simulated)

Pick a user in the top bar. The role controls the menu, the route guard and every action.

| Role | Can do |
|---|---|
| Employee | Create, edit (Draft only), submit, revise rejected claims, track own claims |
| Manager | Approve or reject claims from direct reports (never their own); view employees and categories |
| Finance | Record payments for Approved claims; manage employees and categories; see all submitted claims |

Demo users: Karthik Rao and Divya Menon (Employees, manager Priya Nair), Vikram Singh and Neha Gupta (Employees, manager Arjun Mehta),
Priya Nair and Arjun Mehta (Managers, approved by Ravi Kumar), Ravi Kumar (Director, a Manager with no approver), Sneha Iyer (Finance).

## Workflow

```
Draft → Submitted → Approved → Paid
           ↓
        Rejected → (Revise) → Draft
```

"Payment Processed" and "Paid / Completed" from the POC diagram are a single `Paid` status: recording the payment completes the claim.

## Business rules implemented

All rules are enforced in the service layer (`src/services`), not only in the UI, and are covered by `tests/rules.test.js`.

Draft by default · at least one item to submit · amount above 0 · no future expense dates · automatic total · per-category maximum
(applies to each expense item) · receipt required above ₹1,000 (proposed training rule) · submitted claims are read-only · managers cannot approve
their own claims · rejection comment mandatory · rejected claims can be revised and resubmitted · only Approved claims can be paid ·
payment reference and date mandatory (reference must be unique, date not in the future) · paid claims are locked · every status change is logged ·
everything survives a refresh.

## Assumptions

- A category maximum applies to each expense item, and exceeding it blocks saving.
- Receipts are stored as base64 in localStorage: images or PDF, up to 300 KB each.
- Each employee has an approving manager. Managers' own claims go to their approver (the Director). A user with no approver cannot submit.
- Drafts are private to their owner. Managers see their own and direct reports' claims; Finance sees every non-draft claim.
- Finance maintains the Employees and Categories master data; Managers have read-only access; Employees have none.

## localStorage keys

`expense_employees`, `expense_categories`, `expense_claims`, `expense_history`, `expense_payments` (plus `expense_session` for the selected user).
Use the **Reset demo data** button in the top bar to restore the sample data.

## Structure

```
src/
  services/    constants, storage, seed, dataStore, permissions, validators, claimService, masterDataService, reportService
  context/     AppContext (current user, toasts)
  components/  Layout, RoleRoute, StatusChip, Timeline, ClaimTable, Dialogs, PageHeader
  pages/       Dashboard, Claims, ClaimForm, ClaimDetails, Approvals, Finance, Employees, Categories, Reports, History
tests/         rules.test.js
TEST_PLAN.md   full list of tests to run on the final application
```
