import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { useLoad, fmtNum, KidFace, Empty } from '../../components/ui.jsx';

export default function Kids() {
  const { session } = useAuth();
  const { tick } = useOutletContext();
  const [q, setQ] = useState('');
  const [classId, setClassId] = useState('');
  const [classes] = useLoad(() => api.listClasses(), []);
  const [kids] = useLoad(() => api.listKids(session, { q, classId }), [q, classId, tick]);
  return (
    <>
      <h1>Hồ sơ các bé</h1>
      <section className="card stack">
        <div className="row">
          <label className="field" style={{ flex: '2 1 260px' }}><span className="sr-only">Tìm bé</span>
            <input className="input" type="search" placeholder="Tên bé, mã bé hoặc SĐT phụ huynh" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="field" style={{ flex: '1 1 180px' }}><span className="sr-only">Lọc theo lớp</span>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Tất cả lớp</option>
              {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="small muted">{kids?.length || 0} bé</div>
        {kids && kids.length === 0 && <Empty>Không tìm thấy bé nào.</Empty>}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Bé</th><th>Mã</th><th>Hạng</th><th style={{ textAlign: 'right' }}>Điểm hiện có</th><th style={{ textAlign: 'right' }}>Tích luỹ</th></tr></thead>
            <tbody>
              {kids?.map((k, i) => (
                <tr key={k.id}>
                  <td><Link to={`/admin/be/${k.id}`} className="row" style={{ textDecoration: 'none', flexWrap: 'nowrap' }}><KidFace name={k.name} idx={i} size={36} /><b>{k.name}</b></Link></td>
                  <td>{k.code}</td>
                  <td>{k.tier.current.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtNum(k.balance)}</td>
                  <td style={{ textAlign: 'right' }}>{fmtNum(k.lifetime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
