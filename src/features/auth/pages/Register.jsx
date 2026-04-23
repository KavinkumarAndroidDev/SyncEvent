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
  }, [dispatch]);

  useEffect(() => {
    if (registerSuccess) {
      dispatch(clearRegisterSuccess());
      navigate('/login');
    }
  }, [dispatch, navigate, registerSuccess]);

  const handleChange = (e) => {
    const nextForm = { ...form, [e.target.name]: e.target.value };
    setForm(nextForm);
    setErrors(validate(nextForm));
    if (error) dispatch(clearError());
  };

  const validate = (values = form) => {
    const errs = {};
    if (!values.fullName.trim()) errs.fullName = 'Full name is required';
    else if (values.fullName.trim().length < 3) errs.fullName = 'Name must be at least 3 characters';

    if (!values.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = 'Enter a valid email';

    const strongPwd = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!values.password) errs.password = 'Password is required';
    else if (!strongPwd.test(values.password))
      errs.password = 'Min 8 chars with uppercase, lowercase, number and special character';

    if (values.phone && !/^[0-9]{10}$/.test(values.phone))
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
              label="Full Name"
              required
              name="fullName"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              error={errors.fullName}
            />
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
          </div>

          <Input
            label="Password"
            required
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
      </div>
    </div>
  );
}
