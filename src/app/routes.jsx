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
import { AuthLoader, GuestRoute, ProtectedRoute, PublicRoute } from './routeGuards';
import AttendeeDashboard from '../features/attendee/layouts/AttendeeDashboard';
import Overview from '../features/attendee/pages/Overview';
import Profile from '../features/attendee/pages/Profile';
import MyRegistrations from '../features/attendee/pages/MyRegistrations';
import PastEvents from '../features/attendee/pages/PastEvents';
import Payments from '../features/attendee/pages/Payments';
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
import AdminOffers from '../features/admin/pages/AdminOffers';
import AdminReports from '../features/admin/pages/AdminReports';
import AdminEvents from '../features/admin/pages/AdminEvents';
import OrganizerDashboard from '../features/organizer/layouts/OrganizerDashboard';
import OrganizerOverview from '../features/organizer/pages/OrganizerOverview';
import OrganizerEvents from '../features/organizer/pages/OrganizerEvents';
import OrganizerCreateEvent from '../features/organizer/pages/OrganizerCreateEvent';
import OrganizerEditEvent from '../features/organizer/pages/OrganizerEditEvent';
import OrganizerTickets from '../features/organizer/pages/OrganizerTickets';
import OrganizerRegistrations from '../features/organizer/pages/OrganizerRegistrations';
import OrganizerPayments from '../features/organizer/pages/OrganizerPayments';
import OrganizerReports from '../features/organizer/pages/OrganizerReports';
import OrganizerNotifications from '../features/organizer/pages/OrganizerNotifications';
import OrganizerReviews from '../features/organizer/pages/OrganizerReviews';
import OrganizerProfile from '../features/organizer/pages/OrganizerProfile';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <AuthLoader />,
        children: [
          {
            element: <PublicRoute />,
            children: [
              { index: true, element: <Home /> },
              { path: 'events', element: <Events /> },
              { path: 'events/:id', element: <EventDetail /> },
              { path: 'about', element: <About /> },
              { path: 'contact', element: <Contact /> },
            ]
          },
          { path: 'register/organizer', element: <RegisterOrganizer /> },
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
                  { path: 'events', element: <AdminEvents /> },
                  { path: 'offers', element: <AdminOffers /> },
                  { path: 'categories', element: <AdminCategories /> },
                  { path: 'venues', element: <AdminVenues /> },
                  { path: 'tickets', element: <AdminTicketsRegistrations /> },
                  { path: 'payments', element: <AdminPayments /> },
                  { path: 'reports', element: <AdminReports /> },
                  { path: 'notifications', element: <AdminNotifications /> },
                  { path: 'profile', element: <Profile /> },
                ],
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['ORGANIZER']} />,
            children: [
              {
                path: 'organizer',
                element: <OrganizerDashboard />,
                children: [
                  { index: true, element: <OrganizerOverview /> },
                  { path: 'events', element: <OrganizerEvents /> },
                  { path: 'create-event', element: <OrganizerCreateEvent /> },
                  { path: 'events/edit/:id', element: <OrganizerEditEvent /> },
                  { path: 'tickets', element: <OrganizerTickets /> },
                  { path: 'registrations', element: <OrganizerRegistrations /> },
                  { path: 'payments', element: <OrganizerPayments /> },
                  { path: 'reports', element: <OrganizerReports /> },
                  { path: 'notifications', element: <OrganizerNotifications /> },
                  { path: 'reviews', element: <OrganizerReviews /> },
                  { path: 'profile', element: <OrganizerProfile /> },
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
  { path: '*', element: <NotFound /> },
]);

export default router;
