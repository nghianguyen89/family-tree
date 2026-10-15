# Bàn giao trang chủ và quản lý nội dung

Ngày: 2026-10-15. Mã nguồn trong workspace; chưa áp dụng migration trên Supabase thật và chưa deploy Vercel.

## Kích hoạt

1. Sau khi database đã có các migration trước đó, chạy toàn bộ [20261015000000_home_content.sql](migrations/20261015000000_home_content.sql) trong Supabase SQL Editor. Migration bổ sung bảng và bucket riêng, không thay thế dữ liệu gia phả. Đã đưa file vào danh sách migration Dashboard và bundle tự đọc tại `/setup`.
2. Cấu hình `SUPABASE_SERVICE_ROLE_KEY` ở server local và môi trường Production của Vercel. Key này chỉ dùng phía server để trả ảnh sau khi kiểm tra quyền; tuyệt đối không thêm tiền tố `NEXT_PUBLIC_`. Upload dùng phiên đăng nhập của người biên tập và policy Storage.
3. Đăng nhập bằng admin/editor đang hoạt động, mở menu tài khoản → **Quản lý nội dung**, hoặc `/dashboard/content`.
4. Mở **Thiết lập trang chủ**, nhập tên dòng họ, lời giới thiệu, quê quán, lịch sử và ban liên lạc. Tải ảnh vào thư viện, chọn **Ảnh bìa trang chủ** rồi bấm **Lưu ảnh bìa trang chủ** ngay cạnh ảnh đang chọn, hoặc **Lưu thông tin và ảnh bìa** ở phần thông tin phía trên. Nút **Lưu mô tả ảnh** chỉ lưu mô tả, chú thích và thứ tự, không áp dụng ảnh bìa. Trạng thái cạnh ảnh phân biệt đã chọn/chưa lưu và ảnh bìa hiện tại. Các thông tin này đều công khai. Có thể sắp xếp ba khu vực thông báo, bài viết và album bằng nút Lên/Xuống.
5. Tạo bài viết, thông báo hoặc album, lưu bản nháp trước khi thêm ảnh. Nhập mô tả cho ảnh, có thể thêm chú thích và thứ tự; ảnh có số thứ tự nhỏ nhất là ảnh đại diện. Xem trước để kiểm tra rồi chọn trạng thái và lưu.

Trang chưa có migration vẫn hiện phần giới thiệu mặc định và trạng thái nội dung chưa khả dụng. Đây không phải xác nhận database thật đã được nâng cấp.

## Quy ước nội dung

- Trang chủ `/` gồm giới thiệu và ảnh bìa, lịch sử, thông báo/sự kiện sắp tới, bài viết, album và liên hệ nếu có nội dung.
- `/news` có bộ lọc bài viết/thông báo/album và phân trang; `/news/[id]` hiển thị chi tiết. Không tự lấy hồ sơ, ngày giỗ hoặc ảnh từ cây gia phả đưa ra công khai.
- Nội dung mới mặc định **Bản nháp / Nội bộ**. Chỉ trạng thái đã đăng, đến giờ đăng, chưa hết hạn và chưa vào thùng rác mới xuất hiện ở trang đọc. Admin/editor xem bản nháp bằng nút Xem trước trong khu quản lý.
- **Công khai:** mọi người xem được; **Nội bộ:** chỉ tài khoản đang hoạt động. Tài khoản chờ duyệt không đọc được bài nội bộ.
- Hẹn giờ đăng và hết hạn áp dụng ngay khi đọc dữ liệu, không cần cron. Các trang đọc dữ liệu theo từng request, không dùng bộ đệm công khai chung cho phiên đăng nhập. Trang đang mở cần tải lại để nhận nội dung vừa đến giờ đăng/hết hạn.
- Tất cả ngày giờ nhập theo giờ Việt Nam UTC+7, ngày dương lịch. Với lễ giỗ âm lịch, người biên tập xác định ngày dương của kỳ cụ thể rồi tạo thông báo; không tự động công khai lịch riêng từ hồ sơ gia phả.
- Thông báo cần thời điểm bắt đầu khi đăng; có thể thêm kết thúc và địa điểm. Trang chủ chỉ hiện các sự kiện chưa bắt đầu hoặc chưa kết thúc, ưu tiên thông báo nổi bật. Thông báo cũ còn trong kho tin cho tới khi hết hạn/gỡ đăng/xóa mềm.
- Bài viết phân chuyên mục lịch sử, chuyện gia đình, hoạt động hoặc tin tức. Có thể đánh dấu nổi bật. Nội dung dạng văn bản nhiều đoạn, không chạy HTML nhập vào.
- Xóa nội dung là chuyển vào thùng rác, giữ ảnh và nội dung để khôi phục. **Khôi phục luôn về bản nháp**, cần đăng lại. Xóa riêng ảnh là xóa hẳn ảnh, có bước xác nhận; ảnh bìa đang được lưu phải đổi/gỡ trong thiết lập trước khi xóa ảnh.
- Ghi người tạo, người sửa gần nhất, thời điểm và số phiên bản; khi hai người cùng sửa, bản lưu cũ bị từ chối để tránh ghi đè. Đây không phải lịch sử đầy đủ mọi phiên bản.

## Ảnh và phân quyền

- Bucket `home-content` là private. Hỗ trợ JPEG, PNG, WebP tối đa 4 MB/ảnh; tối đa 100 ảnh/nội dung và 100 ảnh trong thư viện ảnh bìa của giao diện. Mỗi lần tải một ảnh.
- Upload kiểm tra phiên admin/editor, origin, dung lượng kể cả request dạng stream, MIME và chữ ký đầu file; tên lưu là UUID do server tạo.
- Kiểm tra origin dùng Host thực tế của request để hoạt động cả localhost, `127.0.0.1` và hostname LAN khi Next chuẩn hóa URL; không mở upload cho origin khác. Ảnh có chữ ký hợp lệ vẫn dùng được khi trình duyệt không cung cấp MIME hoặc dùng alias JPEG. Ảnh quá 4 MB bị báo ngay trên form.
- Form hiển thị lỗi riêng cho phiên đăng nhập, dung lượng, định dạng, kho ảnh, policy Storage, schema và kết nối; không hiển thị thông báo thô có thể chứa chi tiết nội bộ từ Supabase. Khi báo lỗi, cung cấp nguyên văn thông báo này cùng định dạng/dung lượng ảnh để chẩn đoán.
- Khách và member không đọc trực tiếp bucket để tạo signed URL. `/api/content/image?id=...` kiểm tra RLS metadata rồi mới đọc file bằng server client. Ảnh của bản nháp, nội dung nội bộ, tương lai, hết hạn hoặc thùng rác tuân theo quyền của nội dung chứa ảnh; ảnh bìa chỉ công khai khi được chọn và lưu.
- Ảnh trả `private, no-store`; dùng thẻ ảnh trực tiếp để tránh cache ảnh dùng chung của Next.js. Khi đổi quyền hoặc gỡ nội dung, request ảnh mới bị chặn; file người xem đã tải trước đó không thể thu hồi.
- RLS và quyền cột bảo vệ dữ liệu ngay cả khi gọi Supabase trực tiếp. Quyền admin được kiểm tra riêng với editor vì hàm `is_editor()` của dự án chỉ kiểm tra vai trò editor.
- Không dùng lại bucket gallery nội bộ, không thay đổi quyền các bảng gia phả hay luồng thu thập/ngày cúng.

## Kiểm tra và bàn giao

- Kiểm thử PGlite: quyền public/member/admin/editor/chờ duyệt; bản nháp, lịch đăng/hết hạn; quyền ảnh/ảnh bìa; thùng rác và khôi phục; bản lưu cũ; ràng buộc lịch; xóa tài khoản tác giả; chạy lại migration/bundle giữ dữ liệu.
- Kiểm thử route: kiểm tra RLS trước khi dùng service client, không cache ảnh; chặn upload không có quyền, origin sai, stream quá lớn và giả định dạng; lưu upload hợp lệ với tên file do server tạo.
- Kiểm thử render: escape HTML nhập vào, không đưa đường dẫn Storage trực tiếp ra markup.
- Script `node scripts/check-home-browser.mjs` dùng Edge headless có sẵn, tự tạo server production trên cổng trống và tắt sau kiểm tra. Ảnh chụp local lưu trong `_screenshot_/home-content/` đã được Git ignore.
- Trạng thái kiểm tra mới nhất ghi tại [CURRENT_SNAPSHOT.md](CURRENT_SNAPSHOT.md). Luồng biên tập/upload thật trên Supabase cần kiểm tra sau khi chạy migration.

CMS độc lập với sao lưu JSON/CSV/GEDCOM của cây gia phả; các bản sao lưu đó **chưa bao gồm nội dung trang chủ và file trong bucket mới**. Khi sao lưu CMS, dùng bản sao lưu database Supabase và sao lưu bucket riêng. Import gia phả không xóa nội dung CMS.
