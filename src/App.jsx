import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { ROLES, ROUTES } from './utils/constants';

import Home from './pages/Home';
import DoctorsPage from './pages/DoctorsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderSetup from './pages/provider/ProviderSetup';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Patient — nested routing handled inside PatientDashboard */}
          <Route path="/patient/*" element={
            <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
              <PatientDashboard />
            </ProtectedRoute>
          }/>

          {/* Provider setup — must be before /provider/* wildcard */}
          <Route path="/provider/setup" element={
            <ProtectedRoute allowedRoles={[ROLES.PROVIDER]}>
              <ProviderSetup />
            </ProtectedRoute>
          }/>

          {/* Provider — nested routing handled inside ProviderDashboard */}
          <Route path="/provider/*" element={
            <ProtectedRoute allowedRoles={[ROLES.PROVIDER]}>
              <ProviderDashboard />
            </ProtectedRoute>
          }/>

          {/* Admin — nested routing handled inside AdminDashboard */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }/>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
