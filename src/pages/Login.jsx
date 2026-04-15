import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, sendOtp, verifyOtp, clearError, resetOtp } from '../features/auth/authSlice';
import Input from '../components/Input';
import Button from '../components/Button';

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
      setTimer(150);
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
  }, []);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'ATTENDEE') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [token, user]);

  //Helper functions
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
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    if (error) dispatch(clearError());
  };

  const validatePassword = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
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

        {error && <div className="form-error-banner">{error}</div>}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="auth-form" noValidate>
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Button type="submit" loading={loading}>Login</Button>
          </form>
        )}

        {mode === 'otp' && !otpSent && (
          <form onSubmit={handleSendOtp} className="auth-form" noValidate>
            <Input
              label="Email or Phone"
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
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
} 