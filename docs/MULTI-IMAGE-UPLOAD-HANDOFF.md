# Tải nhiều ảnh và mô tả sau

Ngày cập nhật: 2026-10-15. Thay đổi mã nguồn local, chưa deploy Vercel.

Luồng hiện tại dùng **Thư viện ảnh chung** theo [bàn giao mới](SHARED-MEDIA-HANDOFF.md). CMS và `/dashboard/gallery` đều upload qua `/api/media/upload`; không tạo thêm bản sao khi chọn từ thư viện.

## Cách sử dụng

1. Trong thư viện ảnh nội bộ hoặc phần ảnh của trang chủ/bài viết/thông báo/album CMS, chọn nhiều ảnh hoặc kéo thả vào khung tải ảnh. Có thể chọn thêm; mỗi ảnh có thumbnail, tên file và nút bỏ trước khi tải.
2. Bấm **Tải ảnh đã chọn**. Ảnh trên 4 MB tự nén trong trình duyệt trước khi gửi; hiện trạng thái **Đang nén ảnh** và dung lượng trước/sau. Từng ảnh có trạng thái riêng; nếu một ảnh lỗi, những ảnh khác vẫn tiếp tục. Nút **Tải tiếp / thử lại ảnh lỗi** bỏ qua những ảnh đã thành công và dùng lại bản đã nén nếu chỉ lỗi mạng/upload.
3. Không cần nhập mô tả trước khi tải. Tiêu đề hoặc mô tả ban đầu lấy từ tên file (bỏ phần mở rộng, giới hạn 200 ký tự); mô tả chi tiết/chú thích/ngày sự kiện có thể nhập sau.
4. CMS: chỉnh mô tả/chú thích/thứ tự ở form dưới mỗi ảnh rồi **Lưu mô tả ảnh**. Album CMS vẫn lấy ảnh có thứ tự nhỏ nhất làm đại diện. Upload giữ ảnh bìa trang chủ đang chọn; với thư viện trống, ảnh tải thành công đầu tiên được chọn tạm, vẫn cần lưu thiết lập để áp dụng.
5. Thư viện chung: ảnh xuất hiện ngay sau upload; bấm **Sửa thông tin** dưới ảnh để nhập tên/ngày/mô tả. Bấm ảnh mở PhotoSwipe, không mở form biên tập. Muốn thay file trong một album, tải ảnh mới rồi đổi tham chiếu.

## Ràng buộc và mã nguồn

- `components/ImageUploadQueue.tsx` dùng chung giữa CMS `MediaManager` và `components/media/MediaLibrary.tsx`. Các object URL thumbnail được giải phóng khi bỏ ảnh, xóa danh sách đã tải hoặc unmount. Không áp dụng crop đại diện vào ảnh album.
- Tải tuần tự mỗi request một file: CMS dùng API hiện có, tối đa 4 MB/ảnh JPG/PNG/WebP, 100 ảnh/nội dung hoặc thư viện ảnh bìa. Giới hạn số chỗ còn lại áp dụng cả các ảnh đang chờ tải.
- Gallery dùng Storage/client hiện có, bucket vẫn giới hạn 10 MB/ảnh JPG/PNG/GIF/WebP; giao diện mới tự nén ảnh trên 4 MB xuống dưới 4 MB, kể cả thay file trong form sửa ảnh. Giới hạn 100 ảnh đang chờ trong một lượt chọn. Không tạo album mới hoặc chuyển ảnh giữa gallery và CMS.
- Đầu vào tối đa 50 MB/ảnh, tối đa 80 triệu pixel khi giải mã. `utils/image-compression.ts` giữ file dưới/ngang 4 MB nguyên vẹn; ảnh lớn xuất WebP, giữ tỷ lệ và trong suốt, cạnh dài tối đa 4096px, thử chất lượng trước rồi giảm kích thước cho tới khi đạt dưới giới hạn (có khoảng đệm 5%). Trình duyệt không mã hóa được WebP dùng PNG và giảm kích thước. GIF lớn chuyển thành ảnh tĩnh, có ghi chú trên giao diện. Chỉ gửi bản nén; không gửi file gốc quá 4 MB hoặc file không nén được. Không chỉnh ảnh gốc trên máy.
- Admin/editor hoạt động quản lý thư viện chung và CMS; member chỉ xem các ảnh được phép. Migration mới bổ sung danh mục, tham chiếu và bucket riêng, không cần thay service key.
- `utils/media-client.ts` gọi API chung. `utils/gallery-images.ts` và các component gallery cũ chỉ phục vụ luồng cũ, không được trang thư viện chính sử dụng.
- `utils/image-upload.ts` kiểm tra đầu vào phía giao diện và sinh tên tạm. API/Storage tiếp tục kiểm tra quyền/định dạng/dung lượng phía server theo luồng hiện có.

## Kiểm tra

- Unit test `tests/image-upload.test.ts`: loại/dung lượng/tên file, mô tả để sau, từ chối phiên không đăng nhập, dọn file khi lỗi và thứ tự thay ảnh.
- Fixture trình duyệt: `bun scripts/create-upload-fixture.mjs`, `next build`, `node scripts/check-home-browser.mjs --image-upload-fixture`. Dùng component thật, ảnh/vai trò giả, API/Storage/actions bị thay bằng dịch vụ trong bộ nhớ. Không ghi Supabase hoặc dùng dữ liệu gia đình.
- Kết quả đã chạy và giới hạn xác nhận xem `CURRENT_SNAPSHOT.md`. Cần người dùng thử upload nhiều ảnh bằng phiên đăng nhập thật trước khi xác nhận môi trường Supabase/Vercel.
