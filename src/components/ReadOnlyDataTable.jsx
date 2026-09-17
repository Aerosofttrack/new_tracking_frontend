// components/ReadOnlyDataTable.jsx
import StatusBadge from './StatusBadge.jsx';
import { formatCellValue, formatDate, formatDateTime } from '../utils/formatters.js';
import "./Datatable.css"

function renderCell(row, column) {
  const value = row[column.key];

  if (column.format === 'date') return formatDate(value);
  if (column.format === 'datetime') return formatDateTime(value);
  if (column.key === 'status' || column.key === 'role') {
    return <StatusBadge value={formatCellValue(value)} />;
  }

  return formatCellValue(value);
}

export default function ReadOnlyDataTable({ columns, rows, loading }) {
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
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((column) => (
                <td key={column.key}>{renderCell(row, column)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}