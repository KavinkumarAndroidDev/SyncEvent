const KEY_PREFIX = 'syncevent-booking-draft-';

function getKey(eventId) {
  return `${KEY_PREFIX}${eventId}`;
}

export function loadBookingDraft(eventId) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(getKey(eventId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBookingDraft(eventId, data) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(getKey(eventId), JSON.stringify(data));
  } catch {
    return;
  }
}

export function clearBookingDraft(eventId) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(getKey(eventId));
  } catch {
    return;
  }
}
