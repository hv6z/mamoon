import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { useLoad, fmtNum, fmtTime, relDay } from '../../components/ui.jsx';


export default function AdminOverview() {
  const { session } = useAuth();
  const { tick } = useOutletContext();
  const [d] = useLoad(() => api.getAdminOverview(session), [tick]);
  if (!d) return null;
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  return (
    <>
      <div className="section-head">
        <div><h1>Chào {session.name}</h1><div className="muted" style={{ textTransform: 'capitalize' }}>{today}</div></div>
        <Link className="btn primary" to="/admin/buoi-hoc">Mở buổi học hôm nay</Link>
      </div>
      <div className="grid" style={{ '--min': '190px', '--gap': '16px' }}>
        <div className="kpi tint-teal"><span>Tổng số bé</span><span className="v">{fmtNum(d.kidCount)}</span><span className="small">+{d.newKidsThisMonth} bé mới tháng này</span></div>
        <div className="kpi tint-yellow"><span>Check-in hôm nay</span><span className="v">{d.checkedInToday} / {d.expectedToday}</span><span className="small">{d.todaySessions.length} buổi học</span></div>
        <div className="kpi tint-pink"><span>Điểm đã phát tháng này</span><span className="v">{fmtNum(d.monthPoints)}</span></div>
        <div className="kpi tint-orange"><span>Ảnh tranh đã lưu</span><span className="v">{fmtNum(d.photoCount)}</span></div>
      </div>

      <div className="row" style={{ alignItems: 'stretch', gap: 22 }}>
        <section className="card stack" style={{ flex: '2 1 440px', minWidth: 0 }}>
          <div className="section-head"><h2 style={{ fontSize: 26 }}>Buổi học hôm nay</h2><Link to="/admin/buoi-hoc" style={{ fontWeight: 800 }}>Xem tất cả</Link></div>
          {d.todaySessions.length === 0 && <p className="muted">Hôm nay không có buổi học.</p>}
          {d.todaySessions.map(({ session: s, stats }) => {
            const started = new Date(s.start) <= new Date();
            return (
              <div key={s.id} className="row box tint-mint" style={{ gap: 16 }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div className="display" style={{ fontSize: 20 }}>{s.className}</div>
                  <div className="small muted">{relDay(s.start)} · {fmtTime(s.start)} – {fmtTime(s.end)} · Chủ đề {s.topic}</div>
                </div>
                <div className="grid" style={{ flex: '2 1 260px', '--min': '80px', '--gap': '10px' }}>
                  {[['Check-in', stats.checkedIn, ''], ['Đã chấm', stats.graded, 'orange'], ['Có ảnh', stats.withPhoto, 'pink']].map(([l, v, tone]) => (
                    <div key={l}><div className="small">{l}</div><div className={`progress thin ${tone}`} style={{ margin: '4px 0' }} role="progressbar" aria-label={l} aria-valuenow={v} aria-valuemin={0} aria-valuemax={stats.total}><span style={{ width: `${stats.total ? (v / stats.total) * 100 : 0}%` }} /></div><div className="small">{v} / {stats.total}</div></div>
                  ))}
                </div>
                <Link className={`btn sm ${started ? 'dark' : ''}`} to={`/admin/buoi-hoc?s=${s.id}`}>{started ? 'Tiếp tục' : 'Mở lớp'}</Link>
              </div>
            );
          })}
        </section>
        <section className="card stack" style={{ flex: '1 1 280px', minWidth: 0, '--gap': '10px' }}>
          <h2 style={{ fontSize: 26 }}>Việc cần làm</h2>
          <Link to="/admin/yeu-cau" className="todo alert"><span className="ring">{d.openRequests}</span>Yêu cầu kiểm tra lại từ phụ huynh</Link>
          {d.todaySessions.map(({ session: s, stats }) => stats.checkedIn - stats.graded > 0 && (
            <Link key={s.id} to={`/admin/buoi-hoc?s=${s.id}`} className="todo warn"><span className="ring">{stats.checkedIn - stats.graded}</span>Bé đã check-in nhưng chưa chấm ({s.className})</Link>
          ))}
          {d.todaySessions.map(({ session: s, stats }) => stats.graded - stats.withPhoto > 0 && (
            <Link key={`p${s.id}`} to={`/admin/buoi-hoc?s=${s.id}`} className="todo warn"><span className="ring">{stats.graded - stats.withPhoto}</span>Tranh đã chấm nhưng chưa có ảnh</Link>
          ))}
          <Link to="/admin/checkin-bu" className="todo ok"><span className="ring" aria-hidden="true">+</span>Check-in bù / tải ảnh điểm danh bù (trong 48 giờ)</Link>
        </section>
      </div>

      <div className="row" style={{ alignItems: 'stretch', gap: 22 }}>
        <section className="card stack" style={{ flex: '1 1 320px', minWidth: 0, '--gap': '10px' }}>
          <div className="section-head"><h2 style={{ fontSize: 26 }}>Xếp hạng tháng này</h2><Link to="/admin/xep-hang" style={{ fontWeight: 800 }}>Xem Top 10</Link></div>
          {d.top5.map((r) => (
            <Link key={r.kidId} to={`/admin/be/${r.kidId}`} className={`lb-row ${r.rank === 1 ? 'rank-1' : ''}`} style={{ minHeight: 52, textDecoration: 'none' }}>
              <span className="lb-badge" style={{ width: 34, height: 34, fontSize: 16 }}>{r.rank}</span><span style={{ flex: 1, fontWeight: 800 }}>{r.name}</span><span className="display" style={{ fontSize: 20 }}>{fmtNum(r.points)}</span>
            </Link>
          ))}
        </section>
        <section className="card stack" style={{ flex: '2 1 440px', minWidth: 0 }}>
          <h2 style={{ fontSize: 26 }}>Hoạt động gần đây</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Lúc</th><th>Bé</th><th>Hoạt động</th><th style={{ textAlign: 'right' }}>Điểm</th></tr></thead>
              <tbody>
                {d.recent.map((e) => (
                  <tr key={e.id}>
                    <td>{relDay(e.createdAt)} {fmtTime(e.createdAt)}</td>
                    <td><Link to={`/admin/be/${e.kidId}`} style={{ fontWeight: 800 }}>{e.kidName}</Link></td>
                    <td>{e.note}{e.makeup && <span className="chip warn" style={{ marginLeft: 6 }}>Bổ sung</span>}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--mm-teal-dark)' }}>{e.amount > 0 ? '+' : ''}{fmtNum(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
