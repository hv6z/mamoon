import { TIERS, CRITERIA, POINTS_PER_SCORE, MAKEUP_WINDOW_HOURS, VOUCHER_DAYS, SCORE_MAX } from '../../config/rules.js';
import { Cup } from '../../components/Icons.jsx';
import { fmtNum } from '../../components/ui.jsx';

export default function Rules() {
  return (
    <div className="stack" style={{ '--gap': '22px', maxWidth: 900 }}>
      <h1>Quy tắc tích điểm</h1>
      <section className="card stack">
        <h2>Bé nhận điểm thế nào?</h2>
        <ul className="stack" style={{ margin: 0, paddingLeft: 22, '--gap': '8px' }}>
          <li><b>Học tại lớp:</b> cô check-in khi bé đến lớp, chấm tranh theo {CRITERIA.length} tiêu chí ({CRITERIA.map((c) => c.label.toLowerCase()).join(', ')}), mỗi tiêu chí 1 đến {SCORE_MAX} điểm. Điểm thưởng = tổng điểm chấm × {POINTS_PER_SCORE}.</li>
          <li><b>Mua hàng tại MaMoon:</b> điểm được cộng khi đơn hoàn tất.</li>
          <li><b>Check-in bù:</b> nếu lớp mất mạng hoặc cô quên check-in, cô có thể bổ sung trong {MAKEUP_WINDOW_HOURS} giờ sau buổi học, kèm ảnh minh chứng. Mục này hiện nhãn "Bổ sung". Nếu thấy sai, phụ huynh bấm "Báo sai" trong Lịch sử điểm.</li>
        </ul>
      </section>
      <section className="card stack">
        <h2>Hạng Cúp</h2>
        <p className="muted">Xét theo tổng điểm tích luỹ, đổi quà không làm tụt hạng.</p>
        <div className="grid" style={{ '--min': '160px' }}>
          {TIERS.map((t) => (
            <div key={t.key} className="stack" style={{ alignItems: 'center', textAlign: 'center', '--gap': '4px' }}>
              <Cup tier={t.key} size={64} />
              <div className="display" style={{ fontSize: 20 }}>{t.name}</div>
              <div className="muted">Từ {fmtNum(t.min)} điểm</div>
            </div>
          ))}
        </div>
      </section>
      <section className="card stack">
        <h2>Đổi quà và voucher</h2>
        <p>Đổi quà sẽ trừ vào số điểm hiện có. Voucher dùng được trong {VOUCHER_DAYS} ngày.</p>
      </section>
      <section className="card stack">
        <h2>Bảng xếp hạng</h2>
        <p>Mỗi tháng xếp Top 10 theo điểm bé nhận được trong tháng (tính theo ngày buổi học). Hạng 1 nổi bật màu vàng; hạng 2 và 3 có viền màu riêng. Phụ huynh có thể xem tranh của các bạn trong Top.</p>
      </section>
      <section className="card tint-pink stack">
        <h2>Ảnh tranh của bé</h2>
        <p>Khi đăng ký, phụ huynh đã đồng ý để MaMoon chụp, lưu và hiển thị tranh của bé trong bộ sưu tập và bảng xếp hạng. Bảng xếp hạng chỉ hiện tên gọi của bé, không hiện số điện thoại hay thông tin khác.</p>
      </section>
      <p className="small muted">Các con số trong trang này đang chờ MaMoon chốt và có thể thay đổi.</p>
    </div>
  );
}
