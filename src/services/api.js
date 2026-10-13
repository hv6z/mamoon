// Lớp API cho bản demo. Mỗi hàm tương ứng một endpoint của backend sau này
// (ghi chú ở đầu mỗi hàm). Giao diện chỉ gọi các hàm này, không đọc dữ liệu trực tiếp.
import { loadDb, transact, resetDb } from './storage.js';
import {
  balanceOf, lifetimeOf, tierInfo, validateScores, convertScore, makeupStatus,
  monthKey, leaderboard, normalizePhone, isValidPhone,
} from './logic.js';
import {
  ATTENDANCE_POINTS, MAKEUP_REASONS, EVIDENCE_TYPES, VOUCHER_DAYS, DEMO_OTP,
} from '../config/rules.js';

export class ApiError extends Error {
  constructor(message, code = 'BAD_REQUEST') { super(message); this.code = code; }
}

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const nowIso = () => new Date().toISOString();

function need(cond, msg, code) { if (!cond) throw new ApiError(msg, code); }
function requireAdmin(actor) { need(actor && actor.role === 'admin', 'Bạn không có quyền thực hiện thao tác này', 'FORBIDDEN'); }
function requireOwnKid(actor, db, kidId) {
  need(actor, 'Bạn cần đăng nhập', 'UNAUTHORIZED');
  if (actor.role === 'admin') return;
  const kid = db.kids.find((k) => k.id === kidId);
  need(kid && kid.parentId === actor.parentId, 'Bạn không có quyền xem thông tin của bé này', 'FORBIDDEN');
}
function audit(db, actor, action, detail) {
  db.audit.push({ id: uid('au'), at: nowIso(), by: actor?.id || 'system', action, detail });
}
function notify(db, kidId, text) {
  db.notifications.push({ id: uid('n'), kidId, text, createdAt: nowIso(), read: false });
}
function kidSummary(db, kid) {
  const lifetime = lifetimeOf(db.ledger, kid.id);
  return { ...kid, balance: balanceOf(db.ledger, kid.id), lifetime, tier: tierInfo(lifetime) };
}
const sessionLabel = (db, s) => `${db.classes.find((c) => c.id === s.classId)?.name || ''} · ${new Date(s.start).toLocaleDateString('vi-VN')}`;

// ---------------------------------------------------------------- Demo
export function resetDemo() { resetDb(); }

// ---------------------------------------------------------------- Auth
// POST /auth/otp
export function requestOtp(phone) {
  need(isValidPhone(phone), 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
  const db = loadDb();
  const exists = db.parents.some((p) => p.phone === normalizePhone(phone));
  return { sent: true, exists, demoCode: DEMO_OTP };
}

// POST /auth/verify
export function verifyOtp(phone, code) {
  need(isValidPhone(phone), 'Số điện thoại không hợp lệ');
  need(String(code).trim() === DEMO_OTP, 'Mã OTP không đúng', 'OTP_INVALID');
  const db = loadDb();
  const parent = db.parents.find((p) => p.phone === normalizePhone(phone));
  need(parent, 'Số điện thoại chưa đăng ký. Hãy đăng ký tài khoản trước.', 'NOT_FOUND');
  const kids = db.kids.filter((k) => k.parentId === parent.id);
  need(kids.length > 0, 'Tài khoản chưa có bé nào. Liên hệ MaMoon để được hỗ trợ.', 'NOT_FOUND');
  return { role: 'parent', id: parent.id, parentId: parent.id, name: parent.name, kidIds: kids.map((k) => k.id), needsTerms: !parent.acceptedTermsAt };
}

// POST /auth/accept-terms  (tài khoản do cô tạo tại lớp, phụ huynh đồng ý ở lần đăng nhập đầu)
export function acceptTerms(actor) {
  need(actor && actor.role === 'parent', 'Bạn cần đăng nhập', 'UNAUTHORIZED');
  return transact((db) => {
    const p = db.parents.find((x) => x.id === actor.parentId);
    need(p, 'Không tìm thấy tài khoản', 'NOT_FOUND');
    if (!p.acceptedTermsAt) p.acceptedTermsAt = nowIso();
    return { ...actor, needsTerms: false };
  });
}

// POST /auth/register
export function registerParent({ phone, code, parentName, kidName, birth, acceptTerms }) {
  need(isValidPhone(phone), 'Số điện thoại không hợp lệ');
  need(String(code).trim() === DEMO_OTP, 'Mã OTP không đúng', 'OTP_INVALID');
  need(kidName && kidName.trim().length >= 2, 'Nhập tên bé (ít nhất 2 ký tự)');
  need(acceptTerms, 'Phụ huynh cần đồng ý điều khoản để tạo tài khoản');
  return transact((db) => {
    const p = normalizePhone(phone);
    need(!db.parents.some((x) => x.phone === p), 'Số điện thoại này đã có tài khoản, hãy đăng nhập', 'CONFLICT');
    const parent = { id: uid('p'), name: parentName?.trim() || `Phụ huynh ${kidName.trim()}`, phone: p, acceptedTermsAt: nowIso() };
    const kid = {
      id: uid('k'), parentId: parent.id, name: kidName.trim(), fullName: kidName.trim(), classId: null,
      code: `MM-${String(db.kids.length + 40).padStart(4, '0')}`, birth: birth || '', joinedAt: nowIso(), createdBy: 'self',
    };
    db.parents.push(parent); db.kids.push(kid);
    notify(db, kid.id, `Chào mừng ${kid.name} đến với MaMoon Rewards!`);
    return { role: 'parent', id: parent.id, parentId: parent.id, name: parent.name, kidIds: [kid.id] };
  });
}

// POST /auth/admin
export function loginAdmin(username, password) {
  const db = loadDb();
  const a = db.admins.find((x) => x.username === String(username).trim());
  need(a && a.password === password, 'Sai tên đăng nhập hoặc mật khẩu', 'UNAUTHORIZED');
  return { role: 'admin', id: a.id, name: a.name };
}

// ---------------------------------------------------------------- User (phụ huynh)
// GET /kids/:id/summary
export function getKidSummary(actor, kidId) {
  const db = loadDb();
  requireOwnKid(actor, db, kidId);
  const kid = db.kids.find((k) => k.id === kidId);
  need(kid, 'Không tìm thấy bé', 'NOT_FOUND');
  const recent = db.ledger.filter((e) => e.kidId === kidId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const now = Date.now();
  const upcoming = db.sessions
    .filter((s) => s.classId === kid.classId && new Date(s.end).getTime() >= now)
    .sort((a, b) => a.start.localeCompare(b.start)).slice(0, 2)
    .map((s) => ({ ...s, className: db.classes.find((c) => c.id === s.classId)?.name }));
  const paintings = db.grades.filter((g) => g.kidId === kidId && g.photo).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const mk = monthKey(new Date());
  const lb = leaderboard(db.ledger, db.kids, mk);
  const myRank = lb.all.find((r) => r.kidId === kidId) || null;
  const unread = db.notifications.filter((n) => n.kidId === kidId && !n.read).length;
  const rewards = db.rewards.filter((r) => r.active).sort((a, b) => a.cost - b.cost).slice(0, 4);
  return { kid: kidSummary(db, kid), recent, upcoming, paintings, myRank, unread, rewards };
}

// GET /kids/:id/paintings
export function getPaintings(actor, kidId) {
  const db = loadDb();
  requireOwnKid(actor, db, kidId);
  return db.grades
    .filter((g) => g.kidId === kidId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((g) => {
      const s = db.sessions.find((x) => x.id === g.sessionId);
      const att = db.attendances.find((a) => a.id === g.attendanceId);
      return { ...g, sessionLabel: s ? sessionLabel(db, s) : '', sessionStart: s?.start, makeup: !!att?.makeup, revoked: att?.status === 'revoked' };
    });
}

// GET /kids/:id/ledger
export function getLedger(actor, kidId) {
  const db = loadDb();
  requireOwnKid(actor, db, kidId);
  const entries = db.ledger.filter((e) => e.kidId === kidId).map((e) => {
    if (e.kind !== 'class') return e;
    const g = db.grades.find((x) => x.id === e.ref);
    const att = g && db.attendances.find((a) => a.id === g.attendanceId);
    return { ...e, makeup: !!att?.makeup, revoked: att?.status === 'revoked' };
  });
  // Check-in bù không kèm điểm chấm vẫn hiện trong lịch sử để phụ huynh có thể báo sai.
  db.attendances
    .filter((a) => a.kidId === kidId && a.makeup && !db.grades.some((g) => g.attendanceId === a.id))
    .forEach((a) => {
      const s = db.sessions.find((x) => x.id === a.sessionId);
      entries.push({ id: `mk-${a.id}`, kidId, amount: 0, kind: 'makeup', ref: a.id, note: `Check-in bù: ${s ? sessionLabel(db, s) : ''}`, occurredAt: s?.start || a.createdAt, createdAt: a.createdAt, makeup: true, revoked: a.status === 'revoked' });
    });
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// GET /rewards
export function listRewards({ includeInactive = false } = {}) {
  const db = loadDb();
  return db.rewards.filter((r) => includeInactive || r.active).sort((a, b) => a.cost - b.cost);
}

// POST /kids/:id/redeem
export function redeem(actor, kidId, rewardId) {
  return transact((db) => {
    requireOwnKid(actor, db, kidId);
    const reward = db.rewards.find((r) => r.id === rewardId && r.active);
    need(reward, 'Ưu đãi không còn tồn tại', 'NOT_FOUND');
    const bal = balanceOf(db.ledger, kidId); // đọc số dư bên trong cùng transaction
    need(bal >= reward.cost, `Chưa đủ điểm: cần ${reward.cost}, hiện có ${bal}`, 'INSUFFICIENT');
    const at = nowIso();
    const v = {
      id: uid('v'), kidId, rewardId, name: reward.name, status: 'unused', createdAt: at,
      code: `MMV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      expiresAt: new Date(Date.now() + VOUCHER_DAYS * 864e5).toISOString(),
    };
    db.vouchers.push(v);
    db.ledger.push({ id: uid('l'), kidId, amount: -reward.cost, kind: 'redeem', ref: v.id, note: `Đổi ưu đãi: ${reward.name}`, occurredAt: at, createdAt: at, by: actor.id });
    notify(db, kidId, `Đổi thành công "${reward.name}". Mã voucher ${v.code}.`);
    return v;
  });
}

// GET /kids/:id/vouchers
export function getVouchers(actor, kidId) {
  const db = loadDb();
  requireOwnKid(actor, db, kidId);
  const now = Date.now();
  return db.vouchers.filter((v) => v.kidId === kidId)
    .map((v) => ({ ...v, status: v.status === 'unused' && new Date(v.expiresAt).getTime() < now ? 'expired' : v.status }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// GET /leaderboard?month=YYYY-MM
export function getLeaderboard(actor, mKey = monthKey(new Date())) {
  need(actor, 'Bạn cần đăng nhập', 'UNAUTHORIZED');
  const db = loadDb();
  const lb = leaderboard(db.ledger, db.kids, mKey);
  const top = lb.top.map((r) => ({
    ...r,
    paintings: db.grades
      .filter((g) => g.kidId === r.kidId && g.photo && db.attendances.find((a) => a.id === g.attendanceId)?.status !== 'revoked' && monthKey(db.sessions.find((s) => s.id === g.sessionId)?.start || g.createdAt) === mKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6)
      .map((g) => ({ id: g.id, title: g.title, photo: g.photo, createdAt: g.createdAt })),
  }));
  const mine = actor.role === 'parent'
    ? lb.all.filter((r) => db.kids.find((k) => k.id === r.kidId)?.parentId === actor.parentId)
    : [];
  const cutoff = lb.top.length ? lb.top[lb.top.length - 1].points : 0;
  return { month: mKey, top, mine, cutoff, total: lb.all.length };
}

// GET /kids/:id/notifications  (đánh dấu đã đọc khi mở)
export function getNotifications(actor, kidId) {
  return transact((db) => {
    requireOwnKid(actor, db, kidId);
    const list = db.notifications.filter((n) => n.kidId === kidId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const snapshot = list.map((n) => ({ ...n }));
    list.forEach((n) => { n.read = true; });
    return snapshot;
  });
}

// POST /requests
export function createRequest(actor, { kidId, target, message }) {
  need(message && message.trim().length >= 5, 'Hãy mô tả vấn đề (ít nhất 5 ký tự)');
  return transact((db) => {
    requireOwnKid(actor, db, kidId);
    const open = db.requests.find((r) => r.kidId === kidId && r.status === 'open' && r.target && target && r.target.id === target.id);
    need(!open, 'Bạn đã gửi yêu cầu cho mục này, cô đang kiểm tra', 'CONFLICT');
    const rq = { id: uid('rq'), kidId, target: target || null, message: message.trim(), status: 'open', createdAt: nowIso() };
    db.requests.push(rq);
    return rq;
  });
}

// ---------------------------------------------------------------- Admin
// GET /admin/overview
export function getAdminOverview(actor) {
  requireAdmin(actor);
  const db = loadDb();
  const today = new Date().toDateString();
  const todaySessions = db.sessions.filter((s) => new Date(s.start).toDateString() === today).map((s) => sessionRoster(db, s));
  const mk = monthKey(new Date());
  const monthPoints = db.ledger.filter((e) => e.amount > 0 && monthKey(e.occurredAt) === mk).reduce((s, e) => s + e.amount, 0);
  const lb = leaderboard(db.ledger, db.kids, mk);
  const recent = [...db.ledger].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
    .map((e) => ({ ...e, kidName: db.kids.find((k) => k.id === e.kidId)?.name }));
  return {
    kidCount: db.kids.length,
    newKidsThisMonth: db.kids.filter((k) => monthKey(k.joinedAt) === mk).length,
    todaySessions,
    checkedInToday: todaySessions.reduce((s, x) => s + x.stats.checkedIn, 0),
    expectedToday: todaySessions.reduce((s, x) => s + x.stats.total, 0),
    monthPoints,
    photoCount: db.grades.filter((g) => g.photo).length,
    openRequests: db.requests.filter((r) => r.status === 'open').length,
    top5: lb.top.slice(0, 5),
    recent,
  };
}

function sessionRoster(db, s) {
  const cls = db.classes.find((c) => c.id === s.classId);
  const kids = db.kids.filter((k) => k.classId === s.classId);
  const rows = kids.map((k) => {
    const att = db.attendances.find((a) => a.sessionId === s.id && a.kidId === k.id && a.status === 'active');
    const grade = att ? db.grades.find((g) => g.attendanceId === att.id) : null;
    const t = tierInfo(lifetimeOf(db.ledger, k.id));
    return { kid: { id: k.id, name: k.name, code: k.code, tier: t.current.name }, attendance: att || null, grade: grade || null };
  });
  // Bé không thuộc lớp nhưng được check-in vào buổi này
  db.attendances.filter((a) => a.sessionId === s.id && a.status === 'active' && !kids.some((k) => k.id === a.kidId)).forEach((a) => {
    const k = db.kids.find((x) => x.id === a.kidId);
    if (!k) return;
    const grade = db.grades.find((g) => g.attendanceId === a.id);
    rows.push({ kid: { id: k.id, name: k.name, code: k.code, tier: tierInfo(lifetimeOf(db.ledger, k.id)).current.name }, attendance: a, grade: grade || null });
  });
  const stats = {
    total: rows.length,
    checkedIn: rows.filter((r) => r.attendance).length,
    graded: rows.filter((r) => r.grade).length,
    withPhoto: rows.filter((r) => r.grade?.photo).length,
  };
  return { session: { ...s, className: cls?.name, classTone: cls?.tone }, rows, stats };
}

// GET /admin/sessions?date=today
export function getTodaySessions(actor) {
  requireAdmin(actor);
  const db = loadDb();
  const today = new Date().toDateString();
  return db.sessions.filter((s) => new Date(s.start).toDateString() === today).map((s) => sessionRoster(db, s));
}

// GET /admin/sessions/:id
export function getSession(actor, sessionId) {
  requireAdmin(actor);
  const db = loadDb();
  const s = db.sessions.find((x) => x.id === sessionId);
  need(s, 'Không tìm thấy buổi học', 'NOT_FOUND');
  return sessionRoster(db, s);
}

// GET /admin/kids/search?q=
export function searchKids(actor, q) {
  requireAdmin(actor);
  const db = loadDb();
  const query = String(q || '').trim().toLowerCase();
  if (!query) return [];
  const digits = normalizePhone(query);
  return db.kids.filter((k) => {
    const parent = db.parents.find((p) => p.id === k.parentId);
    return k.name.toLowerCase().includes(query) || k.fullName.toLowerCase().includes(query)
      || k.code.toLowerCase() === query
      || (digits.length >= 4 && parent?.phone.includes(digits));
  }).slice(0, 8).map((k) => ({ id: k.id, name: k.name, code: k.code, classId: k.classId, parentPhone: db.parents.find((p) => p.id === k.parentId)?.phone }));
}

// POST /admin/sessions/:id/checkin
export function checkIn(actor, sessionId, kidId, { clientId } = {}) {
  requireAdmin(actor);
  return transact((db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    need(s, 'Không tìm thấy buổi học', 'NOT_FOUND');
    const kid = db.kids.find((k) => k.id === kidId);
    need(kid, 'Không tìm thấy bé', 'NOT_FOUND');
    const now = Date.now();
    need(now >= new Date(s.start).getTime() - 60 * 60 * 1000, 'Buổi học chưa mở (chỉ check-in trước giờ học tối đa 60 phút)', 'NOT_OPEN');
    need(now <= new Date(s.end).getTime() || clientId, 'Buổi học đã kết thúc. Hãy dùng Check-in bù.', 'CLOSED');
    const existing = db.attendances.find((a) => a.sessionId === sessionId && a.kidId === kidId && a.status === 'active');
    if (existing) return { attendance: existing, duplicate: true };
    const att = { id: uid('at'), sessionId, kidId, checkedInAt: nowIso(), by: actor.id, makeup: false, status: 'active', createdAt: nowIso(), clientId: clientId || null };
    db.attendances.push(att);
    if (ATTENDANCE_POINTS > 0) {
      db.ledger.push({ id: uid('l'), kidId, amount: ATTENDANCE_POINTS, kind: 'attendance', ref: att.id, note: 'Điểm chuyên cần', occurredAt: s.start, createdAt: nowIso(), by: actor.id });
    }
    audit(db, actor, 'checkin', { sessionId, kidId });
    return { attendance: att, duplicate: false };
  });
}

function applyGrade(db, actor, att, { title, scores, comment, photo }, { makeup = false } = {}) {
  const err = validateScores(scores);
  need(!err, err);
  need(title && title.trim(), 'Nhập tên bức tranh');
  need(!db.grades.some((g) => g.attendanceId === att.id), 'Bé đã được chấm buổi này rồi', 'CONFLICT');
  const s = db.sessions.find((x) => x.id === att.sessionId);
  const points = convertScore(scores);
  const g = {
    id: uid('g'), attendanceId: att.id, sessionId: att.sessionId, kidId: att.kidId,
    title: title.trim(), art: null, photo: photo || null, scores, comment: (comment || '').trim(),
    points, by: actor.id, createdAt: nowIso(),
  };
  db.grades.push(g);
  db.ledger.push({
    id: uid('l'), kidId: att.kidId, amount: points, kind: 'class', ref: g.id,
    note: `${makeup ? 'Buổi học (bổ sung)' : 'Buổi học'}: ${g.title}`, makeup,
    occurredAt: s.start, createdAt: nowIso(), by: actor.id,
  });
  const kid = db.kids.find((k) => k.id === att.kidId);
  const before = tierInfo(lifetimeOf(db.ledger, att.kidId) - points);
  const after = tierInfo(lifetimeOf(db.ledger, att.kidId));
  notify(db, att.kidId, `${kid.name} được +${points} điểm với tranh "${g.title}"${photo ? ' (đã có ảnh)' : ''}.`);
  if (after.index > before.index) notify(db, att.kidId, `Chúc mừng ${kid.name} đã lên ${after.current.name}!`);
  return g;
}

// POST /admin/attendances/:id/grade
export function gradeAttendance(actor, attendanceId, data) {
  requireAdmin(actor);
  return transact((db) => {
    const att = db.attendances.find((a) => a.id === attendanceId && a.status === 'active');
    need(att, 'Bé chưa check-in buổi này', 'NOT_FOUND');
    const g = applyGrade(db, actor, att, data);
    audit(db, actor, 'grade', { attendanceId, points: g.points });
    return g;
  });
}

// PUT /admin/grades/:id/photo
export function setGradePhoto(actor, gradeId, photo) {
  requireAdmin(actor);
  need(photo, 'Chưa có ảnh');
  return transact((db) => {
    const g = db.grades.find((x) => x.id === gradeId);
    need(g, 'Không tìm thấy bài chấm', 'NOT_FOUND');
    const hadPhoto = !!g.photo;
    g.photo = photo;
    if (!hadPhoto) notify(db, g.kidId, `Tranh "${g.title}" đã được lưu vào bộ sưu tập.`);
    audit(db, actor, 'photo', { gradeId });
    return g;
  });
}

// GET /admin/makeup/sessions  - các buổi còn trong hạn check-in bù
export function listMakeupSessions(actor) {
  requireAdmin(actor);
  const db = loadDb();
  const now = Date.now();
  return db.sessions
    .filter((s) => makeupStatus(s, now).ok)
    .sort((a, b) => b.start.localeCompare(a.start))
    .map((s) => ({ ...sessionRoster(db, s), deadline: makeupStatus(s, now).deadline }));
}

// POST /admin/attendances/:id/evidence  - tải ảnh điểm danh bù cho bé ĐÃ check-in
// (ví dụ: check-in rồi nhưng chưa có ảnh tranh / chưa có ảnh tờ điểm danh). Cùng hạn 48 giờ.
export function addAttendanceEvidence(actor, { attendanceId, evidence, evidenceType, note }) {
  requireAdmin(actor);
  need(evidence && /^data:image\//.test(evidence), 'Bắt buộc đính kèm ảnh', 'EVIDENCE_REQUIRED');
  need(EVIDENCE_TYPES.some((t) => t.key === evidenceType), 'Chọn loại ảnh');
  return transact((db) => {
    const att = db.attendances.find((a) => a.id === attendanceId);
    need(att, 'Không tìm thấy lượt check-in', 'NOT_FOUND');
    need(att.status === 'active', 'Lượt check-in này đã bị huỷ', 'CONFLICT');
    const s = db.sessions.find((x) => x.id === att.sessionId);
    const st = makeupStatus(s);
    need(st.ok, st.reason, 'WINDOW_CLOSED');
    const at = nowIso();
    att.extraEvidence = [...(att.extraEvidence || []), { evidence, evidenceType, note: (note || '').trim(), by: actor.id, at }];
    const g = db.grades.find((x) => x.attendanceId === att.id);
    let savedToGallery = false;
    if (g && !g.photo && evidenceType === 'painting') { g.photo = evidence; savedToGallery = true; }
    const kid = db.kids.find((k) => k.id === att.kidId);
    notify(db, att.kidId, savedToGallery
      ? `Tranh "${g.title}" của ${kid.name} đã được bổ sung ảnh vào bộ sưu tập.`
      : `Cô đã bổ sung ảnh điểm danh cho ${kid.name} buổi ${new Date(s.start).toLocaleDateString('vi-VN')}.`);
    audit(db, actor, 'attendance_evidence', { attendanceId, evidenceType });
    return { attendance: att, savedToGallery };
  });
}

// POST /admin/makeup  - check-in bù, bắt buộc có minh chứng
export function makeupCheckIn(actor, { sessionId, kidId, evidence, evidenceType, reason, note, grade }) {
  requireAdmin(actor);
  need(evidence && /^data:image\//.test(evidence), 'Bắt buộc đính kèm ảnh minh chứng', 'EVIDENCE_REQUIRED');
  need(EVIDENCE_TYPES.some((t) => t.key === evidenceType), 'Chọn loại minh chứng');
  need(MAKEUP_REASONS.some((r) => r.key === reason), 'Chọn lý do check-in bù');
  return transact((db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    need(s, 'Không tìm thấy buổi học', 'NOT_FOUND');
    const st = makeupStatus(s);
    need(st.ok, st.reason, 'WINDOW_CLOSED');
    const kid = db.kids.find((k) => k.id === kidId);
    need(kid, 'Không tìm thấy bé', 'NOT_FOUND');
    const dup = db.attendances.find((a) => a.sessionId === sessionId && a.kidId === kidId && a.status === 'active');
    need(!dup, `${kid.name} đã được check-in buổi này rồi`, 'CONFLICT');
    const at = nowIso();
    const att = {
      id: uid('at'), sessionId, kidId, checkedInAt: at, by: actor.id, makeup: true, status: 'active', createdAt: at,
      reason, evidenceType, evidence, note: (note || '').trim(),
    };
    db.attendances.push(att);
    let g = null;
    if (grade && grade.scores) {
      g = applyGrade(db, actor, att, {
        ...grade, photo: grade.photo || (evidenceType === 'painting' ? evidence : null),
      }, { makeup: true });
    }
    const d = new Date(s.start).toLocaleDateString('vi-VN');
    notify(db, kidId, `${kid.name} được check-in bù buổi ${d}. Nếu thông tin chưa đúng, phụ huynh bấm "Báo sai" trong Lịch sử điểm.`);
    audit(db, actor, 'makeup', { sessionId, kidId, reason, evidenceType, attendanceId: att.id });
    return { attendance: att, grade: g };
  });
}

// POST /admin/kids  - tạo nhanh tài khoản tại lớp
export function quickCreateKid(actor, { kidName, phone, classId }) {
  requireAdmin(actor);
  need(kidName && kidName.trim().length >= 2, 'Nhập tên bé');
  need(isValidPhone(phone), 'Số điện thoại phụ huynh không hợp lệ');
  return transact((db) => {
    const p = normalizePhone(phone);
    let parent = db.parents.find((x) => x.phone === p);
    if (!parent) {
      parent = { id: uid('p'), name: `Phụ huynh ${kidName.trim()}`, phone: p, acceptedTermsAt: null };
      db.parents.push(parent);
    }
    need(!db.kids.some((k) => k.parentId === parent.id && k.name.toLowerCase() === kidName.trim().toLowerCase()), 'Phụ huynh này đã có bé cùng tên', 'CONFLICT');
    const kid = {
      id: uid('k'), parentId: parent.id, name: kidName.trim(), fullName: kidName.trim(), classId: classId || null,
      code: `MM-${String(db.kids.length + 40).padStart(4, '0')}`, birth: '', joinedAt: nowIso(), createdBy: actor.id,
    };
    db.kids.push(kid);
    audit(db, actor, 'create_kid', { kidId: kid.id });
    return kid;
  });
}

// GET /admin/kids
export function listKids(actor, { q = '', classId = '' } = {}) {
  requireAdmin(actor);
  const db = loadDb();
  const query = q.trim().toLowerCase();
  const digits = normalizePhone(q);
  return db.kids
    .filter((k) => !classId || k.classId === classId)
    .filter((k) => {
      if (!query) return true;
      const parent = db.parents.find((p) => p.id === k.parentId);
      return k.name.toLowerCase().includes(query) || k.fullName.toLowerCase().includes(query) || k.code.toLowerCase().includes(query) || (digits.length >= 4 && parent?.phone.includes(digits));
    })
    .map((k) => kidSummary(db, k))
    .sort((a, b) => b.balance - a.balance);
}

// GET /admin/kids/:id
export function getKidDetail(actor, kidId) {
  requireAdmin(actor);
  const db = loadDb();
  const kid = db.kids.find((k) => k.id === kidId);
  need(kid, 'Không tìm thấy bé', 'NOT_FOUND');
  const parent = db.parents.find((p) => p.id === kid.parentId);
  const classSessions = db.sessions.filter((s) => s.classId === kid.classId && new Date(s.end).getTime() < Date.now());
  const attended = db.attendances.filter((a) => a.kidId === kidId && a.status === 'active');
  const lb = leaderboard(db.ledger, db.kids, monthKey(new Date()));
  return {
    kid: kidSummary(db, kid),
    parent,
    className: db.classes.find((c) => c.id === kid.classId)?.name || 'Chưa xếp lớp',
    attendance: { attended: attended.filter((a) => classSessions.some((s) => s.id === a.sessionId)).length, total: classSessions.length, makeup: attended.filter((a) => a.makeup).length },
    rank: lb.all.find((r) => r.kidId === kidId)?.rank || null,
    paintings: getPaintings(actor, kidId),
    ledger: db.ledger.filter((e) => e.kidId === kidId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    vouchers: db.vouchers.filter((v) => v.kidId === kidId).map((v) => ({ ...v, status: v.status === 'unused' && new Date(v.expiresAt).getTime() < Date.now() ? 'expired' : v.status })),
    makeups: attended.filter((a) => a.makeup).map((a) => ({ ...a, sessionLabel: sessionLabel(db, db.sessions.find((s) => s.id === a.sessionId)) })),
  };
}

// POST /admin/kids/:id/adjust
export function adjustPoints(actor, kidId, amount, reason) {
  requireAdmin(actor);
  const n = Number(amount);
  need(Number.isInteger(n) && n !== 0, 'Số điểm điều chỉnh phải là số nguyên khác 0');
  need(Math.abs(n) <= 500, 'Mỗi lần chỉ điều chỉnh tối đa 500 điểm');
  need(reason && reason.trim().length >= 5, 'Bắt buộc ghi lý do (ít nhất 5 ký tự)');
  return transact((db) => {
    need(db.kids.some((k) => k.id === kidId), 'Không tìm thấy bé', 'NOT_FOUND');
    if (n < 0) need(balanceOf(db.ledger, kidId) + n >= 0, 'Không thể trừ quá số điểm bé đang có');
    const at = nowIso();
    const e = { id: uid('l'), kidId, amount: n, kind: 'adjust', ref: null, note: `Điều chỉnh: ${reason.trim()}`, occurredAt: at, createdAt: at, by: actor.id };
    db.ledger.push(e);
    notify(db, kidId, `Điểm của bé được điều chỉnh ${n > 0 ? '+' : ''}${n}: ${reason.trim()}`);
    audit(db, actor, 'adjust', { kidId, amount: n, reason });
    return e;
  });
}

// GET /admin/requests
export function listRequests(actor) {
  requireAdmin(actor);
  const db = loadDb();
  return db.requests.map((r) => {
    const kid = db.kids.find((k) => k.id === r.kidId);
    let detail = null;
    if (r.target?.type === 'attendance') {
      const att = db.attendances.find((a) => a.id === r.target.id);
      const s = att && db.sessions.find((x) => x.id === att.sessionId);
      detail = att && { title: s ? sessionLabel(db, s) : 'Buổi học', points: 0, makeup: !!att.makeup, evidence: att.evidence, reason: att.reason, attendanceStatus: att.status };
    } else if (r.target?.type === 'grade') {
      const g = db.grades.find((x) => x.id === r.target.id);
      const att = g && db.attendances.find((a) => a.id === g.attendanceId);
      detail = g && { title: g.title, points: g.points, photo: g.photo, makeup: !!att?.makeup, evidence: att?.evidence, reason: att?.reason, attendanceStatus: att?.status };
    } else if (r.target?.type === 'ledger') {
      const e = db.ledger.find((x) => x.id === r.target.id);
      detail = e && { note: e.note, amount: e.amount };
    }
    return { ...r, kidName: kid?.name, detail };
  }).sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === 'open' ? -1 : 1));
}

// POST /admin/requests/:id/resolve   action: 'keep' | 'revoke'
export function resolveRequest(actor, requestId, { action, note }) {
  requireAdmin(actor);
  need(['keep', 'revoke'].includes(action), 'Chọn cách xử lý');
  need(note && note.trim().length >= 3, 'Ghi kết quả xử lý để gửi phụ huynh');
  return transact((db) => {
    const rq = db.requests.find((r) => r.id === requestId);
    need(rq, 'Không tìm thấy yêu cầu', 'NOT_FOUND');
    need(rq.status === 'open', 'Yêu cầu này đã xử lý', 'CONFLICT');
    if (action === 'revoke') {
      const type = rq.target?.type;
      need(type === 'grade' || type === 'attendance', 'Chỉ thu hồi được một buổi học cụ thể');
      const g = type === 'grade' ? db.grades.find((x) => x.id === rq.target.id) : db.grades.find((x) => x.attendanceId === rq.target.id);
      const att = db.attendances.find((a) => a.id === (type === 'grade' ? g?.attendanceId : rq.target.id));
      need(att, 'Không tìm thấy buổi check-in', 'NOT_FOUND');
      need(att.status === 'active', 'Buổi học này đã bị huỷ trước đó', 'CONFLICT');
      att.status = 'revoked';
      if (g) {
        const balance = balanceOf(db.ledger, g.kidId);
        db.ledger.push({ id: uid('l'), kidId: g.kidId, amount: -g.points, kind: 'revoke', ref: g.id, note: `Thu hồi: ${g.title} (${note.trim()})`, occurredAt: db.sessions.find((s) => s.id === g.sessionId).start, createdAt: nowIso(), by: actor.id });
        if (balance < g.points) audit(db, actor, 'negative_balance', { kidId: g.kidId, balance: balance - g.points });
      }
    }
    rq.status = 'resolved';
    rq.resolution = { action, note: note.trim(), by: actor.id, at: nowIso() };
    notify(db, rq.kidId, `Cô đã kiểm tra yêu cầu của bạn: ${note.trim()}`);
    audit(db, actor, 'resolve_request', { requestId, action });
    return rq;
  });
}

// POST /admin/rewards, PATCH /admin/rewards/:id
export function saveReward(actor, { id, name, cost, active = true }) {
  requireAdmin(actor);
  need(name && name.trim().length >= 2, 'Nhập tên ưu đãi');
  const c = Number(cost);
  need(Number.isInteger(c) && c > 0 && c <= 100000, 'Số điểm phải là số nguyên dương');
  return transact((db) => {
    if (id) {
      const r = db.rewards.find((x) => x.id === id);
      need(r, 'Không tìm thấy ưu đãi', 'NOT_FOUND');
      Object.assign(r, { name: name.trim(), cost: c, active });
      return r;
    }
    const tones = ['teal', 'pink', 'yellow', 'orange'];
    const r = { id: uid('r'), name: name.trim(), cost: c, active, tone: tones[db.rewards.length % tones.length] };
    db.rewards.push(r);
    return r;
  });
}

export function listClasses() {
  return loadDb().classes;
}
