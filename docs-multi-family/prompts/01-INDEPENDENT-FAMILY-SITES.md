# Prompt giai đoạn 1 — Website gia tộc độc lập

Anh muốn thực hiện **giai đoạn 1** trong `docs-multi-family/IDEA.md`. Đây là yêu cầu triển khai nguồn của giai đoạn này, không phải lệnh làm toàn bộ lộ trình hoặc deploy lên dịch vụ thật.

## Đọc và kiểm tra đầu vào

Đọc `AGENTS.md`, các tài liệu bắt buộc và toàn bộ `docs-multi-family/IMPLEMENTATION-PROMPT.md`; áp dụng các quy tắc chung đó. Đọc mục Giai đoạn 1 và các quyết định đã chốt trong `IDEA.md`. Đọc handoff liên quan cùng tài liệu Next.js trong repo trước khi sửa code.

Xác minh branch/worktree và config thử nghiệm độc lập. Không sửa code triển khai trên `main`, không dùng key hoặc dữ liệu gia đình. Nếu môi trường mới chưa sẵn sàng, khảo sát/chuẩn bị phần độc lập và báo cụ thể phần bị chặn; không ghi thử lên môi trường cũ.

## Mục tiêu

Cùng một bộ mã nguồn chạy được với ít nhất hai gia tộc giả, mỗi bản triển khai gắn config/Supabase riêng, giữ chức năng hiện có và cho từng gia tộc chọn phiên bản riêng. Chưa xây website quản trị trung tâm.

## Công việc

1. Khảo sát các điểm singleton thật sự cần đổi: `app/config.ts`, branding/metadata/logo/favicon, Supabase browser/server/middleware/service client, public intake, URL OAuth/email, Storage/CMS, backup và runner migration. Truy caller trước khi đổi; tái sử dụng kiến trúc và helper đang có.
2. Chốt và ghi ngắn gọn hợp đồng config không bí mật trong `families/<family-id>/`, cùng cách chọn family phía triển khai. Chuẩn bị demo và một family giả khác; không thêm dữ liệu thật. Chỉ đóng gói/đưa ra public tài nguyên của family được chọn.
3. Kiểm tra ID/config và binding môi trường trước khi thao tác dữ liệu. Thiếu, không tồn tại hoặc mâu thuẫn config/project phải báo lỗi; không tự fallback demo và không cho request chọn URL/key/database tùy ý. URL/key của Auth/truy vấn/service client/migration phải thuộc đúng project đã xác minh.
4. Dùng config cho branding/thiết lập ban đầu, giữ nội dung đã biên tập trong database. Demo khách chỉ xem phần công khai; admin demo có thể quản lý dữ liệu giả theo quyền hiện có. Không mở thêm quyền xem cây/hồ sơ riêng hoặc luồng sửa/reset cho khách; không phát hành link thu thập đang hoạt động trên demo giới thiệu.
5. Tái sử dụng trang Cập nhật hệ thống. Xác minh nguồn phát hành của repo sản phẩm rồi tách bản phát hành với commit phát triển. Dùng thông tin phát hành nhỏ, có phiên bản và ghi chú; bản quan trọng chỉ rõ lý do/phạm vi phiên bản phải cập nhật, không suy đoán mức bắt buộc từ số version. Nếu chưa xác định được kênh phát hành thật, triển khai/kiểm thử bằng fixture và ghi phần chờ xác minh, không trỏ nhầm repo gốc hoặc dựng dịch vụ phát hành mới.
6. Hiện trạng thái đang chạy/có bản thường/có bản bắt buộc/không kiểm tra được theo phạm vi phiên bản. Thông báo cho admin, không tự deploy, migrate hoặc khóa website. Phiên bản không bị ảnh hưởng không nhận cảnh báo bắt buộc.
7. Giữ runner và `public.app_migrations`. Điều chỉnh điều kiện hiện đang chặn migration khi chưa ở bản Git mới nhất thành kiểm tra tương thích với code/schema được chọn; không bỏ kiểm tra quyền, khóa, transaction hoặc xác minh đích. Không tự nâng cấp schema các family khác.
8. Cập nhật runbook: cấu hình project có sẵn, chọn và giữ phiên bản deploy, domain/`APP_URL`/OAuth, bootstrap admin sau xác minh email, init so với upgrade, rollback theo tương thích và phạm vi backup/restore thực tế. Chỉ rõ dữ liệu xuất cây chưa chứa toàn bộ website; chưa xây backup tổng hợp tự động.

## Kiểm tra và đầu ra

- A/B dùng config và dịch vụ thử riêng; đổi A không đổi B. Kiểm tra cả dữ liệu, Auth/quyền, ảnh, CMS, intake và phạm vi xuất/nhập gia phả. Thêm trường hợp lỗi config, binding project sai, gọi trực tiếp API/action trái quyền và không lộ config family khác/secret trong client hoặc tài nguyên public.
- Mô phỏng B lên phiên bản mới trong khi A giữ bản cũ; dữ liệu/config/schema A giữ nguyên. Kiểm tra bản thường, bản bắt buộc cho đúng phiên bản, bản không bị ảnh hưởng và lỗi nguồn phát hành. Bản thường mới hơn không xóa cảnh báo bắt buộc còn hiệu lực của phiên bản chưa khắc phục; migration của bản được chọn không bị chặn chỉ vì có bản thường mới hơn.
- Kiểm tra seed chỉ ở khởi tạo thử nghiệm, không ghi đè nội dung đã sửa khi nâng cấp. Kiểm tra rollback khi migration/import lỗi theo cơ chế hiện có.
- Chạy lint, TypeScript, tests phù hợp và production build bằng tooling repo; kiểm thử browser cho phần UI thay đổi. Phân biệt lỗi nguồn với giới hạn môi trường.
- Cấu hình mẫu và runbook phải đủ cho người vận hành dựng website độc lập. Hai môi trường Supabase/deploy thật chỉ được ghi PASS khi đã được cho phép và kiểm tra thực tế; nếu mới có fixture, ghi nguồn đã kiểm tra và bước thật còn chờ.
- Ghi hợp đồng config/thông tin phát hành và kết quả bàn giao trong tài liệu hiện có, đặc biệt `docs/CURRENT_SNAPSHOT.md`, để giai đoạn 2 dùng lại mà không khảo sát lại từ đầu.

## Điểm kết thúc

Bàn giao nền tảng gia tộc độc lập và quy trình cập nhật từng website. Chưa làm registry, website admin hệ thống, Git integration, cấp hạ tầng tự động, khóa website, reset công khai hoặc hệ thống backup mới. Không tự chuyển sang giai đoạn 2.
