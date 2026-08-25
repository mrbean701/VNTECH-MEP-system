Phần mềm quản lý quy trình mua hàng, kho vận và cấp phát vật tư cho các công ty MEP (Cơ điện).  
Tự động hóa – Minh bạch – Kiểm soát chi phí & tiến độ dự án

---

## 📌 Giới thiệu
Hệ thống giúp số hóa và tự động hóa toàn bộ quy trình từ yêu cầu vật tư tại công trường → phê duyệt → mua hàng → nhập kho → chuyển kho → cấp phát vật tư → hoàn trả, đảm bảo minh bạch, kiểm soát chi phí và tiến độ dự án.

---

## 🚀 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| 🖥️ Frontend | HTML, CSS, JavaScript (thuần) |
| ☕ Backend (dự kiến) | Spring Boot (Java) |
| 🗄️ Database (dự kiến) | MySQL |
| 💾 Lưu trữ demo | localStorage |
| 📊 Biểu đồ | Chart.js |
| 📤 Xuất Excel | SheetJS (XLSX) |
| 🎨 Icon | Font Awesome 6 |
| 🧩 Kiến trúc | Monolithic (RESTful API) |

---

## 📦 Các module chính

| Module | Mô tả |
|--------|-------|
| 📊 **Dashboard** | Thống kê tổng quan: dự án, NCC, vật tư, kho, MR, PR, PO, GRN, STO, Cấp phát, Hoàn trả, Cảnh báo tồn kho, Đơn hàng tự động. |
| 📋 **Dự án (Projects)** | CRUD dự án, xem chi tiết với 4 tab: Thông tin, PR, PO, Kho. Tự động tạo kho khi tạo dự án mới. Đổi trạng thái kho (ACTIVE ↔ INACTIVE). |
| 🏢 **Nhà cung cấp (Vendors)** | CRUD nhà cung cấp, xem chi tiết, kiểm tra ràng buộc khi xóa. |
| 📦 **Vật tư (Items)** | CRUD vật tư, tự động thêm vào inventory. Click vào mã/tên để xem chi tiết tồn kho theo từng kho. Kiểm tra ràng buộc khi xóa. |
| 📄 **MR (Material Request)** | Tạo yêu cầu vật tư, duyệt bởi Site Commander (1 bước). Hiển thị tiến độ dạng progress bar. |
| 📑 **PR (Purchase Request)** | Tạo từ MR hoặc thủ công, duyệt 3 bước (Planning → Project → CEO). Progress bar 3 bước. |
| 🛒 **PO (Purchase Order)** | Tạo từ PR hoặc thủ công, duyệt 3 bước (Planning → Project → CEO). Progress bar 3 bước. Tính tổng tiền tự động. |
| 🏚️ **Kho (Warehouse)** | Quản lý danh sách kho, tồn kho. Click vào mã/tên kho để xem chi tiết. Click vào dự án/vật tư để xem chi tiết liên quan. |
| 📥 **GRN (Nhập kho)** | Tạo phiếu nhập từ PO đã duyệt, tự động cập nhật tồn kho. Quy trình 4 bước: DRAFT → RECEIVED → QC_CHECKED → COMPLETED. Hỗ trợ sửa ở DRAFT (điều chỉnh số lượng, serial, tình trạng). Click vào PO, dự án, kho để xem chi tiết. |
| 📤 **STO (Chuyển kho)** | Tạo phiếu chuyển kho giữa các kho, quy trình 3 bước: Lập phiếu → Duyệt → Xuất kho. Hỗ trợ sửa ở DRAFT (điều chỉnh số lượng thực xuất, kiểm tra tồn kho). Ghi chú bị khóa khi hoàn thành. |
| 📤 **Cấp phát (Issue)** | Quản lý cấp phát vật tư cho đội thi công. Quy trình 4 bước: Tạo phiếu → Duyệt (Commander) → Cấp phát (Thủ kho chọn kho, điều chỉnh số lượng) → Xác nhận (Commander). Hiển thị tiến độ progress bar. |
| 🔄 **Hoàn trả (Material Return)** | Quản lý hoàn trả vật tư từ công trường về kho. Quy trình 3 bước: Tạo phiếu (Đội thi công) → Thủ kho nhận & chỉnh sửa → Chỉ huy trưởng xác nhận. Tự động cập nhật tồn kho. |
| 📊 **Cảnh báo tồn kho (Min Stock)** | Cấu hình ngưỡng tồn kho tối thiểu theo từng kho. Lọc theo kho và trạng thái (dưới ngưỡng, gần ngưỡng, an toàn). Hiển thị widget trên Dashboard. |
| 🤖 **Đặt hàng tự động (Auto Reorder)** | Bật/tắt, cấu hình hệ số nhân và nhà cung cấp mặc định. Tự động tạo PR khi vật tư dưới ngưỡng. Hiển thị trạng thái và số PR chờ duyệt trên Dashboard. |
| 👑 **Admin (Quản trị hệ thống)** | **5 tab quản trị toàn diện:** <br> - **Người dùng**: Thêm/sửa/xóa user, gán phòng ban, chức danh. <br> - **Phòng ban**: Thêm/sửa/xóa phòng ban, gán trưởng phòng, quản lý thành viên. <br> - **Workflow**: Cấu hình luồng duyệt cho từng module (MR, PR, PO, GRN, STO, Issue, Material Return). <br> - **Phân quyền role**: Bảng matrix cấp quyền theo role, toggle theo module, hiển thị số lượng quyền đã chọn. <br> - **Phân quyền user**: Phân quyền riêng cho từng user, giao diện box/module, ưu tiên hơn quyền role. |

---

## 🔄 Luồng nghiệp vụ chính

```text
[Site Staff] → MR → [Site Commander] → PR → [Planning] → [Project] → [CEO] → PO → [Planning] → [Project] → [CEO] → GRN → STO → Issue → Material Return
Bước	Mô tả
MR	Yêu cầu vật tư tại công trường
Duyệt MR	Chỉ huy trưởng phê duyệt
PR	Yêu cầu mua hàng (tạo từ MR hoặc thủ công)
Duyệt PR	3 bước: Kế hoạch → Dự án → TGD
PO	Đơn đặt hàng (tạo từ PR hoặc thủ công)
Duyệt PO	3 bước: Kế hoạch → Dự án → TGD
GRN	Nhập kho từ PO đã duyệt (4 bước: DRAFT → RECEIVED → QC_CHECKED → COMPLETED)
STO	Chuyển kho (3 bước: Lập → Duyệt → Xuất)
Issue	Cấp phát vật tư cho đội thi công (4 bước: Tạo → Duyệt → Cấp phát → Xác nhận)
Material Return	Hoàn trả vật tư thừa về kho (3 bước: Tạo → Thủ kho nhận → Xác nhận)
🧑‍💻 Tài khoản mẫu
Email	Mật khẩu	Vai trò	Phòng ban	Quyền hạn chính
admin@mep.com	password	👑 Admin	Ban Giám đốc	Toàn quyền, quản trị hệ thống
ceo@mep.com	password	🏢 CEO	Ban Giám đốc	Duyệt PR/PO step 3
planning@mep.com	password	📋 PLANNING	Phòng Kế hoạch	Duyệt PR/PO step 1
project@mep.com	password	📐 PROJECT	Phòng Dự án	Duyệt PR/PO step 2
purchasing@mep.com	password	🛒 PURCHASING	Phòng Mua hàng	Tạo PR, PO, GRN, STO
commander@mep.com	password	🎖️ SITE_COMMANDER	Ban Chỉ huy công trường	Duyệt MR, cấp phát, hoàn trả
qc@mep.com	password	🔬 QC	Phòng QC	Kiểm tra chất lượng GRN
Ngoài ra còn có các user mở rộng: planning1, planning2, project1, project2, purchasing1, purchasing2, commander1, site1, site2, qc1, qc2, staff1, staff2 (mật khẩu: password).

🛠️ Hướng dẫn cài đặt và chạy
Yêu cầu
✅ Trình duyệt hiện đại (Chrome, Edge, Firefox)

✅ VS Code (khuyến nghị) với extension Live Server

✅ Hoặc Node.js (để chạy http-server)

Cách 1: Dùng Live Server (VS Code)
Mở thư mục dự án trong VS Code.

Click chuột phải vào index.html → Chọn Open with Live Server.

Hệ thống sẽ tự động mở tại http://127.0.0.1:5500.

Cách 2: Dùng http-server (Node.js)
bash
npm install -g http-server
http-server -p 8080 -a 0.0.0.0
# Truy cập tại http://localhost:8080
📁 Cấu trúc thư mục
text
FRONTEND/
├── index.html              # 🏠 File chính
├── README.md               # 📖 Hướng dẫn dự án
├── css/
│   └── style.css           # 🎨 CSS toàn bộ
└── js/
    ├── api.js              # 🌐 Tầng truy xuất dữ liệu
    ├── app.js              # ⚙️ Khởi tạo, menu, router
    ├── auth.js             # 🔐 Đăng nhập, session, logout
    ├── data.js             # 💾 Data layer + mock data
    ├── utils.js            # 🧰 Hàm tiện ích
    ├── render-helpers.js   # 🧩 Hàm render dùng chung
    ├── toast.js            # 🔔 Thông báo toast
    ├── loading.js          # ⏳ Hiệu ứng loading
    ├── dashboard.js        # 📊 Dashboard
    ├── projects.js         # 📋 Quản lý Dự án
    ├── vendors.js          # 🏢 Quản lý Nhà cung cấp
    ├── items.js            # 📦 Quản lý Vật tư
    ├── mr.js               # 📄 Material Request
    ├── pr.js               # 📑 Purchase Request
    ├── po.js               # 🛒 Purchase Order
    ├── inventory.js        # 🏚️ Kho & Tồn kho (tab)
    ├── warehouse.js        # 📥 GRN & STO (FULL)
    ├── issue.js            # 📤 Cấp phát vật tư
    ├── material-return.js  # 🔄 Hoàn trả vật tư
    ├── min-stock.js        # 📊 Cảnh báo tồn kho tối thiểu
    ├── auto-reorder.js     # 🤖 Đặt hàng tự động
    ├── admin.js            # 👑 Quản trị hệ thống
    └── export.js           # 📤 Xuất dữ liệu Excel



🔄 Lịch sử phiên bản
Ngày	                Phiên bản	Nội dung
19/08/2025	                1.0.0	🏗️ Khởi tạo dự án, xây dựng kiến trúc cơ bản và các module cốt lõi: MR, PR, PO, Kho.
19/08/2025	                2.0.0	🚀 Hoàn thiện các module: Dashboard, Dự án, Nhà cung cấp, Vật tư; tích hợp GRN, STO; giao diện demo với localStorage.
20/08/2025	                2.0.1	📂 Tách file thành các module riêng, thêm module GRN và STO.
20/08/2025	                2.0.2	👁️ Bổ sung chức năng xem PR và PO theo dự án trong modal chi tiết dự án.
20/08/2025	                2.0.3	📊 Tách riêng bảng PR và PO trong chi tiết dự án.
20/08/2025	                2.0.4	🗂️ Tách PR và PO thành 2 tab riêng, xem chi tiết inline.
20/08/2025	                2.0.5	🖱️ Thêm chức năng click vào mã hoặc tên dự án để mở chi tiết.
20/08/2025	                2.0.6	🔗 MR/PR/PO: click mã → chi tiết, click tên dự án → chi tiết dự án.
20/08/2025	                2.0.7	🎯 Cập nhật chi tiết dự án: 2 tab PR/PO, xem inline, progress bar.
20/08/2025	                2.0.8	🏚️ Kho: click vật tư → chi tiết. GRN/STO: click liên kết đến PO, dự án, kho.
20/08/2025	                2.0.9	📈 MR/PR/PO: hiển thị thanh tiến độ khi hoàn thành. STO: hiển thị tiến độ 3 bước, khóa ghi chú khi hoàn thành.
20/08/2025	                2.0.10	🏗️ Chi tiết dự án: thêm tab Kho, đổi trạng thái kho, click tên kho xem chi tiết.
20/08/2025	                2.0.11	🐛 Sửa lỗi click vào kho, nút "Chi tiết kho" và "Đổi trạng thái kho" hoạt động.
20/08/2025	                2.0.12	🐛 Sửa lỗi click vào kho, điều chỉnh thứ tự load script.
20/08/2025	                2.0.13	🎨 Tối ưu progress bar, sửa lỗi MR hiển thị 1 bước.
20/08/2025	                2.0.14	✨ Hoàn thiện chức năng sửa GRN và STO: sửa ở DRAFT, điều chỉnh số lượng, serial, tình trạng, kiểm tra tồn kho.
21/08/2025	                2.0.15	📤 Thêm module Cấp phát (Issue) với quy trình 4 bước, chọn kho xuất, điều chỉnh số lượng.
21/08/2025	                2.0.16	🔄 Thêm module Hoàn trả (Material Return) với quy trình 3 bước, cập nhật tồn kho.
21/08/2025	                2.0.17	📊 Thêm module Cảnh báo tồn kho tối thiểu (theo kho), lọc theo trạng thái, widget Dashboard.
21/08/2025	                2.0.18	🤖 Thêm module Đặt hàng tự động (Auto Reorder), cấu hình theo kho, hiển thị trạng thái trên Dashboard.
21/08/2025	                2.0.19	🎨 Cập nhật Dashboard: thêm widget Cấp phát & Hoàn trả, hiển thị trạng thái Auto Reorder.
21/08/2025	                2.0.20	📄 Cập nhật toàn bộ tài liệu: README, SRS, UX/UI, Use Case phản ánh đúng phiên bản hiện tại.
25/08/2025	                2.0.21	👑 Thêm module Admin với 5 tab quản trị: Người dùng, Phòng ban, Workflow, Phân quyền role, Phân quyền user.
🔐 Hệ thống phân quyền 2 cấp: Role-based + User-based (ưu tiên cao hơn).
📊 Phân quyền user giao diện box/module, cho phép gán quyền riêng cho từng user.
🏢 Quản lý phòng ban với trưởng phòng và danh sách thành viên.
⚙️ Cấu hình workflow linh hoạt cho từng module.
📱 Responsive toàn diện cho tất cả bảng biểu và modal.
🐛 Sửa nhiều lỗi nhỏ, cải thiện UX/UI.

📝 Ghi chú
Hệ thống hiện đang chạy trên localStorage, dữ liệu sẽ mất khi xóa cache trình duyệt.

Để chuyển sang backend thật, cần thay thế các hàm getData/saveData trong api.js bằng các lời gọi API RESTful.

Dự án đã được tách thành các module riêng biệt, sẵn sàng cho việc mở rộng và bảo trì.

Mọi đóng góp và phản hồi đều được hoan nghênh. 💬

📄 Tài liệu liên quan
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)

Thiết kế Giao diện (UX/UI)

Sơ đồ Use Case

© 2025 MEP System. All rights reserved.

Tổng số dòng code: ~12,500 dòng