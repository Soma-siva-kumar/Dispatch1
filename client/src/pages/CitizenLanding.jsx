import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Phone,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Eye,
  Info,
  Clock,
  MapPin,
  HeartPulse,
  Flame,
  UserCheck
} from 'lucide-react';

const EMERGENCY_NUMBERS = [
  { service: 'Police Department', number: '100 / 112', desc: 'Law enforcement and immediate safety threats', color: 'var(--accent-blue)' },
  { service: 'Fire & Rescue', number: '101', desc: 'Active fires, hazards, and entrapments', color: 'var(--accent-orange)' },
  { service: 'Ambulance / Medical', number: '102 / 108', desc: 'Critical medical crises and health support', color: 'var(--accent-green)' },
  { service: 'Disaster Management', number: '1078', desc: 'Severe weather events and natural hazards', color: 'var(--accent-yellow)' },
];

const LOCAL_ALERTS = [
  { id: 1, title: 'Road Closure on Washington Blvd', type: 'Traffic', time: '10 mins ago', desc: 'Closed due to minor accident collision. Responders on scene.' },
  { id: 2, title: 'Extreme Rain Warning', type: 'Weather', time: '1 hr ago', desc: 'Expect local flash floods in low lying subway areas. Stay alert.' },
  { id: 3, title: 'Active Patrol Presence in Elm Dist.', type: 'Alert', time: '2 hrs ago', desc: 'Routine security patrols increased for public summer festival.' },
];

export default function CitizenLanding() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(LOCAL_ALERTS);

  const handleReportRedirect = () => {
    if (user) {
      navigate('/report');
    } else {
      navigate('/login');
    }
  };

  const handleHistoryRedirect = () => {
    if (user) {
      if (user.role === 'citizen') {
        navigate('/my-incidents');
      } else {
        navigate('/incidents');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{
      background: '#F8FAFC',
      minHeight: '100vh',
      color: '#1e293b',
      overflowX: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Background Graphic Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '500px',
        backgroundImage: 'linear-gradient(to right, rgba(0, 200, 255, 0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 200, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        maskImage: 'linear-gradient(to bottom, black, transparent)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Citizen Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        background: 'rgba(255, 255, 255, 0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 200, 255, 0.3)'
          }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#6366F1' }}>
              CITIZEN <span style={{ color: '#8B5CF6', fontWeight: 'bold' }}>PORTAL</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Dispatch IQ Public Safety</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ fontSize: '0.875rem', color: '#6366F1', fontWeight: 'bold', border: '1px solid #6366F1', padding: '0.4rem 0.8rem', borderRadius: '6px', textDecoration: 'none' }} className="nav-item">
            Command Center Entry
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#6366F1', fontWeight: 'bold' }}>
                Welcome, <strong style={{ color: '#8B5CF6' }}>{user.name}</strong>
              </span>
              <button onClick={() => logout()} className="btn btn-sm" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#ffffff', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#ffffff', border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
              Sign In / Register
            </Link>
          )}
        </div>
      </nav>

      {/* Reassuring Hero Area */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '30px',
          background: 'rgba(0, 214, 143, 0.08)',
          border: '1px solid rgba(0, 214, 143, 0.15)',
          color: 'var(--accent-green)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '2rem'
        }}>
          <UserCheck size={14} />
          <span>SECURE & ENCRYPTED CITIZEN EMERGENCY FILING</span>
        </div>

        <h1 style={{
          fontSize: '5rem',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: '1rem',
          color: '#ffffff',
          textTransform: 'uppercase',
          textAlign: 'center',
          textShadow: '0 2px 20px rgba(0, 0, 0, 0.65)'
        }}>
          SMART DISPATCH.<br />
          <span style={{
            background: 'linear-gradient(90deg, var(--flag-saffron) 0%, #ffffff 50%, var(--flag-green) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block'
          }}>
            STRONGER COMMUNITIES.
          </span>
        </h1>

        <div style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#cbd5e1',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '1.75rem',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
        }}>
          AI Powered • Real-Time • Intelligent Dispatch
        </div>

        {/* Hero Quote (Premium Indian Tricolor Gradient) */}
        <div className="hero-quote-container">
          <div className="hero-quote">
            We Listen. We Respond. We Protect.
          </div>
        </div>

        <p style={{
          fontSize: '1.15rem',
          maxWidth: '780px',
          margin: '0 auto 2.75rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          fontWeight: 500,
          textAlign: 'center',
          textShadow: '0 1px 6px rgba(0, 0, 0, 0.3)'
        }}>
          Directly alert municipal dispatchers, upload incident descriptions, share GPS locations, and receive live progress updates. Let's make our neighborhoods safer.
        </p>

        {/* Primary Citizen Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '750px',
          margin: '0 auto 4rem'
        }}>
          {/* File Report Card */}
          <div onClick={handleReportRedirect} className="card" style={{
            cursor: 'pointer',
            textAlign: 'left',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            transition: 'var(--transition)'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 214, 143, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <AlertTriangle size={24} color="var(--accent-green)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              File Incident Report <ArrowRight size={18} />
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Instantly create a new medical, traffic, or hazard incident. Shares location directly with control room.
            </p>
          </div>

          {/* Track History Card */}
          <div onClick={handleHistoryRedirect} className="card" style={{
            cursor: 'pointer',
            textAlign: 'left',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            transition: 'var(--transition)'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(67, 97, 238, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <FileSpreadsheet size={24} color="var(--accent-blue)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Track My Reports <ArrowRight size={18} />
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Check status of reports submitted by you. Review dispatch timelines and notes left by officers.
            </p>
          </div>
        </div>
      </header>

      {/* Section 2: Local Alerts & Helpline Numbers */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 4rem',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3rem'
      }}>
        {/* Left Side: Local Safety Bulletins */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Clock size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Local Safety Alerts</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map(alert => (
              <div key={alert.id} className="card" style={{
                background: 'rgba(15, 22, 36, 0.6)',
                padding: '1.25rem',
                borderLeft: '4px solid var(--accent-cyan)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{alert.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alert.time}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {alert.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Emergency Numbers Directory */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Phone size={20} color="var(--accent-red)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Emergency Dial Hotline</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {EMERGENCY_NUMBERS.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                background: 'rgba(15, 22, 36, 0.4)',
                border: '1px solid var(--border)',
                borderRadius: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.service}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: item.color,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontFamily: 'monospace'
                }}>
                  {item.number}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Resource Guidelines */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 5rem',
        padding: '0 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Incident Safety Guidelines</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Immediate actions to take while waiting for emergency responders to arrive.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Medical emergency guideline */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 214, 143, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <HeartPulse size={18} color="var(--accent-green)" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Medical Emergency</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Check for responsiveness and breathing. Apply pressure to wounds, keep the victim warm, and do not move them unless they are in immediate danger.
            </p>
          </div>

          {/* Fire guideline */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 140, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Flame size={18} color="var(--accent-orange)" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fire Outbreak</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Evacuate immediately. Stay low to avoid smoke inhalation. Close doors behind you to restrict oxygen flow to fires. Never use elevators.
            </p>
          </div>

          {/* Safe reporting info */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 200, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Info size={18} color="var(--accent-cyan)" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Filing Reports Safely</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Provide exact landmarks, vehicle color descriptions, or suspect wear. Only take photos or videos if it is entirely safe to do so.
            </p>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 6rem',
        padding: '0 2rem'
      }}>
        <div style={{
          background: 'rgba(15, 22, 36, 0.4)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <ShieldAlert size={48} color="var(--accent-green)" />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Citizen Privacy & Encryption Guarantee</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            All reports submitted via Dispatch IQ are fully end-to-end encrypted before they reach municipal servers. Citizens can choose to submit anonymous reports without revealing identity details.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(8, 12, 20, 0.95)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '3rem 2rem',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        textAlign: 'center'
      }}>
        <p>&copy; {new Date().getFullYear()} Dispatch IQ Citizens Safety Network. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          If you are in immediate life-threatening danger, always dial 100 or 112 directly.
        </p>
      </footer>
    </div>
  );
}
