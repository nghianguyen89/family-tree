# Bàn giao chế độ sáng / tối

Ngày: 2026-10-15. Đã triển khai trong workspace, chưa triển khai production.

## Cách dùng và chỉnh màu

- Bấm icon mặt trăng/mặt trời ở góc trên để đổi chế độ. Khi chưa chọn, giao diện theo cài đặt hệ thống; sau khi chọn, trình duyệt nhớ chế độ qua `giapha-theme` trong localStorage. Xóa khóa này để trở lại chế độ theo hệ thống.
- Sửa `app/themes.css`: khối `@theme` là màu sáng, khối `:root[data-theme='dark']` là màu tối. Các token và quy ước được ghi trong `DESIGN.md`.
- Dùng `bg-neutral`, `bg-surface`, `text-primary`, `text-secondary`, `border-border` trong component mới. Màu SVG dùng `var(--color-...)`; không đặt thêm màu cố định trong component.
- Các utility stone và lớp nền accent cũ được điều chỉnh tại cùng file. Phần `@utility text-*` tăng độ sáng chữ accent trong dark mode, giữ màu nền nút đậm.
- `utils/theme.ts` chứa khóa lưu, lựa chọn chế độ và script chạy trước khi vẽ trang; `components/ThemeToggle.tsx` xử lý chuyển chế độ, đổi cài đặt hệ thống và đồng bộ tab. Khi localStorage bị chặn, nút vẫn đổi được theme trong trang hiện tại.

## Kiểm tra

- TypeScript, ESLint và build production qua; 40 bài kiểm thử ở 8 file qua. `tests/theme.test.ts` kiểm tra lựa chọn người dùng, hệ thống, giá trị lưu sai và localStorage bị chặn. Đã xác nhận quy tắc dark mode xuất hiện trong CSS production.
- Chưa kiểm tra tương tác browser hoặc hình thức bằng phiên đăng nhập thật. Không thay đổi database hay áp dụng migration Supabase.
- Kiểm tra trên trình duyệt: chuyển theme, tải lại, mở tab khác; quan sát form, menu, modal, cả ba kiểu sơ đồ và thư viện ảnh; thử màn hình nhỏ và thao tác bàn phím.
