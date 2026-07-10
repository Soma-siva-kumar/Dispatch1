import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import ControlRoom from './pages/ControlRoom';
import Incidents from './pages/Incidents';
import Units from './pages/Units';
import Analytics from './pages/Analytics';

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
        
        {/* Dispatcher Routes */}
        <Route path="/control-room" element={<ProtectedRoute allowedRoles={['dispatcher']}><ControlRoom /></ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute allowedRoles={['dispatcher']}><Incidents /></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute allowedRoles={['dispatcher']}><Units /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['dispatcher']}><Analytics /></ProtectedRoute>} />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/control-room" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
