# ClaimEase – Test Plan

**Automated** = covered by `npm test` (`tests/rules.test.js`, 57 tests, business rules and data logic).
**Manual** = run in the browser after `npm install && npm run dev`.
Demo users (top-bar switcher): Karthik Rao `E005` Employee · Divya Menon `E006` Employee · Priya Nair `E002` Manager (Engineering) ·
Arjun Mehta `E003` Manager (Sales) · Ravi Kumar `E001` Director/Manager · Sneha Iyer `E004` Finance.
Use **Reset demo data** (top-bar icon) before each section for a clean state.

## 1. Setup and first load
| ID | Test | Expected | Type |
|---|---|---|---|
| SET-01 | `npm install` then `npm run build` | Build succeeds, no errors | Manual |
| SET-02 | `npm test` | All automated tests pass | Automated |
| SET-03 | Open app with empty localStorage | Demo data is loaded (8 employees, 6 categories, 15 claims) | Automated |
| SET-04 | App opens as Karthik Rao (Employee) | Role badge shows Employee | Manual |
| SET-05 | Browser console on every page | No errors or React warnings | Manual |
| SET-06 | DevTools → Application → Local Storage | Keys `expense_employees`, `expense_categories`, `expense_claims`, `expense_history`, `expense_payments` exist | Automated |

## 2. Roles and access
| ID | Test | Expected | Type |
|---|---|---|---|
| ROL-01 | Switch user via dropdown | Role badge and menu update immediately; app returns to Dashboard | Manual |
| ROL-02 | Employee menu | Dashboard, My Claims, Reports, Activity History only | Manual |
| ROL-03 | Manager menu | Adds Manager Approvals, Employees, Expense Categories | Manual |
| ROL-04 | Finance menu | Adds Finance Processing, Employees, Expense Categories (no Manager Approvals) | Manual |
| ROL-05 | Employee opens `#/approvals` directly | "Access denied" page | Manual |
| ROL-06 | Employee opens `#/finance`, `#/employees`, `#/categories` | "Access denied" on each | Manual |
| ROL-07 | Manager opens `#/finance` | "Access denied" | Manual |
| ROL-08 | Finance opens `#/approvals` | "Access denied" | Manual |
| ROL-09 | Module access matrix | Matches design table | Automated |
| ROL-10 | Employee sees only own claims | Other employees' claims never listed | Automated |
| ROL-11 | Draft claims are private | Manager and Finance never see another user's Draft | Automated |
| ROL-12 | Manager sees own and direct reports' claims only | Priya sees Divya and Karthik, not Vikram | Automated |
| ROL-13 | Finance sees all non-draft claims | 14 claims for the seed data | Automated |
| ROL-14 | Open another user's claim by URL (e.g. Karthik opens a Divya claim) | "Claim not found or no access" | Manual |
| ROL-15 | Open another user's Draft by URL as Manager | "Claim not found or no access" | Manual |
| ROL-16 | Open `#/claims/<id>/edit` for a Submitted claim | "Not editable" message, no form | Manual |
| ROL-17 | Unknown URL | Redirects to Dashboard | Manual |

## 3. Dashboard
| ID | Test | Expected | Type |
|---|---|---|---|
| DSH-01 | Finance dashboard cards | Total 14, Pending 5, Approved 4, Rejected 2, Paid 3 | Automated |
| DSH-02 | Total Paid Amount | Equals sum of payment records, in ₹ with Indian grouping | Automated |
| DSH-03 | Indian currency format | `125000` shows `₹1,25,000` | Automated |
| DSH-04 | Employee dashboard counts only own claims | Karthik: Total 3 (Draft, Submitted, Approved) | Manual |
| DSH-05 | Manager dashboard counts own and team claims | Priya's numbers include Divya, Karthik and her own | Manual |
| DSH-06 | Click Pending Approval card | Opens claims list filtered to Submitted | Manual |
| DSH-07 | "Expenses by Category" chart | One bar per category, ordered high to low, drafts excluded | Automated |
| DSH-08 | Bars proportional; value labels visible | Tallest = highest amount | Manual |
| DSH-09 | Manager with pending claims | Banner "N claims waiting for your approval" with Review button | Manual |
| DSH-10 | Finance with approved claims | Banner "N approved claims waiting for payment" | Manual |
| DSH-11 | Dashboard updates after approve, reject and pay | Counts and amounts change without page reload | Automated |
| DSH-12 | New claim button | Opens Create claim form | Manual |

## 4. Create / Edit claim
| ID | Test | Expected | Type |
|---|---|---|---|
| CLM-01 | Open Create claim | Employee name and department read-only; reference shows "Auto-generated"; status Draft; claim date = today | Manual |
| CLM-02 | Save a new claim | Reference like `EXP-2026-0016`, status Draft | Automated |
| CLM-03 | Reference numbers are unique and increment | Two saves give two different numbers | Automated |
| CLM-04 | Add rows | New empty row appears | Manual |
| CLM-05 | Remove row | Row removed; total recalculated | Manual |
| CLM-06 | Edit row values | Total updates live | Manual |
| CLM-07 | Sample from spec (Travel 1,200 + Food 450 + Hotel 2,500 + Internet 350) | Total = ₹4,500 | Automated |
| CLM-08 | Total cannot be typed or tampered with | No editable total; supplied total ignored by the service | Automated |
| CLM-09 | Claim title empty | Error "Claim title is required" | Automated |
| CLM-10 | Submit with no items | Error "Add at least one expense item" | Automated |
| CLM-11 | Save draft with no items | Allowed | Automated |
| CLM-12 | Submit without business purpose | Error shown on the field | Automated |
| CLM-13 | Amount = 0 | Error "greater than 0" | Automated |
| CLM-14 | Amount negative | Error "greater than 0" | Automated |
| CLM-15 | Expense date = tomorrow | Error "cannot be in the future" | Automated |
| CLM-16 | Expense date = today | Accepted | Automated |
| CLM-17 | Date picker blocks future dates | Dates after today cannot be picked | Manual |
| CLM-18 | Food item ₹1,001 (cap ₹1,000) | Error "Exceeds Food limit of ₹1,000" | Automated |
| CLM-19 | Food item exactly ₹1,000 | Accepted | Automated |
| CLM-20 | Item ₹1,001 without receipt, submit | Error "Receipt required for expenses above ₹1,000" | Automated |
| CLM-21 | Item exactly ₹1,000 without receipt, submit | Accepted | Automated |
| CLM-22 | Item above ₹1,000 with receipt | Accepted | Automated |
| CLM-23 | Item above ₹1,000 without receipt, Save draft | Allowed; amber hint shown beside Attach | Automated |
| CLM-24 | Attach a PNG/JPG receipt | File name shown; preview opens | Manual |
| CLM-25 | Attach a PDF receipt | Accepted; preview or download works | Manual |
| CLM-26 | Attach file over 300 KB | Error toast, file not attached | Manual |
| CLM-27 | Attach a `.txt` or `.exe` file | Error toast "Only image or PDF" | Manual |
| CLM-28 | Remove an attached receipt | Receipt cleared; hint reappears if amount above ₹1,000 | Manual |
| CLM-29 | Category dropdown | Shows active categories with their maximum; inactive ones hidden | Manual |
| CLM-30 | Submit success | Confirmation dialog, then status Submitted, redirected to details | Manual |
| CLM-31 | Submitting writes history | "Created" and "Submitted" entries | Automated |
| CLM-32 | Claim goes to the employee's manager | Karthik's claim is assigned to Priya | Automated |
| CLM-33 | User with no manager (Director) submits | Error "No approving manager assigned" | Automated |
| CLM-34 | Edit a Draft: add/remove rows | Saved correctly; total recalculated | Automated |
| CLM-35 | Edit Submitted claim | Blocked (service and UI) | Automated |
| CLM-36 | Edit another employee's Draft | Blocked | Automated |
| CLM-37 | Edit Paid claim | "Paid claims cannot be modified" | Automated |
| CLM-38 | Cancel button | Returns to previous page; nothing saved | Manual |
| CLM-39 | Several errors at once | All invalid fields highlighted; first error shown in toast | Manual |
| CLM-40 | Submit from Details page on a Draft with a missing receipt | Blocked with a clear message | Automated |

## 5. My Claims list
| ID | Test | Expected | Type |
|---|---|---|---|
| LST-01 | Employee list | Only own claims, newest first | Manual |
| LST-02 | Search by reference | Matches | Manual |
| LST-03 | Search by title | Matches (case-insensitive) | Manual |
| LST-04 | Status filter | Each status shows only that status | Manual |
| LST-05 | Date range filter (claim date) | Inclusive range | Manual |
| LST-06 | Combine search + status + dates | All filters apply together | Manual |
| LST-07 | Clear button | Resets all filters | Manual |
| LST-08 | No matches | "No claims match your filters." | Manual |
| LST-09 | Manager/Finance toggle "My claims / Team|All claims" | Switches scope; employee column appears | Manual |
| LST-10 | Draft row action | "Edit" opens form; other statuses show "View" | Manual |
| LST-11 | Row click | Opens Claim Details | Manual |
| LST-12 | Status chips | Colour per status (grey, amber, blue, red, green) | Manual |

## 6. Claim details
| ID | Test | Expected | Type |
|---|---|---|---|
| DET-01 | Header | Reference, employee, department, status, date, approver, total, purpose | Manual |
| DET-02 | Items table | Category, date, description, amount, receipt; total row | Manual |
| DET-03 | Receipt link | Opens preview dialog; Download works | Manual |
| DET-04 | History timeline | All events in order with actor, time, comments | Manual |
| DET-05 | Owner views own Submitted claim | Banner "waiting for approval by <manager>"; no edit button | Manual |
| DET-06 | Rejected claim | Red banner with rejection comment | Manual |
| DET-07 | Paid claim | Green banner with payment date and reference | Manual |
| DET-08 | Buttons per role and status | Edit/Submit only for owner Draft; Approve/Reject only for assigned manager on Submitted; Record payment only for Finance on Approved; Revise only for owner on Rejected | Manual |
| DET-09 | Manager viewing own Submitted claim | Info "You cannot approve your own claim"; no Approve button | Manual |

## 7. Manager approvals
| ID | Test | Expected | Type |
|---|---|---|---|
| APR-01 | Priya's pending queue | Shows Karthik's and Divya's Submitted claims only | Manual |
| APR-02 | Arjun's pending queue | Shows Vikram's Submitted claim, not Priya's team's | Manual |
| APR-03 | Approve (confirm dialog) | Status Approved; leaves pending queue; history "Approved" | Automated |
| APR-04 | Cancel the confirm dialog | Nothing changes | Manual |
| APR-05 | Reject with comment | Status Rejected; comment saved and shown | Automated |
| APR-06 | Reject with empty comment | Blocked, "Rejection comment is required" | Automated |
| APR-07 | Reject with spaces only | Blocked | Automated |
| APR-08 | Manager cannot approve own claim | Priya's own claim not in her queue; service blocks direct attempt | Automated |
| APR-09 | Director approves a manager's claim | Ravi approves Priya's claim | Automated |
| APR-10 | Manager not assigned to the claim | Cannot approve (service blocks) | Automated |
| APR-11 | Employee or Finance approving | Blocked | Automated |
| APR-12 | Approving a claim that is not Submitted | Blocked | Automated |
| APR-13 | "Reviewed by me" tab | Lists claims this manager approved or rejected | Manual |
| APR-14 | Success/error toasts | Visible and readable | Manual |

## 8. Rejection and resubmission
| ID | Test | Expected | Type |
|---|---|---|---|
| REJ-01 | Owner clicks Revise on a Rejected claim | Status returns to Draft; history "Revised" | Automated |
| REJ-02 | Edit, then resubmit | Status Submitted again; full history shown | Automated |
| REJ-03 | Edit form for a revised claim | Shows the previous rejection comment banner | Manual |
| REJ-04 | Another employee revises someone's rejected claim | Blocked | Automated |

## 9. Finance processing
| ID | Test | Expected | Type |
|---|---|---|---|
| FIN-01 | Queue shows Approved claims only | Not Submitted/Rejected/Draft/Paid | Manual |
| FIN-02 | Record payment with reference + date | Status Paid; payment record created; history entry | Automated |
| FIN-03 | Payment reference empty | Blocked | Automated |
| FIN-04 | Payment date empty | Blocked | Automated |
| FIN-05 | Payment date in the future | Blocked | Automated |
| FIN-06 | Duplicate payment reference | Blocked | Automated |
| FIN-07 | Pay a non-Approved claim | Blocked (Draft, Submitted, Rejected) | Automated |
| FIN-08 | Non-finance user pays | Blocked | Automated |
| FIN-09 | Paid claim: edit / re-pay / revise / approve / reject | All blocked | Automated |
| FIN-10 | Payment records tab | Lists reference, claim, employee, date, amount, paid by | Manual |
| FIN-11 | Dashboard Paid count and amount after payment | Increase correctly | Automated |
| FIN-12 | Payment dialog defaults date to today | Pre-filled | Manual |

## 10. Employees
| ID | Test | Expected | Type |
|---|---|---|---|
| EMP-01 | Employee list shows 8 sample employees with manager names | Correct | Manual |
| EMP-02 | Manager opens page | View only, no Add/Edit | Manual |
| EMP-03 | Finance adds an employee | Appears in list and in the user switcher | Automated |
| EMP-04 | Finance edits an employee | Changes saved | Automated |
| EMP-05 | Validation: empty name, bad email, empty department | Field errors shown | Automated |
| EMP-06 | Duplicate email | Blocked | Manual |
| EMP-07 | Manager must have Manager role; cannot be own manager | Blocked | Automated |
| EMP-08 | Non-finance save attempt | Blocked | Automated |

## 11. Expense categories
| ID | Test | Expected | Type |
|---|---|---|---|
| CAT-01 | List shows 6 categories with caps | Correct | Manual |
| CAT-02 | Manager opens page | View only | Manual |
| CAT-03 | Finance adds a category | Available in claim form | Automated |
| CAT-04 | Duplicate name (any case) | Blocked | Automated |
| CAT-05 | Maximum amount 0 or empty | Blocked | Automated |
| CAT-06 | Change cap, then create claim above it | New cap enforced | Automated |
| CAT-07 | Deactivate category | Hidden from new claims; old claims still display it | Manual |

## 12. Reports
| ID | Test | Expected | Type |
|---|---|---|---|
| RPT-01 | No filters | All visible claims; totals consistent with the grouped tables | Automated |
| RPT-02 | Filter by employee | Only that employee | Automated |
| RPT-03 | Filter by category | Only claims with that category; amounts count that category only | Automated |
| RPT-04 | Filter by status | Only that status | Automated |
| RPT-05 | Filter by date range | Inclusive | Automated |
| RPT-06 | Combined filters | All applied | Manual |
| RPT-07 | Totals by employee / category / status agree | Same grand total | Automated |
| RPT-08 | Role scope | Employee sees own, Manager team, Finance all | Manual |
| RPT-09 | Export CSV | File downloads; opens in Excel; commas and quotes escaped | Automated (content) / Manual (download) |
| RPT-10 | Empty result | "No claims match" and Export disabled | Manual |

## 13. Activity history
| ID | Test | Expected | Type |
|---|---|---|---|
| HIS-01 | Every status change recorded | Created, Submitted, Approved/Rejected, Revised, Payment recorded | Automated |
| HIS-02 | Lifecycle transitions | `null>Draft, Draft>Submitted, Submitted>Approved, Approved>Paid` with actor and timestamp | Automated |
| HIS-03 | Page shows newest first | Correct | Manual |
| HIS-04 | Search by reference, title, person, comment | Matches | Manual |
| HIS-05 | Filter by activity type | Matches | Manual |
| HIS-06 | Role scope | Employee sees own claims' history only | Manual |
| HIS-07 | Reference link opens the claim | Works | Manual |

## 14. Persistence
| ID | Test | Expected | Type |
|---|---|---|---|
| PER-01 | Create a claim, refresh the browser | Claim still there | Automated (logic) / Manual |
| PER-02 | Switch user, refresh | Same user still selected | Manual |
| PER-03 | Approve, refresh | Status stays Approved | Manual |
| PER-04 | Reload does not re-seed or overwrite data | Your changes remain | Automated |
| PER-05 | Close and reopen the tab | Data remains | Manual |
| PER-06 | Reset demo data | Original 15 claims restored; custom data gone | Automated |
| PER-07 | Receipt attachments survive refresh | Still previewable | Manual |
| PER-08 | Storage full (attach many large receipts) | Friendly error, existing data unharmed | Manual |
| PER-09 | Corrupt a localStorage value, then refresh | App does not crash (falls back safely) | Manual |

## 15. End-to-end scenarios
| ID | Scenario | Expected |
|---|---|---|
| E2E-01 | Happy path: Karthik creates and submits → Priya approves → Sneha pays | Statuses Draft → Submitted → Approved → Paid; history has 4 entries; dashboard counts update for each role |
| E2E-02 | Rejection loop: Divya submits → Priya rejects with comment → Divya revises, edits, resubmits → Priya approves → Sneha pays | Full history preserved including the rejection comment |
| E2E-03 | Manager's own claim: Priya submits → she cannot approve → Ravi approves → Sneha pays | Self-approval blocked; Director approval works |
| E2E-04 | Rule gauntlet: try each of the 16 rules in the spec in the UI | Each is blocked with a clear message |
| E2E-05 | Multi-role session: use all three roles without refresh between switches | No stale data; menus and queues are correct |
| E2E-06 | Cross-team isolation: Arjun and Priya each see only their own team's queue | Confirmed |

## 16. UI/UX, responsiveness, accessibility
| ID | Test | Expected |
|---|---|---|
| UX-01 | Desktop (1440 px) | Sidebar fixed; tables readable |
| UX-02 | Tablet (768 px) | Layout adapts; no horizontal page scroll |
| UX-03 | Mobile (375 px) | Sidebar becomes a drawer opened by the menu button; item table scrolls horizontally inside its container |
| UX-04 | Status colours are consistent across table, details, timeline | Yes |
| UX-05 | Keyboard: tab through the claim form and dialogs | Logical focus order; Enter submits dialogs; Esc closes |
| UX-06 | Form fields have labels; errors are announced next to the field | Yes |
| UX-07 | Empty states | Friendly text on every list |
| UX-08 | Toasts for success and error | Appear bottom centre, auto-dismiss |
| UX-09 | Browsers | Chrome, Edge, Firefox (latest) |
| UX-10 | Colour contrast and zoom to 200 % | No clipped content |
