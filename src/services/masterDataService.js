import { ROLES } from './constants.js';
import {
  getEmployees, saveEmployees, getCategories, saveCategories, getEmployee,
} from './dataStore.js';
import { RuleError } from './errors.js';

function requireFinance(userId) {
  const user = getEmployee(userId);
  if (!user || user.role !== ROLES.FINANCE) {
    throw new RuleError('Only Finance can manage employees and categories.');
  }
}

const nextId = (list, prefix, width) =>
  prefix +
  String(
    list.reduce((m, x) => Math.max(m, parseInt(x.id.slice(prefix.length), 10) || 0), 0) + 1,
  ).padStart(width, '0');

export function saveEmployee(userId, data) {
  requireFinance(userId);
  const employees = getEmployees();
  const errors = {};
  if (!data.name || !data.name.trim()) errors.name = 'Name is required';
  if (!/^\S+@\S+\.\S+$/.test(data.email || '')) errors.email = 'A valid email is required';
  else if (
    employees.some((e) => e.id !== data.id && e.email.toLowerCase() === data.email.trim().toLowerCase())
  ) {
    errors.email = 'Email is already in use';
  }
  if (!data.department || !data.department.trim()) errors.department = 'Department is required';
  if (!Object.values(ROLES).includes(data.role)) errors.role = 'Role is required';
  if (data.managerId) {
    if (data.managerId === data.id) errors.managerId = 'An employee cannot be their own manager';
    else if (!employees.some((e) => e.id === data.managerId && e.role === ROLES.MANAGER)) {
      errors.managerId = 'Selected manager must have the Manager role';
    }
  }
  if (Object.keys(errors).length) throw new RuleError('Please fix the highlighted errors', errors);

  const record = {
    id: data.id || nextId(employees, 'E', 3),
    name: data.name.trim(),
    email: data.email.trim(),
    department: data.department.trim(),
    role: data.role,
    managerId: data.managerId || null,
  };
  const idx = employees.findIndex((e) => e.id === record.id);
  if (idx >= 0) employees[idx] = record;
  else employees.push(record);
  saveEmployees(employees);
  return record;
}

export function saveCategory(userId, data) {
  requireFinance(userId);
  const categories = getCategories();
  const errors = {};
  const name = (data.name || '').trim();
  if (!name) errors.name = 'Category name is required';
  else if (categories.some((c) => c.id !== data.id && c.name.toLowerCase() === name.toLowerCase())) {
    errors.name = 'A category with this name already exists';
  }
  const max = Number(data.maxAmount);
  if (!Number.isFinite(max) || max <= 0) errors.maxAmount = 'Maximum eligible amount must be greater than 0';
  if (Object.keys(errors).length) throw new RuleError('Please fix the highlighted errors', errors);

  const record = {
    id: data.id || nextId(categories, 'CAT', 2),
    name,
    maxAmount: max,
    active: data.active !== false,
  };
  const idx = categories.findIndex((c) => c.id === record.id);
  if (idx >= 0) categories[idx] = record;
  else categories.push(record);
  saveCategories(categories);
  return record;
}
