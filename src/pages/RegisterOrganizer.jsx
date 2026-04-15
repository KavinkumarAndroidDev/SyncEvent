import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError } from '../features/auth/authSlice';
import axiosInstance from '../api/axiosInstance';
import Input from '../components/Input';
import Button from '../components/Button';

export default function RegisterOrganizer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.auth);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    organizationName: '',
    description: '',
    website: '',
    instagram: '',
    linkedin: '',
  });

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 3) errs.fullName = 'Name must be at least 3 characters';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';

    const strongPwd = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!form.password) errs.password = 'Password is required';
    else if (!strongPwd.test(form.password)) errs.password = 'Min 8 chars with uppercase, lowercase, number and special character';

    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) errs.phone = 'Phone must be 10 digits';

    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.organizationName.trim()) errs.organizationName = 'Organization name is required';
    return errs;
  };

  const handleNextStep = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const organizerPayload = {
        organizationName: form.organizationName.trim(),
      };

      if (form.description) organizerPayload.description = form.description.trim();
      if (form.website) organizerPayload.website = form.website.trim();
      if (form.instagram) organizerPayload.instagram = form.instagram.trim();
      if (form.linkedin) organizerPayload.linkedin = form.linkedin.trim();

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        ...organizerPayload,
      };

      if (form.phone) payload.phone = form.phone;
      if (form.gender) payload.gender = form.gender;

      await axiosInstance.post('/auth/register/organizer', payload);
      navigate('/login', { state: { message: 'Organizer account created! Please log in.' } });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h2 className="auth-title" style={{ marginBottom: 0 }}>Become an Organizer</h2>
            </div>
          </div>
          <p className="auth-sub">Create events and manage your audience on SyncEvent.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 99,
            background: step >= 1 ? 'var(--primary)' : 'var(--neutral-100)',
          }}/>
          <div style={{
            flex: 1, height: 4, borderRadius: 99,
            background: step >= 2 ? 'var(--primary)' : 'var(--neutral-100)',
            transition: 'background 0.3s'
          }}/>
          <span style={{ fontSize: 12, color: 'var(--neutral-400)', marginLeft: 4 }}>Step {step}/2</span>
        </div>

        {(apiError || error) && (
          <div className="form-error-banner">{apiError || error}</div>
        )}

        {step === 1 && (
          <div className="auth-form">
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
                placeholder="you@company.com"
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

            <Button type="button" onClick={handleNextStep}>
              Continue to Organization Details
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--neutral-400)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>

            <Input
              label="Organization Name *"
              name="organizationName"
              placeholder="Acme Events Pvt Ltd"
              value={form.organizationName}
              onChange={handleChange}
              error={errors.organizationName}
            />

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                name="description"
                className="form-input"
                rows={3}
                placeholder="Tell attendees what your organization is about..."
                value={form.description}
                onChange={handleChange}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="form-row">
              <Input
                label="Website"
                name="website"
                placeholder="https://yourwebsite.com"
                value={form.website}
                onChange={handleChange}
              />
              <Input
                label="Instagram Handle"
                name="instagram"
                placeholder="@yourhandle"
                value={form.instagram}
                onChange={handleChange}
              />
            </div>

            <Input
              label="LinkedIn URL"
              name="linkedin"
              placeholder="https://linkedin.com/company/your-org"
              value={form.linkedin}
              onChange={handleChange}
            />

            <Button type="submit" loading={loading}>
              Create Organizer Account
            </Button>
          </form>
        )}

        <>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
          <p className="auth-switch" style={{ marginTop: 4 }}>
            Registering as an attendee? <Link to="/register">Sign up here</Link>
          </p>
        </>
      </div>
    </div>
  );
}
