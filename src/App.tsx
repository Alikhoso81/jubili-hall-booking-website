import { Routes, Route, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from './lib/auth';
import { WorkspaceProvider } from './lib/workspace';
import { Spinner, Button } from './components/ui';
import AppShell from './components/layout/AppShell';
import RequirePermission from './components/RequirePermission';
import Login from './pages/Login';
import DashboardPage from './pages/dashboard/DashboardPage';
import VenuesPage from './pages/events/VenuesPage';
import BookingCalendarPage from './pages/events/BookingCalendarPage';
import BookingsPage from './pages/events/BookingsPage';
import NewBookingPage from './pages/events/NewBookingPage';
import BookingDetailPage from './pages/events/BookingDetailPage';
import InvoicePage from './pages/events/InvoicePage';
import InvoicesPage from './pages/events/InvoicesPage';
import CompanySettingsPage from './pages/settings/CompanySettingsPage';
import UsersPage from './pages/settings/UsersPage';
import RolesPage from './pages/settings/RolesPage';
import HelpPage from './pages/HelpPage';
import ComingSoon from './pages/ComingSoon';

function Protected({ perm, children }: { perm: string; children: JSX.Element }) {
  return <RequirePermission perm={perm}>{children}</RequirePermission>;
}

export default function App() {
  const { user, staff, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1b0f] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (staff && !staff.is_active) {
    return (
      <div className="min-h-screen bg-[#0d1b0f] flex items-center justify-center px-4 text-center">
        <div className="max-w-sm">
          <h1 className="text-white text-xl font-bold mb-2">Account deactivated</h1>
          <p className="text-white/50 text-sm mb-6">
            Your access has been switched off. Contact an administrator if you think this is a mistake.
          </p>
          <Button variant="secondary" onClick={() => void signOut()}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Protected perm="dashboard"><DashboardPage /></Protected>} />

          <Route path="calendar" element={<Protected perm="booking_calendar"><BookingCalendarPage /></Protected>} />
          <Route path="venues" element={<Protected perm="venues"><VenuesPage /></Protected>} />
          <Route path="bookings" element={<Protected perm="bookings"><BookingsPage /></Protected>} />
          <Route path="bookings/new" element={<Protected perm="bookings"><NewBookingPage /></Protected>} />
          <Route path="bookings/:id" element={<Protected perm="bookings"><BookingDetailPage /></Protected>} />
          <Route path="bookings/:id/invoice" element={<Protected perm="invoices"><InvoicePage /></Protected>} />
          <Route path="invoices" element={<Protected perm="invoices"><InvoicesPage /></Protected>} />
          <Route path="quotations" element={<Protected perm="quotations"><ComingSoon eyebrow="Events" title="Quotations" /></Protected>} />

          <Route path="accounts/chart" element={<Protected perm="chart_of_accounts"><ComingSoon eyebrow="Accounts" title="Chart Of Accounts" /></Protected>} />
          <Route path="accounts/journal" element={<Protected perm="journal_entries"><ComingSoon eyebrow="Accounts" title="Journal Entries" /></Protected>} />
          <Route path="accounts/trial-balance" element={<Protected perm="trial_balance"><ComingSoon eyebrow="Accounts" title="Trial Balance" /></Protected>} />
          <Route path="accounts/ledgers" element={<Protected perm="ledgers"><ComingSoon eyebrow="Accounts" title="Ledgers" /></Protected>} />

          <Route path="inventory/items" element={<Protected perm="inventory_items"><ComingSoon eyebrow="Inventory" title="Inventory Items" /></Protected>} />
          <Route path="inventory/stock-in" element={<Protected perm="stock_in"><ComingSoon eyebrow="Inventory" title="Stock In" /></Protected>} />
          <Route path="inventory/stock-out" element={<Protected perm="stock_out"><ComingSoon eyebrow="Inventory" title="Stock Out" /></Protected>} />
          <Route path="inventory/report" element={<Protected perm="stock_report"><ComingSoon eyebrow="Inventory" title="Stock Report" /></Protected>} />

          <Route path="vouchers/payment" element={<Protected perm="payment_voucher"><ComingSoon eyebrow="Finance Vouchers" title="Payment Voucher" /></Protected>} />
          <Route path="vouchers/receipt" element={<Protected perm="receipt_voucher"><ComingSoon eyebrow="Finance Vouchers" title="Receipt Voucher" /></Protected>} />
          <Route path="vouchers/journal" element={<Protected perm="journal_voucher"><ComingSoon eyebrow="Finance Vouchers" title="Journal Voucher" /></Protected>} />
          <Route path="vouchers/contra" element={<Protected perm="contra_voucher"><ComingSoon eyebrow="Finance Vouchers" title="Contra Voucher" /></Protected>} />

          <Route path="reports/pnl" element={<Protected perm="profit_and_loss"><ComingSoon eyebrow="Financial Reports" title="Profit & Loss" /></Protected>} />
          <Route path="reports/balance-sheet" element={<Protected perm="balance_sheet"><ComingSoon eyebrow="Financial Reports" title="Balance Sheet" /></Protected>} />
          <Route path="reports/cash-flow" element={<Protected perm="cash_flow"><ComingSoon eyebrow="Financial Reports" title="Cash Flow" /></Protected>} />
          <Route path="reports/event-profitability" element={<Protected perm="event_profitability"><ComingSoon eyebrow="Financial Reports" title="Event Profitability" /></Protected>} />
          <Route path="reports/aging" element={<Protected perm="aging_report"><ComingSoon eyebrow="Financial Reports" title="Aging Report" /></Protected>} />

          <Route path="staff/directory" element={<Protected perm="staff_directory"><ComingSoon eyebrow="Staff & Payroll" title="Staff Directory" /></Protected>} />
          <Route path="staff/attendance" element={<Protected perm="attendance"><ComingSoon eyebrow="Staff & Payroll" title="Attendance" /></Protected>} />
          <Route path="staff/payroll" element={<Protected perm="payroll_runs"><ComingSoon eyebrow="Staff & Payroll" title="Payroll Runs" /></Protected>} />
          <Route path="staff/salary-slips" element={<Protected perm="salary_slips"><ComingSoon eyebrow="Staff & Payroll" title="Salary Slips" /></Protected>} />

          <Route path="settings" element={<Protected perm="company_settings"><CompanySettingsPage /></Protected>} />
          <Route path="settings/users" element={<Protected perm="users"><UsersPage /></Protected>} />
          <Route path="settings/roles" element={<Protected perm="roles"><RolesPage /></Protected>} />

          <Route path="help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  );
}
