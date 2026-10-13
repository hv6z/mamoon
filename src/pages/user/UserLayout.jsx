import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { Duck, Coin, Icon } from '../../components/Icons.jsx';
import { useLoad, fmtNum } from '../../components/ui.jsx';

const NAV = [
  { to: '/app', end: true, label: 'Tổng quan', icon: Icon.home },
  { to: '/app/tranh', label: 'Tranh của bé', short: 'Tranh', icon: Icon.palette },
  { to: '/app/xep-hang', label: 'Xếp hạng', icon: Icon.trophy },
  { to: '/app/uu-dai', label: 'Đổi quà', icon: Icon.gift },
  { to: '/app/lich-su', label: 'Lịch sử', icon: Icon.history },
];

export default function UserLayout() {
  const { session, logout } = useAuth();
  const nav = useNavigate();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [sum] = useLoad(() => api.getKidSummary(session, session.kidId), [session.kidId, tick]);
  const kid = sum?.kid;
  return (
    <div className="user-shell">
      <div className="user-wrap">
        <header className="topbar">
          <Link to="/app" className="brand" aria-label="MaMoon, về trang tổng quan"><Duck size={50} /><span className="brand-name">MaMoon</span></Link>
          <nav className="pillnav" aria-label="Menu chính">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>)}
            <NavLink to="/app/quy-tac" className={({ isActive }) => (isActive ? 'active' : '')}>Quy tắc</NavLink>
          </nav>
          <div className="top-right">
            {kid && <Link to="/app/lich-su" className="coin-pill" aria-label={`${kid.balance} điểm`}><Coin size={30} />{fmtNum(kid.balance)}</Link>}
            <Link to="/app/thong-bao" className="avatar light bell" aria-label={`Thông báo${sum?.unread ? `, ${sum.unread} chưa đọc` : ''}`}>
              <Icon.bell />{sum?.unread > 0 && <span className="badge">{sum.unread}</span>}
            </Link>
            <button type="button" className="avatar" onClick={() => { logout(); nav('/login'); }} aria-label="Đăng xuất" title="Đăng xuất">
              {kid ? kid.name.replace(/^Bé\s+/, '')[0] : '?'}
            </button>
          </div>
        </header>
        <main>
          <Outlet context={{ summary: sum, refresh }} />
        </main>
      </div>
      <nav className="bottomnav" aria-label="Menu chính">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <n.icon size={22} />{n.short || n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
