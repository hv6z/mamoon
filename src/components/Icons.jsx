// Hình vẽ và biểu tượng dùng chung (SVG tự vẽ, không phải logo chính thức).

// Màu lấy từ biến brand (khai báo trong global.css). Dùng style vì thuộc tính fill không nhận var().
const c = (token) => ({ fill: `var(--${token})` });
const st = (token, w) => ({ stroke: `var(--${token})`, strokeWidth: w, fill: 'none' });

export function Duck({ size = 54, title }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <ellipse cx="80" cy="152" rx="46" ry="6" style={c('mm-teal-dark')} opacity="0.12" />
      <ellipse cx="62" cy="148" rx="12" ry="5" style={c('mm-orange')} /><ellipse cx="94" cy="148" rx="12" ry="5" style={c('mm-orange')} />
      <ellipse cx="78" cy="108" rx="52" ry="40" style={c('mm-yellow')} />
      <circle cx="102" cy="58" r="36" style={c('mm-yellow')} />
      <path d="M96 25c-2-8 6-12 10-8-2 2-2 5 0 8z" style={c('mm-orange')} />
      <ellipse cx="62" cy="112" rx="24" ry="17" style={c('mm-orange')} opacity="0.35" />
      <path d="M132 58c14 2 22 7 22 12s-8 8-22 8c-5-5-5-15 0-20z" style={c('mm-orange')} />
      <circle cx="112" cy="52" r="7" style={c('mm-black')} /><circle cx="114.5" cy="49.5" r="2.5" style={c('bg-card')} />
      <ellipse cx="120" cy="68" rx="7" ry="4.5" style={c('mm-pink')} opacity="0.7" />
      <ellipse cx="88" cy="38" rx="12" ry="7" style={c('bg-card')} opacity="0.5" transform="rotate(-25 88 38)" />
    </svg>
  );
}

export function Coin({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" style={{ ...c('mm-yellow'), stroke: 'var(--mm-orange)', strokeWidth: 4 }} />
      <polygon points="32,18 36,27 46,28 38.5,34.5 40.8,44.5 32,39.3 23.2,44.5 25.5,34.5 18,28 28,27" style={c('mm-orange')} />
    </svg>
  );
}

// Cúp theo bảng màu brand: Đồng = cam, Bạc = teal nhạt, Vàng = vàng, Kim Cương = teal.
const CUP = {
  dong: ['mm-orange', 'mm-orange'],
  bac: ['mm-teal-50', 'mm-teal'],
  vang: ['mm-yellow', 'mm-orange'],
  kimcuong: ['mm-teal', 'mm-teal-dark'],
};
export function Cup({ tier = 'dong', size = 64, dim = false }) {
  const [body, base] = CUP[tier] || CUP.dong;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ opacity: dim ? 0.5 : 1 }}>
      <path d="M17 9h30v15c0 11-7 18-15 18s-15-7-15-18z" style={{ ...c(body), stroke: `var(--${base})`, strokeWidth: 2.5 }} />
      <path d="M17 13H9c0 9 4 14 10 15M47 13h8c0 9-4 14-10 15" style={st(base, 4)} strokeLinecap="round" />
      <rect x="28" y="41" width="8" height="9" style={c(base)} /><rect x="19" y="50" width="26" height="9" rx="4" style={c('mm-teal-dark')} />
      <path d="M22 13v10c0 6 2 10 5 12" style={{ ...st('bg-card', 3), opacity: 0.7 }} strokeLinecap="round" />
    </svg>
  );
}

function Stroke({ size = 22, children, label }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      {children}
    </svg>
  );
}
export const Icon = {
  home: (p) => <Stroke {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Stroke>,
  palette: (p) => <Stroke {...p}><path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z" /><circle cx="7.5" cy="11" r="1.2" /><circle cx="10" cy="7" r="1.2" /><circle cx="15" cy="7.5" r="1.2" /></Stroke>,
  history: (p) => <Stroke {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></Stroke>,
  gift: (p) => <Stroke {...p}><path d="M4 11h16v9H4z" /><path d="M3 7h18v4H3z" /><path d="M12 7v13" /><path d="M12 7c-1-3-5-3-5-1 0 1.5 3 1 5 1zM12 7c1-3 5-3 5-1 0 1.5-3 1-5 1z" /></Stroke>,
  trophy: (p) => <Stroke {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4c0 3 1 5 3 5M17 6h3c0 3-1 5-3 5" /></Stroke>,
  book: (p) => <Stroke {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></Stroke>,
  bell: (p) => <Stroke {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></Stroke>,
  logout: (p) => <Stroke {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Stroke>,
  camera: (p) => <Stroke {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="4" /></Stroke>,
  check: (p) => <Stroke {...p}><path d="M5 12l5 5 9-10" /></Stroke>,
  search: (p) => <Stroke {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Stroke>,
  menu: (p) => <Stroke {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Stroke>,
  close: (p) => <Stroke {...p}><path d="M6 6l12 12M18 6L6 18" /></Stroke>,
  calendar: (p) => <Stroke {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" /></Stroke>,
  users: (p) => <Stroke {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-7 7-7s7 3 7 7" /><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-6-5-6.5" /></Stroke>,
  inbox: (p) => <Stroke {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Stroke>,
  clockPlus: (p) => <Stroke {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M19 3v4M17 5h4" /></Stroke>,
  wifiOff: (p) => <Stroke {...p}><path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.3-1.7M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 5" /><circle cx="12" cy="20" r="1" /></Stroke>,
  shield: (p) => <Stroke {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></Stroke>,
  flag: (p) => <Stroke {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Stroke>,
  refresh: (p) => <Stroke {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></Stroke>,
};
