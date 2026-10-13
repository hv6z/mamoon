// Các hàm tính toán thuần (không đọc/ghi dữ liệu) để dễ viết unit test.
import {
  TIERS, CRITERIA, SCORE_MIN, SCORE_MAX, POINTS_PER_SCORE, MAKEUP_WINDOW_HOURS, LEADERBOARD_SIZE,
} from '../config/rules.js';

const HOUR = 3600 * 1000;

/** Số dư hiện có = tổng mọi biến động điểm của bé. */
export function balanceOf(ledger, kidId) {
  return ledger.filter((e) => e.kidId === kidId).reduce((s, e) => s + e.amount, 0);
}

/** Điểm tích luỹ để xét hạng = tổng biến động trừ các lần đổi quà. */
export function lifetimeOf(ledger, kidId) {
  return ledger
    .filter((e) => e.kidId === kidId && e.kind !== 'redeem')
    .reduce((s, e) => s + e.amount, 0);
}

/** Trả về hạng hiện tại, hạng kế tiếp và số điểm còn thiếu. */
export function tierInfo(lifetime) {
  let idx = 0;
  TIERS.forEach((t, i) => { if (lifetime >= t.min) idx = i; });
  const current = TIERS[idx];
  const next = TIERS[idx + 1] || null;
  const toNext = next ? next.min - lifetime : 0;
  const progress = next ? (lifetime - current.min) / (next.min - current.min) : 1;
  return { index: idx, current, next, toNext, progress: Math.max(0, Math.min(1, progress)) };
}

/** Kiểm tra bảng điểm chấm hợp lệ. Trả về chuỗi lỗi hoặc null. */
export function validateScores(scores) {
  if (!scores) return 'Chưa chấm điểm';
  for (const c of CRITERIA) {
    const v = scores[c.key];
    if (!Number.isInteger(v)) return `Chưa chấm tiêu chí "${c.label}"`;
    if (v < SCORE_MIN || v > SCORE_MAX) return `Điểm "${c.label}" phải từ ${SCORE_MIN} đến ${SCORE_MAX}`;
  }
  return null;
}

export function scoreTotal(scores) {
  return CRITERIA.reduce((s, c) => s + (scores?.[c.key] || 0), 0);
}

export function maxScoreTotal() {
  return CRITERIA.length * SCORE_MAX;
}

/** Quy đổi điểm chấm ra điểm thưởng. */
export function convertScore(scores) {
  return scoreTotal(scores) * POINTS_PER_SCORE;
}

/**
 * Có được check-in bù cho buổi học này không.
 * Chỉ khi buổi học đã kết thúc và chưa quá MAKEUP_WINDOW_HOURS giờ.
 */
export function makeupStatus(session, now = Date.now()) {
  const end = new Date(session.end).getTime();
  const start = new Date(session.start).getTime();
  if (now < start) return { ok: false, reason: 'Buổi học chưa diễn ra' };
  if (now <= end) return { ok: false, reason: 'Buổi học đang diễn ra, hãy check-in bình thường' };
  const deadline = end + MAKEUP_WINDOW_HOURS * HOUR;
  if (now > deadline) return { ok: false, reason: `Đã quá ${MAKEUP_WINDOW_HOURS} giờ sau buổi học`, deadline };
  return { ok: true, deadline };
}

export function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Bảng xếp hạng theo tháng: cộng điểm kiếm được trong tháng (tính theo ngày buổi học),
 * không tính lần đổi quà. Chỉ những bé có điểm > 0 mới được xếp.
 */
export function leaderboard(ledger, kids, mKey, size = LEADERBOARD_SIZE) {
  const sums = new Map();
  for (const e of ledger) {
    if (e.kind === 'redeem') continue;
    if (monthKey(e.occurredAt) !== mKey) continue;
    sums.set(e.kidId, (sums.get(e.kidId) || 0) + e.amount);
  }
  const rows = kids
    .map((k) => ({ kidId: k.id, name: k.name, points: sums.get(k.id) || 0 }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'vi'));
  rows.forEach((r, i) => { r.rank = i + 1; });
  return { top: rows.slice(0, size), all: rows };
}

/** Che bớt số điện thoại khi hiển thị cho phụ huynh khác. */
export function maskPhone(phone = '') {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}

export function normalizePhone(phone = '') {
  return phone.replace(/[^\d]/g, '');
}

export function isValidPhone(phone) {
  return /^0\d{9}$/.test(normalizePhone(phone));
}
