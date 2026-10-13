import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { Icon } from '../../components/Icons.jsx';
import { Modal, useAction, useLoad, fmtNum } from '../../components/ui.jsx';

export default function AdminRewards() {
  const { session } = useAuth();
  const run = useAction();
  const [tick, setTick] = useState(0);
  const [list] = useLoad(() => api.listRewards({ includeInactive: true }), [tick]);
  const [edit, setEdit] = useState(null);
  function toggle(r) {
    const res = run(() => api.saveReward(session, { ...r, active: !r.active }), r.active ? 'Đã ẩn ưu đãi' : 'Đã hiện ưu đãi');
    if (res.ok) setTick((t) => t + 1);
  }
  return (
    <>
      <div className="section-head"><h1>Ưu đãi</h1><button type="button" className="btn primary" onClick={() => setEdit({ name: '', cost: '' })}>+ Thêm ưu đãi</button></div>
      <div className="grid" style={{ '--min': '220px' }}>
        {list?.map((r) => (
          <div key={r.id} className="card stack" style={{ opacity: r.active ? 1 : 0.6, '--gap': '10px' }}>
            <div style={{ height: 70, borderRadius: 20, background: `var(--mm-${r.tone || 'teal'}-50)`, display: 'grid', placeItems: 'center' }}><Icon.gift size={36} /></div>
            <b className="display" style={{ fontSize: 20 }}>{r.name}</b>
            <div>{fmtNum(r.cost)} điểm · {r.active ? 'Đang hiện' : 'Đã ẩn'}</div>
            <div className="row"><button type="button" className="btn sm" onClick={() => setEdit(r)}>Sửa</button><button type="button" className="btn sm ghost" onClick={() => toggle(r)}>{r.active ? 'Ẩn' : 'Hiện'}</button></div>
          </div>
        ))}
      </div>
      {edit && <EditModal reward={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); setTick((t) => t + 1); }} />}
    </>
  );
}

function EditModal({ reward, onClose, onDone }) {
  const { session } = useAuth();
  const run = useAction();
  const [f, setF] = useState({ ...reward, cost: String(reward.cost) });
  function submit(e) {
    e.preventDefault();
    const r = run(() => api.saveReward(session, { ...f, cost: Number(f.cost) }), 'Đã lưu ưu đãi');
    if (r.ok) onDone();
  }
  return (
    <Modal title={reward.id ? 'Sửa ưu đãi' : 'Thêm ưu đãi'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label className="field">Tên ưu đãi<input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
        <label className="field">Số điểm cần đổi<input className="input" type="number" min="1" step="1" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} required /></label>
        <button type="submit" className="btn primary">Lưu</button>
      </form>
    </Modal>
  );
}
