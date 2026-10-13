// Hiển thị ảnh tranh: ảnh thật (data URL / URL) hoặc tranh minh hoạ cho dữ liệu mẫu ("art:fish").
// Tranh minh hoạ chỉ dùng màu brand (biến CSS).
const c = (token, extra) => ({ fill: `var(--${token})`, ...extra });
const BG = { fish: 'mm-teal-50', house: 'mm-yellow-50', flower: 'mm-mint-bg', rocket: 'mm-teal-dark', cat: 'mm-pink-50', tree: 'mm-orange-50' };

function Drawing({ kind }) {
  switch (kind) {
    case 'fish':
      return (<><path d="M0 104c20-8 40 8 60 0s40-8 60 0 40 8 60 0v31H0z" style={c('mm-teal')} /><ellipse cx="88" cy="62" rx="40" ry="24" style={c('mm-orange')} /><path d="M126 62l26-18v36z" style={c('mm-pink')} /><path d="M70 44c6 10 6 26 0 36M88 40c6 12 6 32 0 44" style={{ stroke: 'var(--mm-yellow)', strokeWidth: 6, fill: 'none' }} /><circle cx="62" cy="56" r="5" style={c('mm-black')} /></>);
    case 'house':
      return (<><circle cx="146" cy="30" r="16" style={c('mm-yellow')} /><rect x="0" y="104" width="180" height="31" style={c('mm-teal')} /><rect x="56" y="60" width="64" height="46" style={c('mm-pink')} /><path d="M48 64l40-32 40 32z" style={c('mm-teal-dark')} /><rect x="80" y="78" width="16" height="28" style={c('bg-card')} /><circle cx="30" cy="82" r="16" style={c('mm-orange')} /><rect x="28" y="90" width="4" height="16" style={c('mm-teal-dark')} /></>);
    case 'flower':
      return (<><path d="M40 135V76M90 135V62M140 135V80" style={{ stroke: 'var(--mm-teal)', strokeWidth: 5 }} /><circle cx="40" cy="68" r="16" style={c('mm-pink')} /><circle cx="40" cy="68" r="6" style={c('mm-yellow')} /><circle cx="90" cy="54" r="20" style={c('mm-orange')} /><circle cx="90" cy="54" r="7" style={c('mm-yellow')} /><circle cx="140" cy="72" r="14" style={c('mm-pink')} /><circle cx="140" cy="72" r="5" style={c('bg-card')} /></>);
    case 'rocket':
      return (<><circle cx="30" cy="24" r="3" style={c('mm-yellow')} /><circle cx="150" cy="40" r="3" style={c('mm-yellow')} /><circle cx="120" cy="16" r="2" style={c('mm-yellow')} /><path d="M90 18c18 14 22 40 14 70H76c-8-30-4-56 14-70z" style={c('bg-card')} /><circle cx="90" cy="54" r="9" style={c('mm-teal')} /><path d="M76 74l-14 18h16zM104 74l14 18h-16z" style={c('mm-pink')} /><path d="M80 90l10 22 10-22z" style={c('mm-orange')} /></>);
    case 'cat':
      return (<><ellipse cx="90" cy="96" rx="44" ry="28" style={c('mm-black')} /><circle cx="60" cy="70" r="24" style={c('mm-black')} /><path d="M42 54l4-20 12 14zM70 48l10-16 2 20z" style={c('mm-black')} /><circle cx="52" cy="68" r="4" style={c('mm-yellow')} /><circle cx="68" cy="68" r="4" style={c('mm-yellow')} /><path d="M132 96c18 0 22-20 10-26" style={{ stroke: 'var(--mm-black)', strokeWidth: 8, fill: 'none' }} strokeLinecap="round" /><circle cx="140" cy="118" r="12" style={c('mm-pink')} /></>);
    default:
      return (<><rect x="0" y="110" width="180" height="25" style={c('mm-teal')} /><rect x="84" y="64" width="12" height="48" style={c('mm-teal-dark')} /><circle cx="90" cy="54" r="34" style={c('mm-teal')} /><circle cx="76" cy="48" r="5" style={c('mm-pink')} /><circle cx="100" cy="40" r="5" style={c('mm-pink')} /><circle cx="104" cy="62" r="5" style={c('mm-pink')} /></>);
  }
}

export default function Art({ photo, title = 'Tranh của bé' }) {
  if (!photo) {
    return (
      <div className="painting" role="img" aria-label={`${title}: chưa có ảnh`} style={{ display: 'grid', placeItems: 'center' }}>
        <span className="small muted">Chưa có ảnh</span>
      </div>
    );
  }
  if (photo.startsWith('art:')) {
    const kind = photo.slice(4);
    return (
      <div className="painting" role="img" aria-label={title} style={{ background: `var(--${BG[kind] || 'mm-mint-bg'})` }}>
        <svg viewBox="0 0 180 135" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><Drawing kind={kind} /></svg>
      </div>
    );
  }
  return <div className="painting"><img src={photo} alt={title} loading="lazy" /></div>;
}
