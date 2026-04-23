export default function AdminToolbar({
  title,
  description,
  search,
  onSearchChange,
  sort,
  onSortChange,
  sortOptions,
  actionLabel,
  onAction,
  pageSize,
  onPageSizeChange,
  onExport,
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 className="view-title">{title}</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>{description}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {onExport && <button className="btn-outline-sm" onClick={onExport} style={{ minWidth: 110 }}>Export</button>}
          {actionLabel && (
            <button className="btn-primary" onClick={onAction} style={{ minWidth: 140 }}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
        <input
          className="form-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <select className="form-input" value={sort} onChange={(e) => onSortChange(e.target.value)} style={{ width: 200 }}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {onPageSizeChange && (
          <select className="form-input" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} style={{ width: 150 }}>
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        )}
      </div>
    </div>
  );
}
