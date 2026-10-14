# Bàn giao — Khoảng năm sinh và năm mất

- Ngày: 2026-10-14.
- Trạng thái: mã nguồn và kiểm thử hoàn tất; chưa xác nhận áp dụng trên Supabase thật.
- Phạm vi: thêm/sửa thành viên, chi tiết hồ sơ, thẻ thành viên, mindmap, danh sách chọn quan hệ và sao lưu.

## Kết quả

Trong form, chọn **Chỉ biết khoảng năm** rồi nhập **Từ năm** và **Đến năm**. Ví dụ sinh 1880–1885, mất 1937–1939. Chọn **Đã mất** để nhập khoảng năm mất. Hiển thị có dấu `≈` cho biết đây là ước tính.

Khoảng dùng năm dương lịch; không suy ra ngày-tháng, âm lịch, con giáp, tuổi chính xác hoặc sự kiện sinh nhật/ngày giỗ.

Tính năng [ngày cúng riêng](FAMILY-INTAKE-HANDOFF.md) cho phép thiết lập lịch cúng độc lập, kể cả khi năm mất chỉ biết một khoảng hoặc hoàn toàn chưa biết. Sự kiện khi đó đến từ ngày cúng đã khai, không suy ra từ khoảng năm.

## Quy ước dữ liệu

| Trường                             | Ý nghĩa                 |
| ---------------------------------- | ----------------------- |
| `birth_year_from`, `birth_year_to` | Hai đầu khoảng năm sinh |
| `death_year_from`, `death_year_to` | Hai đầu khoảng năm mất  |

- Hai đầu đều bắt buộc khi dùng khoảng; là số nguyên từ 1 đến 9999; đầu khoảng không lớn hơn cuối.
- Không dùng khoảng thì hai cột tương ứng là `NULL`.
- Khi lưu khoảng sinh, các cột `birth_year/month/day` là `NULL`.
- Khi lưu khoảng mất, các cột `death_year/month/day` và `death_lunar_year/month/day` là `NULL`; `is_deceased=true`.
- Không chấp nhận khoảng mất nằm hoàn toàn trước thời điểm sinh sớm nhất. Các khoảng chồng lấn chưa đủ bằng chứng để kết luận thứ tự nên không bị chặn chỉ vì chồng lấn.
- Chuyển về nhập ngày chính xác rồi lưu sẽ xoá khoảng tương ứng. Bỏ chọn **Đã mất** rồi lưu sẽ xoá thông tin mất.

UI kiểm tra khi nhập; validator kiểm tra sao lưu; database có CHECK constraints. Không dùng năm đầu hoặc năm cuối thay cho năm chính xác.

## Các tệp chính

- `components/MemberForm.tsx`, `components/YearRangeFields.tsx`: nhập và lưu.
- `types/index.ts`, `utils/yearRanges.ts`, `utils/dateHelpers.ts`: kiểu dữ liệu, kiểm tra và định dạng.
- `context/MemberDetailContent.tsx`, `components/PersonCard.tsx`, `components/MindmapNode.tsx`, `components/RelationshipManager.tsx`: hiển thị.
- `app/actions/data.ts`, `utils/backup-validation.ts`, `utils/gedcom.ts`: bảo toàn dữ liệu khi sao lưu/khôi phục. CSV sử dụng các trường trong dữ liệu export.
- `lib/i18n/messages.ts`: tiếng Việt và tiếng Anh.
- `docs/schema.sql`, `app/actions/migrations.ts`: schema và danh sách migration cho SQL bundle.

## Migration

Chạy toàn bộ [20261014010000_add_person_year_ranges.sql](migrations/20261014010000_add_person_year_ranges.sql) trong Supabase SQL Editor của đúng project.

Migration bổ sung cột nullable, CHECK constraints và định nghĩa cập nhật của `import_family_backup`. Không gọi hàm import trong quá trình migration. Ngày chính xác và hồ sơ hiện có được giữ nguyên. File có transaction, hỗ trợ chạy lặp lại và yêu cầu PostgREST reload schema sau cập nhật.

Đối với database mới, SQL bundle tại `/setup` đã bao gồm migration. Không sửa migration cũ để nâng cấp database đã dùng.

## Kiểm thử đã thực hiện

- Database cũ chưa có cột khoảng năm được nâng cấp thành công trong PGlite.
- Chạy lại migration vẫn giữ khoảng và ngày chính xác đã có.
- CHECK constraints chặn thiếu đầu/cuối, khoảng ngược, khoảng kết hợp ngày chính xác và thời gian mất trước sinh.
- RPC import giữ khoảng, có rollback khi bản sao lưu vi phạm ràng buộc.
- CSV và GEDCOM round-trip giữ bốn trường. GEDCOM xuất khoảng dưới dạng `BET <năm> AND <năm>`.
- Định dạng hiển thị giữ dấu `≈`; khoảng không tạo tuổi hay sự kiện ngày sinh/ngày giỗ.
- TypeScript và ESLint qua. Sau khi bổ sung form thu thập/ngày cúng, build toàn ứng dụng đã qua; xem trạng thái mới nhất trong `CURRENT_SNAPSHOT.md`. Chưa kiểm tra thao tác trên browser có đăng nhập thật.

## Checklist xác nhận trên Supabase và giao diện thật

- [ ] Chạy migration thành công trên project đang kết nối.
- [ ] Thêm thành viên sinh 1880–1885, mất 1937–1939 và lưu.
- [ ] Mở lại hồ sơ và form sửa: đủ hai đầu khoảng, dấu `≈` hiển thị trên hồ sơ/thẻ/mindmap.
- [ ] Thử đầu khoảng lớn hơn cuối, kiểm tra thông báo lỗi.
- [ ] Thử chuyển sang ngày chính xác, lưu rồi mở lại.
- [ ] Xuất và đọc bản sao lưu để xác nhận bốn trường; thử khôi phục chỉ trên database kiểm thử hoặc sau khi đã sao lưu dữ liệu cần giữ.

Khi hoàn thành, cập nhật [CURRENT_SNAPSHOT.md](CURRENT_SNAPSHOT.md) theo bằng chứng thực tế.
