import { Staff } from './types';

/**
 * Permission catalogue. Each key is stored in `staff.permissions[]`.
 * Grouped only for display on the Users screen.
 */
export const PERMISSION_GROUPS: { group: string; items: { key: string; label: string }[] }[] = [
  {
    group: 'Overview',
    items: [{ key: 'dashboard', label: 'Dashboard' }],
  },
  {
    group: 'Events',
    items: [
      { key: 'venues', label: 'Venues' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'booking_calendar', label: 'Booking Calendar' },
      { key: 'quotations', label: 'Quotations' },
      { key: 'invoices', label: 'Invoices' },
    ],
  },
  {
    group: 'Accounts',
    items: [
      { key: 'chart_of_accounts', label: 'Chart Of Accounts' },
      { key: 'journal_entries', label: 'Journal Entries' },
      { key: 'trial_balance', label: 'Trial Balance' },
      { key: 'detailed_trial_balance', label: 'Detailed Trial Balance' },
      { key: 'ledgers', label: 'Ledgers' },
    ],
  },
  {
    group: 'Finance Vouchers',
    items: [
      { key: 'payment_voucher', label: 'Payment Voucher' },
      { key: 'receipt_voucher', label: 'Receipt Voucher' },
      { key: 'journal_voucher', label: 'Journal Voucher' },
      { key: 'contra_voucher', label: 'Contra Voucher' },
    ],
  },
  {
    group: 'Financial Reports',
    items: [
      { key: 'profit_and_loss', label: 'Profit & Loss' },
      { key: 'balance_sheet', label: 'Balance Sheet' },
      { key: 'cash_flow', label: 'Cash Flow' },
      { key: 'event_profitability', label: 'Event Profitability' },
      { key: 'aging_report', label: 'Aging Report' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { key: 'inventory_items', label: 'Inventory Items' },
      { key: 'stock_in', label: 'Stock In' },
      { key: 'stock_out', label: 'Stock Out' },
      { key: 'stock_report', label: 'Stock Report' },
    ],
  },
  {
    group: 'Staff & Payroll',
    items: [
      { key: 'staff_directory', label: 'Staff Directory' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'payroll_runs', label: 'Payroll Runs' },
      { key: 'salary_slips', label: 'Salary Slips' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { key: 'users', label: 'Users' },
      { key: 'roles', label: 'Roles' },
      { key: 'company_settings', label: 'Company Settings' },
      { key: 'audit_log', label: 'Audit Log' },
    ],
  },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.label]))
);

/** Built-in roles and the permissions they grant. */
export const ROLE_PRESETS: Record<string, { label: string; permissions: string[] }> = {
  admin: { label: 'Admin', permissions: ALL_PERMISSIONS },
  manager: {
    label: 'Manager',
    permissions: [
      'dashboard', 'venues', 'bookings', 'booking_calendar', 'quotations', 'invoices',
      'event_profitability', 'aging_report', 'staff_directory', 'attendance',
    ],
  },
  booker: {
    label: 'Booker',
    permissions: ['bookings', 'booking_calendar', 'quotations'],
  },
  accountant: {
    label: 'Accountant',
    permissions: [
      'dashboard', 'invoices', 'chart_of_accounts', 'journal_entries', 'trial_balance',
      'detailed_trial_balance', 'ledgers', 'payment_voucher', 'receipt_voucher',
      'journal_voucher', 'contra_voucher', 'profit_and_loss', 'balance_sheet', 'cash_flow',
      'event_profitability', 'aging_report',
    ],
  },
};

export function permissionsForRole(role: string): string[] {
  return ROLE_PRESETS[role]?.permissions ?? [];
}

export function effectivePermissions(staff: Staff | null): string[] {
  if (!staff) return [];
  if (staff.role === 'admin') return ALL_PERMISSIONS;
  // Explicit grants win; otherwise fall back to the role preset.
  return staff.permissions.length > 0 ? staff.permissions : permissionsForRole(staff.role);
}

export function can(staff: Staff | null, permission: string): boolean {
  if (!staff || !staff.is_active) return false;
  if (staff.role === 'admin') return true;
  return effectivePermissions(staff).includes(permission);
}
