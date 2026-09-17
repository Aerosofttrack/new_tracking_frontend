export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value.username) return value.username;
    if (value.vehicleNumber) return value.vehicleNumber;
    if (value.imei) return value.imei;
    if (value.packageName) return value.packageName;
    if (value.groupName) return value.groupName;
    if (value._id) return String(value._id);
    return JSON.stringify(value);
  }
  return String(value);
}

export function getRefLabel(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.name || item.username || item.vehicleNumber || item.imei
    || item.packageName || item.groupName || item.packageCode || item._id;
}
