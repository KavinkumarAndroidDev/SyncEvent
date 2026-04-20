export default function BookingAlert({ message, type = 'error', style }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      style={{
        background: isError ? '#fef2f2' : '#ecfdf5',
        border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
        color: isError ? '#dc2626' : '#15803d',
        fontSize: 14,
        padding: '10px 14px',
        borderRadius: 8,
        marginBottom: 16,
        ...style,
      }}
    >
      {message}
    </div>
  );
}
