import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { Icon } from '../../components/Icons.jsx';
import { useLoad, fmtDate, Empty } from '../../components/ui.jsx';

export default function Notifications() {
  const { session } = useAuth();
  const { refresh } = useOutletContext();
  const [list] = useLoad(() => api.getNotifications(session, session.kidId), [session.kidId]);
  useEffect(() => { if (list) refresh(); }, [list]); // cập nhật số chưa đọc trên thanh trên
  if (!list) return null;
  return (
    <div className="stack" style={{ '--gap': '22px', maxWidth: 820 }}>
      <h1>Thông báo</h1>
      <div className="card">
        {list.length === 0 && <Empty>Chưa có thông báo.</Empty>}
        {list.map((n) => (
          <div className="activity-row" key={n.id}>
            <span className={`avatar ${n.read ? 'light' : ''}`} style={{ width: 40, height: 40 }}><Icon.bell size={18} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: n.read ? 700 : 800 }}>{n.text}</div>
              <div className="small muted">{fmtDate(n.createdAt, true)}</div>
            </div>
            {!n.read && <span className="chip alert">Mới</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
