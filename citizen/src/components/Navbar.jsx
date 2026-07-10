import { useState, useEffect } from 'react';
import { Clock, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ title }) {
  const { t } = useLanguage();
  const [time, setTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="navbar"
      style={{
        background: scrolled
          ? 'rgba(6, 9, 15, 0.95)'
          : 'rgba(6, 9, 15, 0.82)',
        boxShadow: scrolled
          ? '0 2px 20px rgba(0,0,0,0.5), 0 1px 0 rgba(255,153,51,0.15)'
          : '0 1px 0 rgba(255,153,51,0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Tricolour bottom border accent */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%)',
        opacity: 0.4,
      }} />

      <div className="navbar-left">
        <Shield size={16} style={{ color: 'var(--flag-saffron)', opacity: 0.8 }} />
        <span className="page-title">{title}</span>
      </div>

      <div className="navbar-right">
        {/* Live indicator */}
        <div className="live-indicator">
          <div className="live-dot" />
          {t('common.live')}
        </div>

        {/* Clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          background: 'var(--bg-glass)',
          padding: '0.3rem 0.7rem',
          borderRadius: '999px',
          border: '1px solid var(--border)',
        }}>
          <Clock size={12} style={{ color: 'var(--flag-saffron)' }} />
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>

      </div>
    </header>
  );
}
