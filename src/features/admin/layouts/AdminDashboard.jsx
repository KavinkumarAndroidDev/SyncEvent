import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { logoutUser as logout } from '../../auth/slices/authSlice';
import Modal from '../../../components/ui/Modal';
import { fetchAdminCounts } from '../slices/adminSlice';

const navItems = [
  {
    to: '/admin', end: true, label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    to: '/admin/users', label: 'User Management',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  {
    to: '/admin/organizer-approvals', label: 'Organizer Approvals', badgeKey: 'organizerApprovals',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  },
  {
    to: '/admin/event-approvals', label: 'Event Approvals', badgeKey: 'eventApprovals',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  },
  {
    to: '/admin/events', label: 'Events',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  },
  {
    to: '/admin/offers', label: 'Offers',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  },
  {
    to: '/admin/categories', label: 'Categories',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  },
  {
    to: '/admin/venues', label: 'Venues',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  },
  {
    to: '/admin/tickets', label: 'Tickets & Registrations',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
  },
  {
    to: '/admin/payments', label: 'Transactions & Revenue',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  },
  {
    to: '/admin/reports', label: 'Reports & Analytics',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  },

  {
    to: '/admin/notifications', label: 'Notifications', badgeKey: 'notifications',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  },
  {
    to: '/admin/profile', label: 'Profile',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  },
];

export default function AdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const { counts } = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCounts());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    setShowModal(false);
    navigate('/login');
  };

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-user-row">
          <div className="dash-user-avatar">{user?.fullName?.charAt(0)?.toUpperCase() || 'A'}</div>
          <div className="dash-user-info">
            <div className="dash-user-name">{user?.fullName || 'Admin'}</div>
            <div className="dash-user-email">{user?.email}</div>
          </div>
        </div>

        <nav className="dash-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `dash-nav-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badgeKey && counts[item.badgeKey] > 0 && <span className="dash-badge">{counts[item.badgeKey]}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <button className="dash-logout-btn" onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>

      <Modal
        isOpen={showModal}
        title="Confirm Logout"
        onClose={() => setShowModal(false)}
        actions={
          <>
            <button className="btn-table" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleLogout}>Logout</button>
          </>
        }
      >
        Are you sure you want to logout?
      </Modal>
    </div>
  );
}
