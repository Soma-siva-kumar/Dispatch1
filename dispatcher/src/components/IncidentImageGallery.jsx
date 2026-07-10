import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ImageOff, Camera } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   IncidentImageGallery
   Reusable gallery shown wherever an incident is displayed.
   Props:
     images   – Array of { url, publicId, uploadedAt } | string[]
     editable – boolean: show remove button (optional)
     onRemove – (publicId) => void (optional)
   ───────────────────────────────────────────────────────────── */
export default function IncidentImageGallery({ images = [], editable = false, onRemove }) {
  const [viewer, setViewer] = useState(null); // index of open image
  const [loaded, setLoaded] = useState({});   // track per-image load state

  // Normalize: accept string[] or object[]
  const normalized = images.map(img =>
    typeof img === 'string' ? { url: img, publicId: img } : img
  );

  const openViewer = (idx) => setViewer(idx);
  const closeViewer = useCallback(() => setViewer(null), []);
  const prev = useCallback(() => setViewer(i => (i - 1 + normalized.length) % normalized.length), [normalized.length]);
  const next = useCallback(() => setViewer(i => (i + 1) % normalized.length), [normalized.length]);

  // Keyboard navigation
  useEffect(() => {
    if (viewer === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewer, closeViewer, prev, next]);

  if (!normalized.length) return null;

  return (
    <>
      <style>{`
        .img-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
        @media (min-width: 768px)  { .img-gallery { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); } }
        @media (min-width: 1200px) { .img-gallery { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }

        .img-card {
          position: relative; border-radius: 12px; overflow: hidden; cursor: pointer;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          aspect-ratio: 1;
          animation: img-fade-in 0.35s ease forwards;
          opacity: 0;
        }
        .img-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 32px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.35); }
        .img-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
        .img-card:hover img { transform: scale(1.08); }

        .img-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%);
          display: flex; align-items: flex-end; justify-content: flex-end;
          padding: 0.5rem; opacity: 0; transition: opacity 0.22s;
        }
        .img-card:hover .img-card-overlay { opacity: 1; }

        .img-zoom-icon { color: white; background: rgba(0,0,0,0.5); border-radius: 50%; padding: 4px; display: flex; }

        .img-remove-btn {
          position: absolute; top: 6px; right: 6px;
          background: rgba(220,38,38,0.85); color: white;
          border: none; border-radius: 50%; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; opacity: 0; transition: opacity 0.22s;
          z-index: 2; font-size: 12px;
        }
        .img-card:hover .img-remove-btn { opacity: 1; }

        /* Fullscreen viewer */
        .img-viewer-backdrop {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.93);
          backdrop-filter: blur(18px);
          display: flex; align-items: center; justify-content: center;
          animation: img-fade-in 0.2s ease;
        }
        .img-viewer-close {
          position: absolute; top: 1.25rem; right: 1.25rem;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: white; border-radius: 50%; width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.18s; z-index: 10000;
        }
        .img-viewer-close:hover { background: rgba(255,255,255,0.2); }

        .img-viewer-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: white; border-radius: 50%; width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.18s; z-index: 10000;
        }
        .img-viewer-nav:hover { background: rgba(255,255,255,0.22); }
        .img-viewer-nav.left { left: 1.25rem; }
        .img-viewer-nav.right { right: 1.25rem; }

        .img-viewer-img {
          max-width: calc(100vw - 8rem); max-height: calc(100vh - 6rem);
          object-fit: contain; border-radius: 12px;
          box-shadow: 0 0 60px rgba(0,0,0,0.8);
          animation: img-zoom-in 0.2s ease;
        }
        .img-viewer-counter {
          position: absolute; bottom: 1.25rem; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,0.7); font-size: 0.8rem; background: rgba(0,0,0,0.4);
          padding: 0.25rem 0.8rem; border-radius: 99px; backdrop-filter: blur(8px);
        }

        .img-section-header {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-muted);
          margin-bottom: 0.75rem;
        }

        @keyframes img-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes img-zoom-in { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div>
        <div className="img-section-header">
          <Camera size={14} />
          Incident Images ({normalized.length})
        </div>

        <div className="img-gallery">
          {normalized.map((img, idx) => (
            <div
              key={img.publicId || img.url || idx}
              className="img-card"
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => openViewer(idx)}
            >
              {loaded[idx] === false ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <ImageOff size={28} />
                </div>
              ) : (
                <img
                  src={img.url}
                  alt={`Incident image ${idx + 1}`}
                  loading="lazy"
                  onLoad={() => setLoaded(p => ({ ...p, [idx]: true }))}
                  onError={() => setLoaded(p => ({ ...p, [idx]: false }))}
                />
              )}
              <div className="img-card-overlay">
                <span className="img-zoom-icon"><ZoomIn size={14} /></span>
              </div>
              {editable && onRemove && img.publicId && (
                <button
                  className="img-remove-btn"
                  title="Remove image"
                  onClick={e => { e.stopPropagation(); onRemove(img.publicId); }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Viewer */}
      {viewer !== null && (
        <div className="img-viewer-backdrop" onClick={closeViewer}>
          <button className="img-viewer-close" onClick={closeViewer} aria-label="Close"><X size={20} /></button>

          {normalized.length > 1 && (
            <>
              <button className="img-viewer-nav left" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous">
                <ChevronLeft size={22} />
              </button>
              <button className="img-viewer-nav right" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next">
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <img
            className="img-viewer-img"
            src={normalized[viewer]?.url}
            alt={`Incident image ${viewer + 1}`}
            onClick={e => e.stopPropagation()}
          />

          {normalized.length > 1 && (
            <div className="img-viewer-counter">{viewer + 1} / {normalized.length}</div>
          )}
        </div>
      )}
    </>
  );
}
