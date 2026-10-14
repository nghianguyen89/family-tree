# Bàn giao — Form công khai, duyệt gia đình và ngày cúng riêng

- Ngày: 2026-10-14.
- Trạng thái: đã triển khai trong mã nguồn và kiểm thử tự động; chưa áp dụng migration trên Supabase thật.
- Vai trò duyệt: admin hoặc editor đang hoạt động. “Mod” trong yêu cầu dùng vai trò editor hiện có.

## Kết quả và cách dùng

1. Chạy [migration thu thập và ngày cúng](migrations/20261014020000_family_intake_and_memorial.sql) trên đúng project Supabase. Database đã cài phải có các migration trước đó, gồm [migration khoảng năm](migrations/20261014010000_add_person_year_ranges.sql). Với database mới hoặc chưa biết migration còn thiếu, dùng SQL bundle đầy đủ ở `/setup` theo runbook.
2. Đăng nhập admin/editor, mở menu tài khoản → **Thông tin chờ duyệt**, hoặc truy cập `/dashboard/intake`.
3. Nhập tên đợt thu thập, chọn người gốc của nhánh, số ngày hiệu lực rồi tạo link. Copy và lưu link ngay; sau khi tải lại không thể lấy lại token gốc từ danh sách.
4. Gửi link cho người trong nhánh. Họ chọn đời/người nối, khai từng thành viên và quan hệ, xem lại rồi gửi, không cần đăng nhập.
5. Người duyệt chọn một lượt gửi, kiểm tra nhánh, ghép người đã có nếu trùng, chỉnh thông tin và đời khi cần. Duyệt sẽ lưu cả gia đình và quan hệ trong một transaction.

Link tạo trên `localhost` chỉ truy cập được từ máy chạy ứng dụng theo cấu hình mạng hiện tại. Muốn gửi cho người thân ở nơi khác, ứng dụng cần chạy trên một địa chỉ public và tạo link ở địa chỉ đó. Phiên này không thực hiện triển khai hoặc mở tunnel.

## Thông tin người khai

- Họ tên người gửi và số điện thoại/email liên hệ; chỉ người duyệt đọc thông tin liên hệ.
- Chọn người đã có trên cây, lọc theo đời trong nhánh được chia sẻ. Danh sách công khai chỉ chứa ID, họ tên và đời; không chứa ngày sinh, avatar, hồ sơ riêng hay dữ liệu các lượt gửi khác.
- Mỗi lượt khai 1–30 người. Mỗi người nối với người được chọn hoặc người khai phía trước, bằng quan hệ con, vợ/chồng hoặc bổ sung chính người được chọn.
- Con có thể chọn thêm cha/mẹ còn lại nếu người đó đã khai phía trước hoặc là người nối đã chọn.
- Họ tên, giới tính; ngày sinh/ngày mất biết một phần hoặc khoảng năm; tên thường gọi, ghi chú; tình trạng đã mất và ngày cúng riêng.
- Số người được tính từ các mục đã thêm. Nút bỏ người chỉ bỏ mục cuối để không làm đứt các tham chiếu quan hệ phía sau.
- Có bước xem lại, đồng ý gửi và mã biên nhận. Không có trang công khai tra cứu hồ sơ chờ duyệt bằng mã biên nhận.

## Duyệt và xử lý trùng

Trạng thái: `pending`, `needs_info`, `approved`, `rejected`. Danh sách có bộ lọc và phân trang 20 lượt/trang.

- Admin/editor được đổi người nối, chỉnh người và quan hệ trước khi duyệt.
- Người trùng tên cần ghép với hồ sơ có sẵn hoặc xác nhận rõ là người khác cần tạo mới. Database kiểm tra lại tại thời điểm duyệt.
- Ghép hồ sơ không mặc định thay thế thông tin. Chỉ khi chọn ô **Thay thế thông tin cơ bản và ngày tháng...**, dữ liệu cơ bản/ngày tháng/ghi chú/ngày cúng được cập nhật. Avatar, dữ liệu riêng và đời hiện có của người ghép được giữ.
- Đời của người mới suy ra từ cha/mẹ hoặc vợ/chồng. Nếu người nối chưa có đời, người duyệt phải nhập đời cho người mới. Đời nhập không được trái với đời cha/mẹ hoặc vợ/chồng đã biết.
- Ngăn quan hệ với chính mình và vòng tổ tiên; lưu các quan hệ trùng đã có theo cách không tạo bản sao.
- Duyệt lại hồ sơ đã hoàn tất bị từ chối. Nếu một bước lưu lỗi, toàn bộ thành viên/quan hệ của lượt duyệt được rollback và hồ sơ vẫn ở khu chờ.
- “Cần bổ sung” hoặc “Từ chối” yêu cầu ghi chú. Người duyệt chủ động liên hệ qua thông tin người gửi; chưa tự gửi email/SMS hoặc tạo luồng người gửi sửa lại theo mã biên nhận.
- Payload gốc được giữ; dữ liệu đã chỉnh khi duyệt nằm ở `reviewed_payload`. Lưu người duyệt, thời điểm, ghi chú và các ID đã ghép/tạo. Đây không phải nhật ký đầy đủ mọi lần chỉnh sửa trung gian.

## Ngày cúng độc lập

Các cột của `persons`:

| Cột                              | Ý nghĩa                              |
| -------------------------------- | ------------------------------------ |
| `memorial_day`, `memorial_month` | Ngày/tháng cúng lặp lại              |
| `memorial_calendar`              | `lunar` hoặc `solar`                 |
| `memorial_is_leap_month`         | Chỉ dùng với âm lịch                 |
| `memorial_note`                  | Ghi chú lịch cúng, tối đa 1000 ký tự |

- Không cần năm mất hoặc ngày mất. Chỉ thiết lập cho người đã mất.
- Ngày cúng không sửa hoặc suy ra ngày mất; dùng được đồng thời với khoảng năm mất.
- Khi có ngày cúng riêng, lịch này thay cho sự kiện suy ra từ ngày mất để tránh hai sự kiện giỗ/cúng cho cùng người trong một kỳ.
- Nếu không có lịch cúng riêng, ưu tiên ngày mất âm lịch. Chỉ chuyển từ dương lịch sang âm lịch khi có đủ ngày/tháng/năm mất; không lấy năm hiện tại để đoán khi năm mất chưa biết.
- Dương lịch 29/2 chỉ hiện trong năm nhuận. Âm lịch tháng nhuận chỉ hiện vào năm có đúng tháng nhuận; ngày không tồn tại bị bỏ qua. Tìm kỳ âm lịch tiếp theo trong tối đa 20 năm.
- Không ghi số năm mất cho lịch cúng riêng. Ghi chú lịch cúng hiển thị trong sự kiện.
- Có thể chỉnh ngày cúng từ cả form công khai và form thành viên hiện có; chi tiết hồ sơ hiển thị lịch này.

## Phân quyền và giới hạn

| Người truy cập                       | Được phép                                                              |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Không đăng nhập/người giữ link       | Xem tên/đời trong nhánh và gửi dữ liệu vào khu chờ qua RPC chuyên dụng |
| Member hoặc tài khoản chưa hoạt động | Không đọc danh sách chờ, tạo link hoặc duyệt                           |
| Admin/editor hoạt động               | Tạo/tắt link, đọc hồ sơ chờ và duyệt                                   |

Không mở quyền đọc/ghi trực tiếp bảng gia phả hoặc bảng chờ cho anonymous. Public client dùng publishable/anon key, không dùng cookie phiên hay service-role key.

- Token link ngẫu nhiên 32 byte, chỉ lưu hash trong database. Link mặc định 90 ngày, UI cho chọn 1–365 ngày; có thể tắt trước hạn.
- Danh sách công khai tối đa 500 người là người gốc và con cháu theo quan hệ sinh học/nhận nuôi; không tự công khai toàn bộ người của các nhánh khác hoặc danh sách vợ/chồng ngoài nhánh.
- Tối đa 30 lượt/link/giờ, 100 lượt/ngày và 1000 lượt tổng; quota trong database có khoá để không bị bỏ qua bằng gọi RPC trực tiếp.
- API giới hạn JSON 64 KiB, kiểm tra consent, honeypot và origin. Chưa tích hợp CAPTCHA bên ngoài.
- Trang public có `noindex`, `nofollow`, không gửi referrer; API trả `no-store`.

## Persistence và sao lưu

`family_intake_links` lưu cấu hình link; `family_intake_submissions` lưu khu chờ và kết quả duyệt. Người gốc không có FK cascade từ `persons`: xoá/thay thế cây không xoá âm thầm lịch sử thu thập. Link có người gốc không còn tồn tại sẽ không hoạt động; người duyệt phải đổi người nối cho hồ sơ chờ nếu cần.

Backup JSON/CSV/GEDCOM của cây giữ ngày cúng. GEDCOM dùng extension riêng `_MEMORIAL`; parser của ứng dụng bảo toàn các trường này, chưa xác nhận phần mềm gia phả khác giữ extension khi nhập/xuất lại.

Các link và hồ sơ chờ chưa nằm trong chức năng xuất cây hiện có. Muốn sao lưu cả lịch sử thu thập, cần sao lưu database bao gồm hai bảng này. Nhập backup cây giữ các bảng thu thập đang có; ID người gốc thay đổi có thể khiến link cũ không còn dùng được.

## Các tệp chính

- `app/contribute/[token]/page.tsx`, `app/api/intake/[token]/route.ts`, `proxy.ts`: đường dẫn công khai và API gửi.
- `app/dashboard/intake/page.tsx`, `app/actions/intake.ts`, `components/intake/`: quản lý link, form và duyệt.
- `types/intake.ts`, `utils/intake.ts`, `utils/supabase/public-intake.ts`: hợp đồng dữ liệu, kiểm tra và anonymous client.
- `components/MemorialFields.tsx`, `components/MemberForm.tsx`, `context/MemberDetailContent.tsx`: nhập/hiển thị ngày cúng.
- `utils/memorial.ts`, `utils/eventHelpers.ts`, `components/EventsList.tsx`: lịch cúng.
- `app/actions/data.ts`, `utils/backup-validation.ts`, `utils/gedcom.ts`: sao lưu/khôi phục.
- `lib/i18n/intake.ts`: tiếng Việt và tiếng Anh.

## Bằng chứng và việc cần xác nhận

Kiểm thử tự động gồm phân quyền anonymous/member/editor, phạm vi nhánh, staging trước duyệt, chống chèn cờ duyệt qua form public, atomic approval/rollback, trùng tên, vòng tổ tiên, đời chưa biết, quota, migration chạy lại, bảo toàn lịch sử thu thập khi nhập cây, ngày cúng âm/dương lịch, tháng nhuận và sao lưu. Có kiểm tra render server của form, chưa có bài test tương tác browser đăng nhập thật.

Kết quả kiểm tra và build mới nhất xem [CURRENT_SNAPSHOT.md](CURRENT_SNAPSHOT.md).

- [ ] Áp dụng migration trên Supabase thật.
- [ ] Tạo link bằng admin và bằng editor; mở ở cửa sổ chưa đăng nhập.
- [ ] Gửi một gia đình có cha/mẹ/con, kiểm tra chưa xuất hiện trên cây.
- [ ] Duyệt, ghép người trùng, kiểm tra nhánh/đời và quan hệ trên cây.
- [ ] Khai người không rõ ngày mất nhưng có ngày cúng; kiểm tra lịch sự kiện.
- [ ] Tắt link và kiểm tra không nhận thêm lượt gửi.
- [ ] Kiểm tra thao tác trên điện thoại và địa chỉ website public trước khi gửi link rộng rãi.
