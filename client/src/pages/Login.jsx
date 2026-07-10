import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const routes = { dispatcher: '/control-room', admin: '/control-room', officer: '/officer', citizen: '/report' };
      navigate(routes[user.role] || '/report');
    }
  }, [user, navigate]);
  
  // Toggle tab state: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Shared form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration only form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('citizen');
  const [badgeNumber, setBadgeNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name}!`);
      // Redirect based on role
      const routes = { dispatcher: '/control-room', admin: '/control-room', officer: '/officer', citizen: '/report' };
      navigate(routes[user.role] || '/report');
    } catch {
      toast.error('Invalid credentials. Please try again.');
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
        role,
        phone: phone || undefined,
        badgeNumber: role === 'officer' ? badgeNumber : undefined
      };
      const user = await register(userData);
      toast.success(`Registration successful! Welcome, ${user.name}!`);
      // Redirect based on role
      const routes = { dispatcher: '/control-room', admin: '/control-room', officer: '/officer', citizen: '/report' };
      navigate(routes[user.role] || '/report');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo" style={{ background: 'transparent', boxShadow: 'none', border: '2px solid #ff9933', borderRadius: '50%', overflow: 'hidden' }}>
            <img src="/prakasam_police_badge.jpg" alt="Prakasam Police Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>DispatchIQ</h1>
          <p style={{ fontSize: '0.875rem' }}>Emergency Response & Dispatch Platform</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setPassword('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`login-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setPassword(''); // Clear password for registration
            }}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
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
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
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
                placeholder="Enter your email"
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
                placeholder="Create a password"
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
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              >
                <option value="citizen">Citizen</option>
                <option value="officer">Officer</option>
                <option value="dispatcher">Dispatcher</option>
              </select>
            </div>

            {role === 'officer' && (
              <div className="form-group">
                <label className="form-label">Badge Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your badge number"
                  value={badgeNumber}
                  onChange={e => setBadgeNumber(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register & Sign In →'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
