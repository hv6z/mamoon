import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { CRITERIA, SCORE_MAX, MAKEUP_REASONS, EVIDENCE_TYPES, MAKEUP_WINDOW_HOURS } from '../../config/rules.js';
import { convertScore, validateScores } from '../../services/logic.js';
import PhotoInput from '../../components/PhotoInput.jsx';
import { Icon } from '../../components/Icons.jsx';
import { useAction, useLoad, useToast, fmtDate, fmtTime, KidFace, Empty } from '../../components/ui.jsx';

function hoursLeft(deadline) {
  const h = Math.max(0, (deadline - Date.now()) / 3600e3);
  return h >= 1 ? `còn ${Math.floor(h)} giờ` : `còn ${Math.ceil(h * 60)} phút`;
}

export default function MakeupCheckin() {
  const { session: actor } = useAuth();
  const { tick, refresh } = useOutletContext();
  const run = useAction();
  const toast = useToast();
  const [local, setLocal] = useState(0);
  const [list] = useLoad(() => api.listMakeupSessions(actor), [tick, local]);
  const [sid, setSid] = useState('');
  // pick: { kidId, name, code, mode: 'checkin' | 'evidence', attendanceId, otherClass }
  const [pick, setPick] = useState(null);
  const [q, setQ] = useState('');
  const [evidenceType, setEvidenceType] = useState('sheet');
  const [evidence, setEvidence] = useState(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [withGrade, setWithGrade] = useState(true);
  const [title, setTitle] = useState('');
  const [scores, setScores] = useState({});
  const [done, setDone] = useState(null);
  const [tried, setTried] = useState(false);

  const current = list?.find((x) => x.session.id === sid);
  const absent = useMemo(() => current?.rows.filter((r) => !r.attendance) || [], [current]);
  const present = useMemo(() => current?.rows.filter((r) => r.attendance) || [], [current]);
  const others = useMemo(() => {
    if (!current || q.trim().length < 2) return [];
    const inRoster = new Set(current.rows.map((r) => r.kid.id));
    return api.searchKids(actor, q).filter((k) => !inRoster.has(k.id));
  }, [q, current, actor]);

  function reset() {
    setPick(null); setEvidence(null); setReason(''); setNote(''); setTitle(''); setScores({}); setTried(false); setQ('');
  }
  function choose(p) {
    setPick(p); setEvidence(null); setTried(false);
    setEvidenceType(p.mode === 'evidence' ? 'painting' : 'sheet');
    setTimeout(() => document.getElementById('makeup-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function submit(e) {
    e.preventDefault();
    setTried(true);
    if (!evidence) { toast('Bắt buộc đính kèm ảnh', 'error'); return; }
    if (pick.mode === 'evidence') {
      const r = run(() => api.addAttendanceEvidence(actor, { attendanceId: pick.attendanceId, evidence, evidenceType, note }));
      if (r.ok) {
        setDone(`Đã tải ảnh bù cho ${pick.name} buổi ${fmtDate(current.session.start)}${r.value.savedToGallery ? ', ảnh tranh đã vào bộ sưu tập của bé' : ''}. Đã báo phụ huynh.`);
        reset(); setLocal((x) => x + 1); refresh();
      }
      return;
    }
    if (!reason) { toast('Chọn lý do check-in bù', 'error'); return; }
    if (withGrade) {
      const err = validateScores(scores) || (!title.trim() && 'Nhập tên bức tranh');
      if (err) { toast(err, 'error'); return; }
    }
    const r = run(() => api.makeupCheckIn(actor, {
      sessionId: sid, kidId: pick.kidId, evidence, evidenceType, reason, note,
      grade: withGrade ? { title, scores, comment: '' } : null,
    }));
    if (r.ok) {
      const pts = r.value.grade?.points || 0;
      setDone(`Đã check-in bù cho ${pick.name} buổi ${fmtDate(current.session.start)}${pts ? `, cộng ${pts} điểm (nhãn Bổ sung)` : ''}. Đã báo phụ huynh.`);
      reset(); setLocal((x) => x + 1); refresh();
    }
  }

  if (!list) return null;
  return (
    <>
      <div>
        <h1>Check-in bù</h1>
        <p className="muted" style={{ maxWidth: 780 }}>Dùng khi lớp mất mạng, web lỗi hoặc cô quên check-in, hoặc khi cần <b>tải ảnh điểm danh bù</b> cho bé đã check-in. Chỉ làm được trong {MAKEUP_WINDOW_HOURS} giờ sau buổi học và bắt buộc có ảnh. Phụ huynh sẽ nhận thông báo và có thể báo sai.</p>
      </div>

      {done && (
        <div className="status-bar" role="status"><Icon.check size={20} />{done}<button type="button" className="btn sm ghost" onClick={() => setDone(null)}>Đóng</button></div>
      )}

      <section className="card stack">
        <h2 style={{ fontSize: 24 }}>1. Chọn buổi học</h2>
        {list.length === 0 ? <Empty>Không có buổi học nào trong {MAKEUP_WINDOW_HOURS} giờ qua. Quá hạn thì dùng "Điều chỉnh điểm" trong Hồ sơ bé, kèm lý do.</Empty> : (
          <div className="grid" style={{ '--min': '240px', '--gap': '12px' }}>
            {list.map(({ session: s, stats, deadline }) => (
              <button type="button" key={s.id} className="pick-card" onClick={() => { setSid(s.id); reset(); }} aria-pressed={sid === s.id}>
                <b>{s.className}</b>
                <span className="small muted">{fmtDate(s.start)} · {fmtTime(s.start)} – {fmtTime(s.end)}</span>
                <span className="row" style={{ gap: 6 }}><span className="chip ok">Có mặt {stats.checkedIn}/{stats.total}</span><span className="chip warn">{hoursLeft(deadline)}</span></span>
              </button>
            ))}
          </div>
        )}
      </section>

      {current && (
        <section className="card stack">
          <h2 style={{ fontSize: 24 }}>2. Chọn bé</h2>

          <div className="stack" style={{ '--gap': '8px' }}>
            <h3 style={{ fontSize: 19 }}>Chưa check-in (trong lớp)</h3>
            {absent.length === 0 ? <p className="muted">Tất cả các bé trong lớp đã được check-in buổi này.</p> : (
              <div className="grid" style={{ '--min': '200px', '--gap': '8px' }}>
                {absent.map((r) => (
                  <button type="button" key={r.kid.id} className={`roster-row ${pick?.kidId === r.kid.id ? 'selected' : ''}`} aria-pressed={pick?.kidId === r.kid.id}
                    onClick={() => choose({ kidId: r.kid.id, name: r.kid.name, code: r.kid.code, mode: 'checkin' })}>
                    <KidFace name={r.kid.name} size={36} /><span><b>{r.kid.name}</b><span className="small muted" style={{ display: 'block' }}>{r.kid.code} · Check-in bù</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="stack" style={{ '--gap': '8px' }}>
            <h3 style={{ fontSize: 19 }}>Đã check-in, cần tải ảnh điểm danh bù</h3>
            {present.length === 0 ? <p className="muted">Chưa có bé nào check-in buổi này.</p> : (
              <div className="grid" style={{ '--min': '260px', '--gap': '8px' }}>
                {present.map((r) => {
                  const hasPhoto = !!r.grade?.photo || !!r.attendance.evidence || (r.attendance.extraEvidence || []).length > 0;
                  return (
                    <div key={r.kid.id} className={`roster-row ${pick?.kidId === r.kid.id ? 'selected' : ''}`} style={{ cursor: 'default', flexWrap: 'wrap', border: '2px solid var(--border)' }}>
                      <KidFace name={r.kid.name} size={36} />
                      <span style={{ flex: '1 1 120px', minWidth: 0 }}><b>{r.kid.name}</b>
                        <span className="row" style={{ gap: 4, marginTop: 2 }}>
                          {hasPhoto ? <span className="chip ok"><Icon.check size={14} />Có ảnh</span> : <span className="chip warn">Chưa có ảnh</span>}
                          {r.attendance.makeup && <span className="chip warn">Bổ sung</span>}
                        </span>
                      </span>
                      <button type="button" className="btn sm dark" style={{ marginLeft: 'auto' }} onClick={() => choose({ kidId: r.kid.id, name: r.kid.name, code: r.kid.code, mode: 'evidence', attendanceId: r.attendance.id })}>
                        <Icon.camera size={16} />Tải ảnh bù
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="stack" style={{ '--gap': '8px' }}>
            <h3 style={{ fontSize: 19 }}>Bé học khác lớp / không có trong danh sách</h3>
            <label className="field"><span className="sr-only">Tìm bé khác lớp</span>
              <input className="input" type="search" placeholder="Tìm theo tên, mã bé hoặc SĐT phụ huynh" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            {q.trim().length >= 2 && others.length === 0 && <p className="muted">Không tìm thấy bé nào khác.</p>}
            {others.map((k) => (
              <button type="button" key={k.id} className={`roster-row ${pick?.kidId === k.id ? 'selected' : ''}`} aria-pressed={pick?.kidId === k.id}
                onClick={() => choose({ kidId: k.id, name: k.name, code: k.code, mode: 'checkin', otherClass: true })}>
                <KidFace name={k.name} size={36} /><span><b>{k.name}</b><span className="small muted" style={{ display: 'block' }}>{k.code} · khác lớp · Check-in bù</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {pick && (
        <form id="makeup-form" className="card stack" onSubmit={submit} noValidate aria-label="Ảnh và thông tin bổ sung" style={{ scrollMarginTop: 80 }}>
          <h2 style={{ fontSize: 24 }}>3. {pick.mode === 'evidence' ? `Tải ảnh điểm danh bù cho ${pick.name}` : `Minh chứng và lý do cho ${pick.name}`}</h2>
          {pick.otherClass && <div className="status-bar warn">{pick.name} không thuộc lớp này. Hãy chắc chắn bé có học buổi này.</div>}
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, '--gap': '8px' }}>
            <legend style={{ fontWeight: 800, marginBottom: 6 }}>Loại ảnh (bắt buộc)</legend>
            {EVIDENCE_TYPES.map((t) => (
              <label key={t.key} className="check"><input type="radio" name="evt" value={t.key} checked={evidenceType === t.key} onChange={() => setEvidenceType(t.key)} />{t.label}</label>
            ))}
          </fieldset>
          <PhotoInput value={evidence} onChange={setEvidence} required label={evidenceType === 'painting' ? 'Chụp / tải ảnh tranh bé vẽ trong buổi đó' : 'Chụp / tải ảnh tờ điểm danh giấy (có tên bé, ngày, chữ ký của cô)'} hint="Bắt buộc. Thiếu ảnh sẽ không lưu được." />
          {tried && !evidence && <div className="error-text" role="alert"><Icon.flag size={16} />Chưa có ảnh</div>}

          {pick.mode === 'checkin' && (
            <>
              <label className="field">Lý do (bắt buộc)
                <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Chọn lý do…</option>
                  {MAKEUP_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </label>
              {tried && !reason && <div className="error-text" role="alert"><Icon.flag size={16} />Chưa chọn lý do</div>}
            </>
          )}
          <label className="field">Ghi chú thêm<textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: wifi lớp mất từ 9:10 đến 10:00" /></label>

          {pick.mode === 'checkin' && (
            <>
              <label className="check"><input type="checkbox" checked={withGrade} onChange={(e) => setWithGrade(e.target.checked)} />Nhập luôn điểm chấm tranh của buổi đó</label>
              {withGrade && (
                <div className="stack box tint-mint">
                  <label className="field">Tên tranh<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                  {CRITERIA.map((c) => (
                    <div key={c.key} className="row" style={{ gap: 10 }}>
                      <span style={{ flex: '0 0 100px', fontWeight: 800 }}>{c.label}</span>
                      <div className="row" style={{ gap: 6 }} role="radiogroup" aria-label={c.label}>
                        {Array.from({ length: SCORE_MAX }, (_, i) => i + 1).map((v) => (
                          <button key={v} type="button" role="radio" aria-checked={scores[c.key] === v} aria-label={`${c.label} ${v}`} className={`score-btn ${scores[c.key] >= v ? 'on' : ''}`} onClick={() => setScores({ ...scores, [c.key]: v })}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="display" style={{ fontSize: 22 }}>+{validateScores(scores) ? 0 : convertScore(scores)} điểm (nhãn Bổ sung)</div>
                  {evidenceType === 'painting' && <div className="small muted">Ảnh minh chứng là ảnh tranh nên sẽ được lưu luôn vào bộ sưu tập của bé.</div>}
                </div>
              )}
            </>
          )}
          {pick.mode === 'evidence' && evidenceType === 'painting' && <p className="small muted">Nếu bé đã được chấm mà chưa có ảnh tranh, ảnh này sẽ được lưu vào bộ sưu tập của bé.</p>}
          <div className="status-bar warn">Hệ thống sẽ ghi lại: người làm ({actor.name}), thời điểm làm, buổi học, ảnh{pick.mode === 'checkin' ? ' và lý do' : ''}. Không ai sửa được bản ghi này.</div>
          <div className="row">
            <button type="submit" className="btn primary">{pick.mode === 'evidence' ? 'Lưu ảnh bù' : 'Lưu check-in bù'}</button>
            <button type="button" className="btn" onClick={reset}>Huỷ</button>
          </div>
        </form>
      )}
      <p className="small muted">Buổi học quá {MAKEUP_WINDOW_HOURS} giờ không còn hiện ở đây. Khi đó dùng <Link to="/admin/be">Hồ sơ bé</Link> → Điều chỉnh điểm, bắt buộc ghi lý do.</p>
    </>
  );
}
