import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import ResourcePage from './pages/ResourcePage.jsx';
import LicenseActivation from './components/Licenseactivation.jsx';
import LiveTracking from './pages/LiveTracking.jsx';
import "./App.css"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="resources/:resourceKey" element={<ResourcePage />} />
              <Route path="live-tracking" element={<LiveTracking />} />
              <Route path="license-activation" element={<LicenseActivation />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}