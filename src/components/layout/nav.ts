import {
  LayoutDashboard, CalendarDays, BookOpen, Boxes, ReceiptText, LineChart, Users, Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavChild {
  label: string;
  to: string;
  /** permission key required to see this item */
  perm: string;
  end?: boolean;
}

export interface NavSection {
  label: string;
  icon: LucideIcon;
  /** direct link (no children) */
  to?: string;
  perm?: string;
  end?: boolean;
  children?: NavChild[];
}

export const NAV: NavSection[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/', perm: 'dashboard', end: true },
  {
    label: 'Events',
    icon: CalendarDays,
    children: [
      { label: 'Booking Calendar', to: '/calendar', perm: 'booking_calendar' },
      { label: 'Bookings', to: '/bookings', perm: 'bookings', end: true },
      { label: 'Venues', to: '/venues', perm: 'venues' },
      { label: 'Quotations', to: '/quotations', perm: 'quotations' },
      { label: 'Invoices', to: '/invoices', perm: 'invoices' },
    ],
  },
  {
    label: 'Accounts',
    icon: BookOpen,
    children: [
      { label: 'Chart Of Accounts', to: '/accounts/chart', perm: 'chart_of_accounts' },
      { label: 'Journal Entries', to: '/accounts/journal', perm: 'journal_entries' },
      { label: 'Trial Balance', to: '/accounts/trial-balance', perm: 'trial_balance' },
      { label: 'Ledgers', to: '/accounts/ledgers', perm: 'ledgers' },
    ],
  },
  {
    label: 'Inventory',
    icon: Boxes,
    children: [
      { label: 'Inventory Items', to: '/inventory/items', perm: 'inventory_items' },
      { label: 'Stock In', to: '/inventory/stock-in', perm: 'stock_in' },
      { label: 'Stock Out', to: '/inventory/stock-out', perm: 'stock_out' },
      { label: 'Stock Report', to: '/inventory/report', perm: 'stock_report' },
    ],
  },
  {
    label: 'Finance Vouchers',
    icon: ReceiptText,
    children: [
      { label: 'Payment Voucher', to: '/vouchers/payment', perm: 'payment_voucher' },
      { label: 'Receipt Voucher', to: '/vouchers/receipt', perm: 'receipt_voucher' },
      { label: 'Journal Voucher', to: '/vouchers/journal', perm: 'journal_voucher' },
      { label: 'Contra Voucher', to: '/vouchers/contra', perm: 'contra_voucher' },
    ],
  },
  {
    label: 'Financial Reports',
    icon: LineChart,
    children: [
      { label: 'Profit & Loss', to: '/reports/pnl', perm: 'profit_and_loss' },
      { label: 'Balance Sheet', to: '/reports/balance-sheet', perm: 'balance_sheet' },
      { label: 'Cash Flow', to: '/reports/cash-flow', perm: 'cash_flow' },
      { label: 'Event Profitability', to: '/reports/event-profitability', perm: 'event_profitability' },
      { label: 'Aging Report', to: '/reports/aging', perm: 'aging_report' },
    ],
  },
  {
    label: 'Staff & Payroll',
    icon: Users,
    children: [
      { label: 'Staff Directory', to: '/staff/directory', perm: 'staff_directory' },
      { label: 'Attendance', to: '/staff/attendance', perm: 'attendance' },
      { label: 'Payroll Runs', to: '/staff/payroll', perm: 'payroll_runs' },
      { label: 'Salary Slips', to: '/staff/salary-slips', perm: 'salary_slips' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Company Settings', to: '/settings', perm: 'company_settings', end: true },
      { label: 'Users', to: '/settings/users', perm: 'users' },
      { label: 'Roles', to: '/settings/roles', perm: 'roles' },
    ],
  },
];
