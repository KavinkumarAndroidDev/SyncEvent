import { createBrowserRouter } from 'react-router-dom';
import App from './AppLayout';
import Home from '../features/events/pages/Home';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import RegisterOrganizer from '../features/auth/pages/RegisterOrganizer';
import Events from '../features/events/pages/Events';
import EventDetail from '../features/events/pages/EventDetail';
import BookingPage from '../features/booking/pages/BookingPage';
import About from '../features/public/pages/About';
import Contact from '../features/public/pages/Contact';
import NotFound from '../features/public/pages/NotFound';
import { AuthLoader, GuestRoute, ProtectedRoute } from './routeGuards';

// Attendee Dashboard
import AttendeeDashboard from '../features/attendee/layouts/AttendeeDashboard';
import Overview from '../features/attendee/pages/Overview';
import Profile from '../features/attendee/pages/Profile';
import MyRegistrations from '../features/attendee/pages/MyRegistrations';
import PastEvents from '../features/attendee/pages/PastEvents';
import Payments from '../features/attendee/pages/Payments';

// Admin Dashboard
import AdminDashboard from '../features/admin/layouts/AdminDashboard';
import AdminOverview from '../features/admin/pages/AdminOverview';
import AdminCategories from '../features/admin/pages/AdminCategories';
import AdminVenues from '../features/admin/pages/AdminVenues';
import AdminUsers from '../features/admin/pages/AdminUsers';
import AdminOrganizerApprovals from '../features/admin/pages/AdminOrganizerApprovals';
import AdminEventApprovals from '../features/admin/pages/AdminEventApprovals';
import AdminTicketsRegistrations from '../features/admin/pages/AdminTicketsRegistrations';
import AdminPayments from '../features/admin/pages/AdminPayments';
import AdminNotifications from '../features/admin/pages/AdminNotifications';

// Organizer Dashboard
import OrganizerDashboard from '../features/organizer/layouts/OrganizerDashboard';
import OrganizerOverview from '../features/organizer/pages/OrganizerOverview';

// Placeholder
import DashboardPlaceholder from '../components/common/DashboardPlaceholder';

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
          { path: 'about', element: <About /> },
          { path: 'contact', element: <Contact /> },
          { path: 'register/organizer', element: <RegisterOrganizer /> },


          // Attendee Dashboard
          {
            element: <ProtectedRoute allowedRoles={['ATTENDEE']} />,
            children: [
              { path: 'booking/:id', element: <BookingPage /> },
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

          // Admin Dashboard
          {
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              {
                path: 'admin',
                element: <AdminDashboard />,
                children: [
                  { index: true, element: <AdminOverview /> },
                  { path: 'users', element: <AdminUsers /> },
                  { path: 'organizer-approvals', element: <AdminOrganizerApprovals /> },
                  { path: 'event-approvals', element: <AdminEventApprovals /> },
                  { path: 'events', element: <DashboardPlaceholder title="Events" /> },
                  { path: 'offers', element: <DashboardPlaceholder title="Offers" /> },
                  { path: 'categories', element: <AdminCategories /> },
                  { path: 'venues', element: <AdminVenues /> },
                  { path: 'tickets',element: <DashboardPlaceholder title="Tickets and registrations" />  },
                  { path: 'payments', element: <AdminPayments /> },
                  { path: 'reports', element: <DashboardPlaceholder title="Reports & Analytics" /> },
                  { path: 'feedback', element: <DashboardPlaceholder title="Feedback Moderation" /> },
                  { path: 'notifications', element: <AdminNotifications /> },
                  { path: 'profile', element: <DashboardPlaceholder title="Admin Profile" /> },
                ],
              },
            ],
          },

          // Organizer Dashboard
          {
            element: <ProtectedRoute allowedRoles={['ORGANIZER']} />,
            children: [
              {
                path: 'organizer',
                element: <OrganizerDashboard />,
                children: [
                  { index: true, element: <OrganizerOverview /> },
                  { path: 'events', element: <DashboardPlaceholder title="My Events" /> },
                  { path: 'create-event', element: <DashboardPlaceholder title="Create Event" /> },
                  { path: 'tickets', element: <DashboardPlaceholder title="Ticket Management" /> },
                  { path: 'registrations', element: <DashboardPlaceholder title="Registrations" /> },
                  { path: 'payments', element: <DashboardPlaceholder title="Payments" /> },
                  { path: 'reports', element: <DashboardPlaceholder title="Reports" /> },
                  { path: 'notifications', element: <DashboardPlaceholder title="Notifications" /> },
                  { path: 'profile', element: <DashboardPlaceholder title="Organizer Profile" /> },
                ],
              },
            ],
          },

          // Guest-only routes
          {
            element: <GuestRoute />,
            children: [
              { path: 'login', element: <Login /> },
              { path: 'register', element: <Register /> },
            ],
          },
          { path: '*', element: <NotFound /> }
        ],
      },
    ],
  },
]);

export default router;
