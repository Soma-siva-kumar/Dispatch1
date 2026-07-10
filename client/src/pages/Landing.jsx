import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Activity,
  MapPin,
  Users,
  BarChart3,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  Radio,
  Clock,
  CheckCircle2,
  Bell
} from 'lucide-react';

const SIMULATED_FEED = [
  { id: '1092', type: 'Medical Emergency', priority: 'P1', location: '415 Main St', status: 'En Route', time: 'Just now' },
  { id: '1091', type: 'Structure Fire', priority: 'P1', location: '829 Industrial Pkwy', status: 'Arrived', time: '2m ago' },
  { id: '1090', type: 'Traffic Collision', priority: 'P2', location: 'I-95 South Exit 4', status: 'Dispatched', time: '5m ago' },
  { id: '1089', type: 'Suspicious Activity', priority: 'P3', location: '102 Pine Rd', status: 'Pending', time: '12m ago' },
  { id: '1088', type: 'Water Leak / Hazard', priority: 'P4', location: 'Commerce St & 5th Ave', status: 'Resolved', time: '25m ago' },
];

const INCIDENT_TYPES = [
  'Assault / Battery', 'Structure Fire', 'Vehicle Accident', 'Medical Emergency', 'Active Alarm', 'Trespassing'
];
const STREETS = [
  'Broadway', 'Elm St', 'Oak Ave', 'Pine Rd', 'Maple Ave', 'Washington Blvd', 'Cherry Lane', 'Cedar St'
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState(SIMULATED_FEED);
  const [activeTab, setActiveTab] = useState('dispatchers');

  // Simulated real-time incoming dispatches on landing page
  useEffect(() => {
    const interval = setInterval(() => {
      const randomType = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
      const randomStreet = STREETS[Math.floor(Math.random() * STREETS.length)];
      const randomNumber = Math.floor(Math.random() * 900) + 100;
      const randomPriority = ['P1', 'P2', 'P3', 'P4'][Math.floor(Math.random() * 4)];
      const statuses = ['Pending', 'Dispatched', 'En Route'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const newId = (Math.floor(Math.random() * 9000) + 1000).toString();

      const newIncident = {
        id: newId,
        type: randomType,
        priority: randomPriority,
        location: `${randomNumber} ${randomStreet}`,
        status: randomStatus,
        time: 'Just now'
      };

      setFeed(prev => {
        // Shift times of old incidents
        const updatedPrev = prev.map((item, idx) => ({
          ...item,
          time: idx === 0 ? '1m ago' : `${(idx + 1) * 3}m ago`
        }));
        return [newIncident, ...updatedPrev.slice(0, 4)];
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handlePortalNavigate = (role) => {
    if (user) {
      // If user is already logged in, redirect them directly
      const routes = {
        dispatcher: '/control-room',
        admin: '/control-room',
        officer: '/officer',
        citizen: '/report'
      };
      navigate(routes[user.role] || '/report');
    } else {
      // Redirect to login with intent or just login
      navigate('/login');
    }
  };

  return (
    <div style={{
      background: 'radial-gradient(ellipse at top, #0b1528, #080c14)',
      minHeight: '100vh',
      color: 'var(--text-primary)',
      overflowX: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      paddingTop: '88px'
    }}>
      {/* Dynamic Background Grid Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '600px',
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'linear-gradient(to bottom, black, transparent)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        background: 'rgba(8, 12, 20, 0.82)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-red), var(--accent-orange))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 59, 92, 0.4)'
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              DISPATCH <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>IQ</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Emergency Control</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="live-indicator" style={{ background: 'rgba(0, 214, 143, 0.08)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(0, 214, 143, 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-dot" />
            <span>HQ LIVE SERVER CONNECTED</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Authenticated as: <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
              </span>
              <button onClick={() => handlePortalNavigate(user.role)} className="btn btn-primary btn-sm">
                Go to Dashboard
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Glow behind logo */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '350px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(67, 97, 238, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '30px',
          background: 'rgba(67, 97, 238, 0.08)',
          border: '1px solid rgba(67, 97, 238, 0.15)',
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.03em',
          marginBottom: '2rem',
          boxShadow: '0 0 20px rgba(67, 97, 238, 0.05)'
        }}>
          <Radio size={14} className="live-dot" style={{ animation: 'pulse-live 1.2s infinite' }} />
          <span>REAL-TIME DISPATCH & EMERGENCY COORDINATION PLATFORM</span>
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #ffffff 30%, #a2b9e7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          The Intelligent Backbone For <br />
          <span style={{ color: 'transparent', background: 'linear-gradient(135deg, var(--accent-red), var(--accent-orange))', WebkitBackgroundClip: 'text' }}>Emergency Response</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          maxWidth: '720px',
          margin: '0 auto 2.5rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7
        }}>
          Seamlessly coordinate dispatch centers, active officers, and citizens.
          Leverage real-time status intelligence, dynamic mapping, and predictive analytics to save lives and improve response latency.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => handlePortalNavigate('dispatcher')} className="btn btn-primary btn-lg" style={{ gap: '0.75rem' }}>
            <span>Launch Command Suite</span>
            <ArrowRight size={18} />
          </button>
          <Link to="/citizen" className="btn btn-ghost btn-lg" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
            Citizen Portal
          </Link>
        </div>

        {/* Live Statistics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginTop: '4.5rem',
          padding: '1.5rem',
          background: 'rgba(13, 20, 33, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
            <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Clock size={12} /> Response Target
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>&lt; 4.2 Min</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Average dispatcher-to-responder dispatch latency.</div>
          </div>

          <div style={{ textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
            <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MapPin size={12} /> Live tracking
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>100% Active</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full GPS patrol monitoring & automatic routing.</div>
          </div>

          <div style={{ textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '1rem' }}>
            <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Activity size={12} /> System Status
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>99.98%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operational uptime for live WebSocket feeds.</div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Users size={12} /> Citizen Access
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>Instant Web</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No app download required to submit emergency reports.</div>
          </div>
        </div>
      </header>

      {/* Feature & Demo Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem 5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2.5rem',
        alignItems: 'start',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Side: Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              All-In-One Response Infrastructure
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Dispatch IQ integrates disconnected response channels into a unified, secure Web-based interface.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(67, 97, 238, 0.1)',
              border: '1px solid rgba(67, 97, 238, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Shield size={20} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>Role-Based Access Terminals</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Dedicated secure views tailored specifically for emergency dispatchers, field officers, and administrators.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 200, 255, 0.1)',
              border: '1px solid rgba(0, 200, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <MapPin size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>Interactive Incident Tracking</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Live dispatch map utilizing Leaflet spatial visualization to map active incidents and dispatch route points.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 214, 143, 0.1)',
              border: '1px solid rgba(0, 214, 143, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Activity size={20} color="var(--accent-green)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>Live Websocket Feeds</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Bidirectional data sync keeps field officers, control rooms, and callers aligned in real-time.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 140, 0, 0.1)',
              border: '1px solid rgba(255, 140, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <BarChart3 size={20} color="var(--accent-orange)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>Decision Analytics</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Aggregated graphs tracking peak emergency incident types, busy hours, and average resolution times.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Mock Command Terminal */}
        <div className="card" style={{
          background: 'rgba(15, 22, 36, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          padding: 0
        }}>
          {/* Mock Console Header */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-red)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-yellow)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)' }} />
              <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                live_dispatch_feed.log
              </span>
            </div>
            <span style={{
              fontSize: '0.65rem',
              background: 'rgba(255, 59, 92, 0.1)',
              color: 'var(--accent-red)',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}>
              LIVE REPLAY
            </span>
          </div>

          {/* Console Log Area */}
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: 'JetBrains Mono, monospace', minHeight: '340px' }}>
            {feed.map((incident, idx) => (
              <div key={incident.id} style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.03)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: 1 - idx * 0.15
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <span style={{
                    color: incident.priority === 'P1' ? 'var(--p1)' : incident.priority === 'P2' ? 'var(--p2)' : 'var(--p3)',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    [{incident.priority}]
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      #{incident.id} - {incident.type}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Loc: {incident.location}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                  <span className={`badge ${
                    incident.status === 'Resolved' ? 'badge-resolved' :
                    incident.status === 'En Route' ? 'badge-en_route' :
                    incident.status === 'Dispatched' ? 'badge-dispatched' : 'badge-pending'
                  }`} style={{ fontSize: '0.6rem' }}>
                    {incident.status}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {incident.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Console footer */}
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Automatically listening to incidents on global Socket.IO channels
            </span>
          </div>
        </div>
      </section>

      {/* Gateway Portals Selector */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 5rem',
        padding: '0 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Select Your Dispatch Portal</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto' }}>
            Choose a terminal to view authorization and simulation portals for active response systems.
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: 'rgba(255,255,255,0.03)',
          padding: '0.25rem',
          borderRadius: '30px',
          width: 'max-content',
          margin: '0 auto 3rem',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {['dispatchers', 'responders', 'citizens'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '25px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dynamic Target Gateways */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {activeTab === 'dispatchers' && (
            <div className="card" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '2.5rem',
              background: 'rgba(13, 20, 33, 0.4)', borderColor: 'rgba(67, 97, 238, 0.2)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(0, 200, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  CENTRAL ROOM
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '1rem 0 0.75rem' }}>Dispatcher Command Suite</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Full control panel dashboard to review reports, edit classifications, coordinate responding officers, and follow GPS locator units.
                </p>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <li>Simultaneously monitor multiple emergency incidents</li>
                  <li>Real-time chat notification and priority assignments</li>
                  <li>Patrol vehicle allocation map view</li>
                </ul>
                <button onClick={() => handlePortalNavigate('dispatcher')} className="btn btn-primary">
                  Enter Control Room Terminal <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                  Features available
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Instant socket messaging with patrol cars</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Real-time Leaflet geo-routing overlays</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Administrative user approval controls</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'responders' && (
            <div className="card" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '2.5rem',
              background: 'rgba(13, 20, 33, 0.4)', borderColor: 'rgba(255, 59, 92, 0.2)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-red)', background: 'rgba(255, 59, 92, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  FIELD OPERATIONS
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '1rem 0 0.75rem' }}>Officer Responder View</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Dedicated interface designed for active duty responders. Review incident details, update dispatch status (En Route, Arrived, Resolved), and sync GPS updates directly back to dispatcher terminals.
                </p>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <li>Quick actions to toggle responder availability</li>
                  <li>Directions, descriptions, and priorities for assigned cases</li>
                  <li>Instant feedback socket channel triggers</li>
                </ul>
                <button onClick={() => handlePortalNavigate('officer')} className="btn btn-danger">
                  Enter Officer Portal <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                  Responders Features
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Status quick-buttons (Dispatched/Arrived)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Live dispatch assignment notification sound</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Automatic GPS mapping integrations</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'citizens' && (
            <div className="card" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '2.5rem',
              background: 'rgba(13, 20, 33, 0.4)', borderColor: 'rgba(0, 214, 143, 0.2)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(0, 214, 143, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  PUBLIC PORTAL
                </span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '1rem 0 0.75rem' }}>Citizen Portal</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  A secure portal for public reports. Allow citizens to easily file structure, medical, or security incidents online, trace case status updates, and stay notified in high-severity neighborhoods.
                </p>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  <li>Simpler reporting wizard to file an incident instantly</li>
                  <li>Check history of reported incidents and current states</li>
                  <li>Real-time updates as dispatch units respond</li>
                </ul>
                <button onClick={() => navigate('/citizen')} className="btn btn-success">
                  Enter Citizen Portal <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                  Citizen Capabilities
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Fast incident upload and image attachments</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Transparent timeline of dispatch actions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span style={{ fontSize: '0.9rem' }}>Encrypted anonymous filing safety</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(8, 12, 20, 0.95)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '4rem 2rem 3rem',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--accent-red)" />
              <span>DISPATCH IQ</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              A high-precision real-time response and emergency routing platform. Built with MongoDB, Express, React, and Node.js.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portals</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><Link to="/control-room" style={{ color: 'var(--text-secondary)' }}>Control Room</Link></li>
              <li><Link to="/officer" style={{ color: 'var(--text-secondary)' }}>Officer Terminal</Link></li>
              <li><Link to="/citizen" style={{ color: 'var(--text-secondary)' }}>Citizen Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><span style={{ color: 'var(--accent-green)' }}>● Connected</span></li>
              <li><Link to="/analytics" style={{ color: 'var(--text-secondary)' }}>System Metrics</Link></li>
              <li><span style={{ color: 'var(--text-muted)' }}>V1.2.0-stable</span></li>
            </ul>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Dispatch IQ Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Secure TLS Encrypted</span>
            <span>Real-time Socket.IO Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
