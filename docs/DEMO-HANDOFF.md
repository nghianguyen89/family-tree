# Dữ liệu Demo và ảnh README

Cập nhật: 2026-10-22.

## Phạm vi

Bộ dữ liệu **Gia tộc An** hoàn toàn hư cấu, đã được thêm vào Supabase riêng của `families/demo/config.json`. Không thay project Lê Gia Trang hoặc project gia đình trên `main`. Không chạy migration, reset database, push hoặc deploy trong công việc này.

- 21 hồ sơ: 19 người trong họ chính qua năm thế hệ và hai người riêng của nhánh bên ngoại.
- 32 quan hệ, một nhánh bên ngoại dùng chung hồ sơ Nguyễn Thị Lan; người gốc và đời của nhánh tách khỏi họ chính.
- Một hồ sơ dùng khoảng năm sinh, các ngày cúng âm lịch và hai sự kiện minh họa.
- Bốn nội dung: bài lịch sử, thông báo, album công khai và bài nháp nội bộ.
- Năm tranh phong cảnh tự dựng bằng SVG, chuyển WebP và lưu vào bucket private `media-library`; album/bìa dùng lại các file này.
- Một lượt gửi hư cấu chờ duyệt, gắn với link **đã tắt**, không lưu token có thể chia sẻ. Chưa duyệt lượt này vào cây.

Ngày sinh, sự kiện và nội dung mẫu có mốc cố định; danh sách sự kiện sắp tới thay đổi theo thời điểm chạy web. Đây không phải cơ chế tự reset hoặc làm mới dữ liệu theo ngày.

## Tạo lại dữ liệu

Nguồn mẫu ở [demo-data.mjs](../scripts/demo-data.mjs); công cụ ở [seed-demo.mjs](../scripts/seed-demo.mjs). Cần cài dependencies và profile `families/demo/.env.local` có kết nối SQL/service-role hợp lệ.

```powershell
# Chỉ đọc và báo số lượng trước khi thực hiện
bun scripts/seed-demo.mjs

# Thêm bộ mẫu vào đúng project Demo
bun scripts/seed-demo.mjs --apply
```

Script kiểm tra `FAMILY_ID`, `isDemo`, URL Supabase và SQL cùng project đã cấu hình, từ chối SQL query override và dữ liệu hồ sơ/nội dung nằm ngoài bộ mẫu. Các hàng dùng UUID cố định; chạy lại không nhân đôi hoặc ghi đè các hàng đã chỉnh. File tranh tại đường dẫn riêng của bộ seed được upload lại; thiết lập trang chủ chỉ cập nhật khi còn revision mặc định. Không có lệnh xóa/reset. Ghi dữ liệu nghiệp vụ trong một transaction; Auth và upload Storage nằm ngoài transaction đó, nên lỗi có thể để lại tài khoản/file mẫu để lần chạy sau dùng tiếp.

Một tài khoản biên tập hư cấu `demo-curator@example.test` dùng mật khẩu ngẫu nhiên, chỉ lưu tại `_screenshot_/demo/operator.json` được Git ignore. Tài khoản này có quyền admin phục vụ chụp trang quản trị; không công bố mật khẩu hoặc dùng làm tài khoản truy cập chung. Đây không phải tài khoản đọc công khai cho khách Demo.

## Chụp ảnh

[screenshot-demo.mjs](../scripts/screenshot-demo.mjs) build Next.js production với profile Demo và `APP_URL=http://localhost:3107`, chạy Node.js và Edge headless. Công cụ đăng nhập bằng tài khoản hư cấu, giữ cookie trong phiên trình duyệt riêng, chụp trang thật rồi tắt server/browser do nó tạo. Không thay `.env.local` ở gốc. Mặc định dùng Node tại `C:/nvm4w/nodejs/node.exe`; có thể đặt `DEMO_NODE_PATH` tới Node đã cài. Cần Edge ở đường dẫn Windows ghi trong script và cổng 3107/9317 còn trống.

```powershell
bun scripts/screenshot-demo.mjs
```

`--skip-build` chỉ dùng ngay sau khi đã build thành công cùng profile Demo và origin trên; không tái sử dụng build của gia tộc khác. Build ảnh này dành cho local; cần build lại với cấu hình đích trước deploy.

Kết quả tại [screenshots/demo](screenshots/demo/), kích thước desktop 1440×1050, mobile 390×844. Công cụ kiểm tra ảnh đang hiển thị tải thành công, không lỗi runtime và mobile không tràn ngang; bỏ qua ảnh quản lý tài khoản nếu có email không thuộc `example.test`. Report chỉ ghi tên màn hình, route, kích thước và trạng thái, không ghi session hoặc credential.

Ảnh chứng minh các màn hình đọc/render với phiên admin hư cấu trên database Demo thật. Không xem đây là nghiệm thu mọi luồng ghi, upload từ giao diện, duyệt hồ sơ, backup/restore hoặc deployment Vercel. Giao diện README là ảnh bản nguồn local tại thời điểm chụp; website public có thể đang chạy phiên bản khác.
