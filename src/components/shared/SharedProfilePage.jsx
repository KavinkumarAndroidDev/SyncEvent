import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../lib/axios';
import { fetchCurrentUser, logoutUser } from '../../features/auth/slices/authSlice';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../common/Spinner';

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.89 1 12c.92-2.08 2.49-3.93 4.46-5.31"/>
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.83 11.83 0 0 1-1.67 2.68"/>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
      <path d="M1 1l22 22"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center' }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

const CARD = {
  background: 'white',
  border: '1px solid var(--neutral-100)',
  borderRadius: 20,
  padding: 32,
  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
};

const FIELD_LABEL = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--neutral-400)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
  display: 'block',
};

export default function SharedProfilePage({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', gender: 'OTHER' });
  const [securityForm, setSecurityForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [step, setStep] = useState('IDLE');
  const [loading, setLoading] = useState({ profile: false, otp: false, password: false });
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onClose: null });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        gender: user.gender || 'OTHER',
      });
    }
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  const openModal = (title, message, onClose = null) => {
    setModal({ isOpen: true, title, message, onClose });
  };

  const closeModal = () => {
    const cb = modal.onClose;
    setModal({ isOpen: false, title: '', message: '', onClose: null });
    if (cb) cb();
  };

  const handleUpdateProfile = async () => {
    setLoading(l => ({ ...l, profile: true }));
    try {
      await axiosInstance.put('/users/me', profileForm);
      dispatch(fetchCurrentUser());
      showToast('Personal information updated successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(l => ({ ...l, profile: false }));
    }
  };

  const handleSendOTP = async () => {
    setLoading(l => ({ ...l, otp: true }));
    try {
      await axiosInstance.post('/auth/send-otp', { identifier: user.email });
      setStep('OTP_SENT');
      openModal('Verification Code Sent', 'A 6-digit code has been sent to your registered email. Check your inbox (and spam folder).');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already sent')) {
        setStep('OTP_SENT');
        openModal('Code Already Sent', 'An active code was recently sent. Enter it below to continue.');
      } else {
        showToast(msg || 'Failed to send verification code.', 'error');
      }
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  const handleResetPassword = async () => {
    if (!securityForm.otp || securityForm.otp.length !== 6) {
      showToast('Enter a valid 6-digit code.', 'error'); return;
    }
    if (securityForm.newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast('Passwords do not match.', 'error'); return;
    }
    setLoading(l => ({ ...l, password: true }));
    try {
      await axiosInstance.post('/auth/reset-password', {
        identifier: user.email,
        otp: securityForm.otp,
        newPassword: securityForm.newPassword,
      });
      openModal(
        'Password Changed',
        'Your password has been updated. You will be signed out for security.',
        async () => {
          await dispatch(logoutUser());
          navigate('/login');
        }
      );
      setStep('IDLE');
      setSecurityForm({ otp: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Code incorrect or expired.', 'error');
    } finally {
      setLoading(l => ({ ...l, password: false }));
    }
  };

  if (!user) return <div style={{ padding: 40 }}><Spinner label="Loading profile..." /></div>;

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 28 }}>

      <div>
        <h2 className="view-title">Account & Profile</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>
          Manage your personal information, security settings, and account details.
        </p>
      </div>

      {toast.msg && (
        <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--neutral-50)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Personal Information</h3>
              <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginTop: 3 }}>Update your name, phone and gender</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label style={FIELD_LABEL}>Full Name</label>
              <input className="form-input" value={profileForm.fullName} onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <label style={FIELD_LABEL}>Email Address</label>
              <input
                className="form-input" type="email" value={user.email || ''} disabled
                style={{ cursor: 'not-allowed', background: 'var(--neutral-50)', color: 'var(--neutral-400)' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={FIELD_LABEL}>Phone</label>
                <input className="form-input" type="tel" maxLength="10" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label style={FIELD_LABEL}>Gender</label>
                <select className="form-input" value={profileForm.gender} onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleUpdateProfile} loading={loading.profile}>Save Changes</Button>
            </div>
          </div>
        </div>

        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--neutral-50)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Account Security</h3>
              <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginTop: 3 }}>Change your password with OTP verification</p>
            </div>
          </div>

          {step === 'IDLE' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--neutral-50)', borderRadius: 12, padding: 16, fontSize: 14, color: 'var(--neutral-600)', lineHeight: 1.6 }}>
                For your security, changing your password will sign you out of all devices. You'll need to log in again with the new password.
              </div>
              <Button variant="secondary" onClick={handleSendOTP} loading={loading.otp}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Send Verification Code
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ background: '#fef3c7', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Enter the 6-digit code sent to <strong style={{ marginLeft: 4 }}>{user.email}</strong>
              </div>
              <div>
                <label style={FIELD_LABEL}>6-Digit Verification Code</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="0 0 0 0 0 0"
                  value={securityForm.otp}
                  onChange={e => setSecurityForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
                  maxLength="6"
                  style={{ textAlign: 'center', letterSpacing: '10px', fontWeight: 800, fontSize: 22 }}
                />
              </div>
              <div>
                <label style={FIELD_LABEL}>New Password</label>
                <PasswordInput
                  value={securityForm.newPassword}
                  onChange={e => setSecurityForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label style={FIELD_LABEL}>Confirm New Password</label>
                <PasswordInput
                  value={securityForm.confirmPassword}
                  onChange={e => setSecurityForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => { setStep('IDLE'); setSecurityForm({ otp: '', newPassword: '', confirmPassword: '' }); }}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword} loading={loading.password}>
                  Update Password
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {children}

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        onClose={closeModal}
        actions={<Button onClick={closeModal}>OK</Button>}
      >
        <p style={{ margin: 0, lineHeight: 1.6 }}>{modal.message}</p>
      </Modal>
    </div>
  );
}
