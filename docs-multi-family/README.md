# Ghi chú phát triển hệ thống nhiều gia tộc

Ngày ghi nhận: 2026-10-17.
Cập nhật quyết định: 2026-10-18.

Thư mục này lưu kế hoạch đã chốt và bàn giao triển khai. Trạng thái nguồn và kiểm tra giai đoạn 1 xem [bàn giao giai đoạn 1](PHASE-1-HANDOFF.md); các prompt giai đoạn 2–3 vẫn là công việc tương lai.

- [Kế hoạch và quyết định đã chốt](IDEA.md): mô hình vận hành, phạm vi bản đầu, ba giai đoạn và đầu ra bàn giao.
- [Quy tắc chung cho triển khai](IMPLEMENTATION-PROMPT.md): môi trường, quyền thao tác và cách làm; các prompt từng giai đoạn yêu cầu đọc file này. File này không còn giao toàn bộ lộ trình trong một lượt.

## Prompt theo giai đoạn

| Giai đoạn | Prompt                                                                    | Phạm vi và đầu ra                                                                                                      |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1         | [Website gia tộc độc lập](prompts/01-INDEPENDENT-FAMILY-SITES.md)         | Config Git, hai gia tộc giả độc lập, thông báo cập nhật từng phiên bản, migration và runbook. Chưa làm admin hệ thống. |
| 2         | [Quản trị hệ thống và xuất cấu hình](prompts/02-SYSTEM-ADMIN-REGISTRY.md) | Website/Supabase/Auth quản trị riêng; danh mục, config xuất để đưa vào Git và checklist cho project có sẵn.            |
| 3         | [Tự động hóa các bước đã chọn](prompts/03-SELECTIVE-AUTOMATION.md)        | Mở rộng về sau; chốt tích hợp và quyền dịch vụ cụ thể trước khi làm. Không tự cập nhật mọi gia tộc.                    |

Giai đoạn 1–2 tạo thành bản đầu sử dụng được; giai đoạn 3 không phải điều kiện bàn giao bản đầu. Các prompt là tài liệu cho công việc tương lai, chưa phải xác nhận đã thực hiện tính năng.

## Cách sử dụng

1. Chuẩn bị hoặc xác minh nhánh/worktree và môi trường mới theo kế hoạch; không dùng project gia đình để thử.
2. Mở prompt đúng giai đoạn, sao chép nội dung vào phiên làm việc có repo này. Agent phải đọc kế hoạch, quy tắc chung và snapshot hiện hành, kể cả khi dùng ở tài khoản khác.
3. Chỉ thực hiện giai đoạn được gọi. Kết thúc có kiểm tra, giới hạn xác nhận dịch vụ thật và cập nhật `docs/CURRENT_SNAPSHOT.md`; không tự chạy giai đoạn kế tiếp.
4. Trước giai đoạn sau, xác minh đầu ra cần dùng của giai đoạn trước. Fixture/mock chưa chứng minh môi trường Supabase/Vercel thật hoạt động. Với giai đoạn 3, chọn đúng bước cần tự động hóa và quyền thực hiện, không giao tất cả tích hợp cùng lúc.

## Những quyết định cần giữ

Website gia đình hiện tại tiếp tục dùng nhánh `main`, Vercel project và Supabase project hiện có. Phát triển mới trên nhánh riêng, tên chính thức `multi-family-tree`, với Vercel/Supabase riêng và dữ liệu giả. Không tự merge vào `main` hoặc chuyển website gia đình sang hệ thống mới.

Đã chốt: Git là nguồn cấu hình triển khai. Mỗi gia tộc giữ phiên bản đang chạy và tự chọn thời điểm nâng cấp khi có thông báo phiên bản mới; bản quan trọng được đánh dấu và thông báo bắt buộc cập nhật. Thông báo không tự deploy, chạy migration hoặc khóa website. Xem quy tắc chi tiết trong [ý tưởng](IDEA.md).

Đã xác nhận thêm ngày 2026-10-18: khu quản trị là website riêng trong cùng repo với Supabase/Auth riêng; bản đầu xuất cấu hình để chủ dự án hoặc agent đưa vào Git; khách demo chỉ xem nội dung công khai, admin demo vẫn chỉnh dữ liệu giả theo quyền hiện có. Các lựa chọn này không cần hỏi lại khi triển khai đúng phạm vi.

Ngày 2026-10-18 đã xác minh worktree `D:/projects/my-github/apps/family-tree-multi` trên nhánh `multi-family-tree`; worktree `main` vẫn ở thư mục riêng. Worktree mới chưa có `.env.local`; không sao chép key gia đình. Chủ dự án sẽ cung cấp kết nối Supabase thử sau. Chưa tạo hoặc thay đổi project, OAuth hay tài nguyên triển khai.
