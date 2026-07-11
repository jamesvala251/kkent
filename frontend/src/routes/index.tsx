import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/landing/LandingPage';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Dashboard from '../pages/Dashboard';
import CustomerList from '../pages/customers/CustomerList';
import CustomerForm from '../pages/customers/CustomerForm';
import DriverList from '../pages/drivers/DriverList';
import DriverForm from '../pages/drivers/DriverForm';
import TruckList from '../pages/trucks/TruckList';
import TruckForm from '../pages/trucks/TruckForm';
import HitachiManagement from '../pages/hitachi/HitachiManagement';
import HitachiForm from '../pages/hitachi/HitachiForm';
import TripList from '../pages/trips/TripList';
import TripForm from '../pages/trips/TripForm';
import ExpenseList from '../pages/expenses/ExpenseList';
import ExpenseForm from '../pages/expenses/ExpenseForm';
import DieselManagement from '../pages/diesel/DieselManagement';
import SalaryList from '../pages/salary/SalaryList';
import SalaryForm from '../pages/salary/SalaryForm';
import InvoiceList from '../pages/invoices/InvoiceList';
import InvoiceForm from '../pages/invoices/InvoiceForm';
import Reports from '../pages/reports/Reports';
import RoleList from '../pages/roles/RoleList';
import RoleForm from '../pages/roles/RoleForm';
import Settings from '../pages/settings/Settings';
import Profile from '../pages/profile/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return children;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/auth/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="drivers" element={<DriverList />} />
        <Route path="drivers/new" element={<DriverForm />} />
        <Route path="drivers/:id/edit" element={<DriverForm />} />
        <Route path="trucks" element={<TruckList />} />
        <Route path="trucks/new" element={<TruckForm />} />
        <Route path="trucks/:id/edit" element={<TruckForm />} />
        <Route path="hitachi" element={<HitachiManagement />} />
        <Route path="hitachi/new" element={<HitachiForm />} />
        <Route path="hitachi/:id/edit" element={<HitachiForm />} />
        <Route path="trips" element={<TripList />} />
        <Route path="trips/new" element={<TripForm />} />
        <Route path="trips/:id/edit" element={<TripForm />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="expenses/new" element={<ExpenseForm />} />
        <Route path="expenses/:id/edit" element={<ExpenseForm />} />
        <Route path="diesel" element={<DieselManagement />} />
        <Route path="salary" element={<SalaryList />} />
        <Route path="salary/new" element={<SalaryForm />} />
        <Route path="salary/:id/edit" element={<SalaryForm />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="reports" element={<Reports />} />
        <Route path="roles" element={<RoleList />} />
        <Route path="roles/new" element={<RoleForm />} />
        <Route path="roles/:id/edit" element={<RoleForm />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
