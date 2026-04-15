import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main>
      <section className="about-hero">
        <div className="about-container">
          <span className="about-badge">Our Story</span>
          <h1 className="about-title">Where Smart Event Planning Meets<br /><span className="about-accent">Seamless Execution</span></h1>
          <p className="about-sub">We built SyncEvent to simplify how events are planned, organized, and experienced. From registrations to real-time coordination, our platform helps organizers manage every detail in one place.</p>
        </div>
      </section>

      <section className="about-section bg-light">
        <div className="about-container">
          <div className="section-label">Our Mission</div>
          <h2 className="section-heading">Dual Impact, One Vision</h2>
          <p className="section-sub">Our mission is to empower organizers with powerful tools while creating smooth experiences for attendees.</p>
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-card-header">
                <div className="mission-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                </div>
                <h3 className="mission-card-title">For Organizers</h3>
              </div>
              <p className="mission-card-body">End-to-end event management that eliminates manual work and reduces complexity. Plan, manage, and scale with confidence.</p>
              <ul className="mission-list">
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Smart Event Creation & Customization</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Attendee Registration & Ticketing</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Real Time Analytics & Reporting</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Automated Notifications</li>
              </ul>
            </div>
            <div className="mission-card">
              <div className="mission-card-header">
                <div className="mission-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="mission-card-title">For Attendees</h3>
              </div>
              <p className="mission-card-body">A smooth and intuitive experience — discover, register, and engage with events effortlessly from anywhere.</p>
              <ul className="mission-list">
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Easy Online Registration</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Instant Confirmation & Digital Tickets</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Event Reminders & Updates</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Personalized Event Dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="section-label">Our Team</div>
          <h2 className="section-heading">Meet the Minds Behind SyncEvent</h2>
          <div className="team-grid">
            <div className="team-card">
              <div className="team-avatar">AM</div>
              <div className="team-name">Alex Morgan</div>
              <div className="team-role">Project Lead & System Architect</div>
              <p className="team-bio">Alex leads the overall platform architecture and ensures every feature aligns with user needs. Strong background in software systems and scalable applications.</p>
            </div>
            <div className="team-card">
              <div className="team-avatar" style={{ background: '#ec4899' }}>PS</div>
              <div className="team-name">Priya Sharma</div>
              <div className="team-role">Product Designer & Operations Strategist</div>
              <p className="team-bio">Priya designs intuitive user flows and ensures the platform stays simple yet powerful. She translates real event challenges into practical digital solutions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section bg-dark">
        <div className="about-container">
          <div className="section-label">Our Values</div>
          <h2 className="section-heading white">The Principles That Guide Us</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div className="value-title">Innovation & Efficiency</div>
              <p className="value-body">We continuously improve our platform to simplify complex event processes.</p>
            </div>
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="value-title">User First Approach</div>
              <p className="value-body">Every feature is designed with organizers and attendees in mind.</p>
            </div>
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2v4l.586-.586z"/></svg>
              </div>
              <div className="value-title">Collaboration</div>
              <p className="value-body">Successful events are built on clear communication and teamwork.</p>
            </div>
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="value-title">Reliability</div>
              <p className="value-body">Events demand precision. We focus on stability and performance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-container" style={{ textAlign: 'center' }}>
          <h2 className="section-heading">What people say about us</h2>
          <div className="testimonials-grid" style={{ marginTop: 24 }}>
            <div className="testimonial-card">
              <div className="testimonial-avatar">IC</div>
              <p className="testimonial-text">"The seamless booking experience and real-time updates made our annual summit a massive success."</p>
              <div className="testimonial-name">Isabella Chavez</div>
              <div className="testimonial-role">Graphic Designer</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">SW</div>
              <p className="testimonial-text">"As an organizer, the dashboard is a lifesaver. Real-time tracking is excellent."</p>
              <div className="testimonial-name">Sarah Williams</div>
              <div className="testimonial-role">Event Organizer</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">MB</div>
              <p className="testimonial-text">"I found amazing workshops for my team. Highly recommended for corporate events."</p>
              <div className="testimonial-name">Michael Brown</div>
              <div className="testimonial-role">HR Manager</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-strip">
        <div className="cta-inner">
          <div className="cta-left">
            <div className="cta-title">List your Show</div>
            <p className="cta-sub">Got a show, event, or activity? Partner with us & get listed on SyncEvent.</p>
          </div>
          <Link to="/register" className="cta-btn">Register now</Link>
        </div>
      </section>
    </main>
  );
}