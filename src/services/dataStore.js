import { KEYS } from './constants.js';
import { read, write } from './storage.js';
import { buildSeed } from './seed.js';

export const getEmployees = () => read(KEYS.employees, []);
export const getCategories = () => read(KEYS.categories, []);
export const getClaims = () => read(KEYS.claims, []);
export const getHistory = () => read(KEYS.history, []);
export const getPayments = () => read(KEYS.payments, []);

export const saveEmployees = (v) => write(KEYS.employees, v);
export const saveCategories = (v) => write(KEYS.categories, v);
export const saveClaims = (v) => write(KEYS.claims, v);
export const saveHistory = (v) => write(KEYS.history, v);
export const savePayments = (v) => write(KEYS.payments, v);

export const getEmployee = (id) => getEmployees().find((e) => e.id === id) || null;
export const getClaim = (id) => getClaims().find((c) => c.id === id) || null;

export const DEFAULT_USER_ID = 'E005';
export const getSessionUserId = () => read(KEYS.session, DEFAULT_USER_ID);
export const setSessionUserId = (id) => write(KEYS.session, id);

/** Load demo data on first run only; later runs keep whatever is stored. */
export function ensureSeeded() {
  if (
    read(KEYS.employees, null) === null ||
    read(KEYS.categories, null) === null ||
    read(KEYS.claims, null) === null
  ) {
    resetDemoData();
  }
}

export function resetDemoData() {
  const s = buildSeed();
  saveEmployees(s.employees);
  saveCategories(s.categories);
  saveClaims(s.claims);
  saveHistory(s.history);
  savePayments(s.payments);
  setSessionUserId(DEFAULT_USER_ID);
}
