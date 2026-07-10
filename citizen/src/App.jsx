import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
// Removed FlagBackground import

// Pages
import Login from './pages/Login';
import CitizenPortal from './pages/CitizenPortal';
import MyIncidents from './pages/MyIncidents';
import CitizenLanding from './pages/CitizenLanding';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'rgba(8,12,24,0.95)', color: 'var(--text-primary)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
        success: { iconTheme: { primary: 'var(--flag-green-l)', secondary: 'var(--bg-card)' } },
        error: { iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-card)' } }
      }} />
      <Routes>
        <Route path="/" element={<CitizenLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login defaultMode="register" />} />
        
        {/* Citizen Routes */}
        <Route path="/report" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenPortal /></ProtectedRoute>} />
        <Route path="/my-incidents" element={<ProtectedRoute allowedRoles={['citizen']}><MyIncidents /></ProtectedRoute>} />
        
        {/* Unauthorized */}
        <Route path="/unauthorized" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚫</div>
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-red)' }}>Access Denied</h2>
              <p style={{ marginBottom: '1.75rem', color: 'var(--text-secondary)' }}>You don't have permission to access this page.</p>
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
