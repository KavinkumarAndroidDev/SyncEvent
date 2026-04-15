import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../features/events/eventsSlice';
import EventCard from '../components/EventCard';

const trendingCategories = [
  { name: 'Music', bg: '#dbeafe', fg: '#1d4ed8', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { name: 'Workshops', bg: '#fef3c7', fg: '#92400e', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { name: 'Sports', bg: '#d1fae5', fg: '#065f46', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg> },
  { name: 'Food & Drinks', bg: '#fce7f3', fg: '#be185d', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
];

export default function Home() {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.events);
  const { categories } = useSelector((s) => s.metadata);

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
            Find & Book <span className="hero-accent">Amazing Events</span> Near You
          </h1>
          <p className="hero-sub">Music, workshops, sports, food and more — all in one place.</p>
          <div className="hero-actions">
            <Link to="/events" className="btn-hero">Explore Events</Link>
            <Link to="/register" className="btn-hero-outline">Become an Organizer</Link>
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
            <h2 className="section-title">Trending Categories</h2>
            <Link to="/events" className="see-all-link">See all</Link>
          </div>
          <div className="categories-grid">
            {trendingCategories.map((cat) => {
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

      <section className="cta-strip">
        <div className="cta-inner">
          <div className="cta-left">
            <div className="cta-title">List your Show</div>
            <p className="cta-sub">Got a show, event, or activity? Partner with us & get listed on SyncEvent.</p>
          </div>
          <Link to="/register" className="cta-btn">Register now</Link>
        </div>
      </section>
    </main>
  );
}