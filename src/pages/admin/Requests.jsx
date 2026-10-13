import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { MAKEUP_REASONS } from '../../config/rules.js';
import Art from '../../components/Art.jsx';
import { Modal, useAction, useLoad, fmtDate, Empty } from '../../components/ui.jsx';

export default function Requests() {
  const { session } = useAuth();
  const { tick, refresh } = useOutletContext();
  const [local, setLocal] = useState(0);
  const [list] = useLoad(() => api.listRequests(session), [tick, local]);
  const [open, setOpen] = useState(null);
  if (!list) return null;
  return (
    <>
      <h1>Yêu cầu kiểm tra lại</h1>
      <section className="card stack">
        {list.length === 0 && <Empty>Chưa có yêu cầu nào.</Empty>}
        {list.map((r) => (
          <div key={r.id} className="activity-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}>
                <Link to={`/admin/be/${r.kidId}`} style={{ fontWeight: 800 }}>{r.kidName}</Link>
                <span className="small muted">{fmtDate(r.createdAt, true)}</span>
                {r.status === 'open' ? <span className="chip alert">Chưa xử lý</span> : <span className="chip ok">Đã xử lý</span>}
              </div>
              <p style={{ marginTop: 4 }}>"{r.message}"</p>
              {r.detail && <div className="small muted">Mục: {r.detail.title || r.detail.note}{r.detail.makeup ? ' · Check-in bù' : ''}</div>}
              {r.resolution && <div className="small" style={{ marginTop: 4 }}>Kết quả: {r.resolution.action === 'revoke' ? 'Đã thu hồi' : 'Giữ nguyên'} – {r.resolution.note}</div>}
            </div>
            {r.status === 'open' && <button type="button" className="btn sm dark" onClick={() => setOpen(r)}>Xử lý</button>}
          </div>
        ))}
      </section>
      {open && <ResolveModal req={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); setLocal((x) => x + 1); refresh(); }} />}
    </>
  );
}

function ResolveModal({ req, onClose, onDone }) {
  const { session } = useAuth();
  const run = useAction();
  const [note, setNote] = useState('');
  const canRevoke = req.target && (req.target.type === 'grade' || req.target.type === 'attendance') && req.detail?.attendanceStatus === 'active';
  function act(action) {
    const r = run(() => api.resolveRequest(session, req.id, { action, note }), action === 'revoke' ? 'Đã thu hồi và báo phụ huynh' : 'Đã phản hồi phụ huynh');
    if (r.ok) onDone();
  }
  const d = req.detail;
  return (
    <Modal title={`Yêu cầu của phụ huynh ${req.kidName}`} onClose={onClose} wide>
      <div className="stack">
        <p>"{req.message}"</p>
        {d ? (
          <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
            {(d.evidence || d.photo) && <div style={{ flex: '1 1 240px' }}><Art photo={d.evidence || d.photo} title="Minh chứng" /></div>}
            <div className="stack" style={{ flex: '1 1 220px', '--gap': '6px' }}>
              <b>{d.title || d.note}</b>
              {d.points > 0 && <div>Điểm đã cộng: +{d.points}</div>}
              {d.makeup && <div>Check-in bù · Lý do: {MAKEUP_REASONS.find((x) => x.key === d.reason)?.label || '-'}</div>}
              {d.evidence && <div className="small muted">Ảnh bên cạnh là minh chứng cô đã đính kèm khi check-in bù.</div>}
            </div>
          </div>
        ) : <p className="muted">Yêu cầu chung, không gắn với mục cụ thể. Kiểm tra trong Hồ sơ bé rồi điều chỉnh điểm nếu cần.</p>}
        <label className="field">Kết quả gửi phụ huynh (bắt buộc)<textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Cô đã kiểm tra tờ điểm danh, bé có đi học ạ." /></label>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => act('keep')}>Minh chứng đúng, giữ nguyên</button>
          {canRevoke && <button type="button" className="btn alert" onClick={() => act('revoke')}>Sai, huỷ check-in và thu hồi điểm</button>}
        </div>
      </div>
    </Modal>
  );
}
