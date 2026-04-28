import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function AdminConfirmModal({ confirm, loading, onClose, onConfirm, zIndex = 1100 }) {
  return (
    <Modal
      isOpen={!!confirm}
      title={confirm?.title || 'Confirm Action'}
      onClose={onClose}
      zIndex={zIndex}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Confirm</Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--neutral-600)', lineHeight: 1.6 }}>
        {confirm?.message || 'Are you sure you want to continue?'}
      </p>
    </Modal>
  );
}
