import { useState } from 'react';
import Button from '../../../components/ui/Button';

export function useToast(duration = 4000) {
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), duration);
  };

  return { toast, showToast };
}

export function useModal() {
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, loading: false, confirmLabel: 'Confirm' });

  const openModal = ({ title, message, onConfirm, confirmLabel = 'Confirm' }) =>
    setModal({ isOpen: true, title, message, onConfirm, loading: false, confirmLabel });

  const closeModal = () =>
    setModal(m => ({ ...m, isOpen: false, loading: false }));

  const confirmModal = async () => {
    if (!modal.onConfirm) return closeModal();
    setModal(m => ({ ...m, loading: true }));
    try { await modal.onConfirm(); } finally { closeModal(); }
  };

  const ConfirmModalUI = modal.isOpen ? (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={closeModal}
    >
      <div
        style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>{modal.title}</h3>
        <p style={{ fontSize: 14, color: 'var(--neutral-600)', lineHeight: 1.6, margin: '0 0 24px' }}>{modal.message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={closeModal} disabled={modal.loading}>Cancel</Button>
          <Button onClick={confirmModal} loading={modal.loading}>{modal.confirmLabel}</Button>
        </div>
      </div>
    </div>
  ) : null;

  return { openModal, closeModal, ConfirmModalUI };
}
