# Prompt giai đoạn 3 — Tự động hóa các bước đã chọn

Anh muốn bắt đầu **giai đoạn 3** trong `docs-multi-family/IDEA.md`. Giai đoạn này là phần mở rộng sau bản đầu; trước tiên chốt bước tự động hóa cụ thể, không mặc định làm tất cả tích hợp.

## Đọc và kiểm tra đầu vào

Đọc `AGENTS.md`, các tài liệu bắt buộc, `docs-multi-family/IMPLEMENTATION-PROMPT.md`, phần Giai đoạn 3 trong `IDEA.md` và `docs/CURRENT_SNAPSHOT.md`/runbook của giai đoạn 1–2. Áp dụng các quyết định và giới hạn thao tác đã có; đọc tài liệu Next.js tương ứng trước khi sửa code.

Xác minh nền tảng gia tộc, registry và quy trình thủ công của bước sắp tự động hóa đã hoạt động đến đâu. Không coi fixture là bằng chứng tài nguyên thật đã được tạo hoặc bước bên ngoài đã thành công.

## Mục tiêu

Tự động hóa bước thủ công đã được chọn trên đích được xác minh, có kiểm tra quyền, tiến độ và retry an toàn. Giữ các bước chưa tích hợp dùng được qua runbook và giữ quyền tự chọn nâng cấp của từng gia tộc.

## Chốt phạm vi trước khi triển khai tích hợp

Tóm tắt các bước thủ công hiện có và đề xuất bước nhỏ nhất đáng tự động hóa. Xác minh với anh nếu yêu cầu hiện tại chưa nói rõ:

- Tích hợp nào được làm trong lượt này: tạo PR cấu hình Git, cấp project Supabase/Vercel, cấu hình domain/OAuth hay triển khai/nâng cấp cho một gia tộc được chọn?
- Family/project/môi trường nào được tác động; provider, tài khoản và quyền dịch vụ nào đã có? Tạo tài nguyên tính phí/publish/đổi domain hoặc ghi dịch vụ thật đã được cho phép đến đâu?
- Người nào có quyền kích hoạt và kết quả nào cần được anh review trước bước thực hiện?

Không cần hỏi lại Git là nguồn config, khu quản trị riêng, demo chỉ xem hoặc chính sách từng gia tộc tự nâng cấp. Nếu chưa đủ phạm vi/quyền, tiếp tục khảo sát/phần độc lập và giữ phần tích hợp phụ thuộc ở trạng thái chờ xác nhận; không tự chọn provider, mở rộng quyền hoặc tạo tài nguyên.

## Công việc sau khi đã chốt phạm vi

1. Đọc tài liệu chính thức hiện hành của dịch vụ đã chọn, đối chiếu API/quyền/giới hạn thực tế. Reuse công cụ/thư viện sẵn có; không thêm SDK, queue, workflow engine hoặc secret manager mới nếu chưa cần.
2. Chỉ thay bước thủ công đã chọn. Giữ config Git và hợp đồng bàn giao giai đoạn 1–2; nếu làm Git integration, tạo thay đổi review được theo quyền được cấp, chưa tự merge. Không sửa Git hoặc database của website gia đình thật.
3. Bind thao tác phía server với family/project và phiên bản đích đã xác minh, kiểm tra quyền admin hệ thống cùng phạm vi thao tác. Không nhận URL database/token/service-role key tùy ý từ request để chạy lệnh. Secret ở môi trường/kho bí mật, log và phản hồi không chứa secret.
4. Tách chuẩn bị khỏi thực thi: cho xem đích, cấu hình/thay đổi dự kiến và tài nguyên hoặc chi phí phát sinh đã xác định. Thực hiện ngoài dịch vụ chỉ trong quyền anh đã cấp; xin xác nhận ở bước cuối nếu hành động cụ thể chưa được cho phép.
5. Lưu tiến độ từng bước, ID tài nguyên và kết quả thực tế. Retry phải dùng lại tài nguyên đã tạo, không tạo trùng; báo rõ lỗi giữa chừng và phần cần xử lý tay. Hủy/lỗi không được tự xóa tài nguyên hoặc dữ liệu để dọn dẹp.
6. Mỗi lần nâng cấp chỉ tác động gia tộc/phiên bản được chọn. Bản Git mới không tự nâng cấp các gia tộc khác; bản bắt buộc vẫn chỉ thông báo nếu anh chưa yêu cầu cơ chế cưỡng chế riêng. Giữ kiểm tra schema, backup theo đúng phạm vi và tương thích rollback.
7. Giữ các bước không được tự động hóa dùng được bằng runbook thủ công. Không biểu diễn bước phải làm tay là API đã hoàn thành; không tuyên bố domain/OAuth/deploy hoạt động chỉ vì đã lưu yêu cầu hoặc nhận ID tác vụ.

## Kiểm tra và đầu ra

- Kiểm thử quyền, đích sai, input không hợp lệ, retry sau timeout và lỗi giữa các bước. Mock phải có cả lỗi provider và kết quả đang chờ, không chỉ luồng thành công.
- Ít nhất hai family giả: thực hiện thao tác trên B không đổi config/code/schema/tài nguyên A; retry không tạo trùng hoặc đổi đích.
- Kiểm tra mất quyền, thiếu secret, thao tác trùng và log/response không lộ credential. Giữ kiểm tra server/database, không dựa vào nút xác nhận trên UI để bảo vệ API.
- Chạy kiểm tra nguồn và browser phù hợp. Chỉ ghi PASS dịch vụ thật sau khi đã thực hiện có phép và xác minh kết quả; nếu thiếu tài khoản/quyền, ghi rõ NOT RUN và phần chưa thể bàn giao.
- Cập nhật snapshot/runbook cho đúng tích hợp đã làm: quyền tối thiểu, nơi đặt secret bằng tên biến, cách retry, xử lý phần thành công dở dang và quay về thao tác thủ công. Không ghi giá trị secret, dữ liệu gia đình hoặc quy trình dựa trên quyền chưa có.

## Điểm kết thúc

Chỉ bàn giao tích hợp đã chọn. Không tự mở rộng sang triển khai hàng loạt, billing, SSO xuyên gia tộc, quyền xem dữ liệu tất cả gia tộc, khách sửa demo, khóa/xóa website hoặc tự chạy đợt cập nhật tiếp theo.
