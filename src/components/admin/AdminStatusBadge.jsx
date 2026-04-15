export default function AdminStatusBadge({ status }) {
  const isActive = status === 'ACTIVE';

  return (
    <span
      className="badge"
      style={{
        background: isActive ? '#dcfce7' : '#fee2e2',
        color: isActive ? '#166534' : '#991b1b',
      }}
    >
      {status || 'UNKNOWN'}
    </span>
  );
}
