import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../services/api.js';
import { Modal, useAction } from '../../components/ui.jsx';

/** Phụ huynh báo sai một mục điểm / buổi học. target: { type: 'grade'|'attendance'|'ledger', id } */
export default function ReportModal({ title, target, onClose }) {
  const { session } = useAuth();
  const run = useAction();
  const [msg, setMsg] = useState('');
  function submit(e) {
    e.preventDefault();
    const r = run(() => api.createRequest(session, { kidId: session.kidId, target, message: msg }), 'Đã gửi, cô sẽ kiểm tra và phản hồi sớm');
    if (r.ok) onClose();
  }
  return (
    <Modal title="Báo sai thông tin" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p>Mục: <b>{title}</b></p>
        <label className="field">Phụ huynh thấy chưa đúng ở đâu?
          <textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ví dụ: hôm đó bé nghỉ học / điểm chưa đúng…" required minLength={5} />
        </label>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>Huỷ</button>
          <button type="submit" className="btn primary">Gửi cho cô</button>
        </div>
      </form>
    </Modal>
  );
}
