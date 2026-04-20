import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import RegisterOrganizer from '../pages/RegisterOrganizer';
import Events from '../pages/Events';
import EventDetail from '../pages/EventDetail';
import BookingPage from '../pages/BookingPage';
import About from '../pages/About';
import Contact from '../pages/Contact';
import NotFound from '../pages/NotFound';
import { AuthLoader, GuestRoute, ProtectedRoute } from './routeGuards';

// Attendee Dashboard
import AttendeeDashboard from '../pages/dashboard/AttendeeDashboard';
import Overview from '../pages/dashboard/views/Overview';
import Profile from '../pages/dashboard/views/Profile';
import MyRegistrations from '../pages/dashboard/views/MyRegistrations';
import PastEvents from '../pages/dashboard/views/PastEvents';
import Payments from '../pages/dashboard/views/Payments';

// Admin Dashboard
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import AdminOverview from '../pages/dashboard/views/admin/AdminOverview';
import AdminCategories from '../pages/dashboard/views/admin/AdminCategories';
import AdminVenues from '../pages/dashboard/views/admin/AdminVenues';
import AdminUsers from '../pages/dashboard/views/admin/AdminUsers';
import AdminOrganizerApprovals from '../pages/dashboard/views/admin/AdminOrganizerApprovals';
import AdminEventApprovals from '../pages/dashboard/views/admin/AdminEventApprovals';
import AdminTicketsRegistrations from '../pages/dashboard/views/admin/AdminTicketsRegistrations';
import AdminPayments from '../pages/dashboard/views/admin/AdminPayments';
import AdminNotifications from '../pages/dashboard/views/admin/AdminNotifications';

// Organizer Dashboard
import OrganizerDashboard from '../pages/dashboard/OrganizerDashboard';
import OrganizerOverview from '../pages/dashboard/views/organizer/OrganizerOverview';

// Placeholder
import DashboardPlaceholder from '../pages/dashboard/views/DashboardPlaceholder';

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
                  { path: 'tickets', element: <AdminTicketsRegistrations /> },
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
