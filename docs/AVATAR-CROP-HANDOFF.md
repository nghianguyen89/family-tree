# Cắt ảnh đại diện thành viên

Ngày cập nhật: 2026-10-15.

## Hành vi

- Form thêm và sửa thành viên dùng chung `MemberForm`: chọn ảnh sẽ mở hộp thoại cắt ảnh trước khi thay ảnh xem trước.
- Kéo bằng chuột/cảm ứng hoặc dùng phím mũi tên trong vùng ảnh; thanh phóng to từ 1× đến 16× hỗ trợ chọn khuôn mặt nhỏ trong ảnh chung. Vòng tròn biểu thị vùng hiển thị của avatar trên gia phả.
- “Đặt lại vị trí” đưa ảnh về giữa ở 1×. “Dùng ảnh đã cắt” xác nhận bản cắt; “Chỉnh vùng cắt” mở lại ảnh gốc vừa chọn để điều chỉnh. Hủy/Escape giữ ảnh đã chọn trước đó và trả focus về điều khiển trước khi mở.
- Chỉ tải bản cắt lên bucket `avatars` khi lưu thành viên bằng luồng quyền hiện có. Không tải ảnh gốc trong bước crop. Ảnh cũ chỉ được xóa sau khi lưu thành công theo logic hiện có.
- Đầu vào JPG/PNG/GIF/WebP tối đa 20 MB. Đầu ra vuông tối đa 512×512, không phóng lớn ảnh nhỏ; WebP hoặc PNG nếu trình duyệt không hỗ trợ mã hóa WebP. GIF trở thành ảnh tĩnh. Phóng to khuôn mặt nhỏ không khôi phục chi tiết ảnh gốc.
- Không thay đổi schema, bucket hoặc migration Supabase. Chưa deploy Vercel.

## Mã nguồn và kiểm tra

- `components/AvatarCropDialog.tsx`: native dialog có focus trap, vùng canvas, thao tác kéo và zoom, xử lý lỗi đọc/xuất ảnh và giải phóng object URL.
- `utils/avatarCrop.ts`: tọa độ cắt được giới hạn trong ảnh, mã hóa đúng phần đã chọn.
- `tests/avatar-crop.test.ts`: ảnh ngang/dọc/vuông, cạnh ảnh và vùng khuôn mặt lệch tâm.
- Kiểm tra trình duyệt không dùng phiên đăng nhập hoặc dữ liệu thật: tạo fixture bằng `bun build ./scripts/fixtures/avatar-crop.tsx --target browser --outfile ./_screenshot_/avatar-crop/fixture.js`, chạy production build rồi `node scripts/check-home-browser.mjs --avatar-crop-fixture`. Fixture dùng component crop thật và các vùng màu giả để kiểm tra pixel đầu ra.
- Xem `CURRENT_SNAPSHOT.md` cho kết quả đã chạy. Thao tác lưu thành viên/upload bằng phiên đăng nhập thật còn cần người dùng xác nhận; không ghi kiểm tra fixture thành xác nhận Supabase thật.
