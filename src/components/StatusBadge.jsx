import "./Statusbadge.css"

export default function StatusBadge({ value }) {
  if (!value) return <span className="badge">—</span>;

  const normalized = String(value).toUpperCase();
  const tone = {
    ACTIVE: 'success',
    INACTIVE: 'muted',
    SUSPENDED: 'warning',
    PENDING: 'info',
    ADMIN: 'primary',
    DEALER: 'primary',
    USER: 'info',
    PERSON: 'muted',
  }[normalized] || 'default';

  return <span className={`badge badge-${tone}`}>{value}</span>;
}
