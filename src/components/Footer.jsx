import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer-main">
            <div className="footer-inner">
                <div className="footer-grid">
                    <div>
                        <Link to="/" className="brand-logo">
                            <img src="/Light logo.svg" className="brand-icon" alt="logo" />
                        </Link>
                        <p className="footer-desc">Your platform to discover, plan and book events. From concerts to workshops — all in one place.</p>
                    </div>
                    <div>
                        <div className="footer-col-title">Navigation</div>
                        <div className="footer-links">
                            <Link to="/" className="footer-link">Home</Link>
                            <Link to="/events" className="footer-link">Events</Link>
                            <Link to="/about" className="footer-link">About</Link>
                            <Link to="/contact" className="footer-link">Contact</Link>
                        </div>
                    </div>
                    <div>
                        <div className="footer-col-title">Contact</div>
                        <div className="footer-contact-item">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 14s5-3.8 5-8A5 5 0 0 0 3 6c0 4.2 5 8 5 8z" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.3" /></svg>
                            303 RS Puram, Coimbatore, TN
                        </div>
                        <div className="footer-contact-item">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.8 2.8h2.2l1.1 2.7-1.3 1.2a9 9 0 0 0 4.5 4.5l1.2-1.3 2.7 1.1v2.2A1.6 1.6 0 0 1 11.6 15 10.8 10.8 0 0 1 1 4.4 1.6 1.6 0 0 1 2.8 2.8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                            89036 73410
                        </div>
                        <div className="footer-contact-item">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.8" y="3" width="12.4" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 4l5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            contact@syncevent.io
                        </div>
                    </div>
                </div>
                <hr className="footer-divider" />
                <div className="footer-bottom">
                    <p className="footer-legal">© 2025 SyncEvent. All rights reserved.</p>
                    <div className="social-list">
                        <a className="footer-link" href="#" aria-label="Instagram">
                            <svg className="social-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="11.7" cy="4.3" r=".7" fill="currentColor" /></svg>
                        </a>
                        <a className="footer-link" href="#" aria-label="X">
                            <svg className="social-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h3.4L7.5 5l3.1-4H14l-4.8 6.1L14.5 15H11l-3.5-4.4L3.9 15H1l5-6.4L1 1z" /></svg>
                        </a>
                        <a className="footer-link" href="#" aria-label="LinkedIn">
                            <svg className="social-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 0 0 0 2h.01a1 1 0 0 0 0-2H2zm-1 4h2v9H1V5zm4 0h2v1.2C7.5 5.5 8.4 5 9.5 5 11.4 5 13 6.3 13 9v5h-2V9.2c0-1.2-.7-1.9-1.7-1.9-1.1 0-1.8.8-1.8 2V14H5V5z" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}