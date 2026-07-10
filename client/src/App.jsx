import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import ControlRoom from './pages/ControlRoom';
import CitizenPortal from './pages/CitizenPortal';
import OfficerView from './pages/OfficerView';
import Analytics from './pages/Analytics';
import Incidents from './pages/Incidents';
import Units from './pages/Units';
import MyIncidents from './pages/MyIncidents';
import Users from './pages/Users';
import Landing from './pages/Landing';
import CitizenLanding from './pages/CitizenLanding';

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
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Citizen Routes */}
        <Route path="/citizen" element={<CitizenLanding />} />
        <Route path="/report" element={<ProtectedRoute allowedRoles={['citizen', 'dispatcher', 'admin']}><CitizenPortal /></ProtectedRoute>} />
        <Route path="/my-incidents" element={<ProtectedRoute allowedRoles={['citizen']}><MyIncidents /></ProtectedRoute>} />
        
        {/* Dispatcher/Admin Routes */}
        <Route path="/control-room" element={<ProtectedRoute allowedRoles={['dispatcher', 'admin']}><ControlRoom /></ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute allowedRoles={['dispatcher', 'admin', 'officer']}><Incidents /></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute allowedRoles={['dispatcher', 'admin']}><Units /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['dispatcher', 'admin']}><Analytics /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
        
        {/* Officer Routes */}
        <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerView /></ProtectedRoute>} />
        
        {/* Unauthorized */}
        <Route path="/unauthorized" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
            <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-red)' }}>Access Denied</h2>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>You don't have permission to access this page.</p>
              <button className="btn btn-primary" onClick={() => window.history.back()}>← Go Back</button>
            </div>
          </div>
        } />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
