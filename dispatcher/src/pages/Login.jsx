import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role !== 'dispatcher') {
        logout();
        toast.error('Access Denied: Only dispatchers can log in to this portal.');
        return;
      }
      navigate('/control-room');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role !== 'dispatcher') {
        logout();
        toast.error('Access Denied: Only dispatchers can log in to this portal.');
        setLoading(false);
        return;
      }
      toast.success(`Welcome Dispatcher, ${loggedInUser.name}!`);
      navigate('/control-room');
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
        role: 'dispatcher',
        phone: phone || undefined
      };
      const loggedInUser = await register(userData);
      toast.success(`Dispatcher Registration successful! Welcome, ${loggedInUser.name}!`);
      navigate('/control-room');
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
      background: '#040814',
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
          border-color: #00c8ff !important;
          box-shadow: 0 0 8px rgba(0, 200, 255, 0.3) !important;
          outline: none !important;
        }
        .login-page .btn-primary {
          background: linear-gradient(135deg, #4361ee, #00c8ff) !important;
          border-color: #4361ee !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(67, 97, 238, 0.3) !important;
        }
        .login-page .btn-primary:hover {
          background: linear-gradient(135deg, #304ffe, #00b0ff) !important;
          box-shadow: 0 6px 18px rgba(67, 97, 238, 0.4) !important;
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
      
      {/* Dark premium overlay with deep navy tone */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(135deg, rgba(8, 12, 24, 0.93) 0%, rgba(8, 12, 20, 0.95) 60%, rgba(6, 8, 16, 0.98) 100%)',
        pointerEvents: 'none'
      }}></div>

      <div className="login-card" style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(15, 22, 38, 0.65)',
        border: '1px solid rgba(67, 97, 238, 0.25)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55), 0 0 15px rgba(67, 97, 238, 0.15)',
        backdropFilter: 'blur(16px)',
        zIndex: 3
      }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-logo" style={{ background: 'transparent', boxShadow: 'none', border: '2px solid #ff9933', borderRadius: '50%', overflow: 'hidden' }}>
            <img src="/prakasam_police_badge.jpg" alt="Prakasam Police Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Dispatcher Suite</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Emergency Communications & Dispatch</p>
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
                placeholder="dispatcher@dispatch.com"
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
                placeholder="Dispatcher Jones"
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
                placeholder="jones@dispatch.com"
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

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creating Account...' : 'Register & Sign In →'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
