// Lớp lưu trữ cho bản demo: ghi toàn bộ dữ liệu vào localStorage.
// Khi có backend thật, chỉ cần thay api.js gọi fetch() thay vì đọc/ghi ở đây.
import { buildSeed } from '../data/seed.js';

const KEY = 'mamoon-db-v1';
let memory = null; // dùng khi không có localStorage (unit test, chế độ ẩn danh bị chặn)

function ls() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const t = '__t'; localStorage.setItem(t, t); localStorage.removeItem(t);
    return localStorage;
  } catch { return null; }
}

export function loadDb() {
  const store = ls();
  if (store) {
    try {
      const raw = store.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* dữ liệu hỏng thì tạo lại */ }
  } else if (memory) {
    return structuredClone(memory);
  }
  const db = buildSeed();
  saveDb(db);
  return structuredClone(db);
}

export function saveDb(db) {
  const store = ls();
  if (store) {
    try {
      store.setItem(KEY, JSON.stringify(db));
      return;
    } catch (e) {
      // Đầy bộ nhớ (thường do ảnh quá lớn)
      throw new Error('Bộ nhớ trình duyệt đã đầy. Hãy xoá bớt ảnh hoặc đặt lại dữ liệu demo.');
    }
  }
  memory = structuredClone(db);
}

export function resetDb(seedDate) {
  const db = buildSeed(seedDate);
  memory = null;
  const store = ls();
  if (store) store.removeItem(KEY);
  saveDb(db);
  return db;
}

/** Đọc - sửa - ghi trong một bước, giống một transaction. */
export function transact(fn) {
  const db = loadDb();
  const result = fn(db);
  saveDb(db);
  return result;
}
