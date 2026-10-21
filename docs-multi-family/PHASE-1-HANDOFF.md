# Bàn giao giai đoạn 1 — Website gia tộc độc lập

Ngày: 2026-10-18. Chỉ phạm vi giai đoạn 1; trạng thái kiểm tra cuối cùng xem [snapshot](../docs/CURRENT_SNAPSHOT.md). Tài liệu này không xác nhận Supabase/Vercel thật đã hoạt động.

## Đồng bộ mã nguồn từ main (2026-10-19)

Đã fast-forward `multi-family-tree` từ `cf97719` lên `main` tại `0e31c8d`, khôi phục phần phát triển riêng chưa commit và ghép xung đột thủ công. Giữ config theo gia tộc, binding project, manifest phát hành và runner transaction; không sao chép hoặc sửa env của hai worktree. Bản dự phòng trước ghép còn ở Git stash `591a55d629fbe5aee7a0d3293b916f23b3e70abd`.

Nguồn hiện biết 18 mục schema/migration (thêm bốn file `20261019...`). Xác nhận 14 mục đã áp dụng trên hai project ở bên dưới là lịch sử trước đồng bộ; bốn migration mới chưa được agent áp dụng hoặc xác nhận trên các project này. Deploy/merge code không tự chạy SQL. Tính năng nhánh phụ và địa chỉ quê quán cũ cần các migration tương ứng trên từng project được chọn; không suy trạng thái của gia tộc này từ gia tộc khác.

Kiểm tra sau đồng bộ: 123 tests/28 file, TypeScript, ESLint, build Webpack với demo/key giả, kiểm tra client bundle chỉ đóng gói cấu hình gia tộc được chọn và không lộ secret sentinel đều PASS. Edge kiểm tra fail-closed, đăng nhập/cập nhật với mock Auth/action, mobile/desktop và vi/en PASS. Không thay xác nhận vận hành thật; output build là fixture, cần build lại bằng cấu hình đích trước deploy.

## Đồng bộ upgrade từ main — 2026-10-20

Ghép 093136c: kiểm tra lịch sử migration chỉ SELECT, thông báo mật khẩu database sai, link repo/nhánh, hướng dẫn, SQL bundle, SQL Editor và sao lưu. Nguồn chưa current không hiện thông báo toàn hệ thống đồng bộ. Giữ hợp đồng nguồn phát hành và migration theo code đã chọn bên dưới; không nhập điều kiện khóa theo GitHub mới nhất của main. Không thay config, env, binding, manifest hoặc dữ liệu từng gia tộc. Kết quả kiểm tra ghi tại snapshot.

## Môi trường và giới hạn

Ngày 2026-10-21 đã đối chiếu 218 metadata liên quan bốn migration `20261019...` trên **Demo** với schema kỳ vọng của code, khớp đầy đủ; chỉ bổ sung bốn bản ghi lịch sử thiếu trong transaction sau kiểm tra lại, không chạy lại SQL migration hoặc sửa dữ liệu cây. Hậu kiểm 18/18 mục được ghi nhận. Lịch sử cũ thiếu vì `/setup` không ghi tracker; nguồn `/setup` đã sửa để ghi SQL và lịch sử nguyên tử, giữ timestamp khi replay. Chi tiết/bằng chứng tại [snapshot](../docs/CURRENT_SNAPSHOT.md). Không suy trạng thái Lê Gia Trang từ kết quả Demo; chưa deploy bản sửa.

- Worktree được xác minh: `D:/projects/my-github/apps/family-tree-multi`, nhánh chính thức `multi-family-tree`, bắt đầu từ commit `cf97719`. `main` ở worktree khác và được giữ nguyên.
- Trước triển khai đã có thay đổi tại `docs/CURRENT_SNAPSHOT.md` và thư mục `docs-multi-family/`; giữ nội dung có sẵn. Không tự commit, push, merge, deploy hoặc tạo tài nguyên.
- Ngày 2026-10-18 worktree mới chưa có `.env.local`. Ngày 2026-10-19 chủ dự án đã cung cấp hai project mới và điền `.env.local` cho A; agent giữ nguyên file này, lưu thêm `.env.demo.local` (A) và `.env.legiatrang.local` (B chưa kích hoạt), đều được Git ignore. Không đọc/copy môi trường của worktree `main`, không dùng dữ liệu hoặc key gia đình cũ.
- Không triển khai registry/admin hệ thống, Git integration, tạo hạ tầng, reset công khai, backup tự động hoặc cưỡng chế ngừng website.

## Bản đồ khảo sát và hợp đồng giữ lại

| Phần                            | Điểm mã nguồn / hợp đồng                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Chọn gia tộc, branding          | `app/config.ts`, `next.config.ts`, `families/<id>/config.json`; chọn ở thời điểm build, không lấy từ request/Host                               |
| Metadata, biểu tượng, đăng nhập | `app/layout.tsx`, component logo, trang đăng nhập; chỉ cấu hình công khai của gia tộc đã chọn đi ra client                                      |
| Kết nối                         | `utils/supabase/{client,server,middleware,admin,public-intake}.ts`; browser, cookie client, service client và anonymous intake cùng một project |
| URL                             | `APP_URL`, `app/auth/callback/route.ts`, luồng email và link thu thập; domain gia tộc phải khớp các dịch vụ đã cấu hình                         |
| Trang chủ/CMS                   | `utils/content.ts`, `utils/supabase/content.ts`, `app/actions/content.ts`; thiết lập trong database được ưu tiên, không seed ghi đè khi deploy  |
| Ảnh                             | `utils/supabase/storage.ts`, API media/content/gallery/avatar; quyền và proxy hiện có được giữ, upload vào Storage riêng                        |
| Thu thập                        | `app/actions/intake.ts`, API intake, `utils/supabase/public-intake.ts`; RPC có phạm vi theo token, không mở quyền đọc cây cho khách             |
| Xuất/nhập cây                   | `app/actions/data.ts`, `utils/backup-validation.ts`; RPC `import_family_backup` thay dữ liệu cây trong transaction                              |
| Cập nhật/schema                 | `app/actions/migrations.ts`, trang cập nhật, `public.app_migrations`; quyền, khóa, transaction và kiểm tra project đích vẫn áp dụng             |

Xem handoff [CMS](../docs/HOME-CONTENT-HANDOFF.md), [ảnh chung](../docs/SHARED-MEDIA-HANDOFF.md), [intake](../docs/FAMILY-INTAKE-HANDOFF.md), [khoảng năm](../docs/YEAR-RANGES-HANDOFF.md) trước thao tác từng phần. Không cần thêm `family_id` vào dữ liệu nghiệp vụ vì mỗi gia tộc có database/Auth/Storage riêng.

## Config trong Git

Config không bí mật tại `families/<family-id>/config.json` có hợp đồng phiên bản 1:

| Trường               | Ý nghĩa                                                  |
| -------------------- | -------------------------------------------------------- |
| `configVersion`      | `1`, phiên bản cấu trúc config                           |
| `id`                 | ID ổn định, khớp tên folder; đổi tên/domain không đổi ID |
| `siteName`           | Tên website mặc định                                     |
| `domain`             | Host dự kiến của website, không phải nguồn chọn database |
| `isDemo`             | Dấu hiệu môi trường demo; không cấp thêm quyền           |
| `supabaseProjectRef` | Project ref công khai đã được người vận hành xác minh    |

`FAMILY_ID` chọn đúng một config lúc build. `next.config.ts` chỉ đưa phần công khai đã kiểm tra của config đó vào `NEXT_PUBLIC_FAMILY_CONFIG`; không import danh mục mọi gia tộc vào component trình duyệt. Không tự đặt biến nội bộ này trong môi trường triển khai. Secret nằm ở biến môi trường server, không được thêm vào JSON/assets/public.

Domain Demo được đổi từ mẫu `demo.example.com` sang địa chỉ chủ dự án đang triển khai `demo-familytree.vercel.app` ngày 2026-10-21. Vercel cần `FAMILY_ID=demo`, `APP_URL=https://demo-familytree.vercel.app` và build mới từ nguồn đã sửa; thiếu/sai domain khiến public config rỗng và bị chuyển `/missing-db-config` dù Supabase key đã điền. Domain Lê Gia Trang vẫn là ví dụ; chưa xác minh env hoặc deployment Vercel thật trong lượt sửa này.

Mỗi folder có `assets/logo.svg` (SVG tĩnh do người vận hành duyệt trong Git). Build chỉ nhúng logo đã chọn; `/family-assets/logo` trả logo đó, dùng chung cho header và metadata icon. `APP_URL` chỉ nhận origin HTTPS khớp `domain`, hoặc localhost/127.0.0.1 cho thử local; server runtime vẫn cần `FAMILY_ID` và `APP_URL` khớp bản build. OAuth, email và link thu thập dùng origin này. Để trống biến service/SQL chưa sử dụng; không giữ key placeholder trong môi trường. SQL URL chỉ nhận host Supabase trực tiếp/pooler khớp ref, không nhận query đổi host; runner yêu cầu TLS.

Hai config ban đầu dùng project ref giả; ngày 2026-10-19 đã gắn với hai project mới do chủ dự án cung cấp. B đã đổi ID/folder thành `legiatrang`, tên hiển thị `Lê Gia Trang`, logo chữ L và domain ví dụ `legiatrang.example.com` theo yêu cầu. Sau đó đã khởi tạo schema/migration thật trên cả hai project với cho phép của chủ dự án; chưa deploy website. Khi đổi `FAMILY_ID` hoặc config phải build/deploy lại; không dùng một output `.next` cho hai gia tộc bằng cách chỉ đổi biến runtime.

| Family ID    | Project                | Project ref công khai  | Trạng thái kết nối 2026-10-19                    |
| ------------ | ---------------------- | ---------------------- | ------------------------------------------------ |
| `demo`       | `FamilyTreeDemo`       | `owwuvellerhfpqyzpkdw` | API/SQL và khởi tạo 14 mục schema/migration PASS |
| `legiatrang` | `FamilyTreeLeGiaTrang` | `bludnhpzfnitoexbzodf` | API/SQL và khởi tạo 14 mục schema/migration PASS |

Cả hai bật Email và xác minh email, chưa bật Google. Khởi tạo theo đúng thứ tự của `app/actions/migrations.ts`, mỗi project một transaction với advisory lock; wrapper `BEGIN/COMMIT` lồng được loại như runner và ghi đủ 14 mục `app_migrations`. Hậu kiểm SQL/API xác nhận mỗi project có 14 bảng bật RLS, 50 policy, bốn bucket private; Auth và dữ liệu nghiệp vụ vẫn trống, chỉ `home_settings` có dòng mặc định. Không tạo admin hoặc seed/import dữ liệu gia đình. Chưa kiểm thử đăng nhập/CRUD/upload qua phiên người dùng.

Lưu ý vận hành: metadata membership của SQL role với owner `auth.users`/`storage.objects` có thể trả false nhưng quyền DDL thật vẫn được Supabase cho phép. Đã xác nhận bằng probe CREATE/DROP trigger/policy trong transaction rollback, không đổi owner hoặc cấp thêm quyền. Anonymous đọc `persons` bị từ chối `42501` là hành vi bảo vệ mong đợi; không GRANT thêm chỉ để làm smoke test qua.

Từ 2026-10-20, profile được chuyển từ `.env.demo.local` và `.env.legiatrang.local` ở gốc vào `families/demo/.env.local` và `families/legiatrang/.env.local`; nội dung được giữ nguyên và cả hai vẫn được Git ignore. `.env.local` ở gốc được giữ nguyên làm cấu hình đang chạy. Next.js không tự nạp profile trong `families`; lệnh `bun run dev:family <id>` kiểm tra ID/project URL và khóa dev server, copy profile vào `.env.local` ở gốc rồi chạy dev. Dừng server trước khi chuyển; lưu thay đổi cần giữ ở file gốc về profile trước khi chạy lệnh. Chỉ chạy một gia tộc mỗi lần trong worktree này; production local cần copy profile và build lại. Xem [runbook local](../docs/LOCAL-DEVELOPER-RUNBOOK.md). Trên Vercel, đặt biến môi trường riêng cho từng project và dùng lệnh build bình thường; không dùng file env local.

Thiếu/sai ID, config hoặc project binding phải dừng thao tác dữ liệu, không chuyển sang demo. URL Supabase, publishable/anon key, service key và SQL URL phải thuộc project đã chọn. Với loại key opaque không tự chứa project ref, người vận hành phải xác minh cặp URL/key bằng dashboard project và thao tác thử có quyền phù hợp; không ghi secret vào bằng chứng.

Config chỉ cấp giá trị mặc định khi chưa có thiết lập. Hàng `home_settings` đã lưu luôn thắng; deploy hoặc upgrade không ghi lại tiêu đề, liên hệ, ảnh bìa, bài viết hay nội dung người dùng đã sửa. Giai đoạn 1 không tự seed/reset database. Admin demo chỉ quản lý dữ liệu giả theo quyền hiện có; khách chỉ xem nội dung công khai. Không phát hành link intake đang hoạt động cho demo giới thiệu.

## Dựng website trên project đã chuẩn bị

1. Chuẩn bị hai project Supabase thử độc lập A/B và hai deployment project thử. Ghi family ID, project ref, domain, commit/tag, config version; không ghi key. Kiểm tra project gia đình cũ vẫn dùng `main`; rà soát Preview để code mới không nhận key cũ.
2. Tạo config Git cho A/B từ mẫu và đặt đúng project ref. Mỗi build đặt `FAMILY_ID` riêng. Điền `.env.local` mới từ mẫu repo hoặc secret trên deployment; không sao chép file của worktree `main`. Các biến Supabase dùng tên trong [runbook local](../docs/LOCAL-DEVELOPER-RUNBOOK.md).
3. Đặt `APP_URL` là origin chuẩn của deployment. Trên Supabase Auth đặt Site URL và allowlist redirect của đúng website, gồm `/auth/callback` và local thử khi cần. Trên Google OAuth dùng callback của đúng Supabase project (`https://<ref>.supabase.co/auth/v1/callback`). Cấu hình provider/client secret ở Supabase, không Git. Khi chưa cấu hình Google giữ `NEXT_PUBLIC_DISABLE_SSO=true`.
4. **Init database trống:** xác minh tên/ref project trong Dashboard; dùng SQL bundle `/setup` theo [runbook local](../docs/LOCAL-DEVELOPER-RUNBOOK.md). Chạy đúng thứ tự schema/migration, xác nhận bucket/policy và `app_migrations`. Chỉ nhập dữ liệu giả vào môi trường thử; không chạy SQL seed/reset lên database đang dùng.
5. Đăng ký, xác minh email, rồi chạy [bootstrap-admin.sql](../docs/bootstrap-admin.sql) trong đúng SQL Editor với email đã xác minh. Script không tự lấy người đăng ký đầu tiên; từ chối khi đã có admin hoạt động. Đăng nhập lại, kiểm tra quyền; một Google account trên A không có quyền trên B nếu chưa được duyệt riêng.
6. Kiểm tra domain/HTTPS, callback Google, email xác minh/duyệt, link intake, ảnh, quyền CMS và tài khoản chưa hoạt động. Chỉ ghi PASS sau thao tác thật. Chưa bật link intake trên demo giới thiệu.

## Giữ phiên bản và nâng cấp từng website

Hợp đồng thông báo ở `utils/releases.ts`:

```json
{
  "manifestVersion": 1,
  "repository": "nghianguyen89/family-tree",
  "releases": [
    {
      "version": "2.4.0",
      "notes": "Ví dụ giả: bản sửa cho dải phiên bản được chỉ rõ.",
      "mandatory": {
        "reason": "Lý do do người phát hành công bố.",
        "affected": [{ "minVersion": "2.3.0", "maxVersionExclusive": "2.4.0" }]
      }
    }
  ]
}
```

Đây là fixture minh họa, không phải công bố bản `2.4.0`. `url` tùy chọn trỏ tới GitHub Releases của repo sản phẩm. Dải `affected` gồm cận dưới, không gồm cận trên; một bản thường mới hơn không xóa yêu cầu bắt buộc còn hiệu lực của bản chưa an toàn. Không suy mức bắt buộc từ major/minor/patch.

`PRODUCT_RELEASE_MANIFEST_URL` là URL HTTPS do người vận hành xác minh và chọn phía server; chưa cấu hình kênh thật thì trả `unknown`. Không tự so commit nhánh phát triển hoặc trỏ repo gốc. Trang cập nhật phân biệt `current`, `outdated`, `mandatory`, `unknown`; lỗi mạng/manifest không khóa website. Phiên bản đang chạy lấy từ package của code được triển khai, schema theo `app_migrations`, config theo `configVersion`.

Runner chỉ chạy migration nằm trong code đã chọn. Schema có bản ghi migration ngoài danh sách code đó bị đánh giá không tương thích; không được tự bỏ qua bằng cách xóa lịch sử. Đây là kiểm tra theo danh sách migration, không thay thế đọc hướng dẫn tương thích/rollback của từng bản phát hành. Trạng thái nguồn `unknown` hoặc có bản thường mới hơn không tự ngăn migration tương thích.

`schemaVersion` hiển thị migration cuối mà **code được chọn** biết, không phải số phiên bản database đã đo. `app_migrations` lưu lịch sử runner theo ID file, chưa có checksum hoặc kiểm tra cấu trúc schema thật. SQL chạy thủ công trong SQL Editor có thể chưa có bản ghi runner; không suy database trống từ lịch sử rỗng, không tự đánh dấu migration đã chạy hoặc tự chạy lại trước khi đối chiếu schema/bằng chứng vận hành. Các file SQL vẫn giữ transaction wrapper khi dùng SQL Editor; runner loại các dòng `BEGIN;`/`COMMIT;` ngoài cùng theo dạng hiện có để một transaction của cả batch bảo vệ schema và lịch sử. Khi thêm migration phải kiểm tra lại dạng wrapper và rollback nếu lỗi giữa batch.

Mỗi website lưu riêng commit/tag bất biến được duyệt, family ID/config version và schema migration đã áp dụng. Không gắn Production của mọi website vào nhánh phát triển `multi-family-tree` với auto deploy mọi commit. Với project triển khai có sẵn, người vận hành chọn triển khai commit/tag đã duyệt và tắt/giới hạn auto deploy theo cấu hình dịch vụ; xác minh commit thực tế trên deployment sau khi chạy. Đây là thao tác thủ công, chưa được ứng dụng thực hiện.

**Upgrade A hoặc B:** sao lưu và kiểm thử khôi phục trước; đọc ghi chú phát hành/schema; giữ config/secrets đích, chọn commit/tag mới; áp dụng đúng migration còn thiếu bằng runner/SQL của bản được chọn rồi deploy theo yêu cầu tương thích của bản đó. Deploy code không tự migrate. Không chạy lại seed, bootstrap admin hoặc import cây để nâng cấp. Đối chiếu `public.app_migrations` và phiên bản code sau khi kiểm tra quyền/ảnh/CMS/intake.

B nâng cấp phải có bằng chứng A vẫn giữ commit/config/schema và dữ liệu cũ. Một thông báo bản thường mới hơn không được chặn migration của bản code đã chọn. Nguồn thông báo không có quyền tự deploy, migrate hay khóa website.

**Rollback:** chỉ chuyển về code cũ nếu schema hiện tại còn tương thích. Không tự xóa bản ghi `app_migrations`, đảo migration hoặc dùng backup cây để giả rollback toàn website. Khi thay đổi schema/import lỗi, kiểm tra transaction và trạng thái thực tế trước retry. Nếu không tương thích, sửa tiến hoặc khôi phục bản môi trường đã kiểm chứng sang project thử được cho phép; đối chiếu dữ liệu và chấp nhận khoảng mất dữ liệu trước chuyển traffic. Không thử quy trình bằng dữ liệu gia đình thật.

## Sao lưu và kiểm tra khôi phục thủ công

Xuất JSON v4 hiện tại chứa `persons`, `relationships`, `person_details_private`, `custom_events`, `family_branches`, `family_branch_members` theo quyền và phạm vi xuất, giữ lựa chọn phối ngẫu của nhánh. Liên kết tài khoản Auth với hồ sơ không nằm trong backup cây; khôi phục cùng project giữ liên kết còn hợp lệ, chuyển project cần admin xác nhận lại. CSV/GEDCOM không lưu được cấu trúc nhánh và bị chặn khi có nhánh phụ. Không chứa toàn bộ CMS, `media_assets`, placement, intake, Auth hay bytes ảnh. File có URL/path ảnh không chứng minh ảnh đã được sao lưu. Nhập cây thay thế phần cây, không khôi phục website đầy đủ; link intake có thể mất người gốc phù hợp sau khi thay ID.

Đối với môi trường thử, dùng quy trình [Supabase CLI + psql chính thức](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore): cài CLI/Docker và PostgreSQL client; dump riêng role, schema và data bằng `supabase db dump` (`--role-only`, mặc định schema, `--data-only --use-copy`). Restore vào project thử trống bằng `psql --single-transaction --variable ON_ERROR_STOP=1` theo thứ tự role/schema/data của hướng dẫn. Kiểm tra Auth data, trigger và policy trong dump; bổ sung phần tùy chỉnh `auth`/`storage` và cấu hình dịch vụ chưa có. Giữ file dump ngoài repo với quyền hạn chế.

Tải bytes Storage bằng Dashboard cho số ít file hoặc công cụ S3 tương thích như Cyberduck/AWS CLI/rclone cho cả bucket theo [hướng dẫn tải file chính thức](https://supabase.com/docs/guides/storage/management/download-objects). Lưu bucket/path, kích thước, hash, MIME và quyền; upload lại bytes qua Storage API/S3 vào project thử. Bản ghi `storage.objects` không thay thế file vật lý.

Phiên bản CLI và khả năng backup của gói dịch vụ chưa được xác minh trên máy/project mới. Không chạy các lệnh trên với URL thật trước khi được phép; không thêm CLI thành dependency app. Secret, OAuth/provider, SMTP, redirect/domain và cấu hình deployment phải được ghi nhận trong kho vận hành riêng rồi cấu hình lại an toàn; không giả định dump SQL khôi phục chúng.

Chỉ xác nhận backup/restore PASS khi project thử đã khôi phục và kiểm tra đủ:

- Đếm/đối chiếu ID các bảng cây, private details, events, CMS, settings, placements, assets, intake và lịch sử migration; kiểm tra FK/RLS cùng quyền anonymous/member/editor/admin.
- Tài khoản Auth thử đăng nhập lại được, email đã xác minh và profile/role liên kết đúng; provider/callback và email hoạt động. Không chỉ đếm hàng `auth.users`.
- Đối chiếu inventory/hash bytes ảnh; mở ảnh private/công khai qua proxy với đúng quyền và xác nhận bucket vẫn private theo thiết kế.
- Nội dung sửa trước backup còn nguyên; intake thử gửi/duyệt được; import lỗi không làm mất cây cũ. A không thay đổi trong khi restore B.

Cho tới khi có bằng chứng này, backup toàn môi trường và khả năng khôi phục Auth/Storage là **NOT RUN**, chưa được bảo đảm bởi nút xuất cây.

## Bằng chứng và bước còn chờ

Lượt cuối **PASS**: TypeScript, ESLint, 95 tests/23 file (hai wrapper chạy riêng 6 test con), production build thiếu config và build chọn demo giả, kiểm tra client bundle và Edge headless. Browser dùng trang lỗi cấu hình thật cùng component login/upgrade thật với Auth/action/feed giả; PGlite dùng hai database độc lập và SQL thật. Chưa xác nhận Auth, bytes ảnh hoặc hạ tầng Supabase thật. Chi tiết và lỗi môi trường đã khắc phục xem snapshot.

Lệnh kiểm tra từ repo (Bun; build có thể cần quyền tải font Google, browser cần Edge trên Windows):

```powershell
bun node_modules/typescript/bin/tsc --noEmit
bun node_modules/eslint/bin/eslint.js
bun test tests
bun scripts/create-family-login-fixture.mjs
bun scripts/create-upgrade-fixture.mjs
bun scripts/check-family-browser.mjs
```

Browser harness ép runtime thành cấu hình sai và xóa service/SQL key khỏi env của server con, nên không tự dùng Supabase khi sau này có `.env.local`. Cần build trước khi chạy. Kiểm tra đóng gói bằng `bun scripts/check-family-bundle.mjs demo` sau build fixture `FAMILY_ID=demo`, `APP_URL=http://localhost:3000`, URL `https://<supabaseProjectRef-trong-config-demo>.supabase.co`, public key giả `sb_publishable_phase1_fixture_only`, server secret giả `sb_secret_phase1_server_only_sentinel`. Chỉ đặt các giá trị này trong terminal thử cho lệnh build `bun node_modules/next/dist/bin/next build --webpack`; không lưu chúng vào cấu hình chạy thật. Đổi family cần build riêng; script không deploy hoặc thử kết nối Supabase.

Kết quả lint/TypeScript/tests/build/browser được ghi riêng trong snapshot sau khi chạy; fixture chỉ chứng minh nguồn. Kết nối và khởi tạo schema/migration thật hai project **PASS** như ghi ở trên. Domain, OAuth, bootstrap, CRUD/upload bằng phiên thật, deploy A/B, nâng cấp phiên bản riêng và restore đầy đủ vẫn **NOT RUN**, chờ quyền thực hiện và điều kiện môi trường tương ứng. Sau rename đã chạy lại 95 tests, TypeScript và ESLint PASS; chưa build/browser lại cho tên mới.

Bước tiếp: đăng ký/xác minh email riêng trên từng project, bootstrap email được chủ dự án chỉ định rồi kiểm tra CRUD/upload bằng tài khoản thật. Project ref/URL và secret môi trường thử đã được cấu hình; còn cần domain/triển khai, người vận hành OAuth/backup và quyền thao tác tương ứng khi thực hiện các bước đó. Không đưa key vào tài liệu. Kênh phát hành thật phải được xác minh trước khi bật kiểm tra từ xa. Không tự bắt đầu giai đoạn 2.
