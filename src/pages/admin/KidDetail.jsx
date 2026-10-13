import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { MAKEUP_REASONS, EVIDENCE_TYPES } from '../../config/rules.js';
import Art from '../../components/Art.jsx';
import { Modal, useAction, useLoad, fmtDate, fmtNum, KidFace, Empty } from '../../components/ui.jsx';

const label = (list, key) => list.find((x) => x.key === key)?.label || key;

export default function KidDetail() {
  const { kidId } = useParams();
  const { session } = useAuth();
  const { tick, refresh } = useOutletContext();
  const [local, setLocal] = useState(0);
  const [d, , err] = useLoad(() => api.getKidDetail(session, kidId), [kidId, tick, local]);
  const [adjust, setAdjust] = useState(false);
  const [evidence, setEvidence] = useState(null);
  if (err) return <div className="card"><p>{err.message}</p><Link to="/admin/be">Quay lại danh sách</Link></div>;
  if (!d) return null;
  const { kid, parent } = d;
  return (
    <>
      <Link to="/admin/be" style={{ fontWeight: 800 }}>← Hồ sơ các bé</Link>
      <section className="card stack">
        <div className="row" style={{ gap: 16 }}>
          <KidFace name={kid.name} size={72} />
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <h1 style={{ fontSize: 32 }}>{kid.name} <span className="muted" style={{ fontSize: 20 }}>({kid.fullName})</span></h1>
            <div className="muted">Mã {kid.code} · {d.className} · Tham gia {fmtDate(kid.joinedAt)}</div>
          </div>
          <button type="button" className="btn dark" onClick={() => setAdjust(true)}>Điều chỉnh điểm</button>
        </div>
        <div className="grid" style={{ '--min': '150px', '--gap': '12px' }}>
          <div className="kpi tint-teal"><span className="small">Điểm hiện có</span><span className="v">{fmtNum(kid.balance)}</span></div>
          <div className="kpi tint-yellow"><span className="small">Hạng Cup</span><span className="v" style={{ fontSize: 30 }}>{kid.tier.current.name}</span></div>
          <div className="kpi tint-pink"><span className="small">Xếp hạng tháng</span><span className="v">{d.rank ? `#${d.rank}` : '-'}</span></div>
          <div className="kpi tint-orange"><span className="small">Chuyên cần</span><span className="v">{d.attendance.attended}/{d.attendance.total}</span><span className="small">{d.attendance.makeup} lần check-in bù</span></div>
        </div>
        <div className="grid" style={{ '--min': '240px', '--gap': '12px' }}>
          <div className="stack box tint-mint" style={{ '--gap': '6px' }}>
            <b className="display" style={{ fontSize: 20 }}>Thông tin bé</b>
            <div className="row between"><span className="muted">Ngày sinh</span><span>{kid.birth ? fmtDate(kid.birth) : '-'}</span></div>
            <div className="row between"><span className="muted">Tích luỹ</span><span>{fmtNum(kid.lifetime)} điểm</span></div>
          </div>
          <div className="stack box tint-mint" style={{ '--gap': '6px' }}>
            <b className="display" style={{ fontSize: 20 }}>Phụ huynh</b>
            <div className="row between"><span className="muted">Họ tên</span><span>{parent?.name}</span></div>
            <div className="row between"><span className="muted">SĐT</span><a href={`tel:${parent?.phone}`}>{parent?.phone}</a></div>
            <div className="row between"><span className="muted">Đồng ý điều khoản</span><span>{parent?.acceptedTermsAt ? fmtDate(parent.acceptedTermsAt) : <span className="chip alert">Chưa</span>}</span></div>
          </div>
        </div>
      </section>

      {d.makeups.length > 0 && (
        <section className="card stack">
          <h2 style={{ fontSize: 24 }}>Các lần check-in bù</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Buổi học</th><th>Lý do</th><th>Minh chứng</th><th>Làm lúc</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {d.makeups.map((m) => (
                  <tr key={m.id}>
                    <td>{m.sessionLabel}</td>
                    <td>{label(MAKEUP_REASONS, m.reason)}{m.note && <div className="small muted">{m.note}</div>}</td>
                    <td><button type="button" className="btn sm" onClick={() => setEvidence(m)}>{label(EVIDENCE_TYPES, m.evidenceType)}</button></td>
                    <td>{fmtDate(m.createdAt, true)}</td>
                    <td>{m.status === 'revoked' ? <span className="chip alert">Đã thu hồi</span> : <span className="chip ok">Hợp lệ</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card stack">
        <h2 style={{ fontSize: 24 }}>Bộ sưu tập tranh · {d.paintings.length}</h2>
        {d.paintings.length === 0 ? <Empty>Chưa có tranh.</Empty> : (
          <div className="grid" style={{ '--min': '150px', '--gap': '14px' }}>
            {d.paintings.slice(0, 12).map((g) => (
              <figure key={g.id} style={{ margin: 0 }} className="stack">
                <Art photo={g.photo} title={g.title} />
                <figcaption className="small"><b>{g.title}</b><div className="muted">{fmtDate(g.sessionStart)} · +{g.points}{g.makeup ? ' · Bổ sung' : ''}{g.revoked ? ' · Đã thu hồi' : ''}</div></figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <div className="row" style={{ alignItems: 'flex-start', gap: 22 }}>
        <section className="card stack" style={{ flex: '2 1 400px', minWidth: 0 }}>
          <h2 style={{ fontSize: 24 }}>Lịch sử điểm</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Ngày</th><th>Nội dung</th><th>Người làm</th><th style={{ textAlign: 'right' }}>Điểm</th></tr></thead>
              <tbody>
                {d.ledger.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.occurredAt)}</td>
                    <td>{e.note}{e.makeup && <span className="chip warn" style={{ marginLeft: 6 }}>Bổ sung</span>}</td>
                    <td className="small">{e.by?.startsWith('a') ? 'Admin' : e.by === 'system' ? 'Hệ thống' : 'Phụ huynh'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--mm-teal-dark)' }}>{e.amount > 0 ? '+' : ''}{fmtNum(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card stack" style={{ flex: '1 1 240px', minWidth: 0 }}>
          <h2 style={{ fontSize: 24 }}>Voucher</h2>
          {d.vouchers.length === 0 && <Empty>Chưa đổi voucher.</Empty>}
          {d.vouchers.map((v) => (
            <div key={v.id} className={`box ${v.status === 'unused' ? 'tint-pink' : 'tint-mint'}`}>
              <b>{v.name}</b><div className="small">{v.code} · {v.status === 'unused' ? `Chưa dùng, hạn ${fmtDate(v.expiresAt)}` : 'Đã dùng'}</div>
            </div>
          ))}
        </section>
      </div>

      {adjust && <AdjustModal kid={kid} onClose={() => setAdjust(false)} onDone={() => { setAdjust(false); setLocal((x) => x + 1); refresh(); }} />}
      {evidence && (
        <Modal title="Ảnh minh chứng" onClose={() => setEvidence(null)}>
          <img src={evidence.evidence} alt="Ảnh minh chứng check-in bù" style={{ borderRadius: 20, width: '100%' }} />
          <p className="small muted" style={{ marginTop: 10 }}>{evidence.sessionLabel} · {label(MAKEUP_REASONS, evidence.reason)}</p>
        </Modal>
      )}
    </>
  );
}

function AdjustModal({ kid, onClose, onDone }) {
  const { session } = useAuth();
  const run = useAction();
  const [sign, setSign] = useState(1);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  function submit(e) {
    e.preventDefault();
    const n = sign * Number(amount);
    const r = run(() => api.adjustPoints(session, kid.id, n, reason), `Đã điều chỉnh ${n > 0 ? '+' : ''}${n} điểm`);
    if (r.ok) onDone();
  }
  return (
    <Modal title={`Điều chỉnh điểm: ${kid.name}`} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="tabs" role="radiogroup" aria-label="Cộng hay trừ">
          <button type="button" role="radio" aria-checked={sign === 1} aria-selected={sign === 1} onClick={() => setSign(1)}>Cộng điểm</button>
          <button type="button" role="radio" aria-checked={sign === -1} aria-selected={sign === -1} onClick={() => setSign(-1)}>Trừ điểm</button>
        </div>
        <label className="field">Số điểm<input className="input" type="number" inputMode="numeric" min="1" max="500" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        <label className="field">Lý do (bắt buộc, phụ huynh sẽ thấy)<textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} /></label>
        <p className="small muted">Hiện có {fmtNum(kid.balance)} điểm. Mỗi lần tối đa 500 điểm.</p>
        <button type="submit" className="btn primary">Xác nhận</button>
      </form>
    </Modal>
  );
}
