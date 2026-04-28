import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, resetOtp, resetPassword, sendOtp } from '../slices/authSlice';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, otpSent } = useSelector((s) => s.auth);
  const [identifier, setIdentifier] = useState('');
  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dispatch(resetOtp());
    return () => dispatch(clearError());
  }, [dispatch]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrors({ identifier: 'Enter your email or phone number' });
      return;
    }
    dispatch(sendOtp(identifier));
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.otp.trim()) errs.otp = 'Enter the OTP';
    else if (!/^\d{6}$/.test(form.otp)) errs.otp = 'OTP must be 6 digits';
    if (form.newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const result = await dispatch(resetPassword({
      identifier,
      otp: form.otp,
      newPassword: form.newPassword,
    }));
    if (resetPassword.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1600);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Reset password</h2>
          <p className="auth-sub">Enter your account email or phone to get an OTP.</p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}
        {success && <div className="alert alert-success">Password reset successful. Redirecting to login...</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="auth-form" noValidate>
            <Input
              label="Email or Phone"
              required
              type="text"
              name="identifier"
              placeholder="you@example.com or 9876543210"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setErrors({});
                if (error) dispatch(clearError());
              }}
              error={errors.identifier}
            />
            <Button type="submit" loading={loading}>Send OTP</Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="auth-form" noValidate>
            <p className="auth-sub">OTP sent to <strong>{identifier}</strong></p>
            <Input
              label="OTP"
              required
              type="text"
              name="otp"
              placeholder="6-digit OTP"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
              error={errors.otp}
              maxLength={6}
            />
            <Input
              label="New Password"
              required
              type="password"
              name="newPassword"
              placeholder="Minimum 8 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              error={errors.newPassword}
            />
            <Input
              label="Confirm Password"
              required
              type="password"
              name="confirmPassword"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />
            <Button type="submit" loading={loading}>Reset Password</Button>
            <Button type="button" className="auth-link-btn" onClick={() => dispatch(resetOtp())}>
              Change email / phone
            </Button>
          </form>
        )}

        <p className="auth-switch">
          Remembered password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
