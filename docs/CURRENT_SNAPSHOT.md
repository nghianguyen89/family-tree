# Family tree — Trạng thái hiện tại

Ngày ghi nhận: 2026-10-16. Đây là trạng thái ở workspace, không phải xác nhận đã triển khai lên production.

## Đã thực hiện

- Đã chuyển menu dropdown trên header dashboard sang panel bên trái, mặc định icon 64px, mở rộng 256px bằng hamburger. Đã bổ sung sự kiện, thư viện ảnh, thêm thành viên, thiết lập trang chủ và các mục còn thiếu; lọc nhóm theo member/editor/admin hoạt động, chọn đúng mục theo route con. Desktop dành chỗ cho panel; mobile mở đè, đóng khi chọn link/bấm ngoài/Escape, khóa cuộn và quản lý focus. Header giữ logo/theme/ngôn ngữ; đăng xuất nằm cuối panel. Xem [bàn giao điều hướng](DASHBOARD-NAVIGATION-HANDOFF.md). Không cần migration.

- Đã tái hiện và sửa policy đọc `media_assets` chặn upload gallery ở bước `INSERT ... RETURNING`: admin/editor được đọc kết quả trực tiếp, giữ kiểm tra phạm vi cho member và không cấp đọc bảng cho khách. Bản sửa có trong migration thư viện gốc và migration nâng cấp `20261016010000_fix_media_insert_returning.sql`, đã thêm vào bundle `/setup`. Chủ dự án cung cấp ảnh policy thật; chưa chạy bản sửa trên Supabase thật.

- Đã thêm **Xóa link** tại `/dashboard/intake`: xác nhận, tắt và ẩn khỏi danh sách, giữ hồ sơ đã gửi/kết quả duyệt. Link mới còn mở/còn hạn có **Sao chép link** sau khi tải lại trang; clipboard lỗi có ô sao chép thủ công. Link cũ chỉ có hash có nút **Tạo link thay thế** với xác nhận ngừng địa chỉ cũ, giữ hạn/quota/hồ sơ. Chuẩn bị migration `20261016000000_intake_link_management.sql`, đã thêm vào SQL bundle `/setup`; chưa áp dụng trên Supabase thật. Xem [bàn giao thu thập](FAMILY-INTAKE-HANDOFF.md).

- Đã hợp nhất ảnh CMS/phòng trưng bày thành `media_assets`, dùng lại qua placement `home_content_images.asset_id`; upload chung có hash chống trùng, picker ảnh có sẵn, gỡ liên kết riêng và chặn xóa asset đang dùng. Thư viện `/dashboard/gallery` và album công khai dùng tỷ lệ ảnh thật/masonry, mở PhotoSwipe mã nguồn mở theo lựa chọn chủ dự án. Chuẩn bị migration `20261015010000_shared_media_library.sql` giữ file/ảnh bìa cũ, không copy hoặc tự công khai ảnh nháp. Xem [bàn giao thư viện chung](SHARED-MEDIA-HANDOFF.md).

- Đã tự động nén ảnh trên 4 MB ở uploader dùng chung và khi thay ảnh gallery: nhận ảnh gốc tối đa 50 MB, giữ tỷ lệ, xuất WebP (PNG fallback), không gửi file quá giới hạn khi nén thất bại. Hiển thị trạng thái/dung lượng trước-sau; ảnh nhỏ giữ nguyên, GIF lớn thành ảnh tĩnh có thông báo. API và bucket CMS giữ giới hạn 4 MB.

- Đã dùng chung bộ tải nhiều ảnh cho trang chủ/bài viết/thông báo/album CMS và thư viện ảnh nội bộ: chọn thêm/kéo thả, thumbnail, bỏ từng ảnh, trạng thái mỗi file, thử lại riêng ảnh lỗi và nhập mô tả sau. Giữ quota/quyền/bucket hiện có; upload không đổi ảnh bìa đang chọn. Form sửa ảnh nội bộ điền sẵn metadata và phản ánh dữ liệu sau refresh. Xem [bàn giao tải nhiều ảnh](MULTI-IMAGE-UPLOAD-HANDOFF.md).

- Đã thêm giao diện cắt ảnh đại diện trong form thêm/sửa thành viên: kéo bằng chuột/cảm ứng, phím mũi tên, zoom 1–16×, vòng tròn xem trước, hủy giữ ảnh trước và chỉnh lại từ ảnh gốc vừa chọn. Chỉ upload bản cắt tối đa 512px khi lưu thành viên; không thay đổi database. Xem [bàn giao crop ảnh](AVATAR-CROP-HANDOFF.md).

- Đã thay trang chủ bằng khu giới thiệu dòng họ, ảnh bìa, lịch sử, thông báo/sự kiện sắp tới, bài viết mới, album và liên hệ; thêm `/news` và trang đọc chi tiết.
- Đã thêm `/dashboard/content` cho admin/editor hoạt động: tạo/sửa/xem trước, lưu nháp, hẹn giờ đăng/hết hạn, công khai/nội bộ, ảnh/mô tả/chú thích/thứ tự, lọc/phân trang và thùng rác khôi phục về nháp.
- Đã thêm thiết lập trang chủ, sắp xếp khu vực, kiểm tra phiên bản chống ghi đè, ghi nhận người sửa; chuẩn bị migration `20261015000000_home_content.sql`, RLS và bucket ảnh private. Xem [bàn giao trang chủ](HOME-CONTENT-HANDOFF.md).

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

Panel điều hướng (2026-10-16): TypeScript, ESLint toàn repository, 80 tests ở 18 file và production build `next build --webpack` qua. Edge headless với component thật/profile/router/auth giả kiểm tra desktop thu gọn/mở rộng, vị trí nội dung, active link duy nhất theo route con, quyền member/editor/admin/inactive, mobile overlay/inert/khóa cuộn, Tab/Shift+Tab/Escape/trả focus, đóng bằng link/bấm ngoài, cuộn menu ở 320px, dark mode, logout và nhãn tiếng Anh. Smoke test trang chủ desktop/mobile/theme/kho tin/chuyển khách khỏi CMS qua, không có lỗi runtime. Đã xem ảnh panel desktop/mobile; không dùng phiên hoặc dữ liệu gia đình thật, không ghi Supabase, chưa deploy.

Kiểm tra cuối cùng bản sửa gallery (2026-10-16): 78 bài kiểm thử ở 17 file, TypeScript, ESLint toàn repository, `git diff --check` và production build `next build --webpack` qua. Bài hồi quy dùng PostgreSQL/PGlite thật: policy cũ thất bại, bản sửa INSERT RETURNING qua; kiểm tra quyền member/khách/editor chưa hoạt động và replay SQL bundle tiếp tục qua. Đây là kiểm tra tự động, chưa phải xác nhận upload thật trên Supabase sau bản sửa.

Gallery báo từ chối quyền (2026-10-16): kiểm tra chỉ đọc bằng server client xác nhận bucket `media-library` tồn tại, private, 4 MB, JPEG/PNG/WebP/GIF; bảng `media_assets` truy cập được bằng server key. Ảnh SQL chủ dự án cung cấp xác nhận Storage policy đầy đủ và policy đọc metadata dùng hàm STABLE tự tra lại hàng. PGlite tái hiện lỗi `42501` khi editor thêm ảnh với `RETURNING`; sau migration sửa policy, thao tác này qua, còn anonymous/member/editor chưa hoạt động vẫn bị chặn. Đã sửa thông báo nhắc đúng kho ảnh và tách lỗi database khỏi Storage. Kiểm tra cuối cùng xem ghi chú bên dưới. Chưa chạy migration sửa policy hoặc upload vào Supabase thật; không có kết nối SQL trực tiếp dùng được trong cấu hình local.

Quản lý link thu thập (2026-10-16): TypeScript, ESLint, Prettier và 75 bài kiểm thử ở 17 file qua. Kiểm thử PGlite xác nhận chỉ admin/editor hoạt động đọc token, thay token làm địa chỉ cũ ngừng hoạt động, xóa link chặn đọc/gửi public nhưng giữ hồ sơ chờ, ràng buộc không bật lại link đã xóa và migration chạy lại an toàn. Kiểm thử render danh sách từ dữ liệu đã lưu xác nhận nút sao chép cho link còn mở/còn hạn, tạo thay thế cho link cũ và xóa cho mọi link. Production build `next build --webpack` qua; build Turbopack bị lỗi môi trường `spawning node pooled process / program not found` ở bước CSS, kể cả sau khi thử ngoài sandbox. Chưa kiểm thử tương tác clipboard/xác nhận bằng browser hoặc phiên đăng nhập thật, chưa chạy migration mới trên Supabase thật và chưa deploy.

Thư viện chung (2026-10-15): TypeScript, ESLint và 73 bài kiểm thử ở 17 file qua, gồm migration nhập ảnh cũ/replay, reuse/idempotent attach, quyền public/hết hạn/bìa, ảnh nháp không tự mở cho member, chặn xóa ảnh đang dùng, hash/dimensions thật và proxy không cache. Build production đã qua với hai API media mới. Edge headless với ảnh/dịch vụ giả đã kiểm tra masonry portrait/landscape không crop, PhotoSwipe ảnh cũ thiếu kích thước/zoom/chuyển bàn phím/Escape/focus, album công khai, picker dùng một file ở hai album không upload lại, detach/xóa có bảo vệ, nén/chống trùng và mobile dark mode. Đã xem screenshot desktop/mobile/viewer; không dùng dữ liệu gia đình thật. Chưa áp dụng migration thư viện mới trên Supabase thật hoặc kiểm thử ghi bằng phiên đăng nhập thật; chưa deploy Vercel.

Nén ảnh tự động (2026-10-15): TypeScript, ESLint, build production và 65 bài kiểm thử ở 15 file qua. Fixture Edge dùng PNG ngẫu nhiên thực 7,4 MB, nén thành WebP khoảng 3,5 MB trước khi gọi upload CMS/gallery; ảnh hỏng lớn bị chặn trước request. Các kiểm tra batch/ảnh bìa/mô tả sau/mobile dark mode tiếp tục qua. Test unit kiểm tra ảnh nhỏ giữ nguyên, đầu vào quá giới hạn, tỷ lệ/kích thước đầu ra và giải phóng bitmap/canvas cả khi lỗi. Đây là kiểm tra bằng dịch vụ giả, không upload vào Supabase thật; chưa deploy Vercel hoặc thay bucket/migration.

Tải nhiều ảnh (2026-10-15): TypeScript, ESLint, production build và 62 bài kiểm thử ở 14 file qua. Edge headless với ảnh/dịch vụ giả đã kiểm tra thumbnail, chọn thêm/bỏ ảnh, định dạng/dung lượng/số chỗ còn lại, lỗi giữa lô và thử lại chỉ ảnh lỗi ở cả CMS/gallery, giữ thứ tự/ảnh bìa, chỉnh mô tả sau, giải phóng object URL và layout mobile dark mode. Smoke test trang chủ/kho tin/chuyển khách khỏi CMS cũng qua, không có lỗi runtime. Chưa upload nhiều ảnh bằng phiên đăng nhập thật, không ghi Supabase hoặc chạy migration, chưa deploy Vercel.

Chủ dự án đã xác nhận tính năng crop ảnh đại diện hoạt động ổn trước khi yêu cầu mở rộng upload album; đây là phản hồi sử dụng của chủ dự án, không phải kiểm thử ghi Supabase trực tiếp bởi agent.

Cắt ảnh đại diện (2026-10-15): TypeScript, ESLint, production build và 58 bài kiểm thử ở 13 file qua. Edge headless chạy component crop thật với ảnh nhóm giả 3 vùng màu: hủy giữ kết quả cũ/trả focus, zoom, kéo chuột, cảm ứng, reset và layout mobile dark mode đều qua; giải mã file WebP đầu ra kiểm tra đúng vùng màu đã kéo tới và kích thước 200×200 tại zoom 3×. Smoke test trang chủ/kho tin/chuyển khách khỏi CMS cũng qua, không có lỗi runtime. Đã xem screenshot fixture mobile. Không upload hoặc sửa dữ liệu Supabase thật; chưa kiểm thử lưu bằng phiên đăng nhập thật và chưa deploy Vercel.

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

Trang chủ/CMS (2026-10-15): TypeScript, ESLint, build production và 51 bài kiểm thử ở 11 file qua. Kiểm thử database gồm phân quyền, lịch đăng/hết hạn, quyền ảnh/ảnh bìa, thùng rác, chống ghi đè, xóa tác giả và chạy lại migration/bundle. Kiểm thử route gồm upload hợp lệ/giả định dạng/quá dung lượng/sai quyền, ảnh qua proxy không cache và render escape HTML. Đã smoke test bằng Edge headless trên bản production local: trang chủ desktop/mobile, lưu dark mode sau tải lại, kho tin và chuyển khách khỏi CMS, không có lỗi runtime JavaScript. Server thử riêng đã tắt. Đây là kiểm tra trang đọc khi chưa áp dụng migration CMS thật, chưa phải kiểm thử CRUD/upload bằng phiên đăng nhập thật.

Sửa lỗi upload (2026-10-15): tái hiện request hợp lệ trên `127.0.0.1:3000` bị trả lỗi `origin` vì Next chuẩn hóa URL thành localhost. Đã kiểm tra origin theo Host thực tế, vẫn chặn origin/port/protocol khác và không tin X-Forwarded-Host. Request không đăng nhập trên cả localhost/127.0.0.1 hiện đi qua kiểm tra origin và bị chặn đúng ở bước quyền, không ghi dữ liệu. Đã nhận diện ảnh theo chữ ký khi trình duyệt bỏ trống MIME hoặc dùng alias JPEG, kiểm tra dung lượng trước upload và hiện lỗi cụ thể cho từng bước. TypeScript, ESLint và 54 bài kiểm thử ở 12 file qua. Chưa có xác nhận tải lại chính ảnh người dùng báo lỗi.

Kiểm tra chỉ đọc Supabase thật trong bước chẩn đoán upload: bảng `home_settings` truy cập được, server key đọc được bucket `home-content`; bucket private, giới hạn 4 MB và hỗ trợ JPEG/PNG/WebP. Không tải thử ảnh, không ghi dữ liệu hay chạy migration; chưa xác nhận toàn bộ policy hoặc thao tác upload bằng phiên người dùng.

Chủ dự án đã thử chạy bundle trong SQL Editor và gặp lỗi `42723` do trùng hàm `private.handle_updated_at`. Đã sửa schema/migration để bundle chạy lại được, giữ dữ liệu và phụ thuộc, bổ sung `tests/migration-replay.test.ts`; kết quả chạy lại trên Supabase thật còn chờ xác nhận.

Đã smoke test HTTP trên bản production: `/contribute/invalid` trả 200 tại đúng URL, không chuyển sang đăng nhập; API token sai trả 404. Server thử cổng 3001 đã tắt sau kiểm tra. Kiểm tra này không tạo dữ liệu trên Supabase thật.

Sửa luồng chọn ảnh bìa (2026-10-15): chủ dự án đã xác nhận upload thành công. Kiểm tra chỉ đọc cho thấy thiết lập chưa lưu ảnh bìa; chủ dự án xác nhận bấm nút lưu dưới ảnh, vốn chỉ lưu metadata. Đã phân biệt nhãn lưu metadata/thiết lập, thêm nút lưu ảnh bìa ngay cạnh ảnh đang chọn và trạng thái chưa lưu/đang dùng. Nút mới gửi đúng form thiết lập, giữ kiểm tra phiên bản và quyền hiện có. Không thay đổi dữ liệu Supabase; chờ người dùng bấm nút mới để xác nhận ảnh bìa thật. TypeScript, ESLint, build production và 56 bài kiểm thử ở 12 file qua, gồm hai kiểm thử UI mới cho nhãn và liên kết form.

Sửa hiện tượng nhòe/chớp (2026-10-15): đã xem ảnh lỗi do chủ dự án cung cấp; chủ dự án báo gặp trên Edge và Firefox ở cả local/Vercel. Đã bỏ backdrop blur lồng nhau ở các surface và filter grayscale/opacity trên toàn thẻ thành viên, dùng token surface/secondary hiện có; giảm chuyển động thẻ/tab. Đây là xử lý hướng nghi ngờ compositing, chưa xác nhận được lỗi GPU/driver cụ thể hoặc tái hiện đúng artifact trên máy người dùng. TypeScript, ESLint, build production và 56 bài kiểm thử qua. Edge headless với GPU không bị tắt bằng flag đã kiểm tra CSS thực tế của 72 thành viên giả ở tỷ lệ 125%: không có filter trên vùng thành viên, pixel nội dung trước/sau 24 lượt cuộn/hover/đổi theme và 10 giây chờ trùng nhau; loại scrollbar native tự ẩn khỏi vùng so sánh. Kiểm tra trang chủ desktop/mobile, lưu theme, kho tin và chuyển khách khỏi CMS cũng qua, không có lỗi runtime. Server/browser thử đã tắt. Không sửa dữ liệu hoặc migration Supabase; chưa deploy bản sửa Vercel; vẫn cần người dùng xác nhận sau khi dùng lâu trên Edge/Firefox thật.

## Chưa xác nhận

- Agent chưa chạy migration trang chủ `20261015000000_home_content.sql` hoặc kiểm thử biên tập/upload ảnh trên Supabase thật. Kiểm tra chỉ đọc đã xác nhận bảng thiết lập và bucket ảnh tồn tại như ghi ở trên. Chưa deploy Vercel. CMS cần `SUPABASE_SERVICE_ROLE_KEY` phía server để trả ảnh; sao lưu gia phả hiện tại chưa bao gồm bảng/bucket CMS.

1. Chủ dự án đã chạy script cấp admin đầu tiên hay chưa.
2. Migration `20261014010000_add_person_year_ranges.sql` đã được chạy trên project Supabase thật hay chưa. Agent chưa áp dụng trực tiếp migration này.
3. Luồng tạo/sửa/mở lại thành viên có khoảng năm trên giao diện thật, sau khi database được nâng cấp.
4. Migration `20261014020000_family_intake_and_memorial.sql`, form công khai, duyệt và lịch cúng trên project thật. Agent chưa áp dụng migration hoặc triển khai website public.

Cấu hình không có kết nối SQL trực tiếp sử dụng được tại lúc kiểm tra, nên đã bàn giao file SQL để chủ dự án chạy trong Supabase SQL Editor. Không ghi trạng thái migration thật là đã hoàn tất nếu chưa có xác nhận.

## Bước tiếp theo

- Chạy [migration thư viện chung](migrations/20261015010000_shared_media_library.sql) sau các migration đã có; tải lại `/dashboard/gallery`, thử chọn cùng ảnh cho hai album và kiểm tra bằng member/khách. Phần nhập ảnh cũ và ghi thật trên Supabase chưa được agent thực hiện. Build, 73 tests và fixture browser đã hoàn tất kiểm tra đến 2026-10-16.

- Chạy migration trang chủ theo [bàn giao CMS](HOME-CONTENT-HANDOFF.md); cấu hình service-role key trên server/Vercel; dùng admin/editor nhập nội dung và ảnh thật. Kiểm tra đăng công khai/nội bộ, hẹn giờ, ảnh, thùng rác và tài khoản member trước khi deploy.

- Chạy migration khoảng năm theo [runbook](LOCAL-DEVELOPER-RUNBOOK.md).
- Kiểm tra sinh 1880–1885, mất 1937–1939; lưu, mở lại và sửa hồ sơ theo [checklist bàn giao](YEAR-RANGES-HANDOFF.md).
- Chạy migration thu thập/ngày cúng và kiểm tra theo [bàn giao form công khai](FAMILY-INTAKE-HANDOFF.md). Tạo link ở địa chỉ public khi muốn chia sẻ ngoài máy local.
- Khi có xác nhận mới, cập nhật ngày và trạng thái trong tài liệu này.
