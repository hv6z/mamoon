// Các quy tắc nghiệp vụ. Những giá trị đánh dấu CHỜ CHỐT cần cô xác nhận trước khi chạy thật.

// Hạng Cup, xét theo tổng điểm tích luỹ (không trừ điểm đã dùng để đổi quà). CHỜ CHỐT ngưỡng.
export const TIERS = [
  { key: 'dong', name: 'Cúp Đồng', min: 0 },
  { key: 'bac', name: 'Cúp Bạc', min: 200 },
  { key: 'vang', name: 'Cúp Vàng', min: 500 },
  { key: 'kimcuong', name: 'Cúp Kim Cương', min: 1000 },
];

// Tiêu chí chấm tranh, mỗi tiêu chí 1 đến 5.
export const CRITERIA = [
  { key: 'color', label: 'Màu sắc' },
  { key: 'creative', label: 'Sáng tạo' },
  { key: 'neat', label: 'Gọn gàng' },
];
export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

// Quy đổi: điểm thưởng = tổng điểm chấm x hệ số. CHỜ CHỐT.
export const POINTS_PER_SCORE = 2;

// Điểm chuyên cần khi check-in. CHỜ CHỐT (đang để 0).
export const ATTENDANCE_POINTS = 0;

// Check-in bù chỉ được làm trong khoảng này sau khi buổi học kết thúc.
export const MAKEUP_WINDOW_HOURS = 48;

export const MAKEUP_REASONS = [
  { key: 'offline', label: 'Mất mạng tại lớp' },
  { key: 'system', label: 'Web hoặc máy bị lỗi' },
  { key: 'forgot', label: 'Quên check-in' },
];

export const EVIDENCE_TYPES = [
  { key: 'painting', label: 'Ảnh tranh của bé trong buổi đó' },
  { key: 'sheet', label: 'Ảnh tờ điểm danh giấy' },
];

// Voucher hết hạn sau số ngày này kể từ lúc đổi.
export const VOUCHER_DAYS = 30;

// Bảng xếp hạng lấy bao nhiêu bạn.
export const LEADERBOARD_SIZE = 10;

// Mã OTP dùng cho bản demo (bản thật sẽ gửi SMS).
export const DEMO_OTP = '123456';
