import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import OfficerView from './pages/OfficerView';
import PreviousReports from './pages/PreviousReports';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
        success: { iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-card)' } },
        error: { iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-card)' } }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Officer Routes */}
        <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerView /></ProtectedRoute>} />
        <Route path="/previous-reports" element={<ProtectedRoute allowedRoles={['officer']}><PreviousReports /></ProtectedRoute>} />
        
        {/* Default Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/officer" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
