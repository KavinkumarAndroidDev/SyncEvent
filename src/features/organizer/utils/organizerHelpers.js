export const EVENT_STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export function getEventStatusLabel(status) {
  if (!status) return '-';
  const rawStatus = String(status).toUpperCase();
  if (EVENT_STATUS_LABELS[rawStatus]) {
    return EVENT_STATUS_LABELS[rawStatus];
  }
  return rawStatus.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

export function getBadgeClass(status) {
  return `badge badge-${String(status || '').toLowerCase().replaceAll('_', '-')}`;
}

export function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0%';
  return `${Math.round(Number(value))}%`;
}

export function averageRating(items) {
  if (!items.length) return 0;
  const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0);
  return (total / items.length).toFixed(1);
}

export function getTicketSold(item) {
  return Math.max(0, Number(item.totalQuantity || 0) - Number(item.availableQuantity || 0));
}

export function getTicketStatusAction(status) {
  return status === 'ACTIVE' ? 'Suspend' : 'Activate';
}

export function isFutureEvent(startTime) {
  if (!startTime) return false;
  return new Date(startTime) > new Date();
}

export function isEventActive(startTime, endTime) {
  if (!startTime || !endTime) return false;
  const now = new Date();
  return now >= new Date(startTime) && now <= new Date(endTime);
}

export function canEditEvent(status) {
  const s = String(status).toUpperCase();
  return s === 'DRAFT' || s === 'PENDING_APPROVAL' || s === 'REJECTED';
}

export function canSubmitForApproval(status, startTime) {
  const s = String(status).toUpperCase();
  return (s === 'DRAFT' || s === 'REJECTED') && isFutureEvent(startTime);
}

export function canPublishEvent(status, startTime) {
  return String(status).toUpperCase() === 'APPROVED' && isFutureEvent(startTime);
}

export function canOrganizerCancelEvent(status, startTime) {
  const s = String(status).toUpperCase();
  return (s === 'DRAFT' || s === 'PENDING_APPROVAL' || s === 'APPROVED' || s === 'REJECTED') && isFutureEvent(startTime);
}

