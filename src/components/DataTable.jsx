import StatusBadge from './StatusBadge.jsx';
import { formatCellValue, formatDate, formatDateTime } from '../utils/formatters.js';
import "./Datatable.css"

// In DataTable.jsx - Update renderCell to support custom render
function renderCell(row, column) {
  // If column has custom render function
  if (column.render && typeof column.render === 'function') {
    return column.render(row);
  }

  const value = row[column.key];

  if (column.format === 'date') return formatDate(value);
  if (column.format === 'datetime') return formatDateTime(value);
  if (column.key === 'status' || column.key === 'role') {
    return <StatusBadge value={formatCellValue(value)} />;
  }

  return formatCellValue(value);
}

export default function DataTable({ 
  columns, 
  rows, 
  loading, 
  onEdit, 
  onView,
  onDelete, 
  extraAction, 
  hideActions = false 
}) {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner" />
        <span>Loading records...</span>
      </div>
    );
  }

  if (!rows.length) {
    return <div className="empty-state">No records found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {!hideActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((column) => (
                <td key={column.key}>{renderCell(row, column)}</td>
              ))}
              {!hideActions && (
    <td className="actions-cell">
      {extraAction && (
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => extraAction.onClick(row)}>
          {extraAction.render ? extraAction.render(row) : extraAction.label}
        </button>
      )}
      {onView && (
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => onView(row)}>
          View
        </button>
      )}
      {onEdit && (
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => onEdit(row)}>
          Edit
        </button>
      )}
    </td>
  )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}