import { Link, useOutletContext } from 'react-router-dom';
import { TIERS, POINTS_PER_SCORE } from '../../config/rules.js';
import { maxScoreTotal } from '../../services/logic.js';
import { Duck, Coin, Cup, Icon } from '../../components/Icons.jsx';
import Art from '../../components/Art.jsx';
import { Progress, fmtNum, relDay, fmtTime } from '../../components/ui.jsx';

const POS = [[90, 190], [270, 100], [470, 170], [670, 70]];

function CupMap({ tier, lifetime }) {
  const status = (i) => {
    if (i < tier.index) return 'Đã đạt';
    if (i === tier.index) return 'Hiện tại';
    if (i === tier.index + 1) return `Còn ${fmtNum(TIERS[i].min - lifetime)} điểm`;
    return 'Chưa mở';
  };
  const label = TIERS.map((t, i) => `${t.name}: ${status(i)}`).join(', ');
  return (
    <>
      <svg className="map-wide" role="img" aria-label={`Bản đồ Cúp. ${label}`} viewBox="0 0 760 256" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <path d="M90 190 C 170 190 190 100 270 100 S 400 170 470 170 S 580 70 670 70" style={{ fill: 'none', stroke: 'var(--mm-teal)', opacity: 0.5 }} strokeWidth="6" strokeDasharray="2 14" strokeLinecap="round" />
        {TIERS.map((t, i) => {
          const [x, y] = POS[i];
          return (
            <g key={t.key}>
              <ellipse cx={x} cy={y + 4} rx="38" ry="9" style={{ fill: i <= tier.index ? 'var(--mm-teal-50)' : 'var(--mm-mint-bg)' }} />
              <g transform={`translate(${x - 35} ${y - 64})`}><Cup tier={t.key} size={70} dim={i > tier.index + 1} /></g>
              <text x={x} y={y + 34} textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="700" fontSize="19" style={{ fill: 'var(--mm-teal-dark)' }}>{t.name}</text>
              <text x={x} y={y + 54} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="14" style={{ fill: 'var(--mm-teal-dark)' }}>{status(i)}</text>
              {i === tier.index && (<g><rect x={x - 42} y={y - 94} width="84" height="28" rx="14" style={{ fill: 'var(--mm-yellow)' }} /><text x={x} y={y - 75} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="15" style={{ fill: 'var(--mm-black)' }}>Bé ở đây</text></g>)}
            </g>
          );
        })}
      </svg>
      <ol className="map-list" aria-label="Các hạng Cúp">
        {TIERS.map((t, i) => (
          <li key={t.key} className={i === tier.index ? 'current' : ''}>
            <Cup tier={t.key} size={46} dim={i > tier.index + 1} />
            <div><div className="display" style={{ fontSize: 18 }}>{t.name}</div><div className="small muted">{status(i)}</div></div>
            {i === tier.index && <span className="chip solid-yellow">Bé ở đây</span>}
          </li>
        ))}
      </ol>
    </>
  );
}

export default function Overview() {
  const { summary } = useOutletContext();
  if (!summary) return null;
  const { kid, recent, upcoming, paintings, myRank, rewards } = summary;
  const { tier } = kid;
  const next = upcoming[0];
  const newest = paintings[0];
  return (
    <div className="dash">
      <aside className="dash-aside">
        <section className="card tint-yellow stack hero" aria-label="Điểm của bé">
          <Duck size={170} />
          <h1 style={{ fontSize: 32 }}>Chào {kid.name}!</h1>
          <span className="chip ok"><Cup tier={tier.current.key} size={26} />{tier.current.name}</span>
          <div className="row" style={{ alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
            <span className="big-points">{fmtNum(kid.balance)}</span><span className="display" style={{ fontSize: 26 }}>điểm</span>
          </div>
          <div style={{ width: '100%' }}><Progress value={tier.progress} label={tier.next ? `Tiến độ lên ${tier.next.name}` : 'Đã đạt hạng cao nhất'} /></div>
          <div style={{ fontWeight: 800 }}>{tier.next ? `Còn ${fmtNum(tier.toNext)} điểm nữa lên ${tier.next.name}!` : 'Bé đã đạt hạng cao nhất!'}</div>
          <div className="small muted">Điểm tích luỹ: {fmtNum(kid.lifetime)}</div>
        </section>
        <section className="card tint-pink stack" style={{ '--gap': '12px' }} aria-label="Buổi học sắp tới">
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <span className="avatar light"><Icon.calendar /></span>
            <h2 style={{ fontSize: 24 }}>Buổi học sắp tới</h2>
          </div>
          {next ? (
            <>
              <div><div style={{ fontWeight: 800, fontSize: 18 }}>{next.className}</div><div className="muted">{relDay(next.start)} · {fmtTime(next.start)} – {fmtTime(next.end)} · Chủ đề {next.topic}</div></div>
              <p>Đến lớp nhớ mang mã QR của bé để cô check-in nhé!</p>
            </>
          ) : <p>{kid.classId ? 'Chưa có lịch học mới.' : 'Bé chưa được xếp lớp. MaMoon sẽ liên hệ phụ huynh sớm.'}</p>}
          <div className="chip" style={{ alignSelf: 'flex-start' }}>Mã của bé: {kid.code}</div>
        </section>
      </aside>

      <div className="dash-main">
        <section className="card">
          <div className="section-head"><h2>Bản đồ hành trình Cúp</h2><Link to="/app/quy-tac" style={{ fontWeight: 800 }}>Xem quy tắc lên hạng</Link></div>
          <CupMap tier={tier} lifetime={kid.lifetime} />
        </section>

        <section className="stack" style={{ '--gap': '20px' }}>
          <div><h2>Hôm nay bé làm gì?</h2><div className="muted" style={{ fontSize: 18 }}>Điểm đến từ buổi học tại lớp và đơn hàng</div></div>
          <div className="grid" style={{ '--min': '220px', '--gap': '22px' }}>
            <div className="mission tint-teal">
              <span className="num">1</span>
              <h3>Đến lớp tô tranh</h3>
              <p>Cô chấm tranh tại lớp, điểm vào ví ngay sau buổi học.</p>
              <div className="foot"><span className="chip"><Coin size={20} />Tới {fmtNum(maxScoreTotal() * POINTS_PER_SCORE)}/buổi</span><Link className="btn sm" to="/app/quy-tac">Cách chấm</Link></div>
            </div>
            <div className="mission tint-pink">
              {newest && <span className="sticker">Mới!</span>}
              <span className="num">2</span>
              <h3>Tranh mới của bé</h3>
              <p>{newest ? `"${newest.title}" · +${newest.points} điểm` : 'Tranh bé vẽ ở lớp sẽ được cô chụp và lưu vào đây.'}</p>
              <div className="foot"><span className="chip">{paintings.length ? `${paintings.length} tranh gần đây` : 'Chưa có tranh'}</span><Link className="btn sm dark" to="/app/tranh">Xem tranh</Link></div>
            </div>
            <div className="mission tint-yellow">
              <span className="num">3</span>
              <h3>Bảng xếp hạng</h3>
              <p>{myRank ? `Bé đang hạng ${myRank.rank} tháng này với ${fmtNum(myRank.points)} điểm.` : 'Bé chưa có điểm tháng này.'}</p>
              <div className="foot"><span className="chip">Top 10</span><Link className="btn sm" to="/app/xep-hang">Xem ngay</Link></div>
            </div>
          </div>
        </section>

        <section className="stack" style={{ '--gap': '20px' }}>
          <div className="section-head"><h2>Đổi quà</h2><Link to="/app/uu-dai" style={{ fontWeight: 800 }}>Xem tất cả ưu đãi</Link></div>
          <div className="grid" style={{ '--min': '170px', '--gap': '20px' }}>
            {rewards.map((r) => {
              const enough = kid.balance >= r.cost;
              return (
                <div className="reward" key={r.id}>
                  <div className="thumb" style={{ background: `var(--mm-${r.tone || 'teal'}-50)` }}><Icon.gift size={44} /></div>
                  <div className="name">{r.name}</div>
                  <div className="row" style={{ gap: 6 }}><Coin size={22} />{fmtNum(r.cost)} điểm</div>
                  {enough ? <Link className="btn sm dark" to="/app/uu-dai">Đổi ngay</Link> : (
                    <>
                      <Progress thin value={kid.balance / r.cost} label={`Đã có ${kid.balance} trên ${r.cost} điểm`} />
                      <span className="chip neutral" style={{ justifyContent: 'center', minHeight: 40 }}>Cần thêm {fmtNum(r.cost - kid.balance)} điểm</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 style={{ fontSize: 28 }}>Vừa nhận điểm</h2><Link to="/app/lich-su" style={{ fontWeight: 800 }}>Xem lịch sử</Link></div>
          {recent.length === 0 && <p className="empty">Chưa có hoạt động nào.</p>}
          {recent.map((e) => (
            <div className="activity-row" key={e.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{e.note}</div>
                <div className="small muted">{relDay(e.createdAt)}{e.makeup ? ' · Bổ sung' : ''}</div>
              </div>
              <span className={`amount ${e.amount < 0 ? 'neg' : ''}`}><Coin size={22} />{e.amount > 0 ? '+' : ''}{fmtNum(e.amount)}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
