import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { Coin, Icon } from '../../components/Icons.jsx';
import { Modal, Progress, useLoad, useAction, fmtDate, fmtNum, Empty } from '../../components/ui.jsx';

const STATUS = { unused: ['Chưa dùng', 'mint'], used: ['Đã dùng', 'sky'], expired: ['Hết hạn', 'danger'] };

export default function Rewards() {
  const { session } = useAuth();
  const { summary, refresh } = useOutletContext();
  const run = useAction();
  const [tick, setTick] = useState(0);
  const [rewards] = useLoad(() => api.listRewards(), [tick]);
  const [vouchers] = useLoad(() => api.getVouchers(session, session.kidId), [session.kidId, tick]);
  const [confirm, setConfirm] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!summary || !rewards) return null;
  const balance = summary.kid.balance;

  function doRedeem() {
    if (busy) return; // chống bấm 2 lần
    setBusy(true);
    const r = run(() => api.redeem(session, session.kidId, confirm.id));
    setBusy(false);
    setConfirm(null);
    if (r.ok) { setDone(r.value); setTick((t) => t + 1); refresh(); }
  }

  return (
    <div className="stack" style={{ '--gap': '24px' }}>
      <div className="section-head"><h1>Đổi quà</h1><span className="chip"><Coin size={22} />Bé đang có {fmtNum(balance)} điểm</span></div>
      <div className="grid" style={{ '--min': '180px', '--gap': '20px' }}>
        {rewards.map((r) => {
          const enough = balance >= r.cost;
          return (
            <div className="reward" key={r.id}>
              <div className="thumb" style={{ background: `var(--mm-${r.tone || 'teal'}-50)` }}><Icon.gift size={44} /></div>
              <div className="name">{r.name}</div>
              <div className="row" style={{ gap: 6 }}><Coin size={22} />{fmtNum(r.cost)} điểm</div>
              {enough ? <button type="button" className="btn sm dark" onClick={() => setConfirm(r)}>Đổi ngay</button> : (
                <>
                  <Progress thin value={balance / r.cost} label={`Đã có ${balance} trên ${r.cost} điểm`} />
                  <span className="chip neutral" style={{ justifyContent: 'center', minHeight: 40 }}>Cần thêm {fmtNum(r.cost - balance)} điểm</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <section className="card stack">
        <h2>Voucher của bé</h2>
        {(!vouchers || vouchers.length === 0) && <Empty>Chưa đổi voucher nào.</Empty>}
        {vouchers?.map((v) => (
          <div className="activity-row" key={v.id}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{v.name}</div>
              <div className="small muted">Đổi ngày {fmtDate(v.createdAt)} · Hạn {fmtDate(v.expiresAt)}</div>
            </div>
            <span className="chip" style={{ fontFamily: 'monospace', fontSize: 16 }}>{v.code}</span>
            <span className={`chip flat ${STATUS[v.status][1]}`}>{STATUS[v.status][0]}</span>
          </div>
        ))}
        <p className="small muted">Đưa mã voucher cho nhân viên MaMoon khi nhận quà.</p>
      </section>

      {confirm && (
        <Modal title="Xác nhận đổi quà" onClose={() => setConfirm(null)}>
          <div className="stack">
            <p>Đổi <b>{confirm.name}</b> với <b>{fmtNum(confirm.cost)} điểm</b>?</p>
            <p className="muted">Sau khi đổi, bé còn {fmtNum(balance - confirm.cost)} điểm. Điểm đã đổi không hoàn lại.</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setConfirm(null)}>Để sau</button>
              <button type="button" className="btn primary" onClick={doRedeem} disabled={busy}>Đổi quà</button>
            </div>
          </div>
        </Modal>
      )}
      {done && (
        <Modal title="Đổi thành công!" onClose={() => setDone(null)}>
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
            <p>Mã voucher của bé</p>
            <div className="display" style={{ fontSize: 40, letterSpacing: 2 }}>{done.code}</div>
            <p className="muted">Dùng trước ngày {fmtDate(done.expiresAt)}</p>
            <button type="button" className="btn primary" onClick={() => setDone(null)}>Xong</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
