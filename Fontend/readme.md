🏗️ MEP Purchasing & Warehouse Management System
Phiên bản 2.0.27

Phần mềm quản lý quy trình mua hàng, kho vận và cấp phát vật tư cho các công ty MEP (Cơ điện).
Tự động hóa – Minh bạch – Kiểm soát chi phí & tiến độ dự án

---

## 📌 Giới thiệu

Hệ thống giúp số hóa và tự động hóa toàn bộ quy trình từ yêu cầu vật tư tại công trường → phê duyệt → mua hàng → nhập kho → chuyển kho → cấp phát vật tư → hoàn trả, đảm bảo minh bạch, kiểm soát chi phí và tiến độ dự án.

### 🚀 Điểm nổi bật (phiên bản 2.0.27)

- 👤 **Quản lý chức vụ & gán quyền tự động**: Khi tạo/sửa user, nếu chọn chức vụ đặc biệt (Trưởng phòng, Giám đốc, ...), admin có thể chọn checkbox "Gán toàn bộ quyền phòng ban" để tự động cấp tất cả quyền của phòng ban đó cho user. Hỗ trợ danh sách chức vụ đặc biệt có thể mở rộng.
- 📊 **Mở rộng quản lý trạng thái (Status)**: Hỗ trợ thêm các entity type mới: `user`, `department`, `vendor`, `project`, `warehouse`, `workflow`. Thêm trường `group` để nhóm các trạng thái (VD: order, warehouse, user). Hiển thị trạng thái theo nhóm trong giao diện Admin, lọc và quản lý dễ dàng hơn.
- 🎨 **Màu sắc trạng thái**: Hiển thị màu sắc trực quan cho từng trạng thái (đã có trường `color` từ trước).

### 🚀 Điểm nổi bật (phiên bản 2.0.26)

- 🔄 **Workflow động & đa mẫu nâng cao**: Quản trị viên có thể tạo, chỉnh sửa, sao chép, kích hoạt nhiều mẫu quy trình duyệt cho từng module (MR, PR, PO, GRN, STO, Issue, MaterialReturn) mà không cần sửa code. Mỗi bước workflow có thể gán **permissionKey** (thay vì role cứng) và **statusCode** tùy chỉnh, cho phép bất kỳ user nào có quyền tương ứng đều có thể duyệt, không bị khóa cứng vào một role hay một người cụ thể.
- 👥 **Phân quyền linh hoạt theo phòng ban + user**: Bỏ phân quyền theo role cứng, chuyển sang phân quyền theo phòng ban (module-action: `mr.view`, `pr.create`, ...). User có thể được gán quyền riêng (ưu tiên hơn phòng ban) và quyền sẽ tự động thay đổi theo phòng ban khi user được chuyển đi.
- 🏢 **Quản lý phòng ban & sub-department**: Hỗ trợ tạo phòng ban con (sub-department/team) với cấu trúc phân cấp, mỗi phòng ban có thể có trưởng phòng, danh sách thành viên, và số lượng quyền được hiển thị trực quan. Khi click vào số quyền sẽ chuyển nhanh đến tab phân quyền phòng ban.
- 👤 **Quản lý người dùng nâng cao**: Chức vụ (position) được chọn từ dropdown thay vì nhập tay, với tab riêng để quản lý danh sách chức vụ (CRUD). Người dùng có thể tự cập nhật hồ sơ cá nhân với các trường: địa chỉ, số điện thoại, trình độ học vấn.
- 📊 **Quản lý cảnh báo tồn kho thông minh**: Cấu hình ngưỡng tồn kho tối thiểu, số lượng an toàn và phần trăm cảnh báo theo từng kho. Hiển thị trạng thái UNDER / WARNING / SAFE dựa trên tỷ lệ tồn kho so với số lượng an toàn.
- 🤖 **Đặt hàng tự động nâng cao**: Hỗ trợ đặt hàng theo ngưỡng tồn kho hoặc theo lịch hẹn giờ (cron / ngày cụ thể). Khi tạo đơn tự động, ghi chú sẽ tự động thêm tên người cấu hình và nội dung ghi chú tùy chỉnh. Đơn hàng được tạo ở trạng thái DRAFT và có thể được duyệt bởi chỉ huy trưởng hoặc phòng mua hàng.
- 📜 **Audit Log (Nhật ký hoạt động)**: Ghi lại toàn bộ hành động của người dùng (tạo, sửa, xóa, duyệt, từ chối, đăng nhập) kèm thời gian, IP, UserAgent. Admin có thể xem lọc theo thời gian và tác vụ.
- 📄 **Phân trang toàn diện**: Tất cả các module danh sách đều hỗ trợ phân trang với tùy chọn số dòng hiển thị (10, 20, 30, 50) và ẩn khi dữ liệu ít hơn số dòng tối thiểu.

---

## 🚀 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| 🖥️ Frontend | HTML, CSS, JavaScript (thuần) |
| ☕ Backend | Spring Boot 3.2.5 (Java 17) với JWT, Spring Security, JPA/Hibernate |
| 🗄️ Database | MySQL 8.0+ |
| 📊 Biểu đồ | Chart.js |
| 📤 Xuất Excel | SheetJS (XLSX) |
| 🎨 Icon | Font Awesome 6 |
| 📄 API Documentation | Swagger/OpenAPI 3 |
| 🔐 Bảo mật | JWT + BCrypt |
| 📝 Audit Log | Spring AOP |
| 🧩 Kiến trúc | Monolithic (RESTful API) |

---

## 📦 Các module chính

| Module | Mô tả |
|--------|-------|
| 📊 **Dashboard** | Thống kê tổng quan: dự án, NCC, vật tư, kho, MR, PR, PO, GRN, STO, Cấp phát, Hoàn trả, Cảnh báo tồn kho, Đơn hàng tự động. Hiển thị biểu đồ và widget tương tác, click vào widget để chuyển nhanh đến module chi tiết. |
| 📋 **Dự án (Projects)** | CRUD dự án, xem chi tiết với 4 tab: Thông tin, PR, PO, Kho. Tự động tạo kho khi tạo dự án mới. |
| 🏢 **Nhà cung cấp (Vendors)** | CRUD nhà cung cấp, xem chi tiết, kiểm tra ràng buộc khi xóa. |
| 📦 **Vật tư (Items)** | CRUD vật tư, tự động thêm vào inventory khi tạo. Xem chi tiết tồn kho theo từng kho. |
| 📄 **MR (Material Request)** | Tạo yêu cầu vật tư, duyệt theo workflow động (có thể cấu hình số bước). Hỗ trợ nhiều bước duyệt với quyền linh hoạt. |
| 📑 **PR (Purchase Request)** | Tạo từ MR hoặc thủ công. Duyệt theo workflow động (mặc định 3 bước: Planning → Project → CEO). |
| 🛒 **PO (Purchase Order)** | Tạo từ PR hoặc thủ công. Duyệt theo workflow động (mặc định 3 bước: Planning → Project → CEO). |
| 🏚️ **Kho (Warehouse)** | Quản lý danh sách kho, tồn kho. Xem chi tiết kho, vật tư, dự án liên quan. |
| 📥 **GRN (Nhập kho)** | Tạo phiếu nhập từ PO đã duyệt. Quy trình 4 bước: DRAFT → RECEIVED → QC_CHECKED → COMPLETED. |
| 📤 **STO (Chuyển kho)** | Tạo phiếu chuyển kho. Quy trình 3 bước: Lập phiếu → Duyệt → Xuất kho. |
| 📤 **Cấp phát (Issue)** | Quản lý cấp phát vật tư cho đội thi công. Quy trình 4 bước: Tạo phiếu → Duyệt → Cấp phát → Xác nhận. |
| 🔄 **Hoàn trả (Material Return)** | Quản lý hoàn trả vật tư từ công trường về kho. Quy trình 3 bước: Tạo phiếu → Thủ kho nhận → Xác nhận. |
| 📊 **Cảnh báo tồn kho (Min Stock)** | Cấu hình ngưỡng tồn kho tối thiểu, số lượng an toàn và phần trăm cảnh báo theo từng kho. Lọc theo trạng thái. Widget trên Dashboard. |
| 🤖 **Đặt hàng tự động (Auto Reorder)** | Bật/tắt, cấu hình hệ số nhân, nhà cung cấp, lịch hẹn giờ. Tự động tạo MR/PR khi vật tư dưới ngưỡng hoặc theo lịch. Quản lý quy tắc nâng cao. |
| 👑 **Admin (Quản trị hệ thống)** | 8 tab: Người dùng, Phòng ban, Chức vụ, Workflow (đa mẫu), Trạng thái, Phân quyền phòng ban, Phân quyền user, Nhật ký. Quản lý toàn diện hệ thống. |
| 📤 **Xuất Excel** | Hỗ trợ xuất tất cả danh sách dữ liệu với định dạng .xlsx. |
| 🔐 **Phân quyền 2 cấp** | Phòng ban + User (ưu tiên user). Khi user chuyển phòng ban, quyền phòng ban tự động thay đổi, quyền riêng được giữ nguyên. |
| 📝 **Audit Log** | Ghi lại toàn bộ hoạt động thay đổi dữ liệu (CREATE, UPDATE, DELETE, SUBMIT, APPROVE, REJECT, LOGIN) kèm IP, UserAgent. |

---

## 🔄 Luồng nghiệp vụ chính (với workflow động)
[Site Staff] → MR → [Workflow MR] → PR → [Workflow PR] → PO → [Workflow PO] → GRN → STO → Issue → Material Return


**Workflow động cho phép:**

- Thay đổi số lượng bước duyệt (ví dụ: MR có thể có 1, 2 hoặc nhiều bước).
- Thay đổi thứ tự duyệt.
- Thay đổi **permissionKey** được phép duyệt ở mỗi bước (thay vì role cứng) – bất kỳ user nào có quyền đó đều có thể duyệt.
- Thay đổi phòng ban được phép duyệt (nếu cần).
- Gán trạng thái (statusCode) tùy chỉnh cho từng bước (ví dụ: PENDING_PROJECT, PENDING_CEO).
- Tạo nhiều mẫu workflow khác nhau và lựa chọn áp dụng.

**Ví dụ cấu trúc steps (JSON) với permissionKey:**

```json
[
  {"step": 1, "permissionKey": "pr.approve", "label": "Kế hoạch duyệt", "departmentId": 2, "statusCode": "PENDING_PROJECT"},
  {"step": 2, "permissionKey": "pr.approve", "label": "Dự án duyệt", "departmentId": 3, "statusCode": "PENDING_CEO"},
  {"step": 3, "permissionKey": "pr.approve", "label": "CEO duyệt", "departmentId": 1, "statusCode": "APPROVED"}
]
👥 Tài khoản mẫu
Mặc định (tự động tạo khi chạy lần đầu qua DataInitializer):

Email Mật khẩu Vai trò Phòng ban Quyền hạn chính
admin@mep.com password 👑 Admin Ban Giám đốc Toàn quyền, quản trị hệ thống
(Các tài khoản khác cần được tạo thủ công qua giao diện Admin → Người dùng)

🛠️ Hướng dẫn cài đặt

Cài đặt Database

-- Chạy file mep_db.sql trong MySQL
mysql -u root -p < mep_db.sql

Lưu ý: File mep_db.sql đã được cập nhật để hỗ trợ workflow đa mẫu, phân quyền phòng ban, bảng statuses, và các trường mới như safe_quantity, alert_percent, address, phone, education, schedule, note, created_by, group.

Cấu hình Backend (Spring Boot)
Tạo file src/main/resources/application.properties:

Server
server.port=8080

Database
spring.datasource.url=jdbc:mysql://localhost:3306/mep_db?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

JWT
jwt.secret=your_super_secret_key_for_jwt_token_at_least_32_characters
jwt.expiration=86400000 # 24 hours in milliseconds

Logging
logging.level.com.mep.mepbackend=DEBUG

Chạy Backend

./mvnw spring-boot:run

hoặc
mvn spring-boot:run

Lưu ý: Khi chạy lần đầu, DataInitializer sẽ tự động kiểm tra và tạo tài khoản admin nếu chưa tồn tại, với mật khẩu password. Nếu đã có user admin, nó sẽ bỏ qua.

Chạy Frontend
Mở thư mục frontend trong VS Code và dùng Live Server (hoặc http-server) để chạy index.html.

Kiểm tra API
Truy cập Swagger: http://localhost:8080/swagger-ui/index.html

🗂️ Cấu trúc thư mục (Tóm tắt)
Frontend

FRONTEND/
├── index.html
├── css/
│ └── style.css
└── js/
├── admin/
│ ├── admin-core.js # Quản lý tab, render chính
│ ├── admin-helpers.js # Hàm dùng chung
│ ├── admin-users.js # Quản lý người dùng (có chọn chức vụ dropdown, các trường mới)
│ ├── admin-departments.js # Quản lý phòng ban (sub-department, xem chi tiết)
│ ├── admin-positions.js # Quản lý chức vụ (CRUD)
│ ├── admin-statuses.js # Quản lý trạng thái (statuses)
│ ├── admin-workflows.js # Quản lý workflow (đa mẫu, step-status, permissionKey)
│ ├── admin-department-permissions.js # Phân quyền phòng ban (module-action)
│ ├── admin-user-permissions.js # Phân quyền user (ghi đè phòng ban)
│ └── admin-audit.js # Nhật ký hoạt động
├── api.js # Gọi REST API + fallback localStorage
├── auth.js # Session + phân quyền (ưu tiên user, bỏ role cứng)
├── data.js # LocalStorage helpers (không tạo mẫu)
├── utils.js # Hàm tiện ích (có renderApprovalProgress cập nhật)
├── app.js # Điều hướng menu
├── dashboard.js # Dashboard
├── projects.js # Dự án
├── vendors.js # Nhà cung cấp
├── items.js # Vật tư
├── mr.js # Material Request (hỗ trợ workflow động)
├── pr.js # Purchase Request (hỗ trợ workflow động)
├── po.js # Purchase Order (hỗ trợ workflow động)
├── warehouse.js # Kho + GRN + STO
├── issue.js # Cấp phát
├── material-return.js # Hoàn trả
├── min-stock.js # Cảnh báo tồn kho (có safe_quantity, alert_percent)
├── auto-reorder.js # Đặt hàng tự động (có lịch hẹn, ghi chú)
├── export.js # Xuất Excel
├── toast.js # Thông báo
└── loading.js # Loading overlay

Backend (Spring Boot)

BACKEND/
└── src/main/java/com/mep/mepbackend/
├── aspect/ # LoggingAspect (Audit Log)
├── config/ # JWT, Security, CORS, OpenAPI
├── controller/ # REST Controllers
├── dto/ # Data Transfer Objects
├── entity/ # JPA Entities (có trường mới)
├── exception/ # Global Exception Handler
├── repository/ # JPA Repositories
├── service/ # Business Logic (hỗ trợ workflow động, permissionKey)
└── util/ # DataInitializer (tạo admin tự động), CurrentUserUtil (hasPermissionAndDepartment)

🎯 Tính năng mới chi tiết (so với phiên bản 2.0.26)

1. Quản lý chức vụ & gán quyền tự động
Quản lý chức vụ: Tab riêng trong Admin để CRUD chức vụ (Position).

Gán quyền tự động: Khi tạo/sửa user, nếu chọn chức vụ đặc biệt (Trưởng phòng, Giám đốc, ...), admin có thể chọn checkbox "Gán toàn bộ quyền phòng ban" để tự động cấp tất cả quyền của phòng ban đó cho user.

Danh sách chức vụ đặc biệt: Được cấu hình trong admin-helpers.js và có thể mở rộng.

Cơ chế: Khi checkbox được chọn, hệ thống xóa tất cả user_permissions cũ và gán lại tất cả permission_key của phòng ban đó cho user.

2. Mở rộng quản lý trạng thái (Status)
Entity type mới: Hỗ trợ thêm user, department, vendor, project, warehouse, workflow ngoài các entity type đã có (mr, pr, po, grn, sto, issue, materialreturn).

Nhóm trạng thái (group): Thêm trường group để nhóm các trạng thái (VD: order, warehouse, user, department, vendor, project, workflow).

Hiển thị theo nhóm: Giao diện Admin hiển thị trạng thái theo nhóm giúp dễ dàng quản lý.

Màu sắc: Hiển thị màu sắc trực quan (đã có từ trước).

🔧 API Endpoints mới (bổ sung so với phiên bản 2.0.26)
Workflow & Step-Status
Method	Endpoint	Mô tả
GET	/api/workflows/module/{module}/steps-with-status	Lấy danh sách bước kèm status code và permissionKey
GET	/api/workflows/module/{module}/step/{step}/status	Lấy status code của bước
POST	/api/workflows/with-statuses	Tạo workflow + step-status mappings
PUT	/api/workflows/{id}/with-statuses	Cập nhật workflow + mappings
Department Permissions
Method	Endpoint	Mô tả
GET	/api/permissions/department/{departmentId}	Lấy quyền của phòng ban
POST	/api/permissions/department/{departmentId}/assign	Gán quyền cho phòng ban
DELETE	/api/permissions/department/{departmentId}/remove	Xóa quyền của phòng ban
Statuses (Trạng thái)
Method	Endpoint	Mô tả
GET	/api/statuses/entity/{entityType}	Lấy danh sách status theo entity type
POST	/api/statuses	Tạo mới status
PUT	/api/statuses/{id}	Cập nhật status
DELETE	/api/statuses/{id}	Xóa status
Auto Reorder (Đặt hàng tự động)
Method	Endpoint	Mô tả
POST	/api/auto-reorder/rules/{id}/schedule	Lên lịch (schedule) và ghi chú cho một rule
POST	/api/auto-reorder/trigger/{ruleId}	Kích hoạt tạo MR/PR từ rule đã cấu hình
User Profile (Hồ sơ cá nhân)
Method	Endpoint	Mô tả
PATCH	/api/users/{id}/profile	Cập nhật hồ sơ cá nhân (name, address, phone, education)
🔄 Lịch sử phiên bản
Ngày Phiên bản Nội dung
19/08/2025 1.0.0 🏗️ Khởi tạo dự án, xây dựng kiến trúc cơ bản và các module cốt lõi: MR, PR, PO, Kho.
19/08/2025 2.0.0 🚀 Hoàn thiện các module: Dashboard, Dự án, Nhà cung cấp, Vật tư; tích hợp GRN, STO; giao diện demo với localStorage.
20/08/2025 2.0.1 📂 Tách file thành các module riêng, thêm module GRN và STO.
20/08/2025 2.0.2 👁️ Bổ sung chức năng xem PR và PO theo dự án trong modal chi tiết dự án.
20/08/2025 2.0.3 📊 Tách riêng bảng PR và PO trong chi tiết dự án.
20/08/2025 2.0.4 🗂️ Tách PR và PO thành 2 tab riêng, xem chi tiết inline.
20/08/2025 2.0.5 🖱️ Thêm chức năng click vào mã hoặc tên dự án để mở chi tiết.
20/08/2025 2.0.6 🔗 MR/PR/PO: click mã → chi tiết, click tên dự án → chi tiết dự án.
20/08/2025 2.0.7 🎯 Cập nhật chi tiết dự án: 2 tab PR/PO, xem inline, progress bar.
20/08/2025 2.0.8 🏚️ Kho: click vật tư → chi tiết. GRN/STO: click liên kết đến PO, dự án, kho.
20/08/2025 2.0.9 📈 MR/PR/PO: hiển thị thanh tiến độ khi hoàn thành. STO: hiển thị tiến độ 3 bước, khóa ghi chú khi hoàn thành.
20/08/2025 2.0.10 🏗️ Chi tiết dự án: thêm tab Kho, đổi trạng thái kho, click tên kho xem chi tiết.
20/08/2025 2.0.11 🐛 Sửa lỗi click vào kho, nút "Chi tiết kho" và "Đổi trạng thái kho" hoạt động.
20/08/2025 2.0.12 🐛 Sửa lỗi click vào kho, điều chỉnh thứ tự load script.
20/08/2025 2.0.13 🎨 Tối ưu progress bar, sửa lỗi MR hiển thị 1 bước.
20/08/2025 2.0.14 ✨ Hoàn thiện chức năng sửa GRN và STO: sửa ở DRAFT, điều chỉnh số lượng, serial, tình trạng, kiểm tra tồn kho.
21/08/2025 2.0.15 📤 Thêm module Cấp phát (Issue) với quy trình 4 bước, chọn kho xuất, điều chỉnh số lượng.
21/08/2025 2.0.16 🔄 Thêm module Hoàn trả (Material Return) với quy trình 3 bước, cập nhật tồn kho.
21/08/2025 2.0.17 📊 Thêm module Cảnh báo tồn kho tối thiểu (theo kho), lọc theo trạng thái, widget Dashboard.
21/08/2025 2.0.18 🤖 Thêm module Đặt hàng tự động (Auto Reorder), cấu hình theo kho, hiển thị trạng thái trên Dashboard.
21/08/2025 2.0.19 🎨 Cập nhật Dashboard: thêm widget Cấp phát & Hoàn trả, hiển thị trạng thái Auto Reorder.
21/08/2025 2.0.20 📄 Cập nhật toàn bộ tài liệu: README, SRS, UX/UI, Use Case phản ánh đúng phiên bản hiện tại.
25/08/2025 2.0.21 👑 Thêm module Admin với 5 tab quản trị: Người dùng, Phòng ban, Workflow, Phân quyền role, Phân quyền user.
26/08/2025 2.0.22 🚀 Hoàn thiện Backend Spring Boot với JWT, MySQL, Audit Log, toàn bộ Service/Repository/Controller. Cập nhật README đầy đủ.
26/08/2025 2.0.23 🚀 Nâng cấp workflow động + đa mẫu; phân quyền user ưu tiên role; Giao diện Admin quản lý workflow và user permissions.
27/08/2025 2.0.24 🔐 Cập nhật lớn: Bỏ phân quyền role, chuyển sang phân quyền phòng ban (module-action). Thêm bảng statuses và workflow_step_status; workflow có thể gán status. Tách Admin UI thành 8 module, thêm tìm kiếm, copy quyền, số đếm tự động. Xóa fallback cứng trong auth.js, chỉ dùng dữ liệu từ DB.
28/08/2025 2.0.25 🛠️ Sửa lỗi duyệt workflow: mở rộng pendingStatuses để bao gồm PLANNING_APPROVED, PROJECT_APPROVED. Cập nhật renderApprovalProgress hiển thị đúng bước hiện tại. Thêm hasPermissionAndDepartment vào CurrentUserUtil.
29/08/2025 2.0.26 🚀 Hoàn thiện các tính năng nâng cao: Cảnh báo tồn kho với safe_quantity và alert_percent; Đặt hàng tự động với lịch hẹn giờ và ghi chú; Admin quản lý chức vụ (position) dropdown và sub-department; Audit Log tích hợp; Phân trang toàn diện; Cập nhật giao diện user profile với address, phone, education.
29/08/2025 2.0.27 👤 Mở rộng quản lý chức vụ & gán quyền tự động: Thêm checkbox "Gán toàn bộ quyền phòng ban" khi tạo/sửa user với chức vụ đặc biệt (Trưởng phòng, Giám đốc,...). Mở rộng quản lý trạng thái (Status): Thêm entity type mới (user, department, vendor, project, warehouse, workflow) và trường group để nhóm trạng thái; hiển thị theo nhóm trong Admin.
📊 Đánh giá tổng quan dự án
✅ Điểm mạnh
Kiến trúc module hóa tốt – Các chức năng được tách riêng thành từng file JS rõ ràng (mr.js, pr.js, po.js, warehouse.js, …), dễ bảo trì và mở rộng.

Phân quyền chi tiết & linh hoạt – Hỗ trợ phân quyền theo phòng ban và theo user, với giao diện quản trị trực quan. Quyền user ưu tiên hơn quyền phòng ban. Khi user chuyển phòng ban, quyền phòng ban tự động thay đổi.

Workflow động thực sự – Không fix cứng role hay người duyệt, dùng permissionKey để bất kỳ user có quyền đều có thể duyệt. Số bước và thứ tự có thể tùy chỉnh.

Quy trình nghiệp vụ đầy đủ – Bao gồm MR → PR → PO → GRN → STO → Issue → Material Return, mỗi bước đều có luồng duyệt và trạng thái rõ ràng.

Giao diện responsive – Hoạt động tốt trên cả desktop và mobile, với sidebar thu gọn và overlay cho mobile.

Tích hợp sẵn các tiện ích – Xuất Excel (SheetJS), biểu đồ (Chart.js), toast notification, loading overlay, in phiếu (đang phát triển).

Hỗ trợ quản trị toàn diện – Admin có thể cấu hình workflow, phân quyền chi tiết, quản lý người dùng, phòng ban, chức vụ, trạng thái, và xem nhật ký hoạt động.

Audit Log chi tiết – Ghi lại toàn bộ hoạt động thay đổi dữ liệu, phục vụ kiểm tra và đối chiếu.

⚠️ Điểm cần cải thiện và kế hoạch phát triển
Backend & Database: Hiện tại dữ liệu lưu trên MySQL với JPA/Hibernate, đã triển khai đầy đủ, nhưng có thể tối ưu thêm chỉ mục và truy vấn.

Bảo mật: Đã sử dụng JWT + BCrypt. Cần thêm cơ chế refresh token và giới hạn số lần đăng nhập sai.

Tối ưu hiệu suất: Một số module render lại toàn bộ table khi có thay đổi nhỏ, có thể cải thiện bằng cách chỉ cập nhật phần thay đổi hoặc sử dụng Virtual DOM (nếu migrate sang React/Vue).

Tính năng bổ sung: Thông báo real-time (WebSocket), tìm kiếm nâng cao (filter nhiều trường), báo cáo thống kê chi tiết (biểu đồ tổng hợp theo tháng/quý), xuất báo cáo PDF.

Hoàn thiện các chức năng còn dang dở: In phiếu (GRN, STO, Issue, Material Return), gắn sự kiện cho các hàm export trong export.js (một số chưa được gọi), hỗ trợ import dữ liệu từ Excel.

Tích hợp với hệ thống kế toán: Đồng bộ dữ liệu với phần mềm kế toán để quản lý tài chính.

📝 Ghi chú
Hệ thống đã được chuyển sang sử dụng MySQL và Spring Boot backend hoàn chỉnh với JWT, không còn phụ thuộc vào localStorage cho dữ liệu nghiệp vụ.

Dữ liệu được lưu trữ và quản lý tập trung trên database, đảm bảo an toàn và nhất quán.

Dự án đã được tách thành các module riêng biệt, sẵn sàng cho việc mở rộng và bảo trì.

Mọi đóng góp và phản hồi đều được hoan nghênh. 💬

📄 Tài liệu liên quan
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)

Thiết kế Giao diện (UX/UI)

Sơ đồ Use Case

© 2026 MEP System. All rights reserved.
Tổng số dòng code hiện tại: ~15,500+ dòng (JS + CSS + HTML + Java)


📋 Tóm tắt công việc ngày 29/08/2025 (Phiên bản 2.0.27)
✅ Đã triển khai
Phần II: Chức vụ (Position) – Gán quyền tự động

Thêm flag grantAllDeptPermissions vào UserDTO và User entity (backend)

Thêm method grantAllDepartmentPermissionsToUser() vào PermissionService

Sửa UserService để xử lý flag khi tạo/sửa user

Thêm checkbox "Gán toàn bộ quyền phòng ban" trong form thêm/sửa user (frontend)

Checkbox chỉ hiển thị khi chọn chức vụ đặc biệt (Trưởng phòng, Giám đốc, ...)

Thêm danh sách chức vụ đặc biệt vào admin-helpers.js

Sửa admin-users.js để tích hợp checkbox và gửi flag lên API

Phần III: Trạng thái (Status) – Mở rộng entity type, nhóm, màu sắc

Thêm trường group vào entity Status (backend)

Thêm method findByEntityTypeAndGroupOrderBySortOrderAsc() vào StatusRepository

Cập nhật DataInitializer để tạo dữ liệu mẫu cho các entity type mới (user, department, vendor, project, warehouse, workflow)

Thêm cột group vào bảng statuses (database migration)

Cập nhật admin-statuses.js để hiển thị trạng thái theo nhóm

Thêm ô nhập group trong form thêm/sửa trạng thái

Mở rộng danh sách entity type trong giao diện Admin

📂 Các file đã sửa
Backend:

UserDTO.java – thêm grantAllDeptPermissions

User.java – thêm @Transient grantAllDeptPermissions

PermissionService.java – thêm getAllPermissionKeysByDepartmentId() và grantAllDepartmentPermissionsToUser()

UserService.java – xử lý flag trong create() và update()

Status.java – thêm trường group

StatusRepository.java – thêm method tìm theo group

DataInitializer.java – thêm dữ liệu mẫu cho các entity type mới

Frontend:

admin-helpers.js – thêm getSpecialPositions()

admin-users.js – thêm checkbox và xử lý flag

admin-statuses.js – hiển thị theo nhóm, thêm group trong form

Database:

mep_db.sql – ALTER TABLE statuses ADD COLUMN group VARCHAR(50) NULL

⏳ Chưa triển khai (các phần còn lại)
Phần	Mô tả	File cần sửa	Ưu tiên
IV	Phòng ban (Department) – Tách Team	Team.java, TeamMember.java, TeamService, TeamController, admin-departments.js	🔴 Cao
V	Dự án (Project) – Quản lý thành viên	ProjectMember.java, ProjectMemberService, ProjectMemberController, projects.js	🔴 Cao
VI	Nhà cung cấp (Vendor) – Nhóm hàng, trạng thái	Vendor.java (thêm status), VendorGroup.java, vendors.js	🟡 Trung bình
VII	MR – Modal chọn vật tư	item-selector-modal.js, mr.js, pr.js, po.js	🟡 Trung bình
VIII	Vật tư (Item) – Nhiều tên cùng mã	Item.java (bỏ unique code, thêm isMain), items.js	🟢 Thấp
📌 Ghi chú
Phiên bản hiện tại: 2.0.27 (chưa chính thức triển khai trên server, vẫn đang ở môi trường phát triển)

Cần chạy migration database (ALTER TABLE statuses ADD COLUMN group) trước khi khởi động lại ứng dụng

Các phần còn lại sẽ được triển khai trong các phiên bản tiếp theo, dự kiến hoàn thành trước khi nâng cấp lên phiên bản 2.1 chính thức