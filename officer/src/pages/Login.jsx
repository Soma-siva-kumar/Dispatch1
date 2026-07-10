import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role !== 'officer') {
        logout();
        toast.error('Access Denied: Only officers can log in to this portal.');
        return;
      }
      navigate('/officer');
    }
  }, [user, navigate, logout]);
  
  // Toggle tab state: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Shared form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration only form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role !== 'officer') {
        logout();
        toast.error('Access Denied: Only officers can log in to this portal.');
        setLoading(false);
        return;
      }
      toast.success(`Welcome Officer, ${loggedInUser.name}!`);
      navigate('/officer');
    } catch {
      toast.error('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = {
        name,
        email,
        password,
        role: 'officer',
        phone: phone || undefined,
        badgeNumber: badgeNumber
      };
      const loggedInUser = await register(userData);
      toast.success(`Officer Registration successful! Welcome, ${loggedInUser.name}!`);
      navigate('/officer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: '#060408',
      padding: '1.5rem',
      overflow: 'hidden'
    }}>
      <style>{`
        .login-page .form-input {
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          backdrop-filter: blur(4px);
        }
        .login-page .form-input:focus {
          border-color: #ff3b5c !important;
          box-shadow: 0 0 8px rgba(255, 59, 92, 0.3) !important;
          outline: none !important;
        }
        .login-page .btn-primary {
          background: linear-gradient(135deg, #ff3b5c, #ff8c00) !important;
          border-color: #ff3b5c !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(255, 59, 92, 0.3) !important;
        }
        .login-page .btn-primary:hover {
          background: linear-gradient(135deg, #e62e4d, #e07b00) !important;
          box-shadow: 0 6px 18px rgba(255, 59, 92, 0.4) !important;
        }
        .login-page .btn-ghost {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .login-page .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* Cinematic blurred Indian flag background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        backgroundImage: "url('/indian_flag_hero.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: 'scale(1.08)',
        filter: 'blur(7px) brightness(0.92) saturate(1.15)',
        pointerEvents: 'none'
      }}></div>
      
      {/* Dark premium overlay with deep reddish/purple tone */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(135deg, rgba(20, 8, 12, 0.94) 0%, rgba(14, 6, 10, 0.96) 60%, rgba(8, 4, 6, 0.98) 100%)',
        pointerEvents: 'none'
      }}></div>

      <div className="login-card" style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(26, 12, 18, 0.65)',
        border: '1px solid rgba(255, 59, 92, 0.25)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55), 0 0 15px rgba(255, 59, 92, 0.15)',
        backdropFilter: 'blur(16px)',
        zIndex: 3
      }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-logo" style={{ background: 'transparent', boxShadow: 'none', border: '2px solid #ff9933', borderRadius: '50%', overflow: 'hidden' }}>
            <img src="/prakasam_police_badge.jpg" alt="Prakasam Police Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Responder Terminal</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Field Officers & Incident Responders</p>
        </div>

        <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            type="button"
            className={`btn btn-full ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem' }}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn btn-full ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.4rem' }}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="officer1@dispatch.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Officer Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="smith@dispatch.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="Enter your phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Badge Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter badge number"
                value={badgeNumber}
                onChange={e => setBadgeNumber(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Registering Officer...' : 'Register & Sign In →'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
