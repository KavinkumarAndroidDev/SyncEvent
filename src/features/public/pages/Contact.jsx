import { useState } from 'react';
import axiosInstance from '../../../lib/axios';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      setSending(true);
      await axiosInstance.post('/contact', form);
      setSubmitted(true);
    } catch (err) {
      setErrors({ message: err.response?.data?.message || 'Failed to send message. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <section className="contact-section">
        <div className="contact-container">
          <h1 className="contact-page-title">Contact Us</h1>
          <p className="contact-page-sub">Have questions? We are here to help.</p>

          <div className="contact-grid">
            <div className="contact-card">
              <h4 className="contact-card-title">Send us a Message</h4>
              {submitted ? (
                <div className="contact-success">
                  <div className="success-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <h4>Message Sent!</h4>
                  <p>We will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form" noValidate>
                  <div className="contact-form-row">
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input className={`form-input ${errors.name ? 'input-error' : ''}`} type="text" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} />
                      {errors.name && <span className="field-error">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className={`form-input ${errors.email ? 'input-error' : ''}`} type="email" name="email" placeholder="john@example.com" value={form.email} onChange={handleChange} />
                      {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>
                  </div>
                  <div className="contact-form-row">
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-input" type="tel" name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input className={`form-input ${errors.subject ? 'input-error' : ''}`} type="text" name="subject" placeholder="How can we help?" value={form.subject} onChange={handleChange} />
                      {errors.subject && <span className="field-error">{errors.subject}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className={`form-input contact-textarea ${errors.message ? 'input-error' : ''}`} name="message" rows={5} placeholder="Tell us about your query..." value={form.message} onChange={handleChange} />
                    {errors.message && <span className="field-error">{errors.message}</span>}
                  </div>
                  <button type="submit" className="btn-submit" disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button>
                </form>
              )}
            </div>

            <div className="contact-info-col">
              <h4 className="contact-card-title">Contact Information</h4>
              <p className="contact-info-sub">Have questions? Reach out through any of these channels.</p>
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <div className="contact-info-label">Email</div>
                    <div className="contact-info-value">hello@syncevent.io</div>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <div className="contact-info-label">Phone</div>
                    <div className="contact-info-value">+91 98765 43210</div>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <div className="contact-info-label">Location</div>
                    <div className="contact-info-value">303 RS Puram, Coimbatore, TN</div>
                  </div>
                </div>
              </div>

              <div className="office-hours-card">
                <div className="office-hours-title">Office Hours</div>
                <div className="office-hours-row"><span>Monday – Friday</span><span>9:00 AM – 6:00 PM</span></div>
                <div className="office-hours-row"><span>Saturday</span><span>10:00 AM – 4:00 PM</span></div>
                <div className="office-hours-row"><span>Sunday</span><span>Closed</span></div>
              </div>
            </div>
          </div>

          <div className="contact-map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.196397365287!2d76.95304667503774!3d11.023862289141066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba858546b1c09eb%3A0xe5eb604daac7847c!2sRS%20Puram%2C%20Coimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Office Location"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
