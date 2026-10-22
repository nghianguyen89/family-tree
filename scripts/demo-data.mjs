// Entirely fictional records. Stable IDs let the seed run again without duplicates.
export const id = (n) =>
  `da000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const rows = [
  ['An Văn Khởi', 'male', 1890, 1, false, 1968],
  ['Bùi Thị Hiền', 'female', 1894, 1, true, 1975],
  ['An Văn Lâm', 'male', 1920, 2, false, 2001],
  ['Trần Thị Sen', 'female', 1924, 2, true, 2010],
  ['An Thị Mai', 'female', 1926, 2, false, 2015],
  ['Đỗ Văn Bình', 'male', 1923, 2, true, 2012],
  ['An Văn Minh', 'male', 1950, 3, false, null],
  ['Nguyễn Thị Lan', 'female', 1953, 3, true, null],
  ['An Văn Hòa', 'male', 1955, 3, false, null],
  ['Phạm Thị Thu', 'female', 1958, 3, true, null],
  ['An Thị Hạnh', 'female', 1959, 3, false, null],
  ['Lê Văn Thành', 'male', 1956, 3, true, null],
  ['Đỗ Thị Hương', 'female', 1952, 3, false, null],
  ['An Quốc Bảo', 'male', 1980, 4, false, null],
  ['Vũ Ngọc Anh', 'female', 1984, 4, true, null],
  ['An Thùy Dương', 'female', 1985, 4, false, null],
  ['An Đức Phúc', 'male', 1987, 4, false, null],
  ['An Minh Châu', 'female', 2010, 5, false, null],
  ['An Gia Huy', 'male', 2015, 5, false, null],
  ['Nguyễn Văn Tùng', 'male', 1928, null, false, 2008],
  ['Hoàng Thị Cúc', 'female', 1931, null, false, 2018]
]
export const branchId = id(500)
export const persons = rows.map(
  ([full_name, gender, birth_year, generation, is_in_law, death_year], i) => ({
    id: id(i + 1),
    full_name,
    gender,
    birth_year,
    generation,
    is_in_law,
    death_year,
    is_deceased: death_year !== null,
    birth_month: 10,
    birth_day: 23 + (i % 7),
    birth_order: (i % 3) + 1,
    family_branch_id: i >= 19 ? branchId : null,
    note: 'Hồ sơ hư cấu thuộc bộ dữ liệu giới thiệu Gia tộc An. Không phải thông tin người thật.',
    memorial_day: death_year ? 12 + (i % 5) : null,
    memorial_month: death_year ? 9 : null,
    memorial_calendar: death_year ? 'lunar' : null
  })
)
// Demonstrate uncertain historical years without inventing an exact birthday.
Object.assign(persons[0], {
  birth_year: null,
  birth_month: null,
  birth_day: null,
  birth_year_from: 1888,
  birth_year_to: 1892
})
const links = []
const link = (a, b, type, branch = null) =>
  links.push({
    id: id(100 + links.length),
    person_a: id(a),
    person_b: id(b),
    type,
    family_branch_id: branch
  })
for (const [a, b] of [
  [1, 2],
  [3, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12],
  [14, 15]
])
  link(a, b, 'marriage')
for (const [a, b, children] of [
  [1, 2, [3, 5]],
  [3, 4, [7, 9, 11]],
  [5, 6, [13]],
  [7, 8, [14, 16]],
  [9, 10, [17]],
  [14, 15, [18, 19]]
]) {
  for (const child of children) {
    link(a, child, 'biological_child')
    link(b, child, 'biological_child')
  }
}
link(20, 21, 'marriage', branchId)
link(20, 8, 'biological_child', branchId)
link(21, 8, 'biological_child', branchId)
export const relationships = links
export const branch = {
  id: branchId,
  name: 'Bên ngoại Nguyễn — nhánh minh họa',
  anchor_person_id: id(8),
  partner_person_id: id(7),
  root_person_id: id(20)
}
export const members = [20, 21, 8].map((n) => ({
  branch_id: branchId,
  person_id: id(n),
  generation: n === 8 ? 2 : 1
}))
export const events = [
  {
    id: id(600),
    name: 'Ngày hội gia đình Gia tộc An',
    event_date: '2026-11-08',
    location: 'Nhà sinh hoạt Gia tộc An (địa điểm giả)',
    content:
      'Chương trình minh họa: gặp mặt, chia sẻ chuyện gia đình và chụp ảnh lưu niệm.'
  },
  {
    id: id(601),
    name: 'Cùng cập nhật gia phả',
    event_date: '2026-10-25',
    location: 'Buổi gặp trực tuyến minh họa',
    content:
      'Đối chiếu thông tin các thế hệ, bổ sung ảnh và ghi lại ký ức gia đình.'
  }
]
export const articles = [
  {
    id: id(700),
    kind: 'article',
    title: 'Từ một mái nhà đến năm thế hệ',
    summary:
      'Một câu chuyện hư cấu về hành trình gìn giữ cội nguồn và kết nối con cháu Gia tộc An.',
    body: 'Đây là nội dung minh họa, không mô tả một gia đình có thật.\n\nGia phả bắt đầu từ những câu chuyện nhỏ: tên ông bà, ký ức tuổi thơ và lời dặn của người đi trước. Mỗi thế hệ góp một mảnh ghép để những kỷ niệm được truyền lại.\n\nBộ dữ liệu này minh họa hồ sơ năm thế hệ, quan hệ cha mẹ – con, nhánh bên ngoại và cách ghi khoảng năm khi chưa nhớ ngày sinh chính xác.',
    category: 'history',
    status: 'published',
    visibility: 'public',
    is_featured: true,
    publish_at: '2026-10-01T00:00:00Z'
  },
  {
    id: id(701),
    kind: 'announcement',
    title: 'Hẹn gặp trong ngày hội gia đình',
    summary:
      'Cùng gặp gỡ, xem lại ảnh xưa và bổ sung những câu chuyện còn thiếu trong gia phả.',
    body: 'Thông báo giả phục vụ giới thiệu tính năng. Không phải lời mời tới một sự kiện thật.',
    category: 'activities',
    status: 'published',
    visibility: 'public',
    is_featured: true,
    publish_at: '2026-10-01T00:00:00Z',
    event_start: '2026-11-08T02:00:00Z',
    event_end: '2026-11-08T08:00:00Z',
    location: 'Không gian sinh hoạt Gia tộc An (minh họa)'
  },
  {
    id: id(702),
    kind: 'album',
    title: 'Sắc màu quê nhà',
    summary:
      'Bộ tranh phong cảnh minh họa, dành cho bản demo; không chứa hình ảnh gia đình thật.',
    body: 'Các hình ảnh được dựng bằng SVG và chuyển sang WebP cho bộ demo.',
    category: 'family',
    status: 'published',
    visibility: 'public',
    is_featured: true,
    publish_at: '2026-10-02T00:00:00Z'
  },
  {
    id: id(703),
    kind: 'article',
    title: 'Những điều muốn lưu lại cho con cháu',
    summary: 'Bản nháp minh họa khu biên tập nội dung.',
    body: 'Gợi ý: ghi lại nghề truyền thống, món ăn gia đình và những kỷ niệm đáng nhớ.',
    category: 'family',
    status: 'draft',
    visibility: 'internal',
    is_featured: false,
    publish_at: null
  }
]
