# Thư viện ảnh chung và trình xem ảnh

Ngày: 2026-10-16. Đã cập nhật mã nguồn; chưa chạy migration trên Supabase thật, chưa deploy Vercel.

## Kích hoạt

Chạy [20261015010000_shared_media_library.sql](migrations/20261015010000_shared_media_library.sql) trong Supabase SQL Editor sau các migration hiện có. File đã có trong danh sách nâng cấp/bundle `/setup`. Sau đó chạy lại ứng dụng với thư viện mới trong `bun.lock` và tải lại trang.

Migration tạo danh mục `media_assets`, nhập metadata của gallery/CMS cũ và thêm `asset_id` cho các ảnh trong nội dung. Giữ file ở bucket/path cũ, giữ ID ảnh CMS và ảnh bìa đã lưu, không chuyển hoặc xóa file. Upload mới vào bucket private `media-library`; `gallery` và `home-content` được giữ để đọc các file cũ. Đường dẫn gallery không hợp lệ/URL ngoài Supabase không tự nhập vào thư viện mới. Không ghi nhận việc nhập dữ liệu thật hoàn tất trước khi migration được chạy và người dùng kiểm tra.

## Sử dụng

- `/dashboard/gallery` là **Thư viện ảnh chung**. Admin/editor hoạt động tải ảnh, tìm kiếm, chỉnh tên/mô tả/ngày và quản lý file; member hoạt động chỉ xem những ảnh được phép. Không còn hai khu upload riêng trong luồng ứng dụng chính.
- Trang chủ và mọi bài viết/thông báo/album có **Chọn từ thư viện**. Một file dùng được trong nhiều nội dung, không tạo bản sao. Có thể tải ảnh mới ngay tại nội dung; ảnh đó cũng xuất hiện trong danh mục của ban biên tập.
- Tải nhiều ảnh, thumbnail, nén ảnh trên 4 MB và nhập mô tả sau vẫn hoạt động. Metadata kích thước được đọc phía server; ảnh cũ chưa có kích thước vẫn hiển thị tỷ lệ tự nhiên và được đo khi mở trình xem.
- Phòng trưng bày dùng masonry kiểu Pinterest, ảnh cao/thấp theo tỷ lệ thật. Album công khai dùng bố cục masonry và bấm ảnh mở cùng trình xem. Ảnh bìa album trên thẻ nội dung cũng giữ tỷ lệ, không ép thành ảnh ngang.
- Theo lựa chọn của chủ dự án, dùng **PhotoSwipe 5.4.4 (MIT)** thay Fancybox yêu cầu license trả phí. Có zoom, vuốt/chuyển ảnh, mũi tên bàn phím, Escape, phục hồi focus và caption dạng văn bản an toàn. Không đưa HTML của mô tả vào trình xem.

## Quyền và vòng đời

- Asset mới tải trong thư viện mặc định hiện cho thành viên hoạt động. Asset tải từ CMS mặc định chỉ ban biên tập thấy cho tới khi có nội dung đã đăng hoặc được chọn làm ảnh bìa. Ảnh gallery cũ giữ phạm vi nội bộ; ảnh CMS cũ không tự mở quyền xem cho member chỉ vì được nhập vào danh mục chung.
- Ảnh chỉ công khai khi được tham chiếu bởi nội dung công khai đang có hiệu lực hoặc ảnh bìa trang chủ đã lưu. Hết hạn, vào thùng rác, gỡ đăng hoặc gỡ liên kết sẽ được kiểm tra trên request ảnh mới. Nếu cùng file còn được dùng ở một nơi công khai khác, file đó vẫn công khai qua nơi đó.
- `media_assets` không cấp SELECT metadata cho anonymous. `/api/media/image` kiểm tra RPC `can_read_media_asset` trước khi dùng service client đọc file; trả `private, no-store`. Bảng tham chiếu CMS vẫn dùng RLS hiện có. Member/anonymous không đọc raw Storage để tạo signed URL.
- **Gỡ khỏi nội dung** chỉ xóa placement, giữ asset và file. **Xóa khỏi thư viện** bị chặn nếu ảnh còn được dùng trong bất kỳ nội dung nào (kể cả bản nháp/thùng rác) hoặc ảnh bìa đã lưu. RPC khóa asset và kiểm tra FK trước khi xóa; service client dọn file sau khi metadata đã được xóa. Nếu Storage cleanup lỗi, file riêng tư dư có thể còn lại nhưng proxy đã thu hồi quyền đọc.
- Bucket mới không cho client xóa/ghi đè file đã có asset; cập nhật metadata không thay bytes. Muốn thay một ảnh trong album, tải ảnh mới, gỡ placement cũ và chọn ảnh mới để các album khác không bị thay theo.
- Tên/mô tả chung thuộc asset. Alt/chú thích/thứ tự trong từng nội dung là bản riêng; sửa mô tả chung không ghi đè chú thích đã biên tập ở album khác.

## Chống trùng

Upload mới tính SHA-256 của bytes thực nhận; cùng bytes dùng lại asset đã có, không upload thêm file. Unique hash xử lý cả hai request đồng thời; file dư do thua race được dọn. Việc dùng lại không tự đổi phạm vi nội bộ/riêng tư của asset đã có. RPC attach có tính idempotent, mỗi asset tối đa một placement trong cùng nội dung.

Migration không tải toàn bộ file cũ về để tính hash, không tự xóa các bản sao vật lý đã tồn tại từ trước ở các bucket khác nhau. Chọn lại ảnh cũ qua thư viện sẽ dùng đúng file cũ. Chống upload trùng theo hash áp dụng cho các asset đã có hash từ luồng upload mới; không coi hai ảnh cùng tên hoặc nhìn giống nhau là cùng file.

## Kiểm tra và giới hạn

- `tests/shared-media.test.ts`: nhập dữ liệu cũ, replay migration, hai album dùng một file, trạng thái công khai/hết hạn/bìa, tách liên kết, xóa ảnh đang dùng, RLS/member/inactive editor và bảo vệ file Storage.
- `tests/media-routes.test.ts`: quyền/origin/dung lượng/MIME, kích thước ảnh thật, hash/reuse, cleanup khi lỗi và service download sau kiểm tra quyền.
- `bun scripts/create-upload-fixture.mjs`, `next build`, `node scripts/check-home-browser.mjs --image-upload-fixture`: component thật + PhotoSwipe, ảnh/dịch vụ giả. Kiểm tra masonry tỷ lệ thật, ảnh cũ thiếu kích thước, zoom/chuyển/Escape/focus, chọn lại ảnh cho hai album không upload, gỡ/xóa, nén/chống trùng và mobile dark mode. Không dùng phiên Supabase thật.
- Xem `CURRENT_SNAPSHOT.md` cho kết quả đã ghi nhận. Sao lưu gia phả JSON/CSV/GEDCOM chưa bao gồm `media_assets`, các placement CMS hoặc file Storage; cần sao lưu database và bucket riêng.
