import { RuleError } from './errors.js';

let backend = typeof localStorage !== 'undefined' ? localStorage : null;

/** Swap the storage backend (used by tests). */
export function setBackend(b) {
  backend = b;
}

export function memoryBackend() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      m.set(k, String(v));
    },
    removeItem: (k) => {
      m.delete(k);
    },
  };
}

export function read(key, fallback) {
  try {
    const raw = backend.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    backend.setItem(key, JSON.stringify(value));
  } catch {
    throw new RuleError('Browser storage is full. Remove some receipt attachments and try again.');
  }
}

export function remove(key) {
  try {
    backend.removeItem(key);
  } catch {
    /* ignore */
  }
}
