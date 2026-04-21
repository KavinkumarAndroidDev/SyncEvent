export const MAX_TICKETS_PER_BOOKING = 10;

export function buildCartFromItems(items = []) {
  return items.reduce((acc, item) => {
    acc[item.ticketId] = item.quantity;
    return acc;
  }, {});
}

export function buildParticipantRows(cart, tickets, previousRows = []) {
  const next = [];

  Object.entries(cart).forEach(([ticketId, qty]) => {
    for (let i = 0; i < qty; i += 1) {
      const previousRow = previousRows[next.length] || {};
      const ticket = tickets.find((item) => item.id === Number(ticketId));

      next.push({
        ticketId: Number(ticketId),
        ticketName: ticket?.name || 'Ticket',
        name: previousRow.ticketId === Number(ticketId) ? previousRow.name || '' : '',
        email: previousRow.ticketId === Number(ticketId) ? previousRow.email || '' : '',
        phone: previousRow.ticketId === Number(ticketId) ? previousRow.phone || '' : '',
        gender: previousRow.ticketId === Number(ticketId) ? previousRow.gender || 'OTHER' : 'OTHER',
      });
    }
  });

  return next;
}

export function validateParticipantRows(rows) {
  const incomplete = rows.some((participant) => !participant.name.trim() || !participant.email.trim() || !participant.phone.trim());
  if (incomplete) return 'Please fill in all participant details.';

  const invalidEmail = rows.some((participant) => !/\S+@\S+\.\S+/.test(participant.email.trim()));
  if (invalidEmail) return 'Please enter valid email addresses for all participants.';

  const invalidPhone = rows.some((participant) => !/^\d{10}$/.test(participant.phone.replace(/\D/g, '')));
  if (invalidPhone) return 'Please enter valid 10-digit phone numbers for all participants.';

  const emails = rows.map((participant) => participant.email.toLowerCase().trim());
  if (new Set(emails).size !== emails.length) return 'Each participant must have a unique email address.';

  return '';
}
