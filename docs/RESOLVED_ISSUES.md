# Family tree — Những vấn đề đã xử lý

Ngày ghi nhận: 2026-10-15. Phần này lưu lại nguyên nhân và cách xử lý để các phiên làm việc sau không phải tìm lại.

## Upload ảnh trang chủ báo lỗi chung

- **Hiện tượng báo cáo:** tải ảnh đầu tiên ở phần thiết lập trang chủ local chỉ hiện thông báo chung về định dạng/dung lượng/Storage.
- **Lỗi đã tái hiện:** request từ `127.0.0.1:3000` bị từ chối ở kiểm tra origin vì `request.url` đã được Next chuẩn hóa thành localhost. Đây là lỗi xác nhận được trong mã; chưa xác nhận có phải nguyên nhân của đúng ảnh người dùng đã thử hay không.
- **Xử lý:** so sánh Origin với Host thực tế và protocol của request, vẫn từ chối origin khác/thiếu origin; không dùng X-Forwarded-Host do client cung cấp. Chuẩn hóa MIME ảnh dựa trên chữ ký hợp lệ; bổ sung kiểm tra dung lượng trước fetch và lỗi riêng theo từng bước.
- **Bằng chứng:** request không đăng nhập trên localhost và `127.0.0.1` đều qua bước origin, bị từ chối đúng ở quyền; TypeScript, ESLint và 54 bài kiểm thử qua. Kiểm tra chỉ đọc xác nhận bảng thiết lập, bucket private 4 MB và khả năng server key truy cập bucket trên Supabase thật. Không thực hiện upload hoặc sửa Supabase thật; đang chờ kết quả người dùng thử lại.

## Chọn ảnh bìa nhưng trang chủ chưa đổi

- **Hiện tượng:** chủ dự án xác nhận upload đã thành công, chọn ảnh bìa rồi bấm “Lưu thay đổi” dưới ảnh nhưng trang chủ chưa phản ánh.
- **Nguyên nhân xác nhận:** nút dưới ảnh chỉ gọi action lưu mô tả/thứ tự ảnh; nút lưu thiết lập trang chủ ở form phía trên có cùng tên nên dễ nhầm. Kiểm tra chỉ đọc cho thấy thiết lập chưa có `cover_image_id`; không phải ảnh bìa đã lưu rồi bị cache.
- **Xử lý:** đổi tên thành “Lưu mô tả ảnh” và “Lưu thông tin và ảnh bìa”; thêm nút “Lưu ảnh bìa trang chủ” ngay cạnh ảnh được chọn, liên kết tới đúng form thiết lập. Hiện trạng thái ảnh đã chọn/chưa lưu hoặc đang dùng; phản hồi upload chỉ nói ảnh đã vào thư viện. Phản hồi lưu thiết lập/lỗi cũng hiển thị cạnh ảnh.
- **Xác minh:** bổ sung kiểm thử render cho nhãn nút khác nhau và liên kết nút cạnh ảnh với form thiết lập thay vì form metadata. Không sửa dữ liệu Supabase; người dùng cần lưu lại lựa chọn bằng nút mới.

## Nhòe, mất từng mảng chữ và chớp giao diện

- **Báo cáo:** ảnh local `_screenshot_/bug01.png` cho thấy một phần header và thẻ thành viên bị mất nét/mất mảng; người dùng gặp trên Edge và Firefox, cả local và Vercel. Không sao chép ảnh hoặc dữ liệu gia đình trong ảnh vào tài liệu.
- **Nhận định:** các vùng này có backdrop blur hoặc filter grayscale/opacity trên thẻ chữ, kết hợp chuyển động/bo góc. Đây là hướng nghi ngờ lỗi compositing của trình duyệt/GPU; chưa xác nhận được nguyên nhân GPU/driver cụ thể từ ảnh chụp.
- **Thay đổi mã:** chuyển header, panel, menu và dialog sang surface theme sẵn có, bỏ các backdrop-filter lồng nhau; bỏ grayscale/opacity trên toàn thẻ danh sách/cây/mindmap, giữ nhãn người đã mất và màu chữ phụ. Bỏ chuyển động cả thẻ ở danh sách dày và thay chỉ báo tab dùng shared layout bằng nền tab thường. Không thêm mẹo ép GPU/will-change lên mọi phần tử.
- **Kiểm chứng:** build, TypeScript, ESLint và 56 bài kiểm thử qua. Script `scripts/create-rendering-fixture.mjs` chạy bằng Bun tạo trang gồm 72 thành viên giả, không kết nối Supabase; `node scripts/check-home-browser.mjs --rendering-fixture` kiểm tra bản production local ở tỷ lệ 125% và không tắt GPU bằng flag. Đã qua: không có filter trên vùng thử nghiệm, pixel nội dung trước/sau 24 lượt cuộn/hover/đổi theme và 10 giây chờ trùng nhau (không so scrollbar native tự ẩn), không lỗi JavaScript. Ảnh kiểm chứng nằm trong `_screenshot_/rendering/`, được Git ignore. Cần người dùng xác nhận sau khi dùng một thời gian trên trình duyệt thật; headless không chứng minh mọi GPU/driver đều hết lỗi. Không thay đổi dữ liệu hay migration Supabase, chưa deploy Vercel.

## Local chưa được cấu hình

- **Hiện tượng:** repository chưa có `.env.local`; chưa có project Supabase ở đầu phiên hỗ trợ.
- **Xử lý:** cài thư viện theo lockfile, tạo cấu hình local với `APP_URL=http://localhost:3000`, ẩn SSO và để trống thông tin chưa có.
- **Kết quả:** server khởi động được, trả HTTP 200 ở trang hướng dẫn thiếu cấu hình. Sau đó chủ dự án tự điền thông tin Supabase và xác nhận kết nối, chạy được.
- **Lưu ý:** giao diện chạy local không đồng nghĩa database cũng chạy offline trên máy.

## Bun đã cài nhưng phiên lệnh không tìm thấy

- **Hiện tượng:** `bun` không được nhận diện trong PATH của phiên PowerShell dùng để hỗ trợ.
- **Nguyên nhân quan sát:** executable có ở `%USERPROFILE%\.bun\bin\bun.exe`, nhưng PATH của phiên chưa chứa thư mục này.
- **Xử lý:** dùng đường dẫn đầy đủ và thêm thư mục Bun vào PATH của tiến trình khởi động server.
- **Kết quả:** Bun `1.4.3` chạy được; `bun install --frozen-lockfile` thành công. Không thay đổi PATH toàn hệ điều hành trong phiên hỗ trợ.

## Điền URL nhưng ứng dụng vẫn báo thiếu database

- **Hiện tượng:** sau restart, ứng dụng vẫn chuyển tới `/missing-db-config`.
- **Nguyên nhân đã kiểm tra:** URL có giá trị; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` trống hoặc chưa khai báo.
- **Xử lý:** chỉ ra đúng tên biến cần điền Publishable/anon key. Kiểm tra chỉ ghi trạng thái có/trống, không in key.
- **Kết quả:** chủ dự án sau đó xác nhận đã kết nối và chạy được.

## Tài khoản đầu tiên chờ quản trị duyệt

- **Hiện tượng:** đăng ký tài khoản đầu tiên không tự có quyền quản trị.
- **Nguyên nhân:** bản fork chủ động tạo mọi tài khoản mới dưới quyền `member`, chưa hoạt động; không tự cấp admin theo thứ tự đăng ký.
- **Xử lý đã bàn giao:** xác minh email và chạy [bootstrap-admin.sql](bootstrap-admin.sql), thay email mẫu bằng tài khoản của chủ ứng dụng.
- **Trạng thái:** đã hướng dẫn; chưa có xác nhận script đã chạy trên Supabase thật. Không coi đây là lỗi cần khôi phục cơ chế tự cấp admin.

## Chỉ nhớ khoảng năm sinh/năm mất

- **Nhu cầu:** người thân lịch sử chỉ biết sinh khoảng 1880–1885 và mất khoảng 1937–1939.
- **Hạn chế cũ:** cột năm hỗ trợ một năm, không mô tả được khoảng ước tính.
- **Xử lý:** bổ sung lựa chọn khoảng năm, bốn cột riêng, hiển thị `≈`, kiểm tra đầu/cuối và bảo toàn sao lưu.
- **Kết quả:** mã nguồn hoàn tất và kiểm thử tự động qua. Việc áp dụng migration trên Supabase thật và kiểm tra giao diện còn chờ xác nhận.
- **Chi tiết:** [YEAR-RANGES-HANDOFF.md](YEAR-RANGES-HANDOFF.md).

## Thu thập thông tin từ người thân chưa có tài khoản

- **Nhu cầu:** người trong dòng họ khai thông tin gia đình qua link công khai, admin/mod duyệt trước khi lên cây.
- **Xử lý:** link theo nhánh, chọn đời/người nối, form nhiều người và khu chờ riêng; admin/editor sửa, ghép người trùng và duyệt atomically.
- **Kết quả:** mã nguồn và kiểm thử tự động hoàn tất; migration và thao tác trên Supabase thật còn chờ xác nhận.

## Không nhớ ngày mất nhưng có lịch cúng riêng

- **Nhu cầu:** ông bà đời xa không rõ ngày giỗ hoặc dòng họ có lịch cúng theo truyền thống.
- **Xử lý:** ngày/tháng cúng âm hoặc dương lịch riêng, có tháng nhuận; không bắt buộc năm mất và không ghi đè ngày mất. Lịch cúng riêng ưu tiên để tránh hai sự kiện.
- **Kết quả:** đã tích hợp vào form thành viên, form công khai, chi tiết, lịch và sao lưu. Kiểm thử ngày năm nhuận/tháng nhuận qua.
- **Chi tiết:** [FAMILY-INTAKE-HANDOFF.md](FAMILY-INTAKE-HANDOFF.md).

## SQL bundle chạy lại bị trùng hàm trong schema private

- **Hiện tượng:** SQL Editor báo `42723: function handle_updated_at() already exists in schema "private"` khi chạy bundle từ `/setup` trên database đã nâng cấp.
- **Nguyên nhân:** schema và migration cũ tạo lại hàm trong `public`, còn các hàm `private` từ lần chạy trước vẫn có; lệnh chuyển schema bị trùng tên. Schema cũng xoá/tạo lại `admin_user_data` bằng `CASCADE`, làm mất phụ thuộc không cần thiết.
- **Xử lý:** giữ kiểu quản trị khi đã tồn tại; chuyển hàm khi private chưa có, cập nhật private tại chỗ khi đã có, chuyển tham chiếu trigger sang private rồi xoá helper public bằng `RESTRICT`. Public RPC/policy wrappers được giữ và trả lại chế độ invoker.
- **Kiểm thử:** tái hiện đúng lỗi trước sửa; sau sửa chạy toàn bộ bundle nhiều lần và mô phỏng schema đã chạy trước khi hardening thất bại. Kiểm tra dữ liệu, admin, khu chờ, OID hàm private, phụ thuộc kiểu dữ liệu, trạng thái trigger, RPC quản trị và đăng ký mới.
- **Cách chạy lại:** tải lại `/setup`, copy toàn bộ SQL mới, thay SQL cũ trong Supabase SQL Editor rồi chạy. Chưa xác nhận kết quả trên Supabase thật sau sửa.

## Các thay đổi bảo mật nền đã có trong mã nguồn

Các mục dưới đây được xác nhận từ mã nguồn và bộ kiểm thử, không phải khẳng định chúng mới được thực hiện trong phiên cấu hình local này:

- Tài khoản mới không tự bootstrap thành admin.
- Truy cập Gallery qua route kiểm tra người dùng hoạt động; member không được đọc Storage để tự tạo bearer signed URL.
- Nhập sao lưu qua RPC trong transaction để lỗi ở bảng sau không làm mất dữ liệu do xoá/insert trước đó.
- Bản vá `braces` chặn pattern/AST lồng quá sâu; audit theo phiên bản vẫn có thể báo advisory upstream.

Tham chiếu [migration bảo mật](migrations/20261014000000_personal_fork_security.sql), `patches/braces@3.0.3.patch` và `tests/security.test.ts`, `tests/routes.test.ts`.
