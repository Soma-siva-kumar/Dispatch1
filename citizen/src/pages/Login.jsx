import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone } from 'lucide-react';

export default function Login({ defaultMode = 'login' }) {
  const { user, login, register, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phone, setPhone] = useState('');

  // Already logged-in citizen → portal
  useEffect(() => {
    if (!authLoading && user?.role === 'citizen') {
      navigate('/report', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role !== 'citizen') {
        toast.error(t('login.errorDeny'));
        return;
      }
      toast.success(`${t('login.welcomeBack')}, ${loggedInUser.name}! 🙏`);
      navigate('/report');
    } catch {
      toast.error(t('login.invalidCreds'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { 
      toast.error(t('login.errorMatch')); 
      return; 
    }
    if (password.length < 6) { 
      toast.error(t('login.errorLength')); 
      return; 
    }
    setSubmitting(true);
    try {
      const registeredUser = await register({ name, email, password, role: 'citizen', phone: phone || undefined });
      toast.success(`${t('login.welcome')}, ${registeredUser.name}! ${t('login.accountCreated')} 🎉`);
      navigate('/report');
    } catch (err) {
      const msg = err?.response?.data?.message || t('login.errorRegister');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: 'rgba(6, 9, 20, 0.85)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '24px',
        padding: '0',
        backdropFilter: 'blur(32px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,153,51,0.08)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Tricolour top bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%)',
        }} />

        <div style={{ padding: '2.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 76, height: 76,
              margin: '0 auto 1rem',
              borderRadius: '50%',
              border: '2.5px solid #FF9933',
              overflow: 'hidden',
              boxShadow: '0 0 0 6px rgba(255,153,51,0.1), 0 0 30px rgba(255,153,51,0.35)',
            }}>
              <img
                src="/prakasam_police_badge.jpg"
                alt="Prakasam Police"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <h1 style={{
              fontSize: '1.65rem', fontWeight: 900,
              background: 'linear-gradient(135deg, #FF9933, #FFFFFF, #138808)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.3rem',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {t('common.citizenPortal')}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t('common.prakasamPolice')} — {t('navbar.emergencyServices')}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '14px',
            padding: '5px',
            marginBottom: '2rem',
            border: '1px solid var(--border)',
            gap: '4px',
          }}>
            {[
              { key: 'login',    label: t('navbar.signIn') },
              { key: 'register', label: t('login.registerLink') },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                style={{
                  padding: '0.65rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.25s ease',
                  background: mode === key
                    ? 'linear-gradient(135deg, #FF9933 0%, #138808 100%)'
                    : 'transparent',
                  color: mode === key ? '#fff' : 'var(--text-secondary)',
                  boxShadow: mode === key
                    ? '0 4px 16px rgba(255,153,51,0.4)'
                    : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Sign In Form ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">{t('login.email')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-saffron)', opacity: 0.7,
                  }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('login.password')}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-saffron)', opacity: 0.7,
                  }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{
                      position: 'absolute', right: '0.9rem', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 0, display: 'flex',
                    }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '999px',
                  background: submitting ? 'rgba(255,153,51,0.4)' : 'linear-gradient(135deg, #FF9933, #138808)',
                  color: '#fff',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: "'Outfit', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: submitting ? 'none' : '0 6px 24px rgba(255,153,51,0.4)',
                  transition: 'all 0.25s',
                  marginTop: '0.3rem',
                }}
              >
                {submitting ? t('login.signingIn') : (
                  <><Shield size={16} /> {t('login.signInBtn')} <ArrowRight size={16} /></>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('login.needAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--flag-saffron)', fontWeight: 700,
                    fontSize: '0.8rem', padding: 0, fontFamily: 'inherit',
                  }}
                >
                  {t('login.registerLink')}
                </button>
              </p>
            </form>
          )}

          {/* ── Register Form ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('login.fullName')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-green-l)', opacity: 0.8,
                  }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('login.fullNamePlaceholder')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                    minLength={2}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('login.email')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-green-l)', opacity: 0.8,
                  }} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.phone')}</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-green-l)', opacity: 0.8,
                  }} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder={t('login.phonePlaceholder')}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('login.password')}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-green-l)', opacity: 0.8,
                  }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{
                      position: 'absolute', right: '0.9rem', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 0, display: 'flex',
                    }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('login.confirmPassword')}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '0.9rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--flag-green-l)', opacity: 0.8,
                  }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    placeholder={t('login.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    style={{
                      position: 'absolute', right: '0.9rem', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 0, display: 'flex',
                    }}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '999px',
                  background: submitting ? 'rgba(19,136,8,0.4)' : 'linear-gradient(135deg, #138808, #FF9933)',
                  color: '#fff',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: "'Outfit', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: submitting ? 'none' : '0 6px 24px rgba(19,136,8,0.4)',
                  transition: 'all 0.25s',
                  marginTop: '0.3rem',
                }}
              >
                {submitting ? t('login.creatingAccount') : (
                  <><User size={16} /> {t('login.signUpBtn')} <ArrowRight size={16} /></>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('login.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--flag-saffron)', fontWeight: 700,
                    fontSize: '0.8rem', padding: 0, fontFamily: 'inherit',
                  }}
                >
                  {t('login.loginLink')}
                </button>
              </p>
            </form>
          )}

          {/* Demo section */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('login.quickDemoLogin')}
            </p>
            <button
              type="button"
              onClick={() => { setMode('login'); setEmail('citizen@dispatch.com'); setPassword('password123'); }}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: '12px',
                background: 'rgba(255,153,51,0.07)',
                border: '1px solid rgba(255,153,51,0.2)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontFamily: "'Outfit', inherit",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,153,51,0.13)';
                e.currentTarget.style.color = 'var(--flag-saffron)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,153,51,0.07)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span>👤</span> {t('login.useDemoAccount')}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.68rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              {t('login.demoPasswordLabel')}:{' '}
              <span style={{ fontFamily: 'monospace', color: 'var(--flag-saffron)' }}>password123</span>
            </p>
          </div>

          {/* Back to home */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link
              to="/"
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              ← {t('login.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
