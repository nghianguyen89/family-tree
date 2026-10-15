# Family tree — Bối cảnh dự án

Cập nhật: 2026-10-15.

## Mục tiêu

Đây là bản fork cá nhân của Gia Phả OS, mã nguồn gốc `homielab/giapha-os`, dùng để quản lý gia phả gia đình Việt Nam. Gia đình quản lý dữ liệu trong project Supabase của mình.

Các chức năng gồm hồ sơ thành viên, quan hệ gia đình, sơ đồ cây/mindmap, danh xưng, thống kê, sự kiện, thư viện ảnh và sao lưu JSON/CSV/GEDCOM. Bản fork có thay đổi về bảo mật và hỗ trợ khoảng năm cho thông tin lịch sử không nhớ chính xác.

Đã bổ sung form công khai theo nhánh để người thân khai cả gia đình vào khu chờ, admin/editor duyệt trước khi đưa lên cây. Ngày cúng riêng được lưu độc lập với ngày mất để hỗ trợ lịch cúng truyền thống dù không nhớ ngày mất.

Trang chủ có khu giới thiệu dòng họ, thông báo sắp tới, bài viết và album. Admin/editor biên tập tại `/dashboard/content`, có bản nháp, hẹn giờ, phạm vi công khai/nội bộ và thùng rác. CMS dùng bảng/bucket riêng, không tự công khai dữ liệu gia phả. Xem [bàn giao trang chủ](HOME-CONTENT-HANDOFF.md) để áp dụng migration và cấu hình ảnh.

## Công nghệ

| Thành phần              | Công nghệ trong mã nguồn hiện tại       |
| ----------------------- | --------------------------------------- |
| Web                     | Next.js 16, React 19, TypeScript        |
| UI                      | Tailwind CSS 4, Framer Motion, Lucide   |
| Database, xác thực, ảnh | Supabase PostgreSQL, Auth, Storage      |
| Sơ đồ                   | D3 và các component React               |
| Ngày âm lịch            | `lunar-javascript`                      |
| Quản lý thư viện        | Bun, `bun.lock`                         |
| Kiểm thử database       | PGlite; các bài kiểm thử trong `tests/` |

Phiên bản package ứng dụng tại thời điểm ghi chú: `2.3.0`. Lấy phiên bản phụ thuộc cụ thể từ `package.json` và `bun.lock`.

## Cấu trúc cần biết

| Thư mục/tệp                           | Vai trò                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `app/dashboard/`                      | Trang quản lý thành viên, sơ đồ, sự kiện và quản trị   |
| `app/actions/`                        | Server actions, sao lưu và migration                   |
| `app/api/`                            | Các route như avatar, gallery và duyệt tài khoản       |
| `components/`                         | Form thành viên, danh sách, sơ đồ và các thành phần UI |
| `context/`                            | State giao diện và nội dung chi tiết thành viên        |
| `types/index.ts`                      | Kiểu `Person`, `Relationship`, `Profile`               |
| `utils/supabase/`                     | Client trình duyệt/server/admin và truy vấn            |
| `utils/`                              | Ngày tháng, khoảng năm, quan hệ, xuất nhập dữ liệu     |
| `lib/i18n/`                           | Bản dịch tiếng Việt và tiếng Anh                       |
| `docs/schema.sql`, `docs/migrations/` | Khởi tạo và nâng cấp database                          |
| `patches/`                            | Bản vá phụ thuộc, hiện có bản vá `braces`              |

## Các quy ước của bản fork

- UI tuân thủ [DESIGN.md](../DESIGN.md); không tự thêm token thiết kế.
- Tài khoản mới là `member`, chưa hoạt động. Admin đầu tiên được cấp bằng script sau khi xác minh email.
- Admin quản trị hệ thống; editor biên soạn dữ liệu; member xem dữ liệu theo quyền được cấp.
- `.env.local` là cấu hình riêng của máy và được Git ignore.
- Chạy web local vẫn cần kết nối Supabase để đăng nhập và lưu dữ liệu; chưa có chế độ database offline hoàn chỉnh.
- Ngày chính xác/biết một phần dùng các cột ngày-tháng-năm hiện có. Khoảng năm ước tính dùng cột riêng, không lấy năm đầu/cuối làm ngày chính xác.
- Form công khai chỉ dùng RPC có phạm vi theo link; không mở bảng gia phả hoặc hồ sơ chờ cho anonymous. Ngày cúng hằng năm không suy ra ngày mất.

Xem [trạng thái hiện tại](CURRENT_SNAPSHOT.md) và [bàn giao khoảng năm](YEAR-RANGES-HANDOFF.md) trước khi tiếp tục phát triển.
