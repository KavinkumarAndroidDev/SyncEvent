import { Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchCurrentUser } from '../features/auth/slices/authSlice';

export function AuthLoader() {
  const dispatch = useDispatch();
  const { token, initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !initialized) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, initialized, token]);

  return <Outlet />;
}

export function ProtectedRoute({ allowedRoles } = {}) {
  const { token, user, initialized } = useSelector((s) => s.auth);

  if (!token) return <Navigate to="/login" replace />;
  if (!initialized) return <div className="detail-status">Checking session...</div>;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles?.includes('ORGANIZER') && user?.role === 'ORGANIZER' && user?.verified === false) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { token, user, initialized } = useSelector((s) => s.auth);

  if (!token) return <Outlet />;
  if (!initialized) return <div className="detail-status">Checking session...</div>;

  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'ORGANIZER') {
    if (user?.verified === false) return <Outlet />;
    return <Navigate to="/organizer" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
