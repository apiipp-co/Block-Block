import { useRef, useState } from 'react';
import { api, resolveImage } from '../api/client';
import { ImageIcon } from './icons';
import CropModal from './CropModal';

const FIT_OPTIONS = [
  { value: 'contain', label: 'Full image' },
  { value: 'cover', label: 'Crop to fill' },
];

// Single-image picker for post creation/editing. On select it opens an
// interactive crop tool; the cropped result is uploaded and reported via
// onChange. `fit` controls how the (already-cropped) image is framed in the
// fixed card slots wherever the post is shown.
export default function ImageDrop({ value, onChange, fit = 'contain', onFitChange, placeholder = 'Drop a picture' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState(null); // object URL / remote URL fed to the cropper
  const preview = resolveImage(value);

  const pick = () => inputRef.current && inputRef.current.click();

  // A picked file goes straight into the crop tool (crop is optional — the box
  // defaults to the whole image, so "Apply" with no drag keeps it intact).
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be 5MB or smaller.'); return; }
    setError('');
    setCropSrc(URL.createObjectURL(file));
  };

  const uploadBlob = async (blob) => {
    setBusy(true);
    setError('');
    try {
      const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type || 'image/png' });
      const { imageUrl } = await api.uploadImage(file);
      onChange(imageUrl);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onCropped = (blob) => {
    if (cropSrc && cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    uploadBlob(blob);
  };

  const closeCropper = () => {
    if (cropSrc && cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  return (
    <div>
      {cropSrc && <CropModal src={cropSrc} onCancel={closeCropper} onCropped={onCropped} />}

      <div
        onClick={pick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{
          width: '100%', height: 220, borderRadius: 8, cursor: 'pointer',
          border: preview ? '1px solid #edeff1' : '2px dashed #d7d9da',
          backgroundColor: '#f6f7f8',
          backgroundImage: preview ? `url("${preview}")` : 'none',
          backgroundSize: fit,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#9a9a9b', flexDirection: 'column', gap: 8, overflow: 'hidden',
        }}
      >
        {!preview && (
          <>
            <ImageIcon size={28} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{busy ? 'Uploading…' : placeholder}</span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />

      {preview && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" className="bb-pill" style={{ height: 30 }} onClick={() => setCropSrc(preview)}>Crop</button>
            <button type="button" className="bb-pill" style={{ height: 30 }} onClick={pick}>Replace</button>
            <span style={{ width: 1, height: 20, background: '#edeff1', margin: '0 2px' }} />
            <span style={{ fontSize: 12.5, color: '#787c7e' }}>Display:</span>
            {FIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="bb-pill-btn"
                style={{
                  height: 28, fontSize: 12, padding: '0 12px',
                  background: fit === opt.value ? '#7353ea' : '#f6f7f8',
                  color: fit === opt.value ? '#fff' : '#1a1a1b',
                }}
                onClick={() => onFitChange && onFitChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="button" className="bb-btn-plain" style={{ fontSize: 12.5, color: '#7353ea', fontWeight: 600 }} onClick={() => onChange(null)}>Remove picture</button>
          </div>
        </>
      )}
      {error && <p className="bb-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
