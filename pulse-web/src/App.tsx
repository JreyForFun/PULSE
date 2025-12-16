import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResidentList = lazy(() => import('./pages/ResidentList'));
const ResidentProfile = lazy(() => import('./pages/ResidentProfile'));
const AddResident = lazy(() => import('./pages/AddResident'));
const LogVisit = lazy(() => import('./pages/LogVisit'));
const VisitHistory = lazy(() => import('./pages/VisitHistory'));
const Visits = lazy(() => import('./pages/Visits'));
const Reports = lazy(() => import('./pages/Reports'));
const RiskPrioritization = lazy(() => import('./pages/RiskPrioritization'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="residents" element={<ResidentList />} />
                <Route path="residents/add" element={<AddResident />} />
                <Route path="residents/edit/:id" element={<AddResident />} />
                <Route path="residents/:id" element={<ResidentProfile />} />
                <Route path="residents/:id/history" element={<VisitHistory />} />
                <Route path="residents/:id/visit" element={<LogVisit />} />
                <Route path="risk-prioritization" element={<RiskPrioritization />} />
                <Route path="visits" element={<Visits />} />
                <Route path="reports" element={<Reports />} />

                <Route element={<AdminRoute />}>
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
