import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Duck } from '../components/Icons.jsx';
import { useToast } from '../components/ui.jsx';

export default function Login() {
  const [tab, setTab] = useState('parent');
  return (
    <div className="login">
      <div className="login-card stack" style={{ '--gap': '18px' }}>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Duck size={64} />
          <span className="brand-name" style={{ fontSize: 36 }}>MaMoon</span>
        </div>
        {/* Gradient thương hiệu chỉ dùng làm mảng trang trí, không đặt chữ lên trên */}
        <div className="brand-banner" aria-hidden="true"><Duck size={88} /></div>
        <div className="card stack">
          <div className="tabs" role="tablist" aria-label="Loại tài khoản">
            <button type="button" role="tab" aria-selected={tab === 'parent'} onClick={() => setTab('parent')}>Phụ huynh</button>
            <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}>Đăng ký</button>
            <button type="button" role="tab" aria-selected={tab === 'admin'} onClick={() => setTab('admin')}>Admin</button>
          </div>
          {tab === 'parent' && <ParentLogin onRegister={() => setTab('register')} />}
          {tab === 'register' && <Register />}
          {tab === 'admin' && <AdminLogin />}
        </div>
        <DemoHelp />
      </div>
    </div>
  );
}

function OtpStep({ phone, onBack, onSubmit, submitLabel }) {
  const [code, setCode] = useState('');
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); onSubmit(code); }}>
      <p>Mã OTP đã gửi tới <b>{phone}</b>.</p>
      <label className="field">Mã OTP
        <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus />
        <span className="hint">Bản demo: mã luôn là 123456</span>
      </label>
      <button className="btn primary block" type="submit" disabled={code.length !== 6}>{submitLabel}</button>
      <button className="btn ghost" type="button" onClick={onBack}>Đổi số điện thoại</button>
    </form>
  );
}

function ParentLogin({ onRegister }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  function send(e) {
    e.preventDefault();
    try {
      const r = api.requestOtp(phone);
      if (!r.exists) { toast('Số này chưa có tài khoản, mời bạn đăng ký', 'error'); onRegister(); return; }
      setStep('otp');
    } catch (x) { toast(x.message, 'error'); }
  }
  const [pendingSession, setPendingSession] = useState(null);
  const [agree, setAgree] = useState(false);
  function verify(code) {
    try {
      const s = api.verifyOtp(phone, code);
      if (s.needsTerms) { setPendingSession(s); setStep('terms'); return; }
      login(s); nav('/app');
    } catch (x) { toast(x.message, 'error'); }
  }
  if (step === 'terms') {
    return (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); try { login(api.acceptTerms(pendingSession)); nav('/app'); } catch (x) { toast(x.message, 'error'); } }}>
        <h1 style={{ fontSize: 28 }}>Chào mừng phụ huynh!</h1>
        <p>Tài khoản của bé đã được cô tạo tại lớp. Trước khi bắt đầu, phụ huynh vui lòng xác nhận:</p>
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>Tôi đồng ý để MaMoon chụp, lưu và hiển thị tranh của bé trên web (bộ sưu tập và bảng xếp hạng).</span></label>
        <button className="btn primary block" type="submit" disabled={!agree}>Đồng ý và tiếp tục</button>
      </form>
    );
  }
  if (step === 'otp') return <OtpStep phone={phone} onBack={() => setStep('phone')} onSubmit={verify} submitLabel="Đăng nhập" />;
  return (
    <form className="stack" onSubmit={send}>
      <h1 style={{ fontSize: 30 }}>Chào phụ huynh!</h1>
      <label className="field">Số điện thoại
        <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </label>
      <button className="btn primary block" type="submit">Nhận mã OTP</button>
    </form>
  );
}

function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ phone: '', parentName: '', kidName: '', birth: '', acceptTerms: false });
  const [step, setStep] = useState('form');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  function next(e) {
    e.preventDefault();
    try {
      const r = api.requestOtp(f.phone);
      if (r.exists) { toast('Số này đã có tài khoản, hãy đăng nhập', 'error'); return; }
      if (!f.acceptTerms) { toast('Cần đồng ý điều khoản để tiếp tục', 'error'); return; }
      setStep('otp');
    } catch (x) { toast(x.message, 'error'); }
  }
  function verify(code) {
    try { login(api.registerParent({ ...f, code })); toast('Tạo tài khoản thành công!', 'ok'); nav('/app'); } catch (x) { toast(x.message, 'error'); }
  }
  if (step === 'otp') return <OtpStep phone={f.phone} onBack={() => setStep('form')} onSubmit={verify} submitLabel="Tạo tài khoản" />;
  return (
    <form className="stack" onSubmit={next}>
      <h1 style={{ fontSize: 30 }}>Tạo tài khoản cho bé</h1>
      <label className="field">Tên bé<input className="input" value={f.kidName} onChange={set('kidName')} required minLength={2} /></label>
      <label className="field">Ngày sinh của bé<input className="input" type="date" value={f.birth} onChange={set('birth')} /></label>
      <label className="field">Tên phụ huynh<input className="input" value={f.parentName} onChange={set('parentName')} autoComplete="name" /></label>
      <label className="field">Số điện thoại phụ huynh<input className="input" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} required /></label>
      <label className="check">
        <input type="checkbox" checked={f.acceptTerms} onChange={set('acceptTerms')} />
        <span>Tôi đồng ý để MaMoon chụp, lưu và hiển thị tranh của bé trên web (bộ sưu tập và bảng xếp hạng). <a href="#/login" onClick={(e) => e.preventDefault()}>Xem điều khoản</a></span>
      </label>
      <button className="btn primary block" type="submit">Tiếp tục</button>
    </form>
  );
}

function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  function submit(e) {
    e.preventDefault();
    try { login(api.loginAdmin(u, p)); nav('/admin'); } catch (x) { toast(x.message, 'error'); }
  }
  return (
    <form className="stack" onSubmit={submit}>
      <h1 style={{ fontSize: 30 }}>Đăng nhập Admin</h1>
      <label className="field">Tên đăng nhập<input className="input" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required /></label>
      <label className="field">Mật khẩu<input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required /></label>
      <button className="btn primary block" type="submit">Đăng nhập</button>
    </form>
  );
}

function DemoHelp() {
  const toast = useToast();
  return (
    <details className="card tint-yellow small">
      <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Tài khoản dùng thử (bản demo)</summary>
      <div className="stack" style={{ marginTop: 10, '--gap': '6px' }}>
        <div>Phụ huynh Bé Na: <b>0900000001</b>, OTP <b>123456</b></div>
        <div>Admin: <b>admin</b> / <b>mamoon123</b></div>
        <div className="muted">Dữ liệu lưu trên trình duyệt này, tên và số điện thoại đều là giả.</div>
        <button type="button" className="btn sm" onClick={() => { api.resetDemo(); toast('Đã đặt lại dữ liệu demo', 'ok'); }}>Đặt lại dữ liệu demo</button>
      </div>
    </details>
  );
}
