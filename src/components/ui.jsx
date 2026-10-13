import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';

// ---------- Toast ----------
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, text, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** Chạy một thao tác API, tự báo lỗi/thành công bằng toast. */
export function useAction() {
  const toast = useToast();
  return useCallback((fn, okText) => {
    try {
      const r = fn();
      if (okText) toast(typeof okText === 'function' ? okText(r) : okText, 'ok');
      return { ok: true, value: r };
    } catch (e) {
      toast(e.message || 'Có lỗi xảy ra', 'error');
      return { ok: false, error: e };
    }
  }, [toast]);
}

/** Tải dữ liệu đồng bộ từ API và cho phép tải lại. */
export function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, error: null });
  const reload = useCallback(() => {
    try { setState({ data: fn(), error: null }); } catch (e) { setState({ data: null, error: e }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return [state.data, reload, state.error];
}

// ---------- Modal ----------
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    ref.current?.addEventListener('keydown', onKey);
    const el = ref.current;
    return () => { el?.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 26 }}>{title}</h2>
          <button type="button" className="btn icon-btn" onClick={onClose} aria-label="Đóng"><Icon.close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Progress({ value, label, thin, tone = '' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`progress ${thin ? 'thin' : ''} ${tone}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function fmtDate(iso, withTime = false) {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return withTime ? `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${date}` : date;
}
export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
export function relDay(iso) {
  const d = new Date(iso); const t = new Date();
  const days = Math.round((new Date(t.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days === -1) return 'Ngày mai';
  return fmtDate(iso);
}
export const fmtNum = (n) => n.toLocaleString('vi-VN');

const FACE_TINTS = ['mm-pink-50', 'mm-teal-50', 'mm-yellow-50', 'mm-orange-50'];
export function KidFace({ name = '?', size = 42, idx }) {
  const letter = name.replace(/^Bé\s+/, '').trim().split(' ').pop()?.[0] || '?';
  const tint = FACE_TINTS[(idx ?? name.length) % FACE_TINTS.length];
  return <span className="kid-face" aria-hidden="true" style={{ width: size, height: size, background: `var(--${tint})`, fontSize: size * 0.45 }}>{letter.toUpperCase()}</span>;
}
