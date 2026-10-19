# Nhánh gia đình phụ bên dâu/rể

Ngày: 2026-10-19. Tính năng được triển khai trong mã nguồn; chưa áp dụng migration trên Supabase thật hoặc triển khai website.

Sửa lỗi migration `Unexpected backup function body` (2026-10-19): bản trước sửa chuỗi từ `pg_get_functiondef` và phụ thuộc xuống dòng/thụt lề của hàm đã lưu. Migration quyền riêng tư hiện định nghĩa trực tiếp hàm sao lưu, có kiểm thử nâng cấp từ hàm cũ dùng CRLF hoặc thụt lề khác. Nếu gặp lỗi này, mở bản đã sửa của `20261019010000_family_branch_privacy.sql` và chạy lại toàn bộ file; không cần chạy lại migration nhánh phụ trước đó. Migration chỉ định nghĩa hàm, không gọi khôi phục dữ liệu. Chưa xác nhận bản sửa trên Supabase thật.

## Cách sử dụng

1. Trên database đã có các migration trước đó, chạy [migration nhánh phụ](migrations/20261019000000_family_branches.sql), sau đó [migration quyền riêng tư](migrations/20261019010000_family_branch_privacy.sql) và [quyền xem của con cháu](migrations/20261019030000_family_branch_descendants.sql). SQL bundle tại `/setup` bao gồm các file này. Nếu đã chạy hai file nhánh trước đó, chỉ cần chạy file quyền xem con cháu mới; cập nhật mã nguồn không tự nâng cấp Supabase.
2. Đăng nhập bằng admin đang hoạt động, mở hồ sơ một người đã đánh dấu dâu/rể trong họ chính.
3. Trong mục **Nhánh phụ**, nhập tên, chẳng hạn “Gia đình bên chị A”, rồi chọn **Tạo nhánh phụ**.
4. Tại trang nhánh, chọn tạo hồ sơ mới hoặc liên kết hồ sơ đã có. Khi nhập người mới có thể khai ngày sinh/mất, khoảng năm và ngày cúng riêng; không bắt buộc biết năm mất.
5. Chọn quan hệ: cha/mẹ, con, vợ/chồng với một người trong nhánh, hoặc chỉ thêm vào danh sách nhánh. Để nối hai hồ sơ đã có, dùng **Thêm quan hệ giữa người đã có** ngay tại trang nhánh hoặc mở mục này trong bảng **Nhánh phụ** ở chi tiết/sửa hồ sơ thuộc nhánh. Ví dụ: chọn ba → **Là vợ/chồng của** → chọn mẹ → **Lưu**. Không tạo thêm hồ sơ, không tự suy ra hôn nhân từ việc cùng có con. Tính năng nối này dùng RPC nhánh có sẵn, không cần migration mới.
6. Chọn người gốc để xem cây từ cha/mẹ hoặc ông bà. Đời được nhập riêng cho từng người trong từng nhánh; không tự tính lại đời toàn bộ nhánh. Dùng mục sửa hồ sơ để chỉnh đầy đủ thông tin và ảnh.
7. Mở **Xem lịch của nhánh** hoặc bộ lọc **Phạm vi lịch** trên trang sự kiện: Tất cả, Họ chính hoặc từng nhánh. Sự kiện riêng không gắn người chỉ xuất hiện ở Tất cả/Họ chính. Một hồ sơ thuộc nhiều nhánh vẫn chỉ sinh một sự kiện cho mỗi kỳ.
8. Quan hệ nhập nhầm có nút **Gỡ quan hệ** và xác nhận; giữ hai hồ sơ. Chỉ gỡ quan hệ thuộc nhánh đang mở. Quan hệ họ chính được dùng lại để hiển thị, không có nút gỡ tại đây.

Nếu thêm ba và mẹ riêng rồi thấy hai gia đình: nối họ thành vợ/chồng như bước 5, đặt cùng **Đời trong nhánh** (cả hai để trống cũng được). Với cây/sơ đồ, chọn ba hoặc mẹ làm **Người gốc hiển thị** vì các chế độ này chỉ đi xuống hậu duệ. Thêm quan hệ không tự đổi đời hay người gốc. Giới hạn hiện có của danh sách: hai vợ chồng mỗi người có cha mẹ riêng đã được khai trong nhánh vẫn có thể nằm ở hai nhóm gia đình gốc khác nhau; bản sửa này không thay thuật toán nhóm đó.

Chi tiết hồ sơ dùng chung hiển thị cả cha mẹ/người thân thuộc các nhánh phụ mà tài khoản có quyền đọc, dù bản thân hồ sơ thuộc họ chính. Không lọc quan hệ theo nhánh sở hữu hồ sơ; RLS quyết định nhánh được đọc. Quan hệ nhánh có nhãn **Nhánh phụ** và được gỡ tại trang nhánh, tránh dùng thao tác xóa quan hệ họ chính. Cùng một người có quan hệ giống nhau ở nhiều phạm vi chỉ hiện/đếm một lần, ưu tiên dòng họ chính. Bản sửa hiển thị không cần SQL hoặc tạo lại quan hệ.

Admin, đúng cặp vợ chồng được xác nhận và con cháu của **người nối nhánh** có tài khoản đang hoạt động được xem nhánh. Con cháu được xác định qua quan hệ con ruột/con nuôi thuộc họ chính, nhiều thế hệ; không đi theo hôn nhân hay quan hệ trong nhánh phụ. Anh chị em, vợ/chồng của con cháu và con riêng của người vợ/chồng được chỉ định không tự có quyền nếu không đồng thời là hậu duệ của người nối. Admin cần liên kết đúng hồ sơ cho từng tài khoản tại Quản lý người dùng.

Con cháu chỉ xem, kể cả khi có vai trò editor; quyền biên soạn họ chính vốn có của editor không đổi. Admin/cặp vợ chồng có vai trò editor mới sửa nhánh. Đổi liên kết tài khoản, tắt tài khoản hoặc gỡ quan hệ cha mẹ–con trên đường tổ tiên thu hồi quyền xem ở lần truy vấn tiếp theo. Quyền sửa hồ sơ dùng chung vẫn có thể đến từ một nhánh khác đã được chia sẻ hợp lệ; không cho người chỉ có quyền xem tự ghép hồ sơ tổ tiên vào nhánh mình quản lý để tạo quyền sửa.

## Mở nhánh phụ trên cây chính

Người có quyền thấy nút **Nhánh phụ · Tên nhánh** màu nhấn tại người nối trong cây, sơ đồ và danh sách. Bấm để mở hàng ảnh + tên đời đầu ngay bên dưới, bấm lại để thu gọn; **Mở nhánh** chuyển sang trang quản lý/cây đầy đủ. Với bong bóng, nút có chấm màu nhấn; chọn nút đó rồi mở nhánh ở bảng bên dưới. Không gửi tên nhánh hoặc dữ liệu nhánh cho người không có quyền.

Phần xem nhanh dùng màu nhấn `tertiary`, tải dữ liệu khi mở lần đầu. Chỉ hiển thị ảnh + tên ngang hàng của thành viên có đời riêng bằng 1; nếu chưa có ai nhập đời 1, dùng các gốc nhánh và vợ/chồng. Người vợ/chồng chưa rõ đời được hiện cùng gốc, không hiện người được khai đời khác khi đã có nhóm đời 1. Không lặp người nối nhánh, không vẽ quan hệ/ngày tháng/huy hiệu hoặc cây con trong phần xem nhanh. Nhiều người cuộn ngang trong một hàng. **Mở nhánh** vẫn xem đầy đủ mọi thế hệ. Không gộp quan hệ nhánh vào thuật toán cây chính, không đổi đời/gốc họ chính. Trang quản lý nhánh vẫn dùng người gốc hiển thị đã chọn. Dữ liệu được đọc bằng phiên Supabase hiện tại; endpoint tải xem nhanh vẫn kiểm tra quyền.

Trên cây dọc, nút/panel nhánh phụ nằm riêng dưới hàng người/vợ chồng, bên ngoài `[data-family-card]`. Bộ căn chiều cao cùng đời chỉ đo hàng thẻ này; không đưa nhánh phụ vào chiều cao đồng bộ. Nút mở/thu gọn con cháu cây chính đặt ở đáy node sau panel, để vẫn nối đúng xuống cây chính. Mở một nhánh không làm dài các thẻ cùng đời khác. Browser regression kiểm tra hai thành viên ngang hàng, ảnh/tên không lặp người nối, không có nút cây con; nhiều thành viên cuộn ngang, các thẻ cùng đời và con của họ giữ kích thước/vị trí sau mở, resize và đóng trên desktop/mobile. Không cần SQL cho thay đổi phần xem nhanh này.

## Xác nhận tài khoản và cặp vợ chồng

1. Admin mở `/dashboard/users`. Với tài khoản của mỗi người, tìm và chọn đúng hồ sơ trên cây, rồi **Lưu liên kết**. Không tự suy ra người đại diện bằng email hoặc tên giống nhau. Một hồ sơ chỉ liên kết với một tài khoản.
2. Tại trang nhánh, admin mở **Quyền xem nhánh**, chọn người vợ/chồng thuộc họ chính. Người này phải có quan hệ hôn nhân họ chính với người dâu/rể đang nối nhánh. Lưu lựa chọn; cả người dâu/rể và người vợ/chồng được chọn có quyền xem khi tài khoản đã liên kết.
3. Khi chỉ có một người vợ/chồng phù hợp, database chọn người đó lúc tạo/nâng cấp nhánh lần đầu. Nếu có nhiều người phù hợp, để trống và chờ admin chọn. Đổi người gốc hiển thị hoặc thêm người vào danh sách nhánh không cấp quyền truy cập.
4. Admin có thể gỡ/đổi liên kết tài khoản hoặc người vợ/chồng được cấp quyền. Xóa quan hệ hôn nhân họ chính thu hồi quyền của người vợ/chồng ngay và xóa lựa chọn cũ; thêm lại quan hệ không tự cấp lại quyền.

Database áp dụng quyền cho tên nhánh, thành viên, hồ sơ được tạo riêng cho nhánh, quan hệ và ảnh đại diện, nên truy cập trực tiếp bằng ID cũng bị chặn. Lịch chỉ lấy những hồ sơ mà tài khoản được đọc. Bộ lọc **Tất cả** nghĩa là tất cả dữ liệu được phép xem. Hồ sơ họ chính vẫn giữ phạm vi xem của họ chính; nếu admin chủ động dùng chung một hồ sơ nhánh phụ sang nhánh khác, người được xem nhánh nhận chia sẻ cũng được đọc hồ sơ đó, nhưng không được xem tên/danh sách nhánh còn lại.

## Quy ước dữ liệu

- `family_branches`: tên, người nối `anchor_person_id`, vợ/chồng được cấp quyền `partner_person_id`, người gốc hiển thị `root_person_id`.
- `profiles.person_id`: hồ sơ đại diện cho tài khoản, chỉ admin được xác nhận bằng `set_user_person`. Không cho người dùng tự nhận hồ sơ hoặc editor đổi người vợ/chồng được cấp quyền.
- `family_branch_members`: một hồ sơ có thể thuộc nhiều nhánh; `generation` tại đây chỉ có ý nghĩa trong nhánh đó.
- `persons.family_branch_id`: `NULL` là hồ sơ họ chính; có ID là hồ sơ được tạo cho nhánh phụ. Hồ sơ này vẫn có thể được liên kết sang nhánh phụ khác. Không chuyển quyền sở hữu hồ sơ bằng cách đổi cột này.
- `relationships.family_branch_id`: `NULL` là quan hệ họ chính; có ID là quan hệ trong nhánh phụ. Quan hệ có cùng hai đầu và loại được phân biệt theo phạm vi nhánh.
- Thêm người và quan hệ vào nhánh dùng RPC trong transaction. Liên kết hồ sơ có sẵn không thay đổi ngày tháng, cờ dâu/rể hoặc đời của hồ sơ đó.
- Cây chính, thống kê, danh xưng, chuẩn hóa đời và cập nhật đời con cháu chỉ dùng hồ sơ/quan hệ họ chính. Cây nhánh phụ hiển thị quan hệ của chính nhánh và các quan hệ họ chính giữa những thành viên được liên kết.
- Người nối là hồ sơ dâu/rể của họ chính. Không được bỏ cờ dâu/rể khi người đó đang làm người nối của nhánh. Người gốc phải thuộc nhánh; thành viên được tạo riêng cho nhánh luôn giữ tư cách thành viên ở nhánh sở hữu.
- Form thu thập công khai hiện dành cho họ chính; không mở rộng link thu thập sang nhánh phụ. Truy vấn công khai và duyệt có kiểm tra phạm vi trong database.
- Lựa chọn gốc của cây phụ có khóa lưu trình duyệt riêng, không thay lựa chọn đã lưu của cây chính.

## Sao lưu và giới hạn

Dùng JSON v4 để giữ hồ sơ, quan hệ, danh sách nhánh và đời riêng của từng nhánh. Xuất theo người gốc bao gồm nhánh phụ gắn với những người được xuất và các nhánh sở hữu cần thiết để không có tham chiếu thiếu. Backup JSON cũ vẫn nhập được; thao tác khôi phục thay thế toàn bộ cây và danh sách nhánh hiện tại theo nội dung backup.

JSON giữ người vợ/chồng được chọn và quan hệ hôn nhân cần thiết. Liên kết tài khoản Auth không nằm trong bản sao lưu cây; khi khôi phục trên cùng project, liên kết đang có được giữ nếu ID người đó còn tồn tại, gỡ nếu người đó không còn. Khi chuyển sang project Auth khác, admin cần xác nhận lại liên kết tài khoản.

Giao diện chặn xuất CSV/GEDCOM khi dữ liệu có nhánh phụ vì hai định dạng hiện tại chưa lưu đầy đủ cấu trúc nhánh. GEDCOM xuất trực tiếp cũng từ chối hồ sơ/quan hệ có phạm vi nhánh. Không dùng các định dạng đó thay cho JSON khi sao lưu hệ thống có nhánh phụ.

Bản này chưa có nút xóa cả nhánh hoặc gỡ thành viên khỏi nhánh. Có thể sửa hồ sơ và gỡ quan hệ thuộc nhánh. Người thuộc nhánh được dùng chung hồ sơ, nên sửa ngày cúng sẽ cập nhật lịch của tất cả các nhánh có người đó.

## Các tệp chính

- [Migration và kiểm tra quyền](migrations/20261019000000_family_branches.sql), [kiểm thử database](../tests/family-branches.test.ts).
- [Migration quyền riêng tư](migrations/20261019010000_family_branch_privacy.sql), [kiểm thử truy cập](../tests/family-branch-privacy.test.ts), [gắn tài khoản với hồ sơ](../components/admin/UserPersonLink.tsx).
- [Server actions](../app/actions/branches.ts), [trang nhánh](../app/dashboard/branches/[id]/page.tsx), [giao diện](../components/branches/BranchWorkspace.tsx), [liên kết từ hồ sơ](../components/branches/BranchLinks.tsx).
- [Bộ lọc phạm vi](../utils/familyBranches.ts), [lịch sự kiện](../components/EventsList.tsx), [kiểm thử phạm vi](../tests/family-branch-scope.test.ts).
- [Sao lưu](../app/actions/data.ts), [kiểm tra backup](../utils/backup-validation.ts), [kiểm thử backup](../tests/branch-backup.test.ts).

## Xác nhận triển khai thật

Kiểm tra workspace: 108 tests, TypeScript, ESLint và build production `next build --webpack` đã qua. Kiểm thử database gồm cặp vợ chồng/admin, hậu duệ nhiều đời/con nuôi, các vai trò không liên quan, giả mạo liên kết, thu hồi quyền, ảnh, duyệt thu thập, khôi phục/replay và nối hai cha mẹ đã có. Có regression ngăn hậu duệ editor dùng INSERT/UPDATE/RPC để tự chia sẻ tổ tiên sang nhánh mình quản lý rồi sửa hồ sơ/ảnh. Turbopack mặc định gặp lỗi môi trường khi khởi tạo Node xử lý CSS. Fixture Edge dùng cây/sơ đồ/node và phần chi tiết quan hệ thật để kiểm tra mở/thu gọn/tải lười, nhánh ẩn, thu hồi quyền trước khi mở, không đệ quy mở lại nhánh trong cây nhỏ, nút sửa bị ẩn với hậu duệ editor, mobile/dark, desktop/light và vi/en. Modal và phần MembersViews của trang quản lý nhánh vẫn là stub; không xác nhận form sửa hồ sơ đầy đủ hoặc đăng nhập thật. Ảnh ở `_screenshot_/branches`.

Storage được kiểm thử ở lớp policy PostgreSQL, chưa kiểm tra dịch vụ tải ảnh/ký URL trên Supabase thật. Policy không thu hồi URL ảnh có chữ ký đã phát hành trước đó; chúng hết hạn theo thời hạn đã cấp. API ảnh của ứng dụng dùng phiên đăng nhập và không cache nội dung riêng.

Kiểm tra bổ sung lỗi thiếu cha mẹ (2026-10-19): fixture dùng `RelationshipManager` thật với truy vấn Supabase giả áp quyền trước khi trả dữ liệu; đã qua cha mẹ của người nối thuộc họ chính, chiều ngược ở hồ sơ cha/mẹ, member có quyền/editor không có quyền, nhãn nhánh/nút xóa và gộp quan hệ/đếm người thân. Mock này không thay kiểm thử RLS PostgreSQL. Truy vấn chỉ đọc nhánh do chủ dự án chỉ định trên Supabase xác nhận người nối thuộc họ chính và có hai quan hệ cha mẹ, không thay dữ liệu. HTTP local chuyển phiên chưa đăng nhập về `/login`; chưa xác nhận chi tiết bằng tài khoản thật trên trình duyệt. 106 tests, TypeScript, ESLint tệp sửa và build Webpack qua. Sơ đồ/modal vẫn là stub trong fixture.

Tái chạy fixture sau khi đã build production bằng Webpack:

```powershell
bun scripts/create-branch-fixture.mjs
node scripts/check-branch-browser.mjs
```

Script mở Edge headless với hồ sơ trình duyệt tạm riêng, server local và mock server actions; không dùng tài khoản thật hay ghi Supabase.

- Chưa chạy migration hoặc thao tác tạo/sửa/khôi phục trên Supabase thật.
- Sau các migration nhánh, admin tạo nhánh và xác nhận tài khoản của cặp vợ chồng/con cháu. Kiểm tra họ chính giữ nguyên đời/phân loại; cặp vợ chồng và con cháu xem được nhánh/lịch/nút mở cây, hậu duệ editor chỉ xem, editor thuộc cặp vợ chồng sửa được, người không liên quan và khách không đọc được tên nhánh/cây/API/ảnh.
- Kiểm tra thu hồi quyền khi đổi/gỡ liên kết tài khoản hoặc gỡ quan hệ hôn nhân. Kiểm tra xuất JSON; chỉ thử khôi phục trên database kiểm thử hoặc khi đã có bản sao lưu phù hợp.
- Kết quả kiểm tra tự động và browser ở workspace được ghi tại [CURRENT_SNAPSHOT.md](CURRENT_SNAPSHOT.md).
