import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../slices/eventsSlice';
import EventCard from '../components/EventCard';

const trendingCategories = [
  {
    name: 'Technology',
    bg: '#e0f2fe',
    fg: '#0369a1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    )
  },
  {
    name: 'Music',
    bg: '#dbeafe',
    fg: '#1d4ed8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    )
  },
  {
    name: 'Food & Drink',
    bg: '#fce7f3',
    fg: '#be185d',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    )
  },
  {
    name: 'Health & Wellness',
    bg: '#dcfce7',
    fg: '#15803d',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    )
  },
  {
    name: 'Education',
    bg: '#fef3c7',
    fg: '#92400e',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    )
  },
  {
    name: 'Business',
    bg: '#f1f5f9',
    fg: '#334155',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    )
  },
  {
    name: 'Art & Culture',
    bg: '#ede9fe',
    fg: '#7c3aed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    )
  },
  {
    name: 'Sports',
    bg: '#d1fae5',
    fg: '#065f46',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/>
      </svg>
    )
  },
];

export default function Home() {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.events);
  const { categories } = useSelector((s) => s.metadata);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchEvents({ size: 10, sort: 'startTime,asc' }));
  }, [dispatch]);

  const getCategoryId = (name) => {
    const found = categories.find(c =>
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    );
    return found ? found.id : null;
  };

  return (
    <main>
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Find &amp; Book <span className="hero-accent">Amazing Events</span> Near You
          </h1>
          <p className="hero-sub">Music, workshops, sports, food and more — all in one place.</p>
          <div className={`hero-actions ${user ? 'hero-actions-logged' : ''}`}>
            <Link to="/events" className="btn-hero">Explore Events</Link>
            {!user && <Link to="/register/organizer" className="btn-hero-outline">Become an Organizer</Link>}
          </div>
        </div>
        <div className="hero-img-wrap">
          <img src="/about_the_eif.jpg" alt="Events" className="hero-img" />
        </div>
      </section>

      <section className="section-wrap" id="events">
        <div className="section-header">
          <h2 className="section-title">Featured Events</h2>
          <Link to="/events" className="see-all-link">Show all events</Link>
        </div>
        {loading && <p className="events-status">Loading events...</p>}
        {error && (
          <div className="events-status">
            <p>Could not load events.</p>
            <button className="retry-btn" onClick={() => dispatch(fetchEvents({ size: 10, sort: 'startTime,asc' }))}>Retry</button>
          </div>
        )}
        {!loading && !error && list.length === 0 && (
          <p className="events-status">No events right now. Check back soon.</p>
        )}
        {!loading && list.length > 0 && (
          <div className="events-row">
            {list.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="categories-section">
        <div className="section-wrap" style={{ paddingTop: 32, paddingBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
            <Link to="/events" className="see-all-link">See all</Link>
          </div>
          <div className="categories-grid">
            {trendingCategories.slice(0, 4).map((cat) => {
              const catId = getCategoryId(cat.name);
              return (
                <Link
                  to={catId ? `/events?categoryId=${catId}` : '/events'}
                  key={cat.name}
                  className="category-card"
                  style={{ background: cat.bg }}
                >
                  <div className="cat-icon" style={{ background: 'rgba(0,0,0,0.07)', color: cat.fg }}>
                    {cat.icon}
                  </div>
                  <span className="category-name">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {!user && (
        <section className="cta-strip">
          <div className="cta-inner">
            <div className="cta-left">
              <div className="cta-title">List your Show</div>
              <p className="cta-sub">Got a show, event, or activity? Partner with us &amp; get listed on SyncEvent.</p>
            </div>
            <Link to="/register/organizer" className="cta-btn">Register as Organizer</Link>
          </div>
        </section>
      )}
    </main>
  );
}
