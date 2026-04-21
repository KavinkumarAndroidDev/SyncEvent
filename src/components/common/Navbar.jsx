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

  const handleLogoutConfirm = () => {
    dispatch(logout());
    setShowModal(false);
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
          <Link to="/" className="brand-logo">
            <img src="/logo.svg" className="brand-icon" alt="logo" />
          </Link>

          <nav className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
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
        </div>
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
