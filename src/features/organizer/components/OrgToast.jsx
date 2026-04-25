export default function OrgToast({ msg, type = 'success' }) {
  if (!msg) return null;
  return (
    <div
      className={`alert ${type === 'success' ? 'alert-success' : 'alert-error'}`}
      style={{ marginBottom: 20 }}
    >
      {msg}
    </div>
  );
}
