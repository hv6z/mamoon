import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { CRITERIA } from '../../config/rules.js';
import { scoreTotal, maxScoreTotal } from '../../services/logic.js';
import Art from '../../components/Art.jsx';
import { Modal, useLoad, fmtDate, Empty } from '../../components/ui.jsx';
import ReportModal from './ReportModal.jsx';

export default function Gallery() {
  const { session } = useAuth();
  const [list] = useLoad(() => api.getPaintings(session, session.kidId), [session.kidId]);
  const [open, setOpen] = useState(null);
  const [report, setReport] = useState(null);
  if (!list) return null;
  const withPhoto = list.filter((g) => g.photo);
  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <div><h1>Tranh của bé</h1><p className="muted" style={{ fontSize: 18 }}>{withPhoto.length} bức tranh cô đã chụp ở lớp</p></div>
      {list.length === 0 ? <div className="card"><Empty>Bé chưa có tranh nào. Tranh vẽ ở lớp sẽ được cô chụp và lưu vào đây.</Empty></div> : (
        <div className="grid" style={{ '--min': '160px' }}>
          {list.map((g) => (
            <button type="button" key={g.id} className="painting-card" onClick={() => setOpen(g)} aria-label={`Xem tranh ${g.title}`}>
              <Art photo={g.photo} title={g.title} />
              <div>
                <div style={{ fontWeight: 800 }}>{g.title}</div>
                <div className="small muted">{fmtDate(g.sessionStart || g.createdAt)} · +{g.points} điểm</div>
                {g.makeup && <span className="chip warn" style={{ marginTop: 4 }}>Bổ sung</span>}
                {g.revoked && <span className="chip alert" style={{ marginTop: 4 }}>Đã thu hồi</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)} wide>
          <div className="row" style={{ alignItems: 'flex-start', gap: 22 }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}><Art photo={open.photo} title={open.title} /></div>
            <div className="stack" style={{ flex: '1 1 240px', '--gap': '10px' }}>
              <div className="muted">{open.sessionLabel}</div>
              {CRITERIA.map((c) => (
                <div key={c.key} className="row between"><span>{c.label}</span><b>{open.scores?.[c.key] ?? '-'} / 5</b></div>
              ))}
              <div className="row between" style={{ borderTop: '2px dashed var(--border)', paddingTop: 8 }}><span>Tổng điểm chấm</span><b>{scoreTotal(open.scores)} / {maxScoreTotal()}</b></div>
              <div className="row between"><span>Điểm thưởng</span><span className="amount">+{open.points}</span></div>
              {open.comment && <div className="card tint-yellow" style={{ padding: 14, borderRadius: 20 }}><b>Cô nhận xét:</b> {open.comment}</div>}
              {open.makeup && <span className="chip warn">Check-in bù (bổ sung)</span>}
              {open.revoked && <span className="chip alert">Buổi này đã bị thu hồi</span>}
              <div className="row">
                {open.photo && !open.photo.startsWith('art:') && <a className="btn sm" href={open.photo} download={`${open.title}.jpg`}>Tải ảnh về</a>}
                {!open.revoked && <button type="button" className="btn sm ghost" onClick={() => { setReport(open); setOpen(null); }}>Báo sai</button>}
              </div>
            </div>
          </div>
        </Modal>
      )}
      {report && <ReportModal title={`Tranh "${report.title}"`} target={{ type: 'grade', id: report.id }} onClose={() => setReport(null)} />}
    </div>
  );
}
