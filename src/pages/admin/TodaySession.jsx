import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import * as queue from '../../services/offlineQueue.js';
import { CRITERIA, SCORE_MAX } from '../../config/rules.js';
import { convertScore, scoreTotal, maxScoreTotal, validateScores } from '../../services/logic.js';
import { Icon } from '../../components/Icons.jsx';
import Art from '../../components/Art.jsx';
import PhotoInput from '../../components/PhotoInput.jsx';
import { Modal, useAction, useLoad, useToast, fmtTime, relDay, KidFace } from '../../components/ui.jsx';

function pendingFor(sessionId) {
  try {
    return JSON.parse(localStorage.getItem('mamoon-offline-queue') || '[]').filter((q) => (q.payload.sessionId || q.payload.sessionRef) === sessionId);
  } catch { return []; }
}

export default function TodaySession() {
  const { session: actor } = useAuth();
  const { tick, refresh } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const run = useAction();
  const toast = useToast();
  const [local, setLocal] = useState(0);
  const reload = () => { setLocal((x) => x + 1); refresh(); };
  const [sessions] = useLoad(() => api.getTodaySessions(actor), [tick, local]);
  const sid = params.get('s') || sessions?.find((s) => new Date(s.session.start) <= new Date())?.session.id || sessions?.[0]?.session.id;
  const current = sessions?.find((s) => s.session.id === sid);
  const [selKid, setSelKid] = useState(null);
  const [q, setQ] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const panelRef = useRef(null);
  const pend = useMemo(() => pendingFor(sid), [sid, tick, local]);

  const results = useMemo(() => (q.trim().length >= 2 ? api.searchKids(actor, q) : []), [q, actor, local]);
  if (!sessions) return null;
  if (!current) {
    return (
      <div className="card stack">
        <h1>Buổi học hôm nay</h1>
        <p>Hôm nay không có buổi học nào. Nếu cần bổ sung cho buổi đã qua, dùng <Link to="/admin/checkin-bu">Check-in bù</Link>.</p>
      </div>
    );
  }
  const s = current.session;
  const now = new Date();
  const notOpen = now < new Date(new Date(s.start).getTime() - 3600e3);
  const ended = now > new Date(s.end);
  const pendingKidIds = new Set(pend.filter((p) => p.type === 'checkin').map((p) => p.payload.kidId));
  const pendingGradeRefs = new Set(pend.filter((p) => p.type === 'grade').map((p) => p.payload.kidId));
  const row = current.rows.find((r) => r.kid.id === selKid);

  function doCheckIn(kidId) {
    if (queue.isOffline()) {
      if (pendingKidIds.has(kidId)) { toast('Bé đã được lưu tạm check-in', 'error'); return; }
      queue.enqueue('checkin', { sessionId: s.id, kidId });
      toast('Mất mạng: đã lưu tạm check-in trên máy', 'ok');
      setSelKid(kidId); setQ(''); reload();
      return;
    }
    const r = run(() => api.checkIn(actor, s.id, kidId));
    if (r.ok) {
      toast(r.value.duplicate ? 'Bé đã check-in buổi này rồi' : 'Check-in thành công', r.value.duplicate ? 'error' : 'ok');
      setSelKid(kidId); setQ(''); reload();
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }

  return (
    <>
      <div className="section-head">
        <div><div className="muted">{relDay(s.start)}</div><h1>Buổi học hôm nay</h1></div>
        <div className="tabs" role="tablist" aria-label="Chọn lớp">
          {sessions.map(({ session: x }) => (
            <button type="button" role="tab" key={x.id} aria-selected={x.id === sid} onClick={() => { setParams({ s: x.id }); setSelKid(null); }}>
              {x.className.replace(/^Lớp\s+/, '')} · {fmtTime(x.start)}
            </button>
          ))}
        </div>
      </div>

      {notOpen && <div className="status-bar warn">Buổi học chưa mở. Có thể check-in từ 60 phút trước giờ học ({fmtTime(s.start)}).</div>}
      {ended && <div className="status-bar warn">Buổi học đã kết thúc. Bé nào chưa check-in hãy dùng <Link to="/admin/checkin-bu">Check-in bù</Link> (cần ảnh minh chứng).</div>}

      {!ended && (
        <section className="card tint-teal stack" style={{ '--gap': '12px' }} aria-label="Check-in">
          <div className="row">
            <h2 style={{ fontSize: 24 }}>Check-in</h2>
            <button type="button" className="btn sm" onClick={() => setShowQr(true)} disabled={notOpen}><Icon.search size={18} />Nhập / quét mã QR của bé</button>
            <button type="button" className="btn sm ghost" onClick={() => setShowCreate(true)}>+ Tạo nhanh tài khoản bé mới</button>
          </div>
          <label className="field">
            <span className="sr-only">Tìm bé theo tên, mã bé hoặc SĐT phụ huynh</span>
            <input className="input" type="search" placeholder="Tìm bé: tên, mã bé hoặc SĐT phụ huynh" value={q} onChange={(e) => setQ(e.target.value)} disabled={notOpen} />
          </label>
          {q.trim().length >= 2 && (
            <div className="stack" style={{ '--gap': '6px' }}>
              {results.length === 0 && <div className="muted">Không tìm thấy bé. Kiểm tra lại hoặc tạo tài khoản mới.</div>}
              {results.map((k) => {
                const done = current.rows.some((r) => r.kid.id === k.id && r.attendance) || pendingKidIds.has(k.id);
                return (
                  <div key={k.id} className="row" style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 18, flexWrap: 'nowrap' }}>
                    <KidFace name={k.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}><b>{k.name}</b><div className="small muted">{k.code} · SĐT {k.parentPhone}{k.classId !== s.classId ? ' · khác lớp' : ''}</div></div>
                    <button type="button" className="btn sm dark" disabled={done} onClick={() => doCheckIn(k.id)}>{done ? 'Đã check-in' : 'Check-in'}</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="row" style={{ alignItems: 'flex-start', gap: 22 }}>
        <section className="card stack" style={{ flex: '1 1 360px', minWidth: 0, '--gap': '8px' }}>
          <div className="section-head"><h2 style={{ fontSize: 24 }}>{s.className}</h2><span className="small muted">Chủ đề: {s.topic}</span></div>
          <div className="row" style={{ gap: 8 }}>
            <span className="chip ok">Check-in {current.stats.checkedIn}/{current.stats.total}</span>
            <span className="chip warn">Đã chấm {current.stats.graded}</span>
            <span className="chip alert">Có ảnh {current.stats.withPhoto}</span>
          </div>
          {current.rows.map((r) => {
            const queued = pendingKidIds.has(r.kid.id);
            return (
              <button type="button" key={r.kid.id} className={`roster-row ${selKid === r.kid.id ? 'selected' : ''}`} onClick={() => { setSelKid(r.kid.id); setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}>
                <KidFace name={r.kid.name} />
                <span style={{ flex: 1, minWidth: 0 }}><b>{r.kid.name}</b><span className="small muted" style={{ display: 'block' }}>{r.kid.code} · {r.kid.tier}</span></span>
                <span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                  {r.attendance ? <span className="chip ok">{fmtTime(r.attendance.checkedInAt)}</span> : queued ? <span className="chip warn">Chờ gửi</span> : <span className="chip neutral">Chưa đến</span>}
                  {r.attendance?.makeup && <span className="chip warn">Bổ sung</span>}
                  {r.grade && <span className="chip warn">+{r.grade.points}</span>}
                  {r.grade && !r.grade.photo && <span className="chip alert">Chưa ảnh</span>}
                  {pendingGradeRefs.has(r.kid.id) && <span className="chip warn">Điểm chờ gửi</span>}
                </span>
              </button>
            );
          })}
        </section>

        <div ref={panelRef} style={{ flex: '1.3 1 420px', minWidth: 0, scrollMarginTop: 80 }}>
          {!row ? (
            <div className="card"><p className="muted">Chọn một bé trong danh sách để chấm tranh và chụp ảnh.</p></div>
          ) : (
            <GradePanel key={`${row.kid.id}-${row.grade?.id || ''}-${local}`} row={row} session={s} queued={pendingKidIds.has(row.kid.id)} gradeQueued={pendingGradeRefs.has(row.kid.id)} onDone={reload} onCheckIn={() => doCheckIn(row.kid.id)} canCheckIn={!notOpen && !ended} />
          )}
        </div>
      </div>

      {showQr && <QrModal onClose={() => setShowQr(false)} onFound={(kidId) => { setShowQr(false); doCheckIn(kidId); }} />}
      {showCreate && <CreateKidModal classId={s.classId} onClose={() => setShowCreate(false)} onCreated={(kid) => { setShowCreate(false); doCheckIn(kid.id); }} />}
    </>
  );
}

function GradePanel({ row, session, queued, gradeQueued, onDone, onCheckIn, canCheckIn }) {
  const { session: actor } = useAuth();
  const run = useAction();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [scores, setScores] = useState({});
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const total = scoreTotal(scores);
  const complete = !validateScores(scores);

  if (!row.attendance && !queued) {
    return (
      <section className="card stack">
        <h2 style={{ fontSize: 26 }}>{row.kid.name}</h2>
        <p>Bé chưa check-in buổi này.</p>
        {canCheckIn ? <button type="button" className="btn primary" onClick={onCheckIn}>Check-in cho bé</button> : <p className="muted">Buổi học không còn mở. Dùng <Link to="/admin/checkin-bu">Check-in bù</Link> nếu bé có đi học.</p>}
      </section>
    );
  }

  if (row.grade) {
    const g = row.grade;
    return (
      <section className="card stack">
        <h2 style={{ fontSize: 26 }}>Đã chấm: {row.kid.name}</h2>
        <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: '1 1 200px' }}><Art photo={g.photo} title={g.title} /></div>
          <div className="stack" style={{ flex: '1 1 200px', '--gap': '6px' }}>
            <b>"{g.title}"</b>
            {CRITERIA.map((c) => <div key={c.key} className="row between"><span>{c.label}</span><b>{g.scores[c.key]}/{SCORE_MAX}</b></div>)}
            <div className="row between"><span>Điểm thưởng</span><span className="amount">+{g.points}</span></div>
            {g.comment && <p className="muted">"{g.comment}"</p>}
          </div>
        </div>
        {!g.photo && (
          <div className="stack">
            <PhotoInput value={newPhoto} onChange={setNewPhoto} label="Chụp ảnh tranh để lưu vào bộ sưu tập" />
            <button type="button" className="btn primary" disabled={!newPhoto} onClick={() => {
              if (queue.isOffline()) { toast('Cần có mạng để tải ảnh. Ảnh vẫn nằm trên máy, thử lại khi có mạng.', 'error'); return; }
              const r = run(() => api.setGradePhoto(actor, g.id, newPhoto), 'Đã lưu ảnh vào bộ sưu tập của bé');
              if (r.ok) onDone();
            }}>Lưu ảnh</button>
          </div>
        )}
        <p className="small muted">Muốn sửa điểm đã chấm? Vào Hồ sơ bé → Điều chỉnh điểm (bắt buộc ghi lý do).</p>
      </section>
    );
  }

  if (gradeQueued) {
    return <section className="card"><h2 style={{ fontSize: 24 }}>{row.kid.name}</h2><p>Điểm đã được lưu tạm, sẽ tự gửi khi có mạng.</p></section>;
  }

  function save() {
    if (saving) return;
    const err = validateScores(scores) || (!title.trim() && 'Nhập tên bức tranh');
    if (err) { toast(err, 'error'); return; }
    setSaving(true);
    const data = { title, scores, comment, photo };
    if (queue.isOffline() || queued) {
      queue.enqueue('grade', { sessionId: session.id, kidId: row.kid.id, attendanceRef: row.attendance?.id || pendingCheckinId(session.id, row.kid.id), data });
      toast('Mất mạng: đã lưu tạm điểm và ảnh trên máy', 'ok');
      setSaving(false); onDone();
      return;
    }
    const r = run(() => api.gradeAttendance(actor, row.attendance.id, data), (g) => `Đã cộng ${g.points} điểm cho ${row.kid.name}`);
    setSaving(false);
    if (r.ok) onDone();
  }

  return (
    <section className="card stack" aria-label={`Chấm tranh ${row.kid.name}`}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <KidFace name={row.kid.name} size={54} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 26 }}>Chấm tranh: {row.kid.name}</h2>
          <div className="muted small">{queued ? 'Check-in đang chờ gửi' : `Check-in ${fmtTime(row.attendance.checkedInAt)}`} · {row.kid.tier}</div>
        </div>
      </div>
      <label className="field">Tên tranh<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Chú cá bảy màu" /></label>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }} className="stack">
        <legend style={{ fontWeight: 800, marginBottom: 8 }}>Tiêu chí chấm (1 đến {SCORE_MAX})</legend>
        {CRITERIA.map((c) => (
          <div key={c.key} className="row" style={{ gap: 10 }}>
            <span style={{ flex: '0 0 100px', fontWeight: 800 }}>{c.label}</span>
            <div className="row" style={{ gap: 6 }} role="radiogroup" aria-label={c.label}>
              {Array.from({ length: SCORE_MAX }, (_, i) => i + 1).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={scores[c.key] === v} aria-label={`${c.label} ${v}`}
                  className={`score-btn ${scores[c.key] >= v ? 'on' : ''}`} onClick={() => setScores({ ...scores, [c.key]: v })}>{v}</button>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      <label className="field">Nhận xét của cô<textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Khen bé một điều và gợi ý một điều" /></label>
      <div className="row between tint-yellow" style={{ padding: '14px 18px', borderRadius: 18 }}>
        <span>Điểm chấm {total}/{maxScoreTotal()}</span>
        <span className="display" style={{ fontSize: 28 }}>+{complete ? convertScore(scores) : 0} điểm thưởng</span>
      </div>
      <div className="field">Ảnh tranh<PhotoInput value={photo} onChange={setPhoto} label="Chụp ảnh tranh" hint="Có thể chụp sau, nhưng nên chụp ngay để lưu vào bộ sưu tập" /></div>
      <button type="button" className="btn primary" onClick={save} disabled={saving || !complete || !title.trim()}>Lưu và cộng {complete ? convertScore(scores) : 0} điểm</button>
    </section>
  );
}

function pendingCheckinId(sessionId, kidId) {
  try {
    const q = JSON.parse(localStorage.getItem('mamoon-offline-queue') || '[]');
    return q.find((x) => x.type === 'checkin' && x.payload.sessionId === sessionId && x.payload.kidId === kidId)?.clientId;
  } catch { return undefined; }
}

function QrModal({ onClose, onFound }) {
  const { session: actor } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState('');
  function submit(e) {
    e.preventDefault();
    const r = api.searchKids(actor, code.trim());
    const kid = r.find((k) => k.code.toLowerCase() === code.trim().toLowerCase());
    if (!kid) { toast('Không có bé nào với mã này', 'error'); return; }
    onFound(kid.id);
  }
  return (
    <Modal title="Mã QR của bé" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p className="muted">Bản demo: nhập mã in dưới QR (ví dụ MM-0040). Bản thật sẽ mở camera để quét.</p>
        <label className="field">Mã bé<input className="input" value={code} onChange={(e) => setCode(e.target.value)} autoFocus placeholder="MM-0040" /></label>
        <button type="submit" className="btn primary">Check-in</button>
      </form>
    </Modal>
  );
}

function CreateKidModal({ classId, onClose, onCreated }) {
  const { session: actor } = useAuth();
  const run = useAction();
  const [f, setF] = useState({ kidName: '', phone: '' });
  function submit(e) {
    e.preventDefault();
    const r = run(() => api.quickCreateKid(actor, { ...f, classId }), (k) => `Đã tạo tài khoản cho ${k.name}`);
    if (r.ok) onCreated(r.value);
  }
  return (
    <Modal title="Tạo nhanh tài khoản bé" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label className="field">Tên bé<input className="input" value={f.kidName} onChange={(e) => setF({ ...f, kidName: e.target.value })} required autoFocus /></label>
        <label className="field">SĐT phụ huynh<input className="input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required /></label>
        <p className="small muted">Phụ huynh sẽ nhận OTP để kích hoạt và đồng ý điều khoản khi đăng nhập lần đầu.</p>
        <button type="submit" className="btn primary">Tạo và check-in</button>
      </form>
    </Modal>
  );
}
