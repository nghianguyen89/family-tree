# Panel điều hướng dashboard

Cập nhật: 2026-10-16. Đã sửa mã nguồn và kiểm thử local; chưa deploy.

## Cách dùng

Menu tài khoản cũ trên header đã chuyển thành thanh điều hướng bên trái trên các trang `/dashboard`. Trên desktop, mặc định thu gọn thành icon rộng 64px; mỗi icon có tên cho trình đọc màn hình và tooltip. Trên điện thoại, thanh bên ẩn hoàn toàn khi đóng, nội dung dùng toàn bộ chiều ngang và nút hamburger nằm trên header. Bấm hamburger để mở panel rộng 256px, hiện tên mục, nhóm chức năng và tài khoản/vai trò; nút đăng xuất luôn ở cuối panel. Không lưu trạng thái mở sau khi tải lại trang.

Trên desktop, mở menu sẽ dành chỗ bên trái cho panel. Dưới 768px, panel mở đè lên nội dung, không chừa khoảng trống cho thanh icon; có lớp nền để đóng, khóa cuộn trang và dùng `inert` cho nội dung phía sau. Tab/Shift+Tab nằm trong panel; Escape đóng và trả focus về nút hamburger trên header. Chọn link hoặc bấm ngoài panel sẽ đóng trên điện thoại. Menu có vùng cuộn riêng cho màn hình thấp; các link trong panel ẩn không thể nhận Tab khi menu đóng.

Header giữ logo, đổi theme và ngôn ngữ. Tên website thu gọn trên điện thoại để các nút không tràn màn hình. Trang public và trang chờ kích hoạt giữ luồng riêng hiện có.

## Quyền hiển thị

| Tài khoản hoạt động | Các nhóm được hiển thị |
| --- | --- |
| Member | Gia phả và Website |
| Editor | Gia phả, Biên soạn và Website |
| Admin | Gia phả, Biên soạn, Quản trị và Website |

- Gia phả: Tổng quan, Cây và thành viên, Tra cứu quan hệ, Sự kiện, Thư viện ảnh, Thống kê.
- Biên soạn: Thêm thành viên, Thu thập thông tin, Quản lý nội dung, Thiết lập trang chủ.
- Quản trị: Quản lý tài khoản, Sắp xếp đời và thứ tự, Sao lưu và khôi phục, Cập nhật hệ thống.
- Website: Trang chủ, Tin tức, Giới thiệu.

Tài khoản chưa hoạt động không được cấp các link dashboard. Điều kiện hiển thị theo quyền các trang hiện có; kiểm tra quyền server/RLS vẫn cần thiết và không thay đổi. Đường dẫn con dùng mục cha gần nhất; chỉ một link có `aria-current="page"`.

## Mã nguồn và kiểm thử

- `components/DashboardShell.tsx`: trạng thái panel, bố cục, keyboard/mobile và context cho nút hamburger trên header.
- `utils/dashboard-navigation.ts`: danh sách route, lọc quyền và xác định mục đang chọn.
- `lib/i18n/navigation.ts`: nhãn tiếng Việt/Anh.
- `app/dashboard/layout.tsx`: giữ kiểm tra đăng nhập/kích hoạt phía server và truyền header/footer/page vào shell.
- `components/DashboardHeader.tsx`, `components/LogoutButton.tsx`: header gọn và nút đăng xuất có chế độ icon.
- `tests/dashboard-navigation.test.ts`: quyền member/editor/admin/inactive và chọn route con chính xác.
- `bun scripts/create-navigation-fixture.mjs` rồi `node scripts/check-home-browser.mjs --navigation-fixture`: component thật với profile/router/auth giả, không dùng phiên người dùng hoặc ghi Supabase. Kiểm tra desktop thu gọn/mở rộng, từng vai trò, mobile ẩn thanh bên/nội dung đủ chiều ngang/nút header, overlay/khóa cuộn/inert/focus trap/Escape/trả focus/chọn link/bấm ngoài, màn hình 320px/dark mode, đăng xuất, tiếng Anh và resize trở lại desktop. Ảnh nằm trong `_screenshot_/navigation/`, được Git ignore.

Đã qua TypeScript, ESLint, 80 bài kiểm thử ở 18 file và build production bằng Webpack. Edge headless đã qua các kiểm tra điều hướng và smoke test trang chủ/mobile/theme/kho tin/chuyển khách khỏi CMS, không có lỗi runtime. Chưa kiểm thử điều hướng bằng phiên Supabase thật và chưa deploy; thay đổi này không cần migration database.
