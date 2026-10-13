import { useId, useState } from 'react';
import { Icon } from './Icons.jsx';

const MAX_SIDE = 1000;
const MAX_FILE_MB = 15;

/** Thu nhỏ ảnh trước khi lưu để tiết kiệm dung lượng (giống bước nén trước khi tải lên kho ảnh). */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Chỉ nhận file ảnh (JPG, PNG, HEIC…)')); return; }
    if (file.size > MAX_FILE_MB * 1024 * 1024) { reject(new Error(`Ảnh quá lớn (tối đa ${MAX_FILE_MB} MB)`)); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh này')); };
    img.src = url;
  });
}

/**
 * Ô chọn/chụp ảnh. Trên điện thoại sẽ mở camera sau (capture="environment").
 * value: data URL hiện tại; onChange(dataUrl | null)
 */
export default function PhotoInput({ value, onChange, label = 'Chụp ảnh tranh', required = false, hint }) {
  const id = useId();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr(''); setBusy(true);
    try { onChange(await resizeImage(f)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <label htmlFor={id} className={`dropzone ${required && !value ? 'required' : ''}`}>
        {value ? <img src={value} alt="Ảnh đã chọn" /> : (<><Icon.camera size={34} /><span>{busy ? 'Đang xử lý ảnh…' : label}</span>{hint && <span className="small muted">{hint}</span>}</>)}
      </label>
      <input id={id} className="sr-only" type="file" accept="image/*" capture="environment" onChange={onFile} aria-required={required} />
      {value && (
        <div className="row">
          <label htmlFor={id} className="btn sm">Chụp lại</label>
          <button type="button" className="btn sm ghost" onClick={() => onChange(null)}>Xoá ảnh</button>
        </div>
      )}
      {err && <div className="error-text" role="alert">{err}</div>}
    </div>
  );
}
