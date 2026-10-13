// Dữ liệu mẫu cho bản demo. Tên, số điện thoại đều là giả.
// Sinh ngẫu nhiên có hạt giống cố định để lần nào cũng ra cùng kết quả.
import { POINTS_PER_SCORE } from '../config/rules.js';

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ARTS = ['fish', 'house', 'flower', 'rocket', 'cat', 'tree'];
const TITLES = {
  fish: ['Chú cá bảy màu', 'Cá voi xanh', 'Đàn cá nhỏ'],
  house: ['Ngôi nhà mùa thu', 'Nhà của bé', 'Căn nhà trên đồi'],
  flower: ['Vườn hoa của mẹ', 'Bó hoa tặng cô', 'Hoa hướng dương'],
  rocket: ['Tên lửa lên trăng', 'Phi thuyền vũ trụ', 'Chuyến bay đêm'],
  cat: ['Mèo mun ngủ trưa', 'Chú mèo tinh nghịch', 'Mèo và cuộn len'],
  tree: ['Cây táo sai quả', 'Rừng mùa thu', 'Cây thông Noel'],
};
const TOPICS = ['Đại dương', 'Mùa thu', 'Vũ trụ', 'Khu vườn', 'Thú cưng', 'Gia đình'];
const COMMENTS = [
  'Con phối màu rất tươi, tô đều tay.',
  'Ý tưởng sáng tạo, lần sau thử thêm nền nhé!',
  'Bức tranh gọn gàng, cô rất thích.',
  'Con chăm chỉ lắm, cố gắng tô kín hơn nhé.',
];

const KIDS = [
  ['Bé Na', 'Nguyễn Ngọc Na', 'c1'], ['Gia Hân', 'Trần Gia Hân', 'c1'], ['Minh Khôi', 'Lê Minh Khôi', 'c1'],
  ['Thiên Phúc', 'Phạm Thiên Phúc', 'c1'], ['Khánh Linh', 'Võ Khánh Linh', 'c1'], ['Tuấn Kiệt', 'Đỗ Tuấn Kiệt', 'c1'],
  ['Mai Chi', 'Bùi Mai Chi', 'c1'], ['Hoàng Nam', 'Hoàng Nhật Nam', 'c1'],
  ['Bảo Ngọc', 'Ngô Bảo Ngọc', 'c2'], ['An Nhiên', 'Đặng An Nhiên', 'c2'], ['Đức Anh', 'Huỳnh Đức Anh', 'c2'],
  ['Tú Anh', 'Phan Tú Anh', 'c2'], ['Gia Bảo', 'Trương Gia Bảo', 'c2'], ['Diệp Chi', 'Lý Diệp Chi', 'c2'],
  ['Quang Huy', 'Vũ Quang Huy', 'c2'], ['Thảo Vy', 'Mai Thảo Vy', 'c2'],
];

function at(base, dayOffset, h, m) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function buildSeed(now = new Date()) {
  const r = rng(20261009);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  let n = 0;
  const id = (p) => `${p}${++n}`;

  const classes = [
    { id: 'c1', name: 'Lớp Tô màu Cá Voi', tone: 'teal', start: [9, 0], end: [10, 30] },
    { id: 'c2', name: 'Lớp Thủ công Mèo Mun', tone: 'pink', start: [15, 30], end: [17, 0] },
  ];
  const admins = [
    { id: 'a1', name: 'Cô Dung', username: 'admin', password: 'mamoon123' },
    { id: 'a2', name: 'Cô Vy', username: 'admin2', password: 'mamoon123' },
  ];
  const parents = [];
  const kids = KIDS.map(([name, fullName, classId], i) => {
    const parentId = `p${i + 1}`;
    parents.push({ id: parentId, name: `Phụ huynh ${name}`, phone: `09000000${String(i + 1).padStart(2, '0')}`, acceptedTermsAt: at(now, -60, 10, 0) });
    return {
      id: `k${i + 1}`, parentId, name, fullName, classId,
      code: `MM-${String(40 + i).padStart(4, '0')}`,
      birth: `20${19 + (i % 3)}-0${(i % 9) + 1}-1${i % 9}`,
      joinedAt: at(now, -70 + i, 9, 0),
      createdBy: 'a1',
    };
  });

  // Buổi học: mỗi lớp 2 buổi/tuần trong 6 tuần trước, cộng buổi hôm nay.
  const sessions = [];
  for (const c of classes) {
    const offsets = [];
    for (let w = 0; w < 6; w++) offsets.push(-(w * 7 + 1), -(w * 7 + 4));
    offsets.push(0);
    for (const off of offsets) {
      sessions.push({
        id: id('s'), classId: c.id, topic: pick(TOPICS),
        start: at(now, off, ...c.start), end: at(now, off, ...c.end),
      });
    }
    // Buổi hôm nay đặt theo giờ hiện tại để bản demo lúc nào mở cũng có lớp đang học:
    // lớp 1 bắt đầu 30 phút trước, lớp 2 bắt đầu sau 2 giờ nữa.
    const todaySession = sessions[sessions.length - 1];
    const base = new Date(now); base.setSeconds(0, 0); base.setMinutes(Math.floor(base.getMinutes() / 5) * 5);
    const startMs = c.id === 'c1' ? base.getTime() - 30 * 60e3 : base.getTime() + 120 * 60e3;
    todaySession.start = new Date(startMs).toISOString();
    todaySession.end = new Date(startMs + 90 * 60e3).toISOString();
  }
  sessions.sort((a, b) => a.start.localeCompare(b.start));

  const attendances = []; const grades = []; const ledger = [];
  const nowMs = now.getTime();
  for (const s of sessions) {
    const started = new Date(s.start).getTime() <= nowMs;
    const finished = new Date(s.end).getTime() < nowMs;
    if (!started) continue;
    const roster = kids.filter((k) => k.classId === s.classId);
    roster.forEach((k, idx) => {
      const isToday = !finished;
      // Buổi hôm nay: một nửa đã check-in. Buổi trước: ~80% có mặt.
      const present = isToday ? idx % 2 === 0 : r() < (k.id === 'k1' ? 0.92 : 0.6 + (idx % 4) * 0.08);
      // Buổi gần nhất của lớp 2 để trống vài bé để demo check-in bù.
      if (!present) return;
      const att = {
        id: id('at'), sessionId: s.id, kidId: k.id, checkedInAt: s.start, by: 'a1',
        makeup: false, status: 'active', createdAt: s.start,
      };
      attendances.push(att);
      if (isToday && idx % 4 !== 0) return; // hôm nay: chỉ chấm vài bé
      const art = pick(ARTS);
      const scores = { color: 3 + Math.floor(r() * 3), creative: 2 + Math.floor(r() * 4), neat: 2 + Math.floor(r() * 4) };
      const points = (scores.color + scores.creative + scores.neat) * POINTS_PER_SCORE;
      const g = {
        id: id('g'), attendanceId: att.id, sessionId: s.id, kidId: k.id,
        title: pick(TITLES[art]), art, photo: r() < 0.9 ? `art:${art}` : null,
        scores, comment: pick(COMMENTS), points, by: 'a1', createdAt: s.end,
      };
      grades.push(g);
      ledger.push({ id: id('l'), kidId: k.id, amount: points, kind: 'class', ref: g.id, note: `Buổi học: ${g.title}`, occurredAt: s.start, createdAt: s.end, by: 'a1' });
    });
  }

  const rewards = [
    { id: 'r1', name: 'Giảm 20k đơn hàng', cost: 100, tone: 'teal', active: true },
    { id: 'r2', name: 'Bánh quy mini', cost: 150, tone: 'pink', active: true },
    { id: 'r3', name: 'Bộ bút màu', cost: 400, tone: 'yellow', active: true },
    { id: 'r4', name: 'Thú bông mini', cost: 600, tone: 'orange', active: true },
    { id: 'r5', name: 'Hộp màu nước', cost: 250, tone: 'teal', active: true },
  ];

  // Bé Na đã đổi 1 lần, có 1 đơn hàng.
  const vouchers = [];
  const naRedeemAt = at(now, -6, 18, 0);
  vouchers.push({ id: 'v1', kidId: 'k1', rewardId: 'r2', name: 'Bánh quy mini', code: 'MMV-7Q2K', status: 'unused', createdAt: naRedeemAt, expiresAt: at(now, 24, 23, 59) });
  ledger.push({ id: id('l'), kidId: 'k1', amount: -150, kind: 'redeem', ref: 'v1', note: 'Đổi ưu đãi: Bánh quy mini', occurredAt: naRedeemAt, createdAt: naRedeemAt, by: 'p1' });
  ledger.push({ id: id('l'), kidId: 'k1', amount: 45, kind: 'order', ref: 'MM1082', note: 'Đơn hàng #MM1082', occurredAt: at(now, -1, 19, 0), createdAt: at(now, -1, 19, 0), by: 'system' });

  const notifications = [
    { id: id('n'), kidId: 'k1', text: 'Chào mừng Bé Na đến với MaMoon Rewards!', createdAt: at(now, -60, 10, 0), read: true },
  ];
  const requests = [
    { id: 'rq1', kidId: 'k3', target: null, message: 'Buổi thứ 3 tuần trước bé có đi học nhưng chưa thấy điểm ạ.', status: 'open', createdAt: at(now, -1, 20, 0) },
  ];

  return {
    version: 1, seededAt: now.toISOString(),
    classes, admins, parents, kids, sessions, attendances, grades, ledger, rewards, vouchers, notifications, requests,
    audit: [],
  };
}
