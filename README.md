# MaMoon Rewards

Web tích điểm cho bé học vẽ tại MaMoon, gồm giao diện **phụ huynh** và **Admin (cô giáo)**.
Bé đến lớp check-in, tô tranh, cô chấm điểm và chụp ảnh tranh lưu vào tài khoản của bé.
Dùng được trên máy tính, máy tính bảng và điện thoại.

> Bản hiện tại là **frontend v0.1 với dữ liệu mẫu** (lưu trên trình duyệt). Chưa có backend/database thật.

## Chạy thử

Yêu cầu Node.js 20 trở lên (khuyến nghị 22, xem `.nvmrc`).

```bash
npm install
npm run dev          # mở http://localhost:5173
npm test             # chạy unit test (logic điểm, phân quyền, check-in bù)
npm run build        # bản để deploy -> thư mục dist/
npm run build:single # gộp thành 1 file HTML -> dist-single/index.html (để gửi xem thử)
```

Tài khoản dùng thử (dữ liệu giả):

| Vai trò | Đăng nhập |
|---|---|
| Phụ huynh Bé Na | SĐT `0900000001`, OTP `123456` |
| Admin | `admin` / `mamoon123` (hoặc `admin2`) |

Màn đăng nhập có nút **Đặt lại dữ liệu demo**.

## Cấu trúc thư mục

```
.
├── index.html                 Trang gốc của Vite
├── package.json               Thư viện và lệnh chạy
├── vite.config.js             Cấu hình build (thường / 1 file)
├── src/
│   ├── main.jsx, App.jsx      Khởi động app, định tuyến (HashRouter)
│   ├── config/rules.js        Quy tắc nghiệp vụ: hạng Cup, quy đổi điểm, hạn 48 giờ… (giá trị CHỜ CHỐT)
│   ├── data/seed.js           Dữ liệu mẫu (16 bé, 2 lớp, 6 tuần buổi học)
│   ├── services/
│   │   ├── logic.js           Hàm tính toán thuần (số dư, hạng, quy đổi, hạn check-in bù, xếp hạng)
│   │   ├── api.js             Lớp API giả lập; mỗi hàm ghi chú endpoint backend tương ứng
│   │   ├── storage.js         Đọc/ghi dữ liệu (bản demo: localStorage)
│   │   ├── offlineQueue.js    Lưu tạm khi mất mạng, có mạng thì tự gửi
│   │   └── *.test.js          Unit test (Vitest)
│   ├── context/               Phiên đăng nhập
│   ├── components/            Icon, ảnh tranh, ô chụp ảnh (tự nén), modal, toast
│   ├── pages/Login.jsx        Đăng nhập OTP, đăng ký, đăng nhập Admin
│   ├── pages/user/            Màn phụ huynh
│   ├── pages/admin/           Màn Admin
│   └── styles/global.css      Toàn bộ CSS + biến màu brand MaMoon
├── docs/                      Tài liệu: sơ đồ user flow, sơ đồ kỹ thuật, PDF (xem docs/README.md)
└── .github/workflows/ci.yml   Tự chạy test + build mỗi lần push
```

## Chức năng đã có

**Phụ huynh**
- Đăng ký bằng SĐT + OTP, bắt buộc đồng ý điều khoản lưu và hiển thị tranh (một lần). Tài khoản do cô tạo tại lớp sẽ được hỏi đồng ý ở lần đăng nhập đầu.
- Tổng quan: điểm hiện có, hạng Cup, bản đồ hành trình Cup, buổi học sắp tới, tranh mới, thứ hạng, đổi quà, điểm gần đây.
- Tranh của bé: xem điểm từng tiêu chí, nhận xét của cô, tải ảnh, **Báo sai**.
- Bảng xếp hạng tháng Top 10: hạng 1/2/3 màu vàng/bạc/đồng, hạng 4–10 một màu; bấm để xem tranh; xem tháng trước.
- Đổi quà (kiểm tra đủ điểm, chống bấm 2 lần), voucher có hạn dùng.
- Lịch sử điểm có nhãn "Bổ sung", "Đã thu hồi", nút Báo sai.
- Thông báo.

**Admin**
- Tổng quan: số liệu, buổi học hôm nay, việc cần làm, top 5, hoạt động gần đây.
- Buổi học hôm nay: tìm bé theo tên / mã / SĐT, nhập mã QR, tạo nhanh tài khoản; chấm 3 tiêu chí, nhận xét, chụp ảnh tranh (trên điện thoại mở camera sau), cộng điểm. Chặn check-in trùng và chấm 2 lần.
- **Lưu tạm khi mất mạng**: công tắc "Giả lập mất mạng" để thử; thao tác được lưu trên máy và tự gửi khi có mạng, không cộng trùng.
- **Check-in bù**: chỉ các buổi đã kết thúc trong 48 giờ; bắt buộc ảnh minh chứng (ảnh tranh hoặc tờ điểm danh) và lý do; có thể nhập điểm chấm; tự ghi người làm, giờ làm; gắn nhãn Bổ sung; điểm tính vào ngày buổi học; báo phụ huynh.
- **Tải ảnh điểm danh bù** cho bé đã check-in (ví dụ chưa có ảnh tranh/tờ điểm danh), và tìm được bé học khác lớp để check-in bù.
- Yêu cầu kiểm tra: xem minh chứng, giữ nguyên hoặc huỷ check-in và thu hồi điểm, bắt buộc ghi kết quả gửi phụ huynh.
- Hồ sơ bé: toàn bộ thông tin bé và phụ huynh, chuyên cần, lần check-in bù kèm ảnh, tranh, lịch sử điểm, voucher; điều chỉnh điểm (bắt buộc lý do, tối đa 500 điểm/lần, không trừ âm).
- Ưu đãi: thêm, sửa, ẩn/hiện.

## Màu sắc (brand guideline MaMoon)

- Toàn bộ màu khai báo một lần trong `:root` của `src/styles/global.css`; component chỉ dùng biến (`var(--mm-teal)`…) hoặc class (`tint-teal`, `chip ok`, `btn primary`…). Không có mã màu viết trực tiếp ngoài khối `:root`.
- Nút chính: vàng + chữ đen. Nút phụ: teal đậm + chữ trắng, hoặc nền trắng viền teal đậm.
- Trạng thái: thành công = teal, cần chú ý = cam, cần xử lý gấp = hồng, luôn kèm chữ/icon.
- `--text-muted` dùng độ đậm 0.82 thay vì 0.72 để chữ phụ đạt tương phản 4.5:1 trên mọi nền tint.

## Chưa có / giới hạn của bản demo

| Mục | Bản demo | Khi làm thật |
|---|---|---|
| Dữ liệu | Lưu trên trình duyệt (localStorage), mỗi máy một bản | Backend API + PostgreSQL (Aiven), thay `api.js` bằng `fetch()` |
| OTP | Mã cố định 123456 | Nhà cung cấp SMS, giới hạn số lần gửi |
| Ảnh | Nén còn ~1000px rồi lưu dạng data URL | Tải lên kho lưu trữ riêng (signed URL), DB chỉ lưu đường dẫn |
| Quét QR | Nhập mã in dưới QR | Thư viện quét QR bằng camera |
| Mật khẩu Admin | Lưu dạng chữ thường trong dữ liệu mẫu | Băm mật khẩu (bcrypt/argon2), đăng nhập phía server |
| Phân quyền | Kiểm tra trong `api.js` | Bắt buộc kiểm tra lại ở server |
| Đồng bộ đơn hàng | Một đơn mẫu | Chờ chốt nguồn đơn (đang dùng Google Form) |
| Đổi quà đồng thời | Một trình duyệt nên không có tranh chấp | Transaction + khoá dòng trong DB |

## Giá trị chờ chốt (`src/config/rules.js`)

Ngưỡng hạng Cup (0/200/500/1000), hệ số quy đổi (×2), điểm chuyên cần (0), hạn check-in bù (48 giờ),
hạn voucher (30 ngày), kỳ xếp hạng (tháng), luật Admin thứ hai duyệt check-in bù (chưa làm).

## Đưa lên GitHub lần đầu

1. Tạo repo **trống** trên GitHub (không tick "Add a README", không thêm .gitignore/license).
2. Trong thư mục này chạy:

```bash
git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
git push -u origin main
```

Repo đã có sẵn commit đầu tiên. Nên để repo ở chế độ **Private** vì có thông tin nội bộ của MaMoon.

## Quy ước làm việc

- Nhánh `main` luôn chạy được. Tính năng mới làm trên nhánh riêng (`feature/ten-tinh-nang`), mở Pull Request để CI chạy test trước khi gộp.
- Không đưa lên GitHub: `node_modules/`, `dist/`, file `.env` (đã chặn trong `.gitignore`).
- Mật khẩu/tài khoản trong `src/data/seed.js` chỉ là dữ liệu demo, không dùng cho hệ thống thật.
