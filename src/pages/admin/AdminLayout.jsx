import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import * as queue from '../../services/offlineQueue.js';
import { Duck, Icon } from '../../components/Icons.jsx';
import { useToast } from '../../components/ui.jsx';

export default function AdminLayout() {
  const { session, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [offline, setOffline] = useState(queue.isOffline());
  const [pending, setPending] = useState(queue.pendingCount());
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  let openRequests = 0;
  try { openRequests = api.listRequests(session).filter((r) => r.status === 'open').length; } catch { /* bỏ qua */ }

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => queue.subscribe((n) => { setPending(n); setOffline(queue.isOffline()); }), []);
  useEffect(() => {
    const sync = () => {
      setOffline(queue.isOffline());
      if (!queue.isOffline() && queue.pendingCount() > 0) {
        const r = queue.flush(session);
        if (r.sent) toast(`Đã gửi ${r.sent} thao tác lưu tạm lên hệ thống`, 'ok');
        if (r.failed) toast(`${r.failed} thao tác chưa gửi được: ${r.errors[0]}`, 'error');
        refresh();
      }
    };
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); };
  }, [session, toast]);

  function toggleOffline(e) {
    queue.setSimulatedOffline(e.target.checked);
    setOffline(queue.isOffline());
    if (!e.target.checked && queue.pendingCount() > 0) {
      const r = queue.flush(session);
      if (r.sent) toast(`Có mạng lại: đã gửi ${r.sent} thao tác lưu tạm`, 'ok');
      if (r.failed) toast(`${r.failed} thao tác chưa gửi được: ${r.errors[0]}`, 'error');
      refresh();
    }
  }

  const links = [
    { to: '/admin', end: true, label: 'Tổng quan', icon: Icon.home },
    { to: '/admin/buoi-hoc', label: 'Buổi học hôm nay', icon: Icon.calendar },
    { to: '/admin/checkin-bu', label: 'Check-in bù', icon: Icon.clockPlus },
    { to: '/admin/be', label: 'Hồ sơ các bé', icon: Icon.users },
    { to: '/admin/xep-hang', label: 'Bảng xếp hạng', icon: Icon.trophy },
    { to: '/admin/yeu-cau', label: 'Yêu cầu kiểm tra', icon: Icon.inbox, count: openRequests },
    { to: '/admin/uu-dai', label: 'Ưu đãi', icon: Icon.gift },
  ];

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <button type="button" className="btn icon-btn" onClick={() => setOpen(true)} aria-label="Mở menu"><Icon.menu /></button>
        <div className="row" style={{ gap: 6 }}><Duck size={36} /><span className="brand-name" style={{ fontSize: 22 }}>MaMoon</span><span className="chip ok">Admin</span></div>
        <span style={{ width: 48 }} />
      </div>
      {open && <div className="drawer-back" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="admin-layout">
        <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Menu Admin">
          <div className="row" style={{ padding: '0 8px 12px', gap: 8, flexWrap: 'nowrap' }}>
            <Duck size={42} />
            <div><div className="brand-name" style={{ fontSize: 24, lineHeight: 1 }}>MaMoon</div><div className="small muted">Admin</div></div>
          </div>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <l.icon size={20} />{l.label}{l.count > 0 && <span className="badge" aria-label={`${l.count} chưa xử lý`}>{l.count}</span>}
            </NavLink>
          ))}
          <div className="box tint-mint" style={{ marginTop: 12 }}>
            <label className="switch"><input type="checkbox" checked={offline} onChange={toggleOffline} />Giả lập mất mạng</label>
            <div className="small muted" style={{ marginTop: 4 }}>Dùng để thử lưu tạm khi lớp mất mạng.</div>
          </div>
          <div className="row tint-mint" style={{ marginTop: 10, padding: 12, borderRadius: 18, flexWrap: 'nowrap' }}>
            <span className="kid-face" style={{ background: 'var(--mm-pink-50)' }}>{session.name.split(' ').pop()[0]}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800 }}>{session.name}</div><div className="small muted">Admin</div></div>
            <button type="button" className="btn icon-btn sm" onClick={() => { logout(); nav('/login'); }} aria-label="Đăng xuất" title="Đăng xuất"><Icon.logout size={18} /></button>
          </div>
        </nav>
        <main className="admin-main">
          {offline && <div className="status-bar alert" role="status"><Icon.wifiOff />Đang mất mạng: check-in và chấm điểm sẽ được lưu tạm trên máy này.</div>}
          {pending > 0 && <div className="status-bar warn" role="status">Có {pending} thao tác đang chờ gửi{offline ? ', sẽ tự gửi khi có mạng lại' : ''}.</div>}
          <Outlet context={{ tick, refresh }} />
        </main>
      </div>
    </div>
  );
}
