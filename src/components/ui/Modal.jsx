export default function Modal({ isOpen, onClose, title, children, actions, maxWidth = '440px' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-box" style={{ maxWidth: maxWidth, width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ marginBottom: '24px', fontSize: '14px', lineHeight: '1.6', color: 'var(--neutral-600)' }}>
          {children}
        </div>
        {actions && (
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
