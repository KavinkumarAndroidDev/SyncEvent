import Modal from '../Modal';
import Button from '../Button';

export default function AdminEntityModal({
  isOpen,
  title,
  form,
  fields,
  errors,
  loading,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onSubmit} loading={loading}>Save</Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {fields.map((field) => (
          <div key={field.name}>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                className="form-input"
                rows={4}
                value={form[field.name]}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                style={{ resize: 'vertical' }}
              />
            ) : (
              <input
                className="form-input"
                type={field.type || 'text'}
                value={form[field.name]}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
            {errors[field.name] && (
              <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors[field.name]}</div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
