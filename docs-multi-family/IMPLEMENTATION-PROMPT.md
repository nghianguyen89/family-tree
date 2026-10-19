# Quy tắc chung cho các prompt triển khai

Cập nhật: 2026-10-18. Đây là tài liệu được các prompt từng giai đoạn tham chiếu, không còn là lệnh triển khai toàn bộ sản phẩm trong một lượt.

## Cách bắt đầu

Đọc [README.md](README.md) và chọn đúng một prompt được liệt kê ở đó. Sao chép nội dung prompt đó vào phiên triển khai. Không thực hiện giai đoạn tiếp theo chỉ vì đọc thấy nó trong kế hoạch.

Trước khi sửa code, đọc:

1. `AGENTS.md`, `DESIGN.md` và hướng dẫn cụ thể trong thư mục bị ảnh hưởng.
2. `docs/README.md`, `docs/PROJECT_CONTEXT.md`, `docs/CURRENT_SNAPSHOT.md`.
3. `docs-multi-family/IDEA.md`, tài liệu này và prompt giai đoạn đang được gọi.
4. Handoff của tính năng liên quan và tài liệu Next.js cài trong repo trước khi sửa phần tương ứng.

## Quyết định phải giữ

- Giữ website gia đình trên `main` và project Vercel/Supabase hiện tại. Không merge hoặc chuyển website đó sang kiến trúc mới nếu chưa có yêu cầu riêng.
- Phát triển trên nhánh/worktree và môi trường riêng, tên nhánh chính thức `multi-family-tree`; dùng dữ liệu giả. Một repo dùng chung chức năng, mỗi gia tộc có ID ổn định, domain, bản triển khai và Supabase riêng, gồm database/Auth/Storage. Không thêm `family_id` trên mọi bảng để gom dữ liệu nghiệp vụ.
- Git là nguồn cấu hình triển khai; secret ở môi trường/kho bí mật phía server. Website dùng config trong phiên bản Git được chọn; dữ liệu và ảnh người dùng nhập nằm ở Supabase riêng. Config ban đầu không ghi đè nội dung đã sửa trong database.
- Chọn family theo cấu hình triển khai đã xác minh. Thiếu/sai config thì báo lỗi và chặn thao tác dữ liệu; không fallback sang demo hoặc cho trình duyệt/Host chọn database đích. Chỉ config/tài nguyên công khai của family đang triển khai được đưa ra client.
- Demo có Supabase riêng và dữ liệu giả. Khách chỉ xem nội dung công khai; admin demo đăng nhập chỉnh dữ liệu. Không thêm tài khoản biên tập dùng chung, quyền sửa công khai hoặc reset công khai; không tự công khai dữ liệu gia phả riêng.
- Khu quản trị hệ thống là website riêng trong cùng repo, có Supabase/Auth riêng cho registry và admin hệ thống. Quyền kiểm tra ở server/database; admin gia tộc không mặc định có quyền hệ thống. Website gia tộc vẫn phục vụ bình thường khi registry ngừng hoạt động.
- Registry lưu danh mục, cấu hình dự kiến/checklist và bằng chứng trạng thái, không thay Git. Bản đầu xuất config không bí mật để chủ dự án hoặc agent đưa vào Git; chưa cấp quyền ghi repo từ web hoặc thu thập key hạ tầng của mọi gia tộc. “Lưu trữ” chỉ áp dụng hồ sơ quản lý, không khóa/xóa tài nguyên website.
- Mỗi gia tộc giữ phiên bản riêng và tự chọn thời điểm nâng cấp. Tái sử dụng trang Cập nhật hệ thống với nguồn phát hành của sản phẩm này: bản thường có thể hoãn; bản quan trọng hiện thông báo bắt buộc theo lý do/phạm vi phiên bản đã công bố. Thông báo không tự deploy, migrate hoặc khóa website. Lỗi kiểm tra phiên bản là chưa xác định trạng thái.
- Phiên bản code, config và schema được theo dõi riêng. Tái sử dụng runner/`public.app_migrations`; migration kiểm tra tương thích với phiên bản được chọn, không buộc mọi gia tộc chạy bản mới nhất. Nâng cấp một gia tộc không tác động gia tộc khác.
- Bản đầu dùng project được chuẩn bị sẵn; domain, OAuth, secret và triển khai theo runbook. Email bàn giao không tự tạo/cấp admin: cần tài khoản đã xác minh và bootstrap đúng project, độc lập với admin hệ thống.
- Giữ hợp đồng sao lưu gia phả hiện có. Nêu rõ phần chưa bao gồm CMS/intake/Auth/file Storage; runbook sao lưu/khôi phục môi trường là công việc riêng, chưa làm hệ thống backup tổng hợp tự động.

## Xác minh môi trường và giới hạn thao tác

Kiểm tra branch/worktree, Git status và hướng dẫn hiện hành; giữ nguyên thay đổi có sẵn. Nếu còn ở `main`, chỉ khảo sát/cập nhật tài liệu, chưa sửa code triển khai; báo rõ môi trường riêng cần chuẩn bị. Không tự checkout/reset, ghi đè `.env.local` hoặc sao chép key gia đình sang môi trường mới.

Xác minh Supabase/deployment đích bằng thông tin an toàn, không in secret hoặc dữ liệu thật. Khi chưa xác minh đích, vẫn làm được phần nguồn/fixture độc lập nhưng không ghi dịch vụ ngoài; không tạo nút hoặc kết quả giả vờ dịch vụ thật đã hoạt động.

Kích hoạt một prompt cho phép sửa và kiểm thử nguồn trong nhánh phát triển đã xác minh cho đúng giai đoạn đó. Không tự commit/push, merge `main`, publish, tạo tài nguyên tính phí, đổi domain, xóa dữ liệu hoặc ghi dịch vụ thật ngoài phạm vi đã được cho phép. Chuẩn bị kết quả review được trước khi hỏi cho bước thực hiện bên ngoài; không hỏi lại điều đã được chủ dự án cho phép rõ trong phiên.

## Cách làm và bàn giao

- Làm phần nhỏ nhất hoàn chỉnh; tái sử dụng component, phân quyền, migration và kiểm thử hiện có. Không thêm framework/dependency, cơ chế dự phòng hoặc chức năng giai đoạn sau khi chưa có nhu cầu.
- Trước khi sửa, xác định caller, hợp đồng dữ liệu, fixture/test và config bị ảnh hưởng. Giữ quyền riêng tư, validation, xử lý lỗi, accessibility và chức năng đang dùng.
- Chỉ hỏi quyết định thật sự chặn công việc; đưa khuyến nghị cụ thể và tiếp tục phần độc lập. Không hỏi lại các lựa chọn đã chốt trong `IDEA.md`.
- Chạy kiểm tra phù hợp với thay đổi; logic mới cần kiểm thử hành vi và trường hợp lỗi. Fixture/mock chỉ xác nhận nguồn; không thay cho Auth, RLS, Storage, migration hay deploy thật.
- Cập nhật `docs/CURRENT_SNAPSHOT.md` và handoff cần thiết: phạm vi đã làm, phiên bản/config an toàn, kiểm tra PASS/FAIL/NOT RUN, giới hạn và đầu ra cho giai đoạn tiếp theo. Không tạo thêm tài liệu trùng nội dung nếu file hiện có đáp ứng.
- Kết thúc ở phạm vi giai đoạn được gọi. Nêu rõ mã nguồn sẵn sàng đến đâu và phần xác nhận môi trường thật còn chờ; không tự chạy prompt kế tiếp.
