# Mục lục tài liệu dự án

Cập nhật: 2026-10-14.

## Thứ tự đọc

1. [Bối cảnh dự án](PROJECT_CONTEXT.md): mục tiêu, công nghệ và cấu trúc mã nguồn.
2. [Trạng thái hiện tại](CURRENT_SNAPSHOT.md): đã thực hiện, bằng chứng kiểm thử và việc còn lại.
3. [Hướng dẫn chạy local](LOCAL-DEVELOPER-RUNBOOK.md): cấu hình, khởi động, database và tài khoản admin.
4. [Những vấn đề đã xử lý](RESOLVED_ISSUES.md): triệu chứng, nguyên nhân và cách giải quyết.
5. [Bàn giao tính năng khoảng năm](YEAR-RANGES-HANDOFF.md): quy ước dữ liệu, migration và kiểm tra trên giao diện.
6. [Form thu thập và ngày cúng riêng](FAMILY-INTAKE-HANDOFF.md): link công khai theo nhánh, khu chờ duyệt và lịch cúng không phụ thuộc ngày mất.

## Tài liệu và tài nguyên có sẵn

- [README chính](../README.md): hướng dẫn sử dụng, triển khai và phân quyền.
- [README tiếng Anh](../README.en.md).
- [AGENTS.md](../AGENTS.md): hướng dẫn cho coding agent.
- [DESIGN.md](../DESIGN.md): quy chuẩn UI bắt buộc.
- [Schema](schema.sql), [các migration](migrations/) và [script cấp admin đầu tiên](bootstrap-admin.sql).
- [Ảnh giao diện](screenshots/).

## Cách duy trì tài liệu

- Mã nguồn và migration thể hiện hành vi đã triển khai; tài liệu cần cập nhật theo chúng.
- `PROJECT_CONTEXT.md` lưu bối cảnh dài hạn; `CURRENT_SNAPSHOT.md` ghi trạng thái mới nhất.
- `RESOLVED_ISSUES.md` lưu lịch sử xử lý, không thay thế trạng thái hiện tại.
- Ghi ngày, kết quả kiểm tra và phần chưa xác nhận khi bàn giao. Phân biệt kiểm thử tự động với thao tác thật trên Supabase.
- Chỉ ghi tên biến cấu hình và ví dụ giả; không ghi key, mật khẩu hay dữ liệu gia đình thật.
