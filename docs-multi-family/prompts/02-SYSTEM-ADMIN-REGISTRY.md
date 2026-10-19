# Prompt giai đoạn 2 — Quản trị hệ thống và xuất cấu hình

Anh muốn thực hiện **giai đoạn 2** trong `docs-multi-family/IDEA.md`. Dùng nền tảng giai đoạn 1 để làm website quản trị riêng; bản đầu dùng project có sẵn và xuất config để đưa vào Git.

## Đọc và kiểm tra đầu vào

Đọc `AGENTS.md`, các tài liệu bắt buộc và `docs-multi-family/IMPLEMENTATION-PROMPT.md`; áp dụng các quy tắc chung đó. Đọc mục Giai đoạn 2 trong `IDEA.md`, prompt giai đoạn 1 và `docs/CURRENT_SNAPSHOT.md`/handoff kết quả giai đoạn 1. Đọc hướng dẫn Next.js/UI tương ứng trước khi sửa code.

Xác minh nhánh/worktree phát triển, hợp đồng config và cách chọn family đã hoạt động ở giai đoạn 1. Xác minh nguồn và mức độ bằng chứng A/B, trạng thái cập nhật/migration, các phần môi trường thật còn chờ. Không tự coi giai đoạn trước đã hoàn tất chỉ vì file prompt tồn tại; nếu thiếu đầu ra cần dùng thì nêu rõ và xử lý đầu vào trước khi làm phần phụ thuộc.

## Mục tiêu

Website admin hệ thống trong cùng repo, dùng Supabase/Auth riêng để quản lý danh mục, xuất config và checklist bàn giao. Không thay đổi cách website gia tộc đọc config từ Git hoặc phục vụ người thân.

## Công việc

1. Dùng kiến trúc Next.js và component hiện có; chọn chế độ triển khai quản trị cố định phía server, không cho trình duyệt chọn/chuyển database. Tách Supabase/Auth quản trị khỏi demo và mọi gia tộc. Không tạo framework hoặc ứng dụng phụ với bộ công cụ mới khi repo hiện tại đáp ứng.
2. Tạo schema/kiểm tra quyền tối thiểu cho registry và admin hệ thống. Xác thực/quyền phải được kiểm tra ở server/action/API và database, không chỉ ẩn menu. Có bootstrap admin hệ thống đã xác minh, không tự cấp quyền cho người đăng ký đầu tiên hoặc tin role admin do client/gia tộc gửi lên.
3. Làm danh sách, tạo/sửa và xem hồ sơ gia tộc: ID duy nhất ổn định, tên, domain dự kiến, email người nhận bàn giao, tham chiếu project không bí mật, ghi chú/checklist và trạng thái. Không thu thập/lưu DB password, service-role key hoặc token hạ tầng của gia tộc vào registry.
4. Xuất config không bí mật đúng hợp đồng giai đoạn 1. Validate phía server và kiểm thử đưa file xuất vào `families/<family-id>/` ở workspace thử có thể build đúng website. Xuất lại không tạo hồ sơ trùng; đổi tên/domain không đổi ID. Không ghi filesystem Vercel làm nguồn bền vững, không tự commit/PR/push.
5. UI phân biệt đã lưu hồ sơ, đã xuất config, đã đưa vào Git và đã triển khai. Theo dõi checklist và bằng chứng/thời điểm/người xác nhận. Giá trị config dự kiến không được hiển thị như cấu hình hoặc phiên bản thật đang chạy; thông tin kiểm tra cũ phải có nguồn/thời điểm.
6. Dùng trạng thái chờ cấu hình, chờ triển khai, hoạt động, lỗi, lưu trữ. Chỉ đánh dấu hoạt động theo bằng chứng kiểm tra website đích, ghi rõ xác nhận thủ công nếu chưa có tích hợp. Lưu trữ chỉ đổi hồ sơ quản lý, không khóa hoặc xóa website/database/Storage/domain.
7. Bàn giao theo runbook giai đoạn 1: chủ dự án hoặc agent đưa config vào Git; người vận hành cấu hình project có sẵn, secret, domain/OAuth và triển khai. Email nhập trong registry chưa cấp quyền: admin gia tộc cần tài khoản đã xác minh và bootstrap trên đúng project.
8. Giữ website gia tộc hoạt động độc lập khi registry không khả dụng. Chưa thêm telemetry từ mọi family, kết nối DB tập trung, tự kiểm tra URL do client gửi hoặc quyền đọc dữ liệu gia phả để làm màn hình quản lý.

## Kiểm tra và đầu ra

- Khách, tài khoản chưa được cấp quyền và admin gia tộc đều không đọc/ghi được registry hoặc gọi trực tiếp action quản trị. Admin hệ thống chỉ quản lý đúng phạm vi đã chốt; không mặc định đọc được hồ sơ gia phả.
- Tạo/sửa/xuất lại, ID trùng, config không hợp lệ, email/domain sai, lưu trữ và lỗi lưu có phản hồi rõ; config xuất không có secret và dùng được với nền tảng giai đoạn 1.
- Thử A/B cùng lúc, đăng nhập riêng và registry ngừng hoạt động: website gia tộc tiếp tục phục vụ, giữ quyền/cấu hình/phiên bản hiện có.
- Không có thao tác lưu/xuất/lưu trữ nào tự tạo project, đổi Git, deploy hoặc chạy migration cho gia tộc. Migration registry cũng phải nhắm đúng project quản trị đã xác minh, không dùng project gia đình thật.
- Chạy lint, TypeScript, tests database/quyền và production build phù hợp; kiểm thử browser luồng danh sách/tạo/sửa/xuất, bàn phím, mobile, theme và ngôn ngữ theo component/quy ước hiện có.
- Cập nhật runbook và snapshot: schema/bootstrap quản trị, hợp đồng file xuất, thao tác thủ công và kết quả kiểm tra. Ghi riêng mock, Supabase thật và deploy thật; chưa đủ bằng chứng thì không ghi hệ thống đang hoạt động.

## Điểm kết thúc

Bàn giao bản đầu gồm giai đoạn 1–2. Chưa tích hợp ghi Git, cấp Supabase/Vercel/domain tự động, triển khai hàng loạt, quyền hỗ trợ xem dữ liệu gia tộc, tạm khóa website thật hoặc xóa tài nguyên. Không tự chuyển sang giai đoạn 3.
