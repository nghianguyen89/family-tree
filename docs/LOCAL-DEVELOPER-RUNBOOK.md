# Family tree — Hướng dẫn chạy local

Cập nhật: 2026-10-18. Thực hiện từ thư mục gốc dự án trong terminal VS Code. Với nhánh `multi-family-tree`, đọc thêm [bàn giao giai đoạn 1](../docs-multi-family/PHASE-1-HANDOFF.md); dùng worktree và Supabase thử riêng, không sao chép `.env.local` từ `main`.

## Công cụ và thư viện

Máy đã có Node.js và Bun. Phiên hỗ trợ đã ghi nhận Node.js `v25.9.0`, Bun `1.4.3`; đây là phiên bản quan sát trên máy, không phải yêu cầu phiên bản tối thiểu.

```powershell
node --version
bun --version
bun install --frozen-lockfile
```

Giữ `bun.lock` và `patches/braces@3.0.3.patch` để cài đúng thư viện cùng bản vá.

Nếu Bun không được nhận diện trong terminal PowerShell nhưng đã cài ở vị trí mặc định:

```powershell
& "$env:USERPROFILE\.bun\bin\bun.exe" --version
$env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
```

Thay đổi PATH trên chỉ có hiệu lực trong terminal đó. Có thể mở lại VS Code sau khi PATH của hệ điều hành được cấu hình đúng.

## Cấu hình local

Chỉ copy mẫu nếu chưa có `.env.local`; không ghi đè cấu hình đã điền:

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

| Biến                                           | Ý nghĩa                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `FAMILY_ID`                                    | Chọn `families/<id>/config.json` lúc build; tên/branding lấy từ config, không dùng `SITE_NAME` |
| `APP_URL`                                      | Local dùng `http://localhost:3000`                                                             |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Project URL của Supabase                                                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Publishable key hoặc legacy anon key; phải dùng đúng tên biến này                              |
| `NEXT_PUBLIC_DISABLE_SSO`                      | `true` khi chưa cấu hình Google/Facebook                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`                    | Server-only, cần cho ảnh Gallery, ảnh trang chủ và chức năng dùng admin client                 |
| `SUPABASE_DB_URL`                              | Server-only, kết nối PostgreSQL cho migration trong Dashboard                                  |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`          | Tuỳ chọn, gửi thông báo email                                                                  |
| `ADMIN_NOTIFICATION_EMAIL`                     | Tuỳ chọn, chỉ định người nhận thông báo                                                        |

Không dùng tiền tố `NEXT_PUBLIC_` cho secret/service-role/database key. Không copy giá trị thật vào tài liệu, ảnh chụp hoặc Git.

## Khởi động và dừng

```powershell
bun dev
```

Mở `http://localhost:3000`. `bun run dev` cũng chạy cùng script. Nhấn `Ctrl+C` tại terminal đang chạy để dừng.

Sau khi sửa `.env.local`, dừng rồi chạy lại để chắc chắn server nhận cấu hình mới. Server nền do agent tạo trong phiên hỗ trợ đã tắt; không dùng các PID cũ để dừng tiến trình sau này.

## Khởi tạo và nâng cấp Supabase

- Database mới: cấu hình URL/key, mở `/setup`, copy toàn bộ SQL bundle và chạy trong Supabase SQL Editor.
- Database đã có dữ liệu: xác định migration còn thiếu trước khi chạy. Bundle `/setup` gồm schema và các migration theo thứ tự; không thay thế việc kiểm tra trạng thái thực tế.
- Riêng tính năng khoảng năm: copy toàn bộ [20261014010000_add_person_year_ranges.sql](migrations/20261014010000_add_person_year_ranges.sql), dán vào SQL Editor và bấm **Run**. File này không thực thi thao tác thay thế dữ liệu; nó bổ sung cột, ràng buộc và định nghĩa lại hàm nhập sao lưu. Chỉ khi gọi chức năng nhập sao lưu, hàm đó mới thay thế dữ liệu.

## Thu thập gia đình và ngày cúng

Sau khi có admin/editor và chạy migration `20261014020000_family_intake_and_memorial.sql`, mở `/dashboard/intake` để tạo link thu thập và duyệt gia đình. Hướng dẫn đầy đủ trong [bàn giao form/ngày cúng](FAMILY-INTAKE-HANDOFF.md). Các route public dùng publishable/anon key hiện có, không yêu cầu service-role key riêng cho tính năng này.

Để sao chép lại và xóa link từ danh sách, chạy thêm [migration quản lý link](migrations/20261016000000_intake_link_management.sql). Link cũ chỉ có hash cần tạo link thay thế một lần nếu không còn giữ địa chỉ gốc; thao tác này yêu cầu xác nhận và giữ hồ sơ đã gửi.

## Trang chủ và nội dung

Chạy migration `20261015000000_home_content.sql` sau các migration hiện có. Admin/editor quản lý tại `/dashboard/content`, thiết lập giới thiệu và ảnh bìa tại `/dashboard/content/settings`. Ảnh cần `SUPABASE_SERVICE_ROLE_KEY` phía server. Khi deploy Vercel, push code không tự áp dụng migration Supabase; cấu hình key ở môi trường Production và chạy SQL riêng. Hướng dẫn đầy đủ trong [bàn giao trang chủ](HOME-CONTENT-HANDOFF.md).

## Admin đầu tiên

1. Đăng ký tài khoản và xác minh email.
2. Mở [bootstrap-admin.sql](bootstrap-admin.sql).
3. Thay email mẫu bằng email đã xác minh của chủ ứng dụng.
4. Chạy script trong Supabase SQL Editor, sau đó đăng xuất và đăng nhập lại.

Script chỉ cấp admin đầu tiên khi chưa có admin hoạt động. Nếu đã có, tìm email bằng:

```sql
SELECT u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin' AND p.is_active = true;
```

Các tài khoản sau được admin duyệt trong **Quản lý người dùng**.

## Khi gặp lỗi

| Hiện tượng                                     | Kiểm tra                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Chuyển tới `/missing-db-config`                | URL và biến `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` phải có giá trị; khởi động lại                             |
| Chuyển tới `/setup`                            | Database có thể chưa có bảng `profiles`; làm theo hướng dẫn setup                                                     |
| Tài khoản đầu tiên chờ duyệt                   | Chạy quy trình cấp admin ở trên                                                                                       |
| Lưu thành viên báo thiếu `year_from`/`year_to` | Chạy migration khoảng năm trên đúng project                                                                           |
| Đăng ký/xác nhận email lỗi                     | Kiểm tra log và cấu hình Auth; `Failed to fetch` còn có thể do kết nối mạng hoặc URL/key sai                          |
| Callback đăng nhập không đúng                  | Supabase Auth URL Configuration: Site URL `http://localhost:3000`, Redirect URL `http://localhost:3000/auth/callback` |
| Cổng 3000 đang được dùng                       | Dừng terminal/server đang chiếm cổng; kiểm tra tiến trình trước khi tắt                                               |

## Kiểm tra khi thay đổi mã

Nếu chạy lại bundle bị lỗi `42723` tại `ALTER FUNCTION ... SET SCHEMA private`, dùng bundle mới sau bản sửa trong `20260901000000_security_definer_and_rls_hardening.sql`: tải lại `/setup`, copy toàn bộ SQL mới và thay nội dung query cũ trong SQL Editor. Không xoá schema `private` hoặc dùng `DROP ... CASCADE` để xử lý lỗi trùng hàm.

```powershell
bun run lint
bun x tsc --noEmit
bun run test:security
```

Kiểm tra build khi cần bàn giao bản production bằng `bun run build`. Kết quả đã chạy trong phiên hiện tại được ghi ở [CURRENT_SNAPSHOT.md](CURRENT_SNAPSHOT.md).
