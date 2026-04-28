import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, sendOtp, verifyOtp, clearError, resetOtp } from '../slices/authSlice';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, otpSent, user } = useSelector((s) => s.auth);

  const [mode, setMode] = useState('password');
  const [form, setForm] = useState({ email: '', password: '' });
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (otpSent) {
      const timeout = setTimeout(() => {
        setTimer(150);
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [otpSent]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'ORGANIZER') {
        if (user.verified === false) {
          return;
        }
        navigate('/organizer', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const handleModeSwitch = (newMode) => {
    if (mode === 'otp' && otpSent) return;
    setMode(newMode);
    setErrors({});
    dispatch(resetOtp());
    dispatch(clearError());
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleChange = (e) => {
    const nextForm = { ...form, [e.target.name]: e.target.value };
    setForm(nextForm);
    setErrors(validatePassword(nextForm));
    if (error) dispatch(clearError());
  };

  const validatePassword = (values = form) => {
    const errs = {};
    if (!values.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = 'Enter a valid email';
    if (!values.password) errs.password = 'Password is required';
    return errs;
  };

  const handlePasswordLogin = (e) => {
    e.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    dispatch(loginUser(form));
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!identifier.trim()) { setErrors({ identifier: 'Enter your email or phone number' }); return; }
    dispatch(sendOtp(identifier));
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp.trim()) { setErrors({ otp: 'Enter the OTP' }); return; }
    if (!/^\d{6}$/.test(otp)) { setErrors({ otp: 'OTP must be 6 digits' }); return; }
    dispatch(verifyOtp({ identifier, otp }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-sub">Login to your SyncEvent account</p>
        </div>

        <div className="auth-tabs">
          <div
            className={`auth-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('password')}
          >
            Password
          </div>

          <div
            className={`auth-tab ${mode === 'otp' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('otp')}
          >
            OTP
          </div>
        </div>

        {(error || (token && user?.role === 'ORGANIZER' && user?.verified === false ? 'Your organizer account is not verified yet.' : '')) && (
          <div className="form-error-banner">
            {error || 'Your organizer account is not verified yet.'}
          </div>
        )}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="auth-form" noValidate>
            <Input
              label="Email"
              required
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              label="Password"
              required
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={loading}>Login</Button>
          </form>
        )}

        {mode === 'otp' && !otpSent && (
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
        )}

        {mode === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
            <p className="auth-sub">
              OTP sent to <strong>{identifier}</strong>
            </p>

            <Input
              label="Enter OTP"
              required
              type="text"
              name="otp"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setErrors({});
                if (error) dispatch(clearError());
              }}
              error={errors.otp}
              maxLength={6}
            />

            <Button type="submit" loading={loading}>
              Verify OTP
            </Button>

            {timer > 0 ? (
              <p className="auth-sub">
                Resend OTP in <strong>{formatTime(timer)}</strong>
              </p>
            ) : (
              <Button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  dispatch(sendOtp(identifier));
                  setTimer(150);
                }}
              >
                Resend OTP
              </Button>
            )}

            <Button
              type="button"
              className="auth-link-btn"
              onClick={() => dispatch(resetOtp())}
            >
              Change email / phone
            </Button>
          </form>
        )}

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
} 
