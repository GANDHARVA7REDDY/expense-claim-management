import { STATUS } from './constants.js';
import { addDays } from '../utils/dates.js';

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const SEED_EMPLOYEES = [
  { id: 'E001', name: 'Ravi Kumar', email: 'ravi.kumar@example.com', department: 'Management', role: 'Manager', managerId: null },
  { id: 'E002', name: 'Priya Nair', email: 'priya.nair@example.com', department: 'Engineering', role: 'Manager', managerId: 'E001' },
  { id: 'E003', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', department: 'Sales', role: 'Manager', managerId: 'E001' },
  { id: 'E004', name: 'Sneha Iyer', email: 'sneha.iyer@example.com', department: 'Finance', role: 'Finance', managerId: 'E001' },
  { id: 'E005', name: 'Karthik Rao', email: 'karthik.rao@example.com', department: 'Engineering', role: 'Employee', managerId: 'E002' },
  { id: 'E006', name: 'Divya Menon', email: 'divya.menon@example.com', department: 'Engineering', role: 'Employee', managerId: 'E002' },
  { id: 'E007', name: 'Vikram Singh', email: 'vikram.singh@example.com', department: 'Sales', role: 'Employee', managerId: 'E003' },
  { id: 'E008', name: 'Neha Gupta', email: 'neha.gupta@example.com', department: 'Sales', role: 'Employee', managerId: 'E003' },
];

// Caps are per expense item. Values are training defaults.
export const SEED_CATEGORIES = [
  { id: 'CAT01', name: 'Travel', maxAmount: 5000, active: true },
  { id: 'CAT02', name: 'Hotel', maxAmount: 4000, active: true },
  { id: 'CAT03', name: 'Food', maxAmount: 1000, active: true },
  { id: 'CAT04', name: 'Internet', maxAmount: 500, active: true },
  { id: 'CAT05', name: 'Office Supplies', maxAmount: 2000, active: true },
  { id: 'CAT06', name: 'Others', maxAmount: 1500, active: true },
];

// item tuple: [categoryId, description, expenseDate, amount, receiptFileName?]
const SPECS = [
  { refNo: 'EXP-2026-0001', employeeId: 'E005', stage: STATUS.DRAFT, title: 'Client Site Visit', purpose: 'Visit to client site for requirement review', claimDate: '2026-11-10', items: [['CAT01', 'Taxi to client site', '2026-11-09', 800]] },
  { refNo: 'EXP-2026-0002', employeeId: 'E005', stage: STATUS.SUBMITTED, title: 'Bangalore Conference Trip', purpose: 'Attending the annual engineering conference', claimDate: '2026-11-12', items: [['CAT01', 'Airport cabs', '2026-11-10', 3200, 'cab-receipt.png'], ['CAT02', 'Hotel - 2 nights', '2026-11-11', 3500, 'hotel-bill.png'], ['CAT03', 'Dinner', '2026-11-11', 650]] },
  { refNo: 'EXP-2026-0003', employeeId: 'E006', stage: STATUS.SUBMITTED, title: 'Team Offsite Cab', purpose: 'Team offsite transport', claimDate: '2026-11-15', items: [['CAT01', 'Cab to offsite venue', '2026-11-14', 1800, 'cab.png'], ['CAT03', 'Lunch', '2026-11-14', 400]] },
  { refNo: 'EXP-2026-0004', employeeId: 'E007', stage: STATUS.SUBMITTED, title: 'Pune Sales Visit', purpose: 'Customer meetings in Pune', claimDate: '2026-11-16', items: [['CAT01', 'Train and local travel', '2026-11-14', 2500, 'travel.png'], ['CAT02', 'Hotel', '2026-11-15', 3800, 'hotel.png']] },
  { refNo: 'EXP-2026-0005', employeeId: 'E008', stage: STATUS.APPROVED, title: 'Internet Reimbursement - Oct', purpose: 'Work from home broadband', claimDate: '2026-11-03', items: [['CAT04', 'Broadband bill Oct', '2026-10-31', 450]] },
  { refNo: 'EXP-2026-0006', employeeId: 'E005', stage: STATUS.APPROVED, title: 'Office Supplies Q4', purpose: 'Ergonomic accessories for the home office', claimDate: '2026-11-05', items: [['CAT05', 'Ergonomic mouse and stand', '2026-11-04', 1900, 'invoice.png']] },
  { refNo: 'EXP-2026-0007', employeeId: 'E006', stage: STATUS.REJECTED, title: 'Vendor Dinner', purpose: 'Dinner with vendor', claimDate: '2026-10-28', rejection: 'Business purpose unclear. Please add the vendor name and purpose.', items: [['CAT03', 'Dinner with vendor', '2026-10-27', 950]] },
  { refNo: 'EXP-2026-0008', employeeId: 'E007', stage: STATUS.PAID, title: 'Mumbai Client Meeting', purpose: 'Quarterly client review in Mumbai', claimDate: '2026-10-15', payment: { ref: 'PAY-2026-0001', date: '2026-10-24' }, items: [['CAT01', 'Flight', '2026-10-12', 4200, 'flight.png'], ['CAT02', 'Hotel', '2026-10-13', 3000, 'hotel.png'], ['CAT03', 'Meals', '2026-10-13', 800]] },
  { refNo: 'EXP-2026-0009', employeeId: 'E008', stage: STATUS.PAID, title: 'Internet Reimbursement - Sep', purpose: 'Work from home broadband', claimDate: '2026-10-05', payment: { ref: 'PAY-2026-0002', date: '2026-10-12' }, items: [['CAT04', 'Broadband bill Sep', '2026-09-30', 400]] },
  { refNo: 'EXP-2026-0010', employeeId: 'E002', stage: STATUS.SUBMITTED, title: 'Hyderabad Workshop', purpose: 'Engineering leadership workshop', claimDate: '2026-11-18', items: [['CAT01', 'Taxi', '2026-11-17', 2800, 'taxi.png'], ['CAT03', 'Lunch', '2026-11-17', 900]] },
  { refNo: 'EXP-2026-0011', employeeId: 'E003', stage: STATUS.APPROVED, title: 'Sales Kickoff', purpose: 'Annual sales kickoff event', claimDate: '2026-11-08', items: [['CAT02', 'Hotel', '2026-11-06', 3600, 'hotel.png'], ['CAT03', 'Dinner', '2026-11-06', 700]] },
  { refNo: 'EXP-2026-0012', employeeId: 'E004', stage: STATUS.SUBMITTED, title: 'Courier Charges', purpose: 'Documents couriered to vendor', claimDate: '2026-11-19', items: [['CAT06', 'Courier to vendor', '2026-11-18', 600]] },
  { refNo: 'EXP-2026-0013', employeeId: 'E008', stage: STATUS.REJECTED, title: 'Taxi Fare', purpose: 'Taxi to customer site', claimDate: '2026-11-01', rejection: 'Receipt is not readable. Please attach a clear copy.', items: [['CAT01', 'Taxi', '2026-10-30', 1500, 'blurry.png']] },
  { refNo: 'EXP-2026-0014', employeeId: 'E006', stage: STATUS.PAID, title: 'Technical Books', purpose: 'Reference books for the team library', claimDate: '2026-09-20', payment: { ref: 'PAY-2026-0003', date: '2026-09-30' }, items: [['CAT05', 'Technical books', '2026-09-18', 1800, 'books.png']] },
  { refNo: 'EXP-2026-0015', employeeId: 'E007', stage: STATUS.APPROVED, title: 'Client Lunch', purpose: 'Lunch with prospective client', claimDate: '2026-11-20', items: [['CAT03', 'Client lunch', '2026-11-19', 980]] },
];

const FINANCE_ID = 'E004';

export function buildSeed() {
  const employees = SEED_EMPLOYEES.map((e) => ({ ...e }));
  const categories = SEED_CATEGORIES.map((c) => ({ ...c }));
  const claims = [];
  const history = [];
  const payments = [];
  let h = 0;
  const nameOf = (id) => employees.find((e) => e.id === id)?.name ?? id;

  SPECS.forEach((s, i) => {
    const emp = employees.find((e) => e.id === s.employeeId);
    const id = `C${String(i + 1).padStart(3, '0')}`;
    const items = s.items.map((it, k) => ({
      id: `${id}-I${k + 1}`,
      categoryId: it[0],
      description: it[1],
      expenseDate: it[2],
      amount: it[3],
      receipt: it[4] ? { name: it[4], type: 'image/png', dataUrl: PIXEL } : null,
    }));
    const created = `${s.claimDate}T09:00:00.000Z`;
    const claim = {
      id,
      refNo: s.refNo,
      employeeId: emp.id,
      title: s.title,
      claimDate: s.claimDate,
      purpose: s.purpose,
      status: s.stage,
      totalAmount: items.reduce((sum, it) => sum + it.amount, 0),
      items,
      approverId: null,
      rejectionComment: null,
      createdAt: created,
      updatedAt: created,
    };
    const ev = (action, from, to, actorId, comment, at) => {
      h += 1;
      history.push({
        id: `H${String(h).padStart(4, '0')}`,
        claimId: id,
        action,
        fromStatus: from,
        toStatus: to,
        actorId,
        actorName: nameOf(actorId),
        comment: comment || '',
        timestamp: at,
      });
    };

    ev('Created', null, STATUS.DRAFT, emp.id, '', created);
    if (s.stage !== STATUS.DRAFT) {
      claim.approverId = emp.managerId;
      claim.submittedAt = addDays(created, 1);
      ev('Submitted', STATUS.DRAFT, STATUS.SUBMITTED, emp.id, '', claim.submittedAt);
    }
    if (s.stage === STATUS.APPROVED || s.stage === STATUS.PAID) {
      claim.approvedAt = addDays(created, 2);
      ev('Approved', STATUS.SUBMITTED, STATUS.APPROVED, claim.approverId, 'Approved', claim.approvedAt);
    }
    if (s.stage === STATUS.REJECTED) {
      claim.rejectedAt = addDays(created, 2);
      claim.rejectionComment = s.rejection;
      ev('Rejected', STATUS.SUBMITTED, STATUS.REJECTED, claim.approverId, s.rejection, claim.rejectedAt);
    }
    if (s.stage === STATUS.PAID) {
      claim.paidAt = `${s.payment.date}T10:00:00.000Z`;
      payments.push({
        id: `P${String(payments.length + 1).padStart(3, '0')}`,
        claimId: id,
        paymentRef: s.payment.ref,
        paymentDate: s.payment.date,
        amount: claim.totalAmount,
        paidBy: FINANCE_ID,
        recordedAt: claim.paidAt,
      });
      ev('Payment recorded', STATUS.APPROVED, STATUS.PAID, FINANCE_ID, `Payment reference ${s.payment.ref}`, claim.paidAt);
    }
    claims.push(claim);
  });

  return { employees, categories, claims, history, payments };
}
