import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import App from '../App';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Events from '../pages/Events';
import EventDetail from '../pages/EventDetail';
import BookingPage from '../pages/BookingPage';
import About from '../pages/About';
import Contact from '../pages/Contact';
import { fetchCurrentUser } from '../features/auth/authSlice';

// Dashboard imports
import AttendeeDashboard from '../pages/dashboard/AttendeeDashboard';
import Overview from '../pages/dashboard/views/Overview';
import Profile from '../pages/dashboard/views/Profile';
import MyRegistrations from '../pages/dashboard/views/MyRegistrations';
import PastEvents from '../pages/dashboard/views/PastEvents';
import Payments from '../pages/dashboard/views/Payments';

export function AuthLoader() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    if (token) dispatch(fetchCurrentUser());
  }, [dispatch, token]);

  return <Outlet />;
}

export function ProtectedRoute() {
  const token = useSelector((s) => s.auth.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
  const token = useSelector((s) => s.auth.token);
  return !token ? <Outlet /> : <Navigate to="/" replace />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <AuthLoader />,
        children: [
          { index: true, element: <Home /> },
          { path: 'events', element: <Events /> },
          { path: 'events/:id', element: <EventDetail /> },
          { path: 'booking/:id', element: <BookingPage /> },
          { path: 'about', element: <About /> },
          { path: 'contact', element: <Contact /> },
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: 'dashboard',
                element: <AttendeeDashboard />,
                children: [
                  { index: true, element: <Overview /> },
                  { path: 'profile', element: <Profile /> },
                  { path: 'registrations', element: <MyRegistrations /> },
                  { path: 'past-events', element: <PastEvents /> },
                  { path: 'payments', element: <Payments /> },
                ],
              },
            ],
          },
          {
            element: <GuestRoute />,
            children: [
              { path: 'login', element: <Login /> },
              { path: 'register', element: <Register /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;