import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { monthKey } from '../../services/logic.js';
import { Cup } from '../../components/Icons.jsx';
import Art from '../../components/Art.jsx';
import { useLoad, fmtNum, fmtDate, Empty, KidFace } from '../../components/ui.jsx';

// Màu: hạng 1 nền vàng chữ đen; hạng 2, 3 nền mint, phân biệt bằng viền teal / cam (xem .rank-2, .rank-3 trong CSS).
const PODIUM = {
  1: { h: 'clamp(150px, 22vw, 220px)', num: 'clamp(54px, 8vw, 82px)', face: 'clamp(70px, 10vw, 110px)' },
  2: { h: 'clamp(110px, 16vw, 165px)', num: 'clamp(42px, 6vw, 62px)', face: 'clamp(60px, 8vw, 92px)' },
  3: { h: 'clamp(90px, 12vw, 125px)', num: 'clamp(38px, 5vw, 54px)', face: 'clamp(60px, 8vw, 92px)' },
};

function lastMonthKey() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return monthKey(d); }

export function LeaderboardView({ actor }) {
  const [mk, setMk] = useState(monthKey(new Date()));
  const [data] = useLoad(() => api.getLeaderboard(actor, mk), [mk]);
  const [sel, setSelRaw] = useState(null);
  const galleryRef = useRef(null);
  // Trên điện thoại khung tranh nằm dưới danh sách, nên cuộn xuống khi bấm chọn
  const setSel = (id) => {
    setSelRaw(id);
    if (window.innerWidth < 860) setTimeout(() => galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };
  useEffect(() => { setSelRaw(data?.top?.length ? data.top[0].kidId : null); }, [data]);
  if (!data) return null;
  const top = data.top;
  const picked = top.find((r) => r.kidId === sel);
  const podium = [top[1], top[0], top[2]].filter(Boolean);
  const [y, m] = mk.split('-');
  return (
    <div className="stack" style={{ '--gap': '28px' }}>
      <div className="section-head">
        <div><h1>Bảng xếp hạng tháng {Number(m)}/{y}</h1><p className="muted" style={{ fontSize: 18 }}>Top 10 bạn nhỏ nhiều điểm nhất tháng. Bấm vào một bạn để xem tranh nhé!</p></div>
        <div className="tabs" role="tablist" aria-label="Chọn tháng">
          <button type="button" role="tab" aria-selected={mk === monthKey(new Date())} onClick={() => setMk(monthKey(new Date()))}>Tháng này</button>
          <button type="button" role="tab" aria-selected={mk === lastMonthKey()} onClick={() => setMk(lastMonthKey())}>Tháng trước</button>
        </div>
      </div>

      {top.length === 0 ? <div className="card"><Empty>Tháng này chưa có bạn nào có điểm.</Empty></div> : (
        <>
          <div className="podium">
            {podium.map((r) => {
              const p = PODIUM[r.rank];
              return (
                <div className={`col rank-${r.rank}`} key={r.kidId}>
                  <div className="who">
                    {r.rank === 1 && <Cup tier="vang" size={56} />}
                    <span className="face" style={{ width: p.face, height: p.face, fontSize: `calc(${p.face} * 0.42)` }}>{r.name.replace(/^Bé\s+/, '').split(' ').pop()[0]}</span>
                    <span className="display" style={{ fontSize: 'clamp(17px, 2.6vw, 28px)', marginTop: 10, overflowWrap: 'anywhere' }}>{r.name}</span>
                    <span style={{ fontWeight: 800 }}>{fmtNum(r.points)} điểm</span>
                  </div>
                  <div className="block" style={{ height: p.h }}>
                    <span className="rank-num" style={{ fontSize: p.num }}>{r.rank}</span>
                    <span className="rank-label">Hạng {r.rank}</span>
                    <button type="button" className={`btn sm ${r.rank === 1 ? '' : 'dark'}`} onClick={() => setSel(r.kidId)} aria-pressed={sel === r.kidId}>Xem tranh</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="row" style={{ alignItems: 'flex-start', gap: 26 }}>
            <div className="stack" style={{ flex: '1 1 340px', minWidth: 0, '--gap': '12px' }}>
              {top.slice(3).map((r) => (
                <button type="button" key={r.kidId} className={`lb-row ${sel === r.kidId ? 'selected' : ''}`} onClick={() => setSel(r.kidId)} aria-pressed={sel === r.kidId}>
                  <span className="lb-badge">{r.rank}</span>
                  <span className="display" style={{ flex: 1, minWidth: 0, fontSize: 21 }}>{r.name}</span>
                  <span style={{ fontWeight: 800 }}>{fmtNum(r.points)} điểm</span>
                </button>
              ))}
              {data.mine.map((r) => (
                <div key={r.kidId} className="mine-row" style={{ marginTop: 8 }}>
                  <span className="lb-badge">{r.rank}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 20 }}>{r.name} của bạn · {fmtNum(r.points)} điểm</div>
                    <div>{r.rank <= 10 ? 'Bé đang ở trong Top 10, giỏi quá!' : `Còn ${fmtNum(data.cutoff - r.points + 1)} điểm nữa là vào Top 10 rồi đó!`}</div>
                  </div>
                </div>
              ))}
            </div>

            <section ref={galleryRef} className="card stack" style={{ flex: '1.3 1 380px', minWidth: 0, scrollMarginTop: 16 }} aria-live="polite">
              {picked && (
                <>
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <span className={`lb-badge ${picked.rank === 1 ? 'gold' : ''}`} style={{ width: 56, height: 56, fontSize: 24 }}>{picked.rank}</span>
                    <div style={{ minWidth: 0 }}><h2 style={{ fontSize: 28 }}>Tranh của {picked.name}</h2><div className="muted">Hạng {picked.rank} · {fmtNum(picked.points)} điểm</div></div>
                  </div>
                  {picked.paintings.length === 0 ? <Empty>Bạn này chưa có ảnh tranh trong tháng.</Empty> : (
                    <div className="grid" style={{ '--min': '140px', '--gap': '14px' }}>
                      {picked.paintings.map((p) => (
                        <figure key={p.id} style={{ margin: 0 }} className="stack">
                          <Art photo={p.photo} title={p.title} />
                          <figcaption style={{ fontWeight: 800, fontSize: 15 }}>{p.title}<div className="small muted">{fmtDate(p.createdAt)}</div></figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default function Leaderboard() {
  const { session } = useAuth();
  return <LeaderboardView actor={session} />;
}
