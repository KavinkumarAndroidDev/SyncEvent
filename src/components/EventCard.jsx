import { Link } from 'react-router-dom';

const colors = [
  ['#dbeafe','#1d4ed8'],
  ['#fce7f3','#be185d'],
  ['#d1fae5','#065f46'],
  ['#fef3c7','#92400e'],
  ['#ede9fe','#5b21b6'],
  ['#fee2e2','#991b1b'],
  ['#e0f2fe','#0369a1'],
  ['#f0fdf4','#166534'],
];

function getColor(id) {
  const idx = (id || 0) % colors.length;
  return colors[idx];
}

export default function EventCard({ event }) {
  const date = event.startTime ? new Date(event.startTime) : null;
  const dateStr = date ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBA';
  const timeStr = date ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  const locationStr = [event.venueName, event.city].filter(Boolean).join(', ') || 'Location TBA';
  const [bg, fg] = getColor(event.id);
  const thumbnail = `https://placehold.co/600x340/${bg.replace('#','')}/${fg.replace('#','')}?text=${encodeURIComponent(event.title || 'Event')}`;
  const priceLabel = event.startingPrice == null ? '' : event.startingPrice === 0 ? 'Free' : `₹${event.startingPrice} onwards`;

  return (
    <Link to={`/events/${event.id}`} className="event-card-link">
      <div className="event-card">
        <div className="event-card-img-wrap">
          <img src={thumbnail} alt={event.title} className="event-card-img" />
          {priceLabel && <span className="event-card-badge">{priceLabel}</span>}
        </div>
        <div className="event-card-body">
          <p className="event-card-date">{dateStr}{timeStr && ` · ${timeStr}`}</p>
          <h3 className="event-card-title">{event.title}</h3>
          <p className="event-card-location">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 14s5-3.8 5-8A5 5 0 0 0 3 6c0 4.2 5 8 5 8z" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="8" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            {locationStr}
          </p>
        </div>
      </div>
    </Link>
  );
}