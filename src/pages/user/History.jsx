import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { Coin } from '../../components/Icons.jsx';
import { useLoad, fmtDate, fmtNum, Empty } from '../../components/ui.jsx';
import ReportModal from './ReportModal.jsx';

const KIND = { class: 'Buổi học', makeup: 'Check-in bù', redeem: 'Đổi quà', order: 'Mua hàng', adjust: 'Điều chỉnh', revoke: 'Thu hồi', attendance: 'Chuyên cần' };
const FILTERS = [['all', 'Tất cả'], ['plus', 'Được cộng'], ['minus', 'Bị trừ']];

export default function History() {
  const { session } = useAuth();
  const [list] = useLoad(() => api.getLedger(session, session.kidId), [session.kidId]);
  const [filter, setFilter] = useState('all');
  const [report, setReport] = useState(null);
  const shown = useMemo(() => (list || []).filter((e) => filter === 'all' || (filter === 'plus' ? e.amount >= 0 : e.amount < 0)), [list, filter]);
  if (!list) return null;
  return (
    <div className="stack" style={{ '--gap': '22px' }}>
      <h1>Lịch sử điểm</h1>
      <div className="tabs" role="tablist" aria-label="Lọc lịch sử" style={{ maxWidth: 420 }}>
        {FILTERS.map(([k, l]) => <button type="button" key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      <div className="card">
        {shown.length === 0 && <Empty>Không có mục nào.</Empty>}
        {shown.map((e) => {
          const reportable = !e.revoked && (e.kind === 'class' || e.kind === 'makeup');
          return (
            <div className="activity-row" key={e.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{e.note}</div>
                <div className="small muted">{KIND[e.kind] || e.kind} · {fmtDate(e.occurredAt)}</div>
                <div className="row" style={{ gap: 6, marginTop: 4 }}>
                  {e.makeup && <span className="chip warn">Bổ sung</span>}
                  {e.revoked && <span className="chip alert">Đã thu hồi</span>}
                  {reportable && <button type="button" className="btn sm ghost" style={{ minHeight: 32 }} onClick={() => setReport(e)}>Báo sai</button>}
                </div>
              </div>
              <span className={`amount ${e.amount < 0 ? 'neg' : ''}`}><Coin size={22} />{e.amount > 0 ? '+' : ''}{fmtNum(e.amount)}</span>
            </div>
          );
        })}
      </div>
      {report && (
        <ReportModal
          title={report.note}
          target={report.kind === 'makeup' ? { type: 'attendance', id: report.ref } : { type: 'grade', id: report.ref }}
          onClose={() => setReport(null)}
        />
      )}
    </div>
  );
}
