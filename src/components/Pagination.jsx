export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!meta.hasPrevPage}
        onClick={() => onPageChange(meta.page - 1)}
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {meta.page} of {meta.totalPages} ({meta.total} total)
      </span>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={!meta.hasNextPage}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Next
      </button>
    </div>
  );
}
