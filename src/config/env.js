// Cấu hình theo môi trường. Đặt trong Vercel: Settings → Environment Variables.
//
// VITE_DEMO_MODE
//   - không đặt hoặc "true": bản demo, hiện dải "Bản demo" và khung "Tài khoản dùng thử"
//   - "false": bản chạy thật, ẩn toàn bộ phần chỉ dành cho demo
// Sau khi đổi biến, cần Redeploy để có hiệu lực (Vite đọc biến lúc build).
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
