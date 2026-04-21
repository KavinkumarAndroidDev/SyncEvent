export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(i);
  }

  const visiblePages = pages.filter(p => {
    return p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1;
  });

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Prev
      </button>

      {visiblePages.map((p, idx) => {
        const prev = visiblePages[idx - 1];
        const showDots = prev !== undefined && p - prev > 1;
        return (
          <span key={p}>
            {showDots && <span className="page-dots">...</span>}
            <button
              className={`page-btn ${p === currentPage ? 'page-btn-active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          </span>
        );
      })}

      <button
        className="page-btn"
        disabled={currentPage === totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next →
      </button>
    </div>
  );
}