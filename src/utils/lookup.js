export const employeeName = (employees, id) => employees.find((e) => e.id === id)?.name ?? '—';
export const employeeDept = (employees, id) => employees.find((e) => e.id === id)?.department ?? '—';
export const categoryName = (categories, id) => categories.find((c) => c.id === id)?.name ?? '—';
