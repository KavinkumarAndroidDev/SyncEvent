import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '../../../lib/axios';
import { fetchCurrentUser } from '../../auth/slices/authSlice';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    gender: 'OTHER'
  });

  const [securityForm, setSecurityForm] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [step, setStep] = useState('IDLE'); // IDLE, OTP_SENT
  const [loading, setLoading] = useState({ profile: false, security: false });
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        gender: user.gender || 'OTHER'
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading({ ...loading, profile: true });
    try {
      await axiosInstance.put('/users/me', profileForm);
      setModal({ isOpen: true, title: 'Profile Updated', message: 'Your personal information has been successfully updated.' });
      dispatch(fetchCurrentUser());
    } catch (err) {
      setModal({ isOpen: true, title: 'Update Failed', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  const handleSendOTP = async () => {
    setLoading({ ...loading, security: true });
    try {
      await axiosInstance.post('/auth/send-otp', { identifier: user.email });
      setStep('OTP_SENT');
      setModal({ 
        isOpen: true, 
        title: 'Verification Code Sent', 
        message: 'A 6-digit security code has been sent to your registered email address. Please check your inbox (and spam folder).' 
      });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already sent')) {
        setStep('OTP_SENT');
        setModal({ 
          isOpen: true, 
          title: 'Code Recently Sent', 
          message: 'An active verification code was recently sent. Please check your email and enter the code below to continue.' 
        });
      } else {
        setModal({ 
          isOpen: true, 
          title: 'Verification Failed', 
          message: msg || 'We encountered an issue sending the verification code. Please try again later.' 
        });
      }
    } finally {
      setLoading({ ...loading, security: false });
    }
  };

  const handleResetPassword = async () => {
    if (!securityForm.otp || securityForm.otp.length !== 6) {
        setModal({ isOpen: true, title: 'Invalid Code', message: 'Please enter a valid 6-digit verification code.' });
        return;
    }
    if (securityForm.newPassword.length < 8) {
        setModal({ isOpen: true, title: 'Weak Password', message: 'Your new password must be at least 8 characters long.' });
        return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
        setModal({ isOpen: true, title: 'Password Mismatch', message: 'The new password and confirmation do not match.' });
        return;
    }

    setLoading({ ...loading, security: true });
    try {
      await axiosInstance.post('/auth/reset-password', { 
        identifier: user.email,
        otp: securityForm.otp,
        newPassword: securityForm.newPassword
      });
      
      setModal({ isOpen: true, title: 'Password Updated', message: 'Your password has been successfully changed. Please use your new password for future logins.' });
      setStep('IDLE');
      setSecurityForm({ otp: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setModal({ 
        isOpen: true, 
        title: 'Update Failed', 
        message: err.response?.data?.message || 'The verification code is incorrect or has expired.' 
      });
    } finally {
      setLoading({ ...loading, security: false });
    }
  };

  return (
    <div className="view-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="view-header" style={{ marginBottom: '40px' }}>
        <h2 className="view-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Security & Profile Settings</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: '15px' }}>Keep your account information accurate and secure.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div className="profile-card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--neutral-50)' }}>
                Personal Information
            </h3>
            
            <div className="form-grid" style={{ marginBottom: '24px' }}>
                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Full Name</label>
                    <input 
                        className="form-input" 
                        type="text" 
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Email Address</label>
                    <input 
                        className="form-input" 
                        type="email" 
                        value={user?.email || ''} 
                        disabled 
                        style={{ cursor: 'not-allowed', background: 'var(--neutral-50)', color: 'var(--neutral-400)' }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Phone Number</label>
                    <input 
                        className="form-input" 
                        type="text" 
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        maxLength="10"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Gender</label>
                    <select 
                        className="form-input" 
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                    >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleUpdateProfile} loading={loading.profile} style={{ padding: '12px 40px' }}>
                    Save Profile Changes
                </Button>
            </div>
        </div>

        <div className="profile-card">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--neutral-50)' }}>
                Account Security
            </h3>

            {step === 'IDLE' ? (
                <div style={{ padding: '24px 0', maxWidth: '600px' }}>
                    <p style={{ fontSize: '15px', color: 'var(--neutral-600)', marginBottom: '24px', lineHeight: '1.6' }}>
                        To update your password, we need to verify your identity. Click the button below to receive a security code on your registered email.
                    </p>
                    <Button onClick={handleSendOTP} loading={loading.security} variant="secondary">
                        Change Account Password
                    </Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '24px', maxWidth: '500px' }}>
                    <div className="form-group" style={{ textAlign: 'center', background: 'var(--neutral-50)', padding: '20px', borderRadius: '12px' }}>
                        <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '12px' }}>
                            6-Digit Verification Code
                        </label>
                        <input 
                            className="form-input" 
                            type="text" 
                            placeholder="0 0 0 0 0 0"
                            value={securityForm.otp}
                            onChange={(e) => setSecurityForm({...securityForm, otp: e.target.value.replace(/\D/g, '')})}
                            maxLength="6"
                            style={{ textAlign: 'center', letterSpacing: '8px', fontWeight: 800, fontSize: '24px', border: '2px solid var(--neutral-100)', borderRadius: '12px' }}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--neutral-400)', marginTop: '12px' }}>
                            Enter the code sent to your email to unlock password fields.
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>New Password</label>
                        <div className="password-input-wrap">
                            <input 
                                className="form-input" 
                                type={showNewPassword ? 'text' : 'password'} 
                                placeholder="Enter new secure password"
                                value={securityForm.newPassword}
                                onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.89 1 12c.92-2.08 2.49-3.93 4.46-5.31" />
                                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.83 11.83 0 0 1-1.67 2.68" />
                                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                        <path d="M1 1l22 22" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600 }}>Confirm New Password</label>
                        <div className="password-input-wrap">
                            <input 
                                className="form-input" 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                placeholder="Repeat your new password"
                                value={securityForm.confirmPassword}
                                onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.89 1 12c.92-2.08 2.49-3.93 4.46-5.31" />
                                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.83 11.83 0 0 1-1.67 2.68" />
                                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                        <path d="M1 1l22 22" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <Button variant="secondary" onClick={() => setStep('IDLE')}>Cancel</Button>
                        <Button onClick={handleResetPassword} loading={loading.security}>Verify & Update</Button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        onClose={() => setModal({ ...modal, isOpen: false })}
        actions={<Button onClick={() => setModal({ ...modal, isOpen: false })}>Acknowledge</Button>}
      >
        <p style={{ margin: 0, lineHeight: 1.5 }}>{modal.message}</p>
      </Modal>
    </div>
  );
}
