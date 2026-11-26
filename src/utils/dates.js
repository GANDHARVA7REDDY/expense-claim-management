const pad = (n) => String(n).padStart(2, '0');

/** Local date as yyyy-mm-dd. */
export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso, n) {
  return new Date(Date.parse(iso) + n * 86400000).toISOString();
}
