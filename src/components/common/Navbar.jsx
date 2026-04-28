import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser as logout } from '../../features/auth/slices/authSlice';
import Modal from '../ui/Modal';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogoutConfirm = () => {
    dispatch(logout());
    setShowModal(false);
    setMobileOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'ORGANIZER') return '/organizer';
    return '/dashboard';
  };

  return (
    <>
      <header className="navbar-root">
        <div className="navbar-inner">
          <Link to="/" className="brand-logo" onClick={() => setMobileOpen(false)}>
            <img src="/logo.svg" className="brand-icon" alt="logo" />
          </Link>

          <nav className="navbar-links">
            {(!user || user.role === 'ATTENDEE') && (
              <>
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/events" className="nav-link">Events</Link>
                <Link to="/about" className="nav-link">About</Link>
                <Link to="/contact" className="nav-link">Contact</Link>
                {user?.role === 'ATTENDEE' && <Link to="/dashboard/notifications" className="nav-link">Notifications</Link>}
              </>
            )}
          </nav>

          <div className="navbar-actions">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="nav-link">Dashboard</Link>
                <span className="user-greet">Hi, {user.fullName?.split(' ')[0]}</span>
                <button className="btn-outline-sm" onClick={() => setShowModal(true)}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/register" className="btn-primary-sm">Sign up</Link>
              </>
            )}
          </div>

          {/* Hamburger Button */}
          <button 
            className="navbar-burger" 
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {mobileOpen && (
          <div className="mobile-menu">
            <nav className="mobile-menu-links">
              {(!user || user.role === 'ATTENDEE') && (
                <>
                  <Link to="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Home</Link>
                  <Link to="/events" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Events</Link>
                  {user?.role === 'ATTENDEE' && <Link to="/dashboard/notifications" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Notifications</Link>}
                  <Link to="/about" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>About</Link>
                  <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Contact</Link>
                </>
              )}
              {user ? (
                <>
                  <Link to={getDashboardLink()} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <button className="btn-outline-sm" style={{ width: '100%', marginTop: 10 }} onClick={() => { setShowModal(true); }}>Logout</button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  <Link to="/login" className="btn-ghost" style={{ textAlign: 'center' }} onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/register" className="btn-primary-sm" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>Sign up</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <Modal
        isOpen={showModal}
        title="Confirm Logout"
        onClose={() => setShowModal(false)}
        actions={
          <>
            <button className="btn-table" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleLogoutConfirm}>Logout</button>
          </>
        }
      >
        Are you sure you want to logout?
      </Modal>
    </>
  );
}
