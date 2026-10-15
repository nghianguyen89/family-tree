# Family tree — Trạng thái hiện tại

Ngày ghi nhận: 2026-10-15. Đây là trạng thái ở workspace, không phải xác nhận đã triển khai lên production.

## Đã thực hiện

- Đã thêm dark mode với icon mặt trăng/mặt trời ở góc trên, cạnh ngôn ngữ trên các trang có thanh điều khiển; trang setup và form công khai cũng có nút chuyển.
- Theme mặc định theo hệ thống, lưu lựa chọn vào trình duyệt, đồng bộ giữa các tab và áp dụng trước khi trang hiển thị. Màu được quản lý tập trung tại `app/themes.css`, theo token trong `DESIGN.md`; lớp surface và màu SVG sơ đồ đã theo theme.

- Đã kiểm tra README và cài thư viện bằng `bun install --frozen-lockfile`.
- Đã tạo cấu hình local. Chủ dự án đã bổ sung cấu hình Supabase và xác nhận kết nối, chạy web được.
- Server nền do agent khởi động đã được tắt theo yêu cầu. Chủ dự án tự quản lý server bằng terminal VS Code với `bun dev`.
- Đã giải thích việc tài khoản đầu tiên chờ duyệt và hướng dẫn chạy `docs/bootstrap-admin.sql` để cấp admin.
- Đã bổ sung lựa chọn khoảng năm sinh và năm mất trong form thêm/sửa thành viên.
- Đã bổ sung lưu, hiển thị, kiểm tra dữ liệu và bảo toàn khoảng năm trong sao lưu JSON, CSV, GEDCOM.
- Đã chuẩn bị migration khoảng năm và đưa vào danh sách SQL bundle tại `/setup`.
- Đã triển khai form công khai `/contribute/[token]`, tạo/tắt link theo nhánh và khu chờ `/dashboard/intake` cho admin/editor.
- Đã triển khai duyệt cả gia đình trong transaction, ghép hồ sơ trùng, kiểm tra đời/vòng tổ tiên và lưu riêng payload gốc/đã duyệt.
- Đã bổ sung ngày cúng riêng hằng năm âm/dương lịch, tháng nhuận, không bắt buộc ngày hoặc năm mất; lịch cúng riêng ưu tiên trong sự kiện.

## Bằng chứng kiểm tra

| Kiểm tra                   | Kết quả đã ghi nhận                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Khởi động local ban đầu    | Next.js chạy thành công; HTTP 200 ở trang thiếu cấu hình khi chưa có key                             |
| Kết nối Supabase, chạy web | Chủ dự án xác nhận; không phải kiểm thử đăng nhập tự động                                            |
| TypeScript                 | `tsc --noEmit` qua sau thay đổi thu thập và ngày cúng                                                |
| ESLint                     | Kiểm tra toàn repository qua sau thay đổi tính năng                                                  |
| Bộ kiểm thử                | 38 bài qua ở 7 file, gồm quyền public/duyệt, database, render form, khoảng năm và ngày cúng          |
| Build production           | `next build` qua với các route thu thập/duyệt mới                                                    |
| Migration                  | Đã kiểm thử trên PGlite: database chưa có cột mới, chạy lặp lại, giữ ngày chính xác, chặn khoảng sai |
| Sao lưu                    | Kiểm thử import database, round-trip CSV và GEDCOM giữ khoảng năm                                    |
| Tuổi và sự kiện            | Khoảng năm không tạo tuổi chính xác hoặc sự kiện ngày sinh/ngày giỗ                                  |

Có kiểm tra render server của form, chưa kiểm tra tương tác browser bằng phiên đăng nhập thật sau khi thêm các tính năng mới.

Dark mode (2026-10-15): TypeScript, ESLint, build production và 40 bài kiểm thử ở 8 file đều qua, gồm hai bài mới về lựa chọn theme/script trước hydration. CSS production đã được kiểm tra có quy tắc dark mode. Chưa xác nhận tương tác và hình thức dark mode trên trình duyệt với phiên đăng nhập thật. Xem [hướng dẫn chỉnh theme](THEME-HANDOFF.md).

Chủ dự án đã thử chạy bundle trong SQL Editor và gặp lỗi `42723` do trùng hàm `private.handle_updated_at`. Đã sửa schema/migration để bundle chạy lại được, giữ dữ liệu và phụ thuộc, bổ sung `tests/migration-replay.test.ts`; kết quả chạy lại trên Supabase thật còn chờ xác nhận.

Đã smoke test HTTP trên bản production: `/contribute/invalid` trả 200 tại đúng URL, không chuyển sang đăng nhập; API token sai trả 404. Server thử cổng 3001 đã tắt sau kiểm tra. Kiểm tra này không tạo dữ liệu trên Supabase thật.

## Chưa xác nhận

1. Chủ dự án đã chạy script cấp admin đầu tiên hay chưa.
2. Migration `20261014010000_add_person_year_ranges.sql` đã được chạy trên project Supabase thật hay chưa. Agent chưa áp dụng trực tiếp migration này.
3. Luồng tạo/sửa/mở lại thành viên có khoảng năm trên giao diện thật, sau khi database được nâng cấp.
4. Migration `20261014020000_family_intake_and_memorial.sql`, form công khai, duyệt và lịch cúng trên project thật. Agent chưa áp dụng migration hoặc triển khai website public.

Cấu hình không có kết nối SQL trực tiếp sử dụng được tại lúc kiểm tra, nên đã bàn giao file SQL để chủ dự án chạy trong Supabase SQL Editor. Không ghi trạng thái migration thật là đã hoàn tất nếu chưa có xác nhận.

## Bước tiếp theo

- Chạy migration khoảng năm theo [runbook](LOCAL-DEVELOPER-RUNBOOK.md).
- Kiểm tra sinh 1880–1885, mất 1937–1939; lưu, mở lại và sửa hồ sơ theo [checklist bàn giao](YEAR-RANGES-HANDOFF.md).
- Chạy migration thu thập/ngày cúng và kiểm tra theo [bàn giao form công khai](FAMILY-INTAKE-HANDOFF.md). Tạo link ở địa chỉ public khi muốn chia sẻ ngoài máy local.
- Khi có xác nhận mới, cập nhật ngày và trạng thái trong tài liệu này.
