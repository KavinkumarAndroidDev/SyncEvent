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
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 className="view-title">{title}</h2>
          <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>{description}</p>
        </div>
        <button className="btn-primary" onClick={onAction} style={{ minWidth: 140 }}>
          {actionLabel}
        </button>
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
      </div>
    </div>
  );
}
