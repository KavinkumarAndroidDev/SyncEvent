import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError, clearRegisterSuccess } from '../slices/authSlice';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, registerSuccess } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', gender: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => dispatch(clearError());
  }, []);

  useEffect(() => {
    if (registerSuccess) {
      dispatch(clearRegisterSuccess());
      navigate('/login');
    }
  }, [registerSuccess]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    if (error) dispatch(clearError());
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 3) errs.fullName = 'Name must be at least 3 characters';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';

    const strongPwd = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!form.password) errs.password = 'Password is required';
    else if (!strongPwd.test(form.password))
      errs.password = 'Min 8 chars with uppercase, lowercase, number and special character';

    if (form.phone && !/^[0-9]{10}$/.test(form.phone))
      errs.phone = 'Phone must be 10 digits';

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = { ...form };
    if (!payload.gender) delete payload.gender;
    if (!payload.phone) delete payload.phone;
    dispatch(registerUser(payload));
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-sub">Join SyncEvent and discover events</p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row">
            <Input
              label="Full Name *"
              name="fullName"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              error={errors.fullName}
            />
            <Input
              label="Email *"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
          </div>

          <Input
            label="Password *"
            type="password"
            name="password"
            placeholder="Min 8 chars, uppercase, number, symbol"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className="form-row">
            <Input
              label="Phone"
              name="phone"
              placeholder="10-digit number"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-input form-select" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={loading}>Create Account</Button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <p className="auth-switch" style={{ marginTop: 4 }}>
          Want to host events? <Link to="/register/organizer">Register as Organizer</Link>
        </p>
      </div>
    </div>
  );
}
