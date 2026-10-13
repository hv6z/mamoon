import { describe, it, expect } from 'vitest';
import {
  balanceOf, lifetimeOf, tierInfo, validateScores, convertScore, makeupStatus, leaderboard, isValidPhone, monthKey,
} from './logic.js';

const L = (kidId, amount, kind = 'class', occurredAt = '2026-10-05T02:00:00.000Z') => ({ kidId, amount, kind, occurredAt });

describe('điểm và hạng', () => {
  const ledger = [L('a', 100), L('a', 300), L('a', -150, 'redeem'), L('b', 50)];
  it('số dư trừ cả lần đổi quà', () => expect(balanceOf(ledger, 'a')).toBe(250));
  it('điểm tích luỹ không trừ đổi quà', () => expect(lifetimeOf(ledger, 'a')).toBe(400));
  it('xét hạng theo tích luỹ', () => {
    expect(tierInfo(0).current.key).toBe('dong');
    expect(tierInfo(199).current.key).toBe('dong');
    expect(tierInfo(200).current.key).toBe('bac');
    expect(tierInfo(320).toNext).toBe(180);
    expect(tierInfo(1000).current.key).toBe('kimcuong');
    expect(tierInfo(5000).next).toBeNull();
  });
  it('thu hồi điểm làm giảm tích luỹ', () => {
    expect(lifetimeOf([...ledger, L('a', -100, 'revoke')], 'a')).toBe(300);
  });
});

describe('chấm điểm', () => {
  it('đủ 3 tiêu chí trong khoảng 1-5', () => {
    expect(validateScores({ color: 5, creative: 4, neat: 4 })).toBeNull();
    expect(validateScores({ color: 5, creative: 4 })).toMatch(/Gọn gàng/);
    expect(validateScores({ color: 6, creative: 4, neat: 4 })).toMatch(/từ 1 đến 5/);
    expect(validateScores({ color: 0, creative: 4, neat: 4 })).toMatch(/từ 1 đến 5/);
    expect(validateScores({ color: 2.5, creative: 4, neat: 4 })).not.toBeNull();
    expect(validateScores(null)).not.toBeNull();
  });
  it('quy đổi 13/15 thành 26 điểm', () => expect(convertScore({ color: 5, creative: 4, neat: 4 })).toBe(26));
});

describe('check-in bù trong 48 giờ', () => {
  const s = { start: '2026-10-08T02:00:00.000Z', end: '2026-10-08T03:30:00.000Z' };
  const t = (iso) => new Date(iso).getTime();
  it('chưa tới giờ học thì không được', () => expect(makeupStatus(s, t('2026-10-08T01:00:00Z')).ok).toBe(false));
  it('đang học thì không được (dùng check-in thường)', () => expect(makeupStatus(s, t('2026-10-08T03:00:00Z')).ok).toBe(false));
  it('ngay sau buổi học thì được', () => expect(makeupStatus(s, t('2026-10-08T03:31:00Z')).ok).toBe(true));
  it('đúng 48 giờ vẫn được', () => expect(makeupStatus(s, t('2026-10-10T03:30:00Z')).ok).toBe(true));
  it('quá 48 giờ thì không được', () => expect(makeupStatus(s, t('2026-10-10T03:31:00Z')).ok).toBe(false));
});

describe('bảng xếp hạng tháng', () => {
  const kids = [{ id: 'a', name: 'An' }, { id: 'b', name: 'Bình' }, { id: 'c', name: 'Chi' }, { id: 'd', name: 'Dũng' }];
  const ledger = [
    L('a', 100), L('a', -100, 'redeem'), // đổi quà không làm tụt hạng tháng
    L('b', 120), L('c', 100),
    L('d', 500, 'class', '2026-09-20T02:00:00.000Z'), // tháng trước
  ];
  const lb = leaderboard(ledger, kids, '2026-10', 10);
  it('không tính đổi quà và tháng khác', () => {
    expect(lb.top.map((r) => r.kidId)).toEqual(['b', 'a', 'c']);
  });
  it('bằng điểm thì xếp theo tên', () => {
    expect(lb.top[1].name).toBe('An');
    expect(lb.top[2].name).toBe('Chi');
  });
  it('chỉ lấy đủ số lượng', () => expect(leaderboard(ledger, kids, '2026-10', 2).top).toHaveLength(2));
  it('khoá tháng theo giờ địa phương', () => expect(monthKey('2026-10-01T10:00:00')).toBe('2026-10'));
});

describe('số điện thoại', () => {
  it('10 số bắt đầu bằng 0', () => {
    expect(isValidPhone('0912345678')).toBe(true);
    expect(isValidPhone('0912 345 678')).toBe(true);
    expect(isValidPhone('912345678')).toBe(false);
    expect(isValidPhone('09123456789')).toBe(false);
    expect(isValidPhone('abc')).toBe(false);
  });
});
