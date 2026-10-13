import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as api from './api.js';
import { resetDb, loadDb, transact } from './storage.js';

const saveDbWith = (fn) => transact((db) => { fn(db); });

const admin = { role: 'admin', id: 'a1', name: 'Cô Dung' };
const IMG = 'data:image/jpeg;base64,AAAA';

function findSession(predicate) {
  return loadDb().sessions.find(predicate);
}

beforeEach(() => {
  vi.useRealTimers();
  resetDb(new Date());
});

describe('phân quyền', () => {
  it('phụ huynh không gọi được API Admin', () => {
    const parent = api.verifyOtp('0900000001', '123456');
    expect(() => api.getAdminOverview(parent)).toThrow(/không có quyền/);
    expect(() => api.adjustPoints(parent, 'k1', 100, 'tự cộng điểm')).toThrow(/không có quyền/);
  });
  it('phụ huynh không xem được bé nhà khác', () => {
    const parent = api.verifyOtp('0900000001', '123456');
    expect(() => api.getKidSummary(parent, 'k2')).toThrow(/không có quyền/);
    expect(api.getKidSummary(parent, 'k1').kid.id).toBe('k1');
  });
  it('chưa đăng nhập thì bị chặn', () => {
    expect(() => api.getKidSummary(null, 'k1')).toThrow(/đăng nhập/);
  });
});

describe('đăng nhập và đăng ký', () => {
  it('sai OTP', () => expect(() => api.verifyOtp('0900000001', '000000')).toThrow(/OTP/));
  it('số chưa đăng ký', () => expect(() => api.verifyOtp('0999999999', '123456')).toThrow(/chưa đăng ký/));
  it('đăng ký bắt buộc đồng ý điều khoản', () => {
    expect(() => api.registerParent({ phone: '0999999999', code: '123456', kidName: 'Bé Mới', acceptTerms: false })).toThrow(/điều khoản/);
  });
  it('không đăng ký trùng số', () => {
    expect(() => api.registerParent({ phone: '0900000001', code: '123456', kidName: 'Bé Mới', acceptTerms: true })).toThrow(/đã có tài khoản/);
  });
  it('đăng ký thành công rồi đăng nhập được', () => {
    api.registerParent({ phone: '0999999999', code: '123456', kidName: 'Bé Mới', acceptTerms: true });
    expect(api.verifyOtp('0999999999', '123456').kidIds).toHaveLength(1);
  });
  it('admin sai mật khẩu', () => expect(() => api.loginAdmin('admin', 'sai')).toThrow(/Sai/));
});

describe('đổi ưu đãi', () => {
  it('không đủ điểm thì báo lỗi, không trừ điểm', () => {
    const parent = api.verifyOtp('0900000001', '123456');
    api.saveReward(admin, { name: 'Quà rất đắt', cost: 99999 });
    const r = api.listRewards().find((x) => x.name === 'Quà rất đắt');
    const before = api.getKidSummary(parent, 'k1').kid.balance;
    expect(() => api.redeem(parent, 'k1', r.id)).toThrow(/Chưa đủ điểm/);
    expect(api.getKidSummary(parent, 'k1').kid.balance).toBe(before);
  });
  it('đổi thành công thì trừ đúng điểm và tạo voucher', () => {
    const parent = api.verifyOtp('0900000001', '123456');
    const before = api.getKidSummary(parent, 'k1').kid.balance;
    const v = api.redeem(parent, 'k1', 'r1');
    expect(v.code).toMatch(/^MMV-/);
    expect(api.getKidSummary(parent, 'k1').kid.balance).toBe(before - 100);
  });
  it('đổi liên tục không làm âm điểm', () => {
    const parent = api.verifyOtp('0900000001', '123456');
    let ok = 0;
    for (let i = 0; i < 50; i++) { try { api.redeem(parent, 'k1', 'r1'); ok++; } catch { break; } }
    expect(api.getKidSummary(parent, 'k1').kid.balance).toBeGreaterThanOrEqual(0);
    expect(ok).toBeGreaterThan(0);
  });
});

describe('buổi học hôm nay', () => {
  it('check-in hai lần không tạo trùng', () => {
    const today = api.getTodaySessions(admin).find((t) => new Date(t.session.start).getTime() <= Date.now());
    const row = today.rows.find((r) => !r.attendance);
    const a = api.checkIn(admin, today.session.id, row.kid.id);
    const b = api.checkIn(admin, today.session.id, row.kid.id);
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    expect(b.attendance.id).toBe(a.attendance.id);
  });
  function checkedInRow() {
    const today = api.getTodaySessions(admin).find((t) => new Date(t.session.start).getTime() <= Date.now());
    const row = today.rows.find((r) => !r.attendance);
    const { attendance } = api.checkIn(admin, today.session.id, row.kid.id);
    return { kid: row.kid, attendance };
  }
  it('chấm điểm cộng đúng điểm và không chấm 2 lần', () => {
    const row = checkedInRow();
    const before = api.getKidDetail(admin, row.kid.id).kid.balance;
    const g = api.gradeAttendance(admin, row.attendance.id, { title: 'Tranh test', scores: { color: 5, creative: 4, neat: 4 } });
    expect(g.points).toBe(26);
    expect(api.getKidDetail(admin, row.kid.id).kid.balance).toBe(before + 26);
    expect(() => api.gradeAttendance(admin, row.attendance.id, { title: 'Lần 2', scores: { color: 5, creative: 5, neat: 5 } })).toThrow(/chấm buổi này rồi/);
  });
  it('thiếu tiêu chí thì không lưu', () => {
    const row = checkedInRow();
    expect(() => api.gradeAttendance(admin, row.attendance.id, { title: 'X', scores: { color: 5 } })).toThrow(/Chưa chấm/);
  });
});

describe('giờ mở check-in', () => {
  it('buổi còn hơn 60 phút mới bắt đầu thì chưa cho check-in', () => {
    const later = api.getTodaySessions(admin).find((t) => new Date(t.session.start).getTime() - Date.now() > 3600e3);
    expect(() => api.checkIn(admin, later.session.id, later.rows[0].kid.id)).toThrow(/chưa mở/);
  });
  it('buổi đã kết thúc thì phải dùng check-in bù', () => {
    const past = loadDb().sessions.find((s) => new Date(s.end).getTime() < Date.now());
    const kid = loadDb().kids.find((k) => k.classId === past.classId);
    expect(() => api.checkIn(admin, past.id, kid.id)).toThrow(/Check-in bù/);
  });
});

describe('check-in bù có minh chứng', () => {
  function absentInRecentSession() {
    const list = api.listMakeupSessions(admin);
    for (const s of list) {
      const row = s.rows.find((r) => !r.attendance);
      if (row) return { session: s.session, kidId: row.kid.id };
    }
    throw new Error('seed không có bé vắng');
  }
  it('không có ảnh minh chứng thì từ chối', () => {
    const { session, kidId } = absentInRecentSession();
    expect(() => api.makeupCheckIn(admin, { sessionId: session.id, kidId, evidence: null, evidenceType: 'sheet', reason: 'forgot' })).toThrow(/minh chứng/);
  });
  it('thiếu lý do thì từ chối', () => {
    const { session, kidId } = absentInRecentSession();
    expect(() => api.makeupCheckIn(admin, { sessionId: session.id, kidId, evidence: IMG, evidenceType: 'sheet', reason: '' })).toThrow(/lý do/);
  });
  it('quá 48 giờ thì từ chối', () => {
    const old = findSession((s) => Date.now() - new Date(s.end).getTime() > 72 * 3600e3);
    const kid = loadDb().kids.find((k) => k.classId === old.classId && !loadDb().attendances.some((a) => a.sessionId === old.id && a.kidId === k.id))
      || loadDb().kids.find((k) => k.classId === old.classId);
    expect(() => api.makeupCheckIn(admin, { sessionId: old.id, kidId: kid.id, evidence: IMG, evidenceType: 'sheet', reason: 'forgot' })).toThrow(/48 giờ|đã được check-in/);
  });
  it('hợp lệ: gắn nhãn bổ sung, tính điểm vào ngày buổi học, báo phụ huynh', () => {
    const { session, kidId } = absentInRecentSession();
    const r = api.makeupCheckIn(admin, {
      sessionId: session.id, kidId, evidence: IMG, evidenceType: 'painting', reason: 'offline',
      grade: { title: 'Tranh bù', scores: { color: 4, creative: 4, neat: 4 } },
    });
    expect(r.attendance.makeup).toBe(true);
    expect(r.grade.points).toBe(24);
    expect(r.grade.photo).toBe(IMG); // ảnh tranh dùng luôn làm ảnh bộ sưu tập
    const entry = loadDb().ledger.find((e) => e.ref === r.grade.id);
    expect(entry.occurredAt).toBe(session.start);
    expect(entry.makeup).toBe(true);
    expect(loadDb().notifications.some((n) => n.kidId === kidId && /check-in bù/.test(n.text))).toBe(true);
    expect(loadDb().audit.some((a) => a.action === 'makeup')).toBe(true);
  });
  it('không check-in bù trùng', () => {
    const { session, kidId } = absentInRecentSession();
    api.makeupCheckIn(admin, { sessionId: session.id, kidId, evidence: IMG, evidenceType: 'sheet', reason: 'forgot' });
    expect(() => api.makeupCheckIn(admin, { sessionId: session.id, kidId, evidence: IMG, evidenceType: 'sheet', reason: 'forgot' })).toThrow(/đã được check-in/);
  });
  it('phụ huynh báo sai → Admin thu hồi → trừ điểm', () => {
    const { session, kidId } = absentInRecentSession();
    const r = api.makeupCheckIn(admin, { sessionId: session.id, kidId, evidence: IMG, evidenceType: 'sheet', reason: 'forgot', grade: { title: 'Bù', scores: { color: 3, creative: 3, neat: 3 } } });
    const kid = loadDb().kids.find((k) => k.id === kidId);
    const phone = loadDb().parents.find((p) => p.id === kid.parentId).phone;
    const parent = api.verifyOtp(phone, '123456');
    const before = api.getKidSummary(parent, kidId).kid.balance;
    const rq = api.createRequest(parent, { kidId, target: { type: 'grade', id: r.grade.id }, message: 'Hôm đó bé nghỉ học ạ' });
    api.resolveRequest(admin, rq.id, { action: 'revoke', note: 'Đã kiểm tra, bé vắng' });
    expect(api.getKidSummary(parent, kidId).kid.balance).toBe(before - 18);
    expect(() => api.resolveRequest(admin, rq.id, { action: 'revoke', note: 'lần 2' })).toThrow(/đã xử lý/);
  });
});

describe('điều chỉnh điểm', () => {
  it('bắt buộc lý do và không trừ quá số dư', () => {
    expect(() => api.adjustPoints(admin, 'k1', 10, '')).toThrow(/lý do/);
    expect(() => api.adjustPoints(admin, 'k1', 0, 'không đổi')).toThrow(/khác 0/);
    expect(() => api.adjustPoints(admin, 'k1', 1.5, 'số lẻ nè')).toThrow(/số nguyên/);
    const bal = api.getKidDetail(admin, 'k1').kid.balance;
    expect(() => api.adjustPoints(admin, 'k1', -(bal + 1), 'trừ quá số dư')).toThrow(/quá số điểm/);
  });
});

describe('bảng xếp hạng', () => {
  it('tối đa 10 bạn, có tranh để xem', () => {
    const parent = api.verifyOtp('0900000001', '123456');
    const lb = api.getLeaderboard(parent);
    expect(lb.top.length).toBeLessThanOrEqual(10);
    expect(lb.top[0].rank).toBe(1);
    for (let i = 1; i < lb.top.length; i++) expect(lb.top[i - 1].points).toBeGreaterThanOrEqual(lb.top[i].points);
  });
});

describe('tải ảnh điểm danh bù cho bé đã check-in', () => {
  function presentInRecent() {
    for (const s of api.listMakeupSessions(admin)) {
      const row = s.rows.find((r) => r.attendance && r.grade && !r.grade.photo) || s.rows.find((r) => r.attendance);
      if (row) return row;
    }
    throw new Error('không có bé đã check-in');
  }
  it('bắt buộc có ảnh', () => {
    const row = presentInRecent();
    expect(() => api.addAttendanceEvidence(admin, { attendanceId: row.attendance.id, evidence: null, evidenceType: 'sheet' })).toThrow(/ảnh/);
  });
  it('lưu ảnh, ghi audit, báo phụ huynh; ảnh tranh vào bộ sưu tập nếu đang thiếu', () => {
    const row = presentInRecent();
    const r = api.addAttendanceEvidence(admin, { attendanceId: row.attendance.id, evidence: IMG, evidenceType: 'painting', note: 'chụp bù' });
    expect(r.attendance.extraEvidence).toHaveLength(1);
    if (row.grade && !row.grade.photo) expect(r.savedToGallery).toBe(true);
    expect(loadDb().audit.some((a) => a.action === 'attendance_evidence')).toBe(true);
    expect(loadDb().notifications.some((n) => n.kidId === row.kid.id && /bổ sung ảnh/.test(n.text))).toBe(true);
  });
  it('quá 48 giờ thì không tải ảnh bù được', () => {
    const db = loadDb();
    const old = db.attendances.find((a) => { const s = db.sessions.find((x) => x.id === a.sessionId); return Date.now() - new Date(s.end).getTime() > 72 * 3600e3; });
    expect(() => api.addAttendanceEvidence(admin, { attendanceId: old.id, evidence: IMG, evidenceType: 'sheet' })).toThrow(/48 giờ/);
  });
  it('bé học khác lớp vẫn check-in bù được', () => {
    const s = api.listMakeupSessions(admin)[0];
    const other = loadDb().kids.find((k) => k.classId !== s.session.classId && !s.rows.some((r) => r.kid.id === k.id));
    const r = api.makeupCheckIn(admin, { sessionId: s.session.id, kidId: other.id, evidence: IMG, evidenceType: 'sheet', reason: 'forgot' });
    expect(r.attendance.makeup).toBe(true);
  });

  it('hồ sơ bé hiện voucher quá hạn là "expired"', () => {
    const k1 = api.getKidDetail(admin, 'k1');
    expect(k1.vouchers.every((v) => v.status !== 'expired' || new Date(v.expiresAt) < new Date())).toBe(true);
    saveDbWith((db) => db.vouchers.push({ id: 'vx', kidId: 'k1', rewardId: 'r1', name: 'Cũ', code: 'X', status: 'unused', createdAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-31T00:00:00Z' }));
    expect(api.getKidDetail(admin, 'k1').vouchers.find((v) => v.id === 'vx').status).toBe('expired');
  });
});
