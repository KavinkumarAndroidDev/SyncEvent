import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchMetadata } from './features/metadata/metadataSlice';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages that should NOT show footer
const NO_FOOTER_PATHS = ['/booking', '/dashboard', '/admin', '/organizer'];
const NO_NAVBAR_PATHS = ['/admin','/organizer']

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchMetadata());
  }, [dispatch]);

  const showFooter = !NO_FOOTER_PATHS.some(p => location.pathname.startsWith(p));
  const showNavbar = !NO_NAVBAR_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="app-root">
      {showNavbar && <Navbar />}
      <div className="app-content">
        <Outlet />
      </div>
      {showFooter && <Footer />}
    </div>
  );
}
