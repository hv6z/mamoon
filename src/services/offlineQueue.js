// Hàng đợi khi mất mạng: lưu thao tác check-in / chấm điểm trên máy, có mạng lại thì gửi lần lượt.
// Ở bản demo, "mất mạng" có thể giả lập bằng công tắc trên thanh Admin.
import * as api from './api.js';

const KEY = 'mamoon-offline-queue';
const FLAG = 'mamoon-sim-offline';
const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(q) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* bỏ qua */ }
  listeners.forEach((fn) => fn(q.length));
}

export function isOffline() {
  let sim = false;
  try { sim = localStorage.getItem(FLAG) === '1'; } catch { /* bỏ qua */ }
  return sim || (typeof navigator !== 'undefined' && navigator.onLine === false);
}

export function setSimulatedOffline(on) {
  try { localStorage.setItem(FLAG, on ? '1' : '0'); } catch { /* bỏ qua */ }
  listeners.forEach((fn) => fn(read().length));
}

export function pendingCount() { return read().length; }

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Thêm một thao tác vào hàng đợi. type: 'checkin' | 'grade' */
export function enqueue(type, payload) {
  const q = read();
  const clientId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  q.push({ clientId, type, payload, createdAt: new Date().toISOString() });
  write(q);
  return clientId;
}

/** Gửi lần lượt. Thao tác lỗi do trùng (đã check-in rồi) thì bỏ, lỗi khác thì giữ lại. */
export function flush(actor) {
  if (isOffline()) return { sent: 0, failed: 0, errors: [] };
  const q = read();
  const keep = []; const errors = [];
  let sent = 0;
  // map clientId check-in -> attendanceId thật để thao tác chấm điểm phía sau dùng được
  const idMap = {};
  for (const item of q) {
    try {
      if (item.type === 'checkin') {
        const r = api.checkIn(actor, item.payload.sessionId, item.payload.kidId, { clientId: item.clientId });
        idMap[item.clientId] = r.attendance.id;
      } else if (item.type === 'grade') {
        const attId = idMap[item.payload.attendanceRef] || item.payload.attendanceRef;
        api.gradeAttendance(actor, attId, item.payload.data);
      }
      sent++;
    } catch (e) {
      if (e.code === 'CONFLICT') { sent++; continue; } // đã có trên máy chủ, không cộng trùng
      errors.push(`${item.type}: ${e.message}`);
      keep.push(item);
    }
  }
  write(keep);
  return { sent, failed: keep.length, errors };
}
