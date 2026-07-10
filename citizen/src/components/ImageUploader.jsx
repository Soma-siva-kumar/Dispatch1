import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/* ─────────────────────────────────────────────────────────────
   ImageUploader — Citizen portal only
   Props:
     files    – FileWithPreview[] state (managed by parent)
     onChange – (files: FileWithPreview[]) => void
     disabled – boolean
   ───────────────────────────────────────────────────────────── */
export default function ImageUploader({ files = [], onChange, disabled = false }) {
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  const validateAndAdd = useCallback((rawFiles) => {
    const newErrors = [];
    const incoming = Array.from(rawFiles);
    const valid = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}" is not a supported format (JPEG, PNG, WEBP only).`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        newErrors.push(`"${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      if (files.length + valid.length >= MAX_FILES) {
        newErrors.push(`Maximum ${MAX_FILES} images allowed.`);
        break;
      }
      valid.push({ file, preview: URL.createObjectURL(file), id: `${Date.now()}-${Math.random()}` });
    }

    setErrors(newErrors);
    if (valid.length > 0) onChange([...files, ...valid]);
  }, [files, onChange]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) validateAndAdd(e.dataTransfer.files);
  };

  const handleInput = (e) => {
    if (!disabled) validateAndAdd(e.target.files);
    e.target.value = '';
  };

  const remove = (id) => {
    const item = files.find(f => f.id === id);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    onChange(files.filter(f => f.id !== id));
  };

  return (
    <div>
      <style>{`
        .img-uploader-zone {
          border: 2px dashed rgba(255,255,255,0.22);
          border-radius: 14px;
          padding: 1.5rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.22s, background 0.22s;
          background: rgba(255,255,255,0.03);
          position: relative;
        }
        .img-uploader-zone.is-over { border-color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.07); }
        .img-uploader-zone.is-disabled { opacity: 0.5; pointer-events: none; }

        .img-uploader-icon { color: rgba(255,255,255,0.4); margin-bottom: 0.5rem; }
        .img-uploader-label { font-size: 0.85rem; color: var(--text-secondary); }
        .img-uploader-label strong { color: var(--text-primary); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
        .img-uploader-hint { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; }

        .img-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.65rem; margin-top: 1rem;
        }
        .img-preview-card {
          position: relative; border-radius: 10px; overflow: hidden;
          aspect-ratio: 1; border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          transition: box-shadow 0.2s;
        }
        .img-preview-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.45); }
        .img-preview-card img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .img-preview-remove {
          position: absolute; top: 5px; right: 5px;
          background: rgba(220,38,38,0.88); color: white;
          border: none; border-radius: 50%; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 11px; transition: background 0.18s;
        }
        .img-preview-remove:hover { background: #dc2626; }

        .img-uploader-errors { margin-top: 0.65rem; }
        .img-uploader-error {
          display: flex; align-items: flex-start; gap: 0.4rem;
          font-size: 0.75rem; color: #ff8080; padding: 0.3rem 0.5rem;
          background: rgba(220,38,38,0.08); border-radius: 6px; margin-bottom: 0.3rem;
        }

        .img-count-pill {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; color: var(--text-muted);
          padding: 0.2rem 0.55rem; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 99px;
          margin-left: 0.5rem;
        }
        .img-count-pill.at-limit { color: #fbbf24; border-color: rgba(251,191,36,0.3); }
      `}</style>

      {/* Drop zone */}
      <div
        className={`img-uploader-zone${dragOver ? ' is-over' : ''}${disabled ? ' is-disabled' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && files.length < MAX_FILES && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={handleInput}
          disabled={disabled}
        />
        <div className="img-uploader-icon">
          {files.length >= MAX_FILES ? <CheckCircle2 size={28} color="#4ADE80" /> : <Upload size={28} />}
        </div>
        {files.length >= MAX_FILES ? (
          <p className="img-uploader-label">Maximum images selected.</p>
        ) : (
          <>
            <p className="img-uploader-label">
              Drag &amp; drop images, or <strong onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>browse</strong>
            </p>
            <p className="img-uploader-hint">JPEG · PNG · WEBP · Max 10 MB each · Up to {MAX_FILES} images</p>
          </>
        )}

        <span className={`img-count-pill${files.length >= MAX_FILES ? ' at-limit' : ''}`}>
          <ImageIcon size={11} />
          {files.length} / {MAX_FILES}
        </span>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="img-uploader-errors">
          {errors.map((err, i) => (
            <div key={i} className="img-uploader-error">
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail previews */}
      {files.length > 0 && (
        <div className="img-preview-grid">
          {files.map(item => (
            <div key={item.id} className="img-preview-card">
              <img src={item.preview} alt="Preview" />
              <button
                type="button"
                className="img-preview-remove"
                onClick={() => remove(item.id)}
                title="Remove"
                disabled={disabled}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
