import { Booking } from './types';

function cell(value: string | number): string {
  const s = value === null || value === undefined ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function bookingsToCsv(bookings: Booking[]): string {
  const headers = [
    'Date', 'Shift', 'Customer', 'Phone', 'Email', 'Event Type',
    'Total', 'Advance', 'Balance', 'Notes', 'Booked By', 'Created At',
  ];
  const rows = bookings.map((b) =>
    [
      b.date,
      b.shift,
      b.customer_name,
      b.customer_phone,
      b.customer_email,
      b.event_type,
      b.total_amount,
      b.advance_paid,
      b.balance_due,
      b.notes,
      b.booked_by,
      b.created_at,
    ]
      .map(cell)
      .join(',')
  );
  return [headers.map(cell).join(','), ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
