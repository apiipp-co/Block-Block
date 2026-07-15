import { useRef, useState, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Interactive crop tool (BeFunky-style: draggable box, resize handles,
// rule-of-thirds grid). Takes an image source and returns a cropped PNG blob.
export default function CropModal({ src, onCancel, onCropped }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completed, setCompleted] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Default the crop box to the whole image so "Apply" with no drag keeps it all.
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const full = { unit: 'px', x: 0, y: 0, width, height };
    setCrop(full);
    setCompleted(full);
  }, []);

  const apply = async () => {
    const image = imgRef.current;
    if (!image || !completed || completed.width === 0 || completed.height === 0) {
      setError('Draw a crop area first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(completed.width * scaleX));
      canvas.height = Math.max(1, Math.round(completed.height * scaleY));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        completed.x * scaleX, completed.y * scaleY,
        completed.width * scaleX, completed.height * scaleY,
        0, 0, canvas.width, canvas.height,
      );
      const blob = await new Promise((res, rej) => {
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not export the crop'))), 'image/png');
      });
      onCropped(blob);
    } catch {
      // Tainted canvas (cross-origin without CORS) or export failure.
      setError('Could not crop this image. Try re-uploading it.');
      setBusy(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,20,24,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}
      onClick={onCancel}
    >
      <div
        className="bb-card"
        style={{ background: '#1f2024', border: '1px solid #34353a', maxWidth: 760, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid #34353a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Crop image</span>
          <button className="bb-icon-btn" style={{ color: '#fff' }} aria-label="Close" onClick={onCancel}>✕</button>
        </div>

        <div style={{ padding: 'var(--space-6)', overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#141418' }}>
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompleted(c)} ruleOfThirds keepSelection>
            <img
              ref={imgRef}
              src={src}
              crossOrigin="anonymous"
              alt="Crop source"
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
            />
          </ReactCrop>
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid #34353a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          {error && <span style={{ color: '#ff8a8a', fontSize: 13, marginRight: 'auto' }}>{error}</span>}
          <button className="bb-pill-btn bb-pill-outline" style={{ borderRadius: 8 }} onClick={onCancel}>Cancel</button>
          <button className="bb-pill-btn bb-pill-primary" style={{ borderRadius: 8 }} onClick={apply} disabled={busy}>{busy ? 'Cropping…' : 'Apply crop'}</button>
        </div>
      </div>
    </div>
  );
}
