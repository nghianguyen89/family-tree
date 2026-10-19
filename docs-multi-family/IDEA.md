# Ý tưởng: một bộ mã nguồn, nhiều website gia tộc độc lập

Ngày ghi nhận: 2026-10-17.
Cập nhật quyết định: 2026-10-18.
Trạng thái: đã thống nhất hướng phát triển; nguồn giai đoạn 1 và giới hạn kiểm chứng được ghi tại [bàn giao giai đoạn 1](PHASE-1-HANDOFF.md). Giai đoạn 2–3 chưa triển khai.

## Mục tiêu

Phát triển repo hiện tại thành sản phẩm có thể giới thiệu cho bạn bè. Người quan tâm xem website demo với thông tin giả; quản trị hệ thống có giao diện chung để tạo gia tộc và cấu hình website riêng cho họ.

Các gia tộc dùng cùng giao diện, chức năng và quy trình cập nhật mã nguồn. Mỗi gia tộc có ID, domain, cấu hình và tài nguyên dữ liệu độc lập.

## Kiến trúc đã chọn

- Một repo chứa mã nguồn dùng chung, không sao chép toàn bộ app cho từng gia tộc.
- Mỗi gia tộc có một bản triển khai website riêng và domain/subdomain riêng.
- Mỗi gia tộc dùng Supabase project riêng: database, Auth và Storage riêng.
- Mỗi gia tộc có folder cấu hình và tài nguyên tĩnh riêng, nhận diện bằng ID ổn định.
- Môi trường phát triển mới bắt đầu bằng family demo với dữ liệu giả, được chọn rõ bằng cấu hình triển khai; không dùng thông tin gia đình thật.
- Có website quản trị hệ thống riêng trong cùng repo, dùng Supabase/Auth riêng để lưu danh mục gia tộc và xác thực admin hệ thống.
- Admin hệ thống và admin gia tộc là hai phạm vi quyền khác nhau.

Không chọn mô hình nhiều gia tộc cùng chung database nghiệp vụ với `family_id` trên mọi bảng ở giai đoạn này. Việc có danh mục quản lý tập trung không có nghĩa là gom dữ liệu gia phả của các gia tộc vào một database.

## Phân chia cấu hình và dữ liệu

Cấu trúc dự kiến, có thể điều chỉnh khi khảo sát mã nguồn:

```text
app/                           Giao diện và chức năng chung
components/
utils/
docs/migrations/               Migration dùng chung, có phiên bản
families/
  demo/
    config.json
    assets/
  <family-id>/
    config.json
    assets/
```

Folder family chứa cấu hình không bí mật và tài nguyên tĩnh được phép đưa vào Git: ID, domain dự kiến, logo, favicon, thiết lập ban đầu. ID không đổi khi đổi tên gia tộc hoặc domain. Cần chọn rõ cơ chế để mỗi bản triển khai chỉ sử dụng cấu hình/tài nguyên tương ứng; không đóng gói toàn bộ cấu hình gia tộc vào bundle trình duyệt.

Đã chốt: Git là nguồn cấu hình triển khai chính. Mỗi website sử dụng cấu hình family trong phiên bản Git được chọn khi triển khai; không tự đọc cấu hình mới nhất trên nhánh chung để thay đổi website đang chạy. Registry quản trị lưu danh mục, tiến độ cấu hình và trạng thái vận hành, không là nguồn thứ hai ghi đè cấu hình triển khai. Thay đổi cấu hình triển khai qua UI phải đi qua quy trình cập nhật Git và triển khai tương ứng; lưu hồ sơ trong registry chưa có nghĩa cấu hình đã được áp dụng.

Bản đầu xuất cấu hình không bí mật để chủ dự án hoặc agent đưa vào Git; chưa tích hợp quyền ghi repo hoặc tự tạo commit/PR từ web. UI phân biệt hồ sơ đã lưu, cấu hình đã xuất, đã đưa vào Git và đã áp dụng trên website. Các bước chưa có kiểm tra tự động phải được ghi nhận là xác nhận thủ công, không giả lập trạng thái thành công.

Các secret, service-role key, mật khẩu database và thông tin truy cập hạ tầng nằm ở biến môi trường hoặc kho bí mật phía server của từng môi trường. Không commit `.env.local` hoặc đưa dữ liệu gia đình thật vào repo/demo/tài liệu.

Dữ liệu người dùng nhập sau triển khai nằm trong Supabase riêng: thành viên, quan hệ, hồ sơ riêng, người dùng/quyền, intake, bài viết, album, thiết lập nội dung. Ảnh tải lên nằm trong Storage riêng; không ghi upload vào folder repo hay filesystem của bản triển khai.

Thông tin giới thiệu, liên hệ, ảnh bìa và nội dung chỉnh thường xuyên nên sửa qua UI và lưu database. Folder cấu hình cung cấp giá trị ban đầu, không ghi đè nội dung người dùng đã sửa khi cập nhật app.

Mỗi bản triển khai chọn một family rõ ràng và gắn cố định với Supabase của môi trường đó. Thiếu hoặc sai ID/config phải báo lỗi cấu hình và chặn thao tác dữ liệu; không tự chuyển sang demo hoặc chọn database theo Host/tham số từ trình duyệt. Kiểm tra URL/key dùng cho Auth, truy vấn, service client và kết nối migration cùng trỏ tới project đích đã xác minh. Thông tin công khai được phép gửi tới client chỉ thuộc family đang triển khai; secret luôn ở server.

## Giao diện quản trị hệ thống

Luồng mong muốn:

1. Xem danh sách gia tộc, domain, trạng thái và phiên bản ứng dụng/database.
2. Bấm **Tạo gia tộc**; nhập tên, ID, domain và email quản trị đầu tiên.
3. Cấu hình Supabase và bản triển khai riêng.
4. Xuất cấu hình để đưa vào Git; người vận hành dùng checklist để kiểm tra kết nối, chuẩn bị schema/migration và triển khai website trên project có sẵn. Ghi kết quả và bằng chứng từng bước.
5. Bàn giao cho admin gia tộc đăng nhập và chỉnh nội dung riêng.

Bản đầu dùng project Supabase/Vercel đã tạo sẵn. Tự tạo tài nguyên qua API là giai đoạn sau, cần tài khoản, quyền và cơ chế quản lý secret phù hợp. Không hứa nút tạo đã tự động cấp hạ tầng nếu thực tế mới lưu danh mục. Registry không giữ mật khẩu database hoặc service-role key của các gia tộc; secret được người vận hành cấu hình trực tiếp trong môi trường tương ứng.

Trạng thái bản đầu: chờ cấu hình, chờ triển khai, hoạt động, lỗi, lưu trữ; kèm kết quả checklist, thời điểm và người xác nhận. “Hoạt động” cần bằng chứng kiểm tra trên website đích; kiểm tra giả lập không đủ. Gia tộc có ID duy nhất; xuất lại cấu hình hoặc tiếp tục checklist không tạo thêm hồ sơ/tài nguyên.

Bản đầu chỉ lưu trữ hồ sơ khỏi danh sách đang quản lý, không khóa hoặc dừng website, không xóa database, Storage hoặc domain. Tạm khóa website thật và xóa vĩnh viễn là chức năng ngoài phạm vi bản đầu, cần quyết định riêng trước khi làm.

Admin gia tộc chỉ quản trị website, người dùng và dữ liệu của mình. Một tài khoản Google có thể đăng nhập vào nhiều website nhưng danh tính Supabase, quyền và trạng thái duyệt được quản lý riêng ở từng project. Không mặc định có SSO xuyên các gia tộc hoặc quyền xem dữ liệu tất cả gia tộc cho admin hệ thống.

Website quản trị dùng Supabase riêng cho Auth và registry, tách khỏi cả demo lẫn database gia tộc. Kiểm tra quyền admin hệ thống ở server và database; tài khoản admin gia tộc không được vào chỉ nhờ có role cùng tên. Website gia tộc không phụ thuộc registry khi phục vụ người dùng: khu quản trị lỗi hoặc ngừng hoạt động không làm ngừng các website gia tộc. Việc quản lý danh mục không cấp quyền tự đọc/sửa dữ liệu gia phả của họ.

Nhập email quản trị khi tạo gia tộc chỉ ghi nhận người sẽ nhận bàn giao, chưa tạo tài khoản hoặc cấp quyền. Giữ cơ chế đăng ký/xác minh email và cấp admin đầu tiên có kiểm tra project đích; không khôi phục cách tự cấp admin cho người đăng ký đầu tiên. Admin hệ thống được cấp quyền theo quy trình riêng, không suy ra từ vai trò admin trong database gia tộc.

## Demo

- Demo là một family riêng, có cấu hình và Supabase riêng.
- Dùng thông tin, email và ảnh giả được phép sử dụng; không sao chép dữ liệu gia đình hiện tại.
- Bản đầu khách chỉ xem phần công khai; admin demo đăng nhập và chỉnh dữ liệu giả theo quyền hiện có. Không mở tài khoản biên tập dùng chung cho khách hoặc tự công khai cây/hồ sơ riêng để làm demo.
- Không mở thêm luồng ghi cho anonymous ngoài các luồng công khai đã được thiết kế riêng. Demo giới thiệu bản đầu không phát hành link thu thập còn hoạt động; vẫn kiểm thử luồng thu thập riêng bằng dữ liệu giả để giữ chức năng.
- Chưa làm khách thử sửa hoặc chức năng reset công khai. Nếu bổ sung reset cho người vận hành về sau, chỉ tác động tài nguyên demo đã xác minh, không nhận tùy ý database đích từ trình duyệt.

## Sao lưu và bàn giao môi trường

Giữ chức năng xuất/nhập gia phả hiện có, gồm thành viên, quan hệ, thông tin riêng và sự kiện. Đây chưa phải bản sao lưu đầy đủ website: không bao gồm toàn bộ CMS, danh mục ảnh, hồ sơ thu thập, tài khoản Auth hoặc bytes của file Storage. Không mở rộng thành hệ thống backup tự động tổng hợp trong bản đầu.

Runbook phải chỉ rõ cách sao lưu/khôi phục database, Auth và Storage theo công cụ thực tế của môi trường, cùng danh sách phần được và chưa được bảo vệ. Chỉ xác nhận khôi phục thành công sau khi kiểm tra trên môi trường thử; file chứa URL/path ảnh không chứng minh ảnh đã được sao lưu. Không thử khôi phục bằng dữ liệu gia đình thật.

Bản đầu dùng Supabase/Vercel project được tạo sẵn theo hướng đã ghi nhận. Người vận hành chuẩn bị project/domain, secret trong môi trường triển khai và cấu hình OAuth Google; ứng dụng cung cấp cấu hình, checklist và kết quả kiểm tra có bằng chứng. Mỗi website cần kiểm tra domain, `APP_URL`, Auth Site URL/redirect URL và link email/thu thập của riêng nó. Không coi việc thêm domain/email vào registry là đã cấu hình các dịch vụ đó.

## Cập nhật dùng chung

Mã nguồn chung được phát hành theo phiên bản. Mỗi gia tộc giữ phiên bản đang chạy và tự chọn thời điểm nâng cấp; các gia tộc có thể chạy các phiên bản khác nhau. Git có phiên bản mới không tự deploy hoặc thay đổi database của tất cả gia tộc. Cấu hình triển khai phải cho phép giữ nguyên phiên bản đã chọn, không tự triển khai mọi commit trên nhánh phát triển chung vào các website đang sử dụng.

Tái sử dụng trang **Cập nhật hệ thống** và cơ chế so sánh phiên bản hiện có. Nguồn kiểm tra phải là nơi phát hành của sản phẩm này, không tiếp tục so với phiên bản repo gốc `homielab/giapha-os`. Phân biệt phiên bản phát hành với commit đang phát triển. Thông báo dành cho admin gia tộc gồm phiên bản đang chạy, phiên bản mới, ghi chú và hướng dẫn nâng cấp.

- **Cập nhật thông thường:** thông báo có bản mới; admin gia tộc có thể nâng cấp hoặc tiếp tục dùng phiên bản hiện tại.
- **Cập nhật quan trọng:** thông tin phát hành do người quản lý sản phẩm công bố phải chỉ rõ yêu cầu bắt buộc, lý do và các phiên bản bị ảnh hưởng. Website thuộc phạm vi đó hiện thông báo **Bắt buộc cập nhật**; không tự suy ra mức độ bắt buộc chỉ từ số phiên bản.
- Bản thường phát hành sau không làm mất yêu cầu bắt buộc còn hiệu lực đối với phiên bản chưa được khắc phục; website đã ở phiên bản an toàn không nhận cảnh báo cũ.
- “Bắt buộc” ở phạm vi đã chốt là yêu cầu admin nâng cấp, chưa bao gồm tự deploy, tự chạy migration, khóa đăng nhập hoặc ngừng phục vụ website. Những biện pháp cưỡng chế đó cần quyết định riêng.
- Nếu không kiểm tra được nguồn phát hành, báo chưa xác định được trạng thái; không coi lỗi mạng là có bản bắt buộc và không ngừng website vì lỗi kiểm tra.

Deploy code không tự chạy migration database. Cần theo dõi phiên bản schema từng project, kiểm tra tương thích, cập nhật thử demo trước, sau đó nâng cấp từng gia tộc khi admin chọn thực hiện. Quy trình phải phân biệt deploy code, migration, seed ban đầu và dữ liệu đang sử dụng; không chạy seed/reset trên database thật khi nâng cấp. Một gia tộc nâng cấp không được thay đổi code, cấu hình hoặc schema của gia tộc chưa nâng cấp.

Tái sử dụng runner và bảng `public.app_migrations` hiện có cho từng database. Khi triển khai, điều chỉnh điều kiện hiện đang chặn migration khi source bị đánh giá cũ hoặc không kiểm tra được so với nguồn Git: kiểm tra khả năng tương thích với phiên bản code được gia tộc chọn, không ép cập nhật chỉ vì có bản mới thông thường.

Cấu hình riêng được giữ khi cập nhật; nếu đổi cấu trúc config phải có cơ chế chuyển đổi. Khi rollback code cần xét khả năng tương thích schema, không mặc định rollback database sẽ khôi phục dữ liệu.

## Bảo vệ website gia đình đang sử dụng

Phương án cuối cùng đã thống nhất:

| Thành phần | Gia đình hiện tại           | Phát triển mới                          |
| ---------- | --------------------------- | --------------------------------------- |
| Nhánh      | Giữ `main`                  | Nhánh chính thức `multi-family-tree`    |
| Vercel     | Giữ project/domain hiện tại | Project mới                             |
| Supabase   | Giữ project hiện tại        | Project mới với dữ liệu giả             |
| Local      | Giữ cấu hình hiện tại       | Cấu hình riêng, nên dùng worktree riêng |

Ngày 2026-10-18 đã xác minh worktree riêng `family-tree-multi` trên nhánh `multi-family-tree`. Kết nối Supabase thử và tài nguyên triển khai còn chờ chủ dự án chuẩn bị. Hai worktree cần hai `.env.local` độc lập; việc tạo nhánh không tự tách file môi trường hoặc database.

Không thay Production Branch của website gia đình khỏi `main`. Rà soát Preview của project cũ để nhánh phát triển mới không vô tình dùng key gia đình. Không dùng key Supabase gia đình cho local mới, CI, demo, Preview hoặc công cụ quản trị mới. Không chạy migration, reset, seed hoặc upload thử vào project gia đình.

Chưa tự merge code mới vào `main`. Chỉ chuyển website gia đình sang kiến trúc mới khi có yêu cầu riêng và kế hoạch chuyển đổi đã được kiểm tra.

## Giai đoạn triển khai

### Giai đoạn 1 — Nền tảng website gia tộc độc lập

Mục tiêu: cùng một bộ mã nguồn chạy đúng cho ít nhất hai gia tộc giả, chưa cần khu quản trị trung tâm.

- Xác minh nhánh/worktree và môi trường phát triển riêng; khảo sát đúng các điểm cấu hình, branding, Supabase, Auth, Storage, CMS, intake, backup và migration bị ảnh hưởng.
- Chọn family/config theo bản triển khai, chỉ đưa tài nguyên được chọn ra website; lỗi cấu hình không fallback sang demo.
- Giữ chức năng, quyền và dữ liệu hiện có; thêm demo giả theo phạm vi chỉ xem đã chốt.
- Điều chỉnh trang Cập nhật hệ thống theo nguồn phát hành riêng, bản thường/bắt buộc và phiên bản bị ảnh hưởng. Tách trạng thái code/schema; tái sử dụng migration hiện có và kiểm tra tương thích với bản được chọn, không yêu cầu luôn chạy bản mới nhất.
- Viết runbook triển khai từng phiên bản trên project có sẵn, OAuth, bootstrap admin, sao lưu/khôi phục theo đúng phạm vi và cập nhật từng gia tộc.
- Kiểm thử A/B độc lập; thử B nâng cấp trong khi A giữ nguyên. Không làm registry, UI quản trị hệ thống, ghi Git từ web hoặc cấp hạ tầng tự động trong chặng này.

Đầu ra: mã nguồn và kiểm tra nền tảng, cấu hình giả mẫu, hợp đồng config/phát hành và runbook đủ để khởi tạo một website riêng. Kiểm thử giả lập phải ghi rõ; chỉ xác nhận hai môi trường thật hoạt động khi có bằng chứng trên hai project kiểm thử độc lập.

### Giai đoạn 2 — Quản trị hệ thống với project có sẵn

Mục tiêu: website quản trị riêng quản lý danh mục và hỗ trợ bàn giao gia tộc, dựa trên nền tảng giai đoạn 1.

- Supabase/Auth riêng cho registry và admin hệ thống; bootstrap độc lập, không dùng role hoặc key của gia tộc để cấp quyền hệ thống.
- UI danh sách, tạo/sửa hồ sơ, xuất config không bí mật theo hợp đồng giai đoạn 1, checklist và lưu trữ hồ sơ. Không tích hợp Git commit/PR trong bản đầu.
- Theo dõi rõ cấu hình dự kiến trong registry và cấu hình/phiên bản thực tế đã được xác nhận ở website; ghi nguồn/thời điểm xác nhận, không hiển thị số liệu cũ như dữ liệu trực tiếp.
- Người vận hành đưa config vào Git, cấu hình secret, domain/OAuth và triển khai thủ công trên project có sẵn; admin gia tộc xác minh tài khoản rồi nhận quyền theo runbook.
- Kiểm tra chặn truy cập trái quyền ở UI, server và database; kiểm thử tạo/xuất lại không trùng, không lộ secret, và website A/B vẫn hoạt động khi registry không khả dụng.

Đầu ra: UI và schema registry, cấu hình xuất dùng được với giai đoạn 1, quy trình bàn giao có bằng chứng. Chưa thu thập quyền hạ tầng hàng loạt, tự deploy, tự migrate hoặc khóa website từ khu quản trị.

### Giai đoạn 3 — Tự động hóa có chọn đích, thực hiện sau

Mục tiêu: tự động hóa các bước thủ công đã ổn định, khi người dùng yêu cầu và có quyền truy cập phù hợp. Giai đoạn 1–2 đã đủ cho bản đầu sử dụng; không cần hoàn thành giai đoạn 3 mới bàn giao bản đầu.

- Trước khi viết tích hợp, chốt chính xác bước sẽ tự động hóa: Git, tạo Supabase/Vercel, domain/OAuth hoặc triển khai/nâng cấp cho một gia tộc được chọn. Không mặc định làm hết các tích hợp trong một đợt.
- Giữ Git là cấu hình triển khai; nếu bổ sung Git integration thì có quyền được cấp riêng và kết quả review được. Secret qua kho bí mật phía server, không nằm trong registry xuất ra client.
- Mọi thao tác có bước xác minh family/project/phiên bản đích, quyền thực hiện và phạm vi chi phí; lưu kết quả từng bước, thử lại không tạo trùng, báo rõ phần thành công và phần cần xử lý thủ công.
- Tự động hóa không đổi chính sách cập nhật: bản thường vẫn tự chọn theo từng gia tộc; bản bắt buộc vẫn là thông báo nếu chưa có yêu cầu cưỡng chế riêng. Không tự cập nhật toàn bộ website chỉ vì Git có phiên bản mới.
- Kiểm thử trên ít nhất hai gia tộc giả, bao gồm lỗi giữa chừng, retry và không tác động gia tộc khác. Thao tác tính phí, publish, đổi domain hoặc ghi dịch vụ thật cần được chủ dự án cho phép theo đích cụ thể.

Đầu ra: chỉ các tích hợp đã được chọn và kiểm chứng, kèm vận hành/khôi phục khi lỗi. Nếu chưa chốt phạm vi hoặc chưa có quyền dịch vụ, chỉ khảo sát/lập phương án cho phần đó, không dựng UI giả thành công hoặc tích hợp chưa dùng.

### Quy tắc bàn giao giữa các giai đoạn

- Mỗi lần kích hoạt prompt chỉ làm giai đoạn được gọi, không tự chuyển sang giai đoạn kế tiếp.
- Ghi kết quả nguồn, kiểm thử tự động, dịch vụ thật và deploy riêng biệt; thiếu môi trường thật thì ghi rõ phần đang chờ, không coi fixture là nghiệm thu hạ tầng.
- Dùng `docs/CURRENT_SNAPSHOT.md` làm điểm bàn giao tiến độ; ghi ID family/project giả hoặc tham chiếu cấu hình an toàn, phiên bản Git và kiểm tra đã thực hiện, không ghi secret hay dữ liệu thật.
- Trước khi bắt đầu giai đoạn sau, đọc snapshot và xác minh các đầu ra cần dùng của giai đoạn trước; không triển khai tiếp trên một nền tảng chưa đủ điều kiện.

## Quyết định đã xác nhận và phần còn mở

Ngày 2026-10-18, chủ dự án xác nhận: Git là nguồn cấu hình triển khai; từng gia tộc tự chọn nâng cấp, bản quan trọng có thông báo bắt buộc; khu quản trị là website/Supabase/Auth riêng trong cùng repo; bản đầu xuất config để chủ dự án hoặc agent đưa vào Git; demo chỉ cho khách xem.

Các quyết định đó không cần hỏi lại khi thực hiện đúng phạm vi. Chi tiết kỹ thuật như tên biến/config và vị trí module chọn theo quy ước repo, ghi lại hợp đồng đã triển khai. Không thêm dependency/framework hoặc đổi kiến trúc nếu công cụ hiện có đáp ứng.

Còn cần xác minh khi thực hiện: môi trường/nhánh/worktree và tài nguyên thật đã chuẩn bị; repo/kênh phát hành của sản phẩm; người vận hành domain/OAuth/backup và tài khoản/quyền dịch vụ. Đây là xác minh đầu vào thực tế, không ghi giả là đã có. Các chức năng ngoài phạm vi như tạm khóa thật, quyền hỗ trợ truy cập dữ liệu, khách sửa demo, xóa vĩnh viễn hoặc tích hợp giai đoạn 3 phải được chốt riêng trước khi làm.

Tài liệu là kế hoạch đã thống nhất, không phải bằng chứng tính năng đã được triển khai.
