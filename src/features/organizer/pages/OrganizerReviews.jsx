import { useState } from 'react';

const mockReviews = [
  { id: 1, eventTitle: 'React Workshop', user: 'Alice', rating: 5, comment: 'Great workshop!', date: '2023-10-01' },
  { id: 2, eventTitle: 'React Workshop', user: 'Bob', rating: 4, comment: 'Very informative.', date: '2023-10-02' },
  { id: 3, eventTitle: 'Vue Meetup', user: 'Charlie', rating: 3, comment: 'It was okay, but a bit short.', date: '2023-10-05' },
];

export default function OrganizerReviews() {
  const [reviews] = useState(mockReviews);

  return (
    <div style={{ padding: 40 }}>
      <div className="view-header">
        <h2 className="view-title">Event Reviews</h2>
        <p style={{ color: 'var(--neutral-400)', fontSize: 14, marginTop: 6 }}>View feedback from attendees for your past events.</p>
      </div>

      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Attendee</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td style={{ fontWeight: 600 }}>{review.eventTitle}</td>
                <td>{review.user}</td>
                <td style={{ color: '#eab308', fontWeight: 600 }}>{review.rating} / 5</td>
                <td style={{ color: 'var(--neutral-600)' }}>{review.comment}</td>
                <td style={{ color: 'var(--neutral-400)' }}>{review.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
