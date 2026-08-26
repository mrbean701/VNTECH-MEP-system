# 🏗️ MEP Purchasing & Warehouse Management System

Phần mềm quản lý quy trình mua hàng, kho vận và cấp phát vật tư cho các công ty MEP (Cơ điện).  
**Tự động hóa – Minh bạch – Kiểm soát chi phí & tiến độ dự án**

---

## 📌 Giới thiệu

Hệ thống giúp số hóa và tự động hóa toàn bộ quy trình từ yêu cầu vật tư tại công trường → phê duyệt → mua hàng → nhập kho → chuyển kho → cấp phát vật tư → hoàn trả, đảm bảo minh bạch, kiểm soát chi phí và tiến độ dự án.

**Điểm nổi bật mới:**
- 🔄 **Workflow động** – Quản trị viên có thể tạo, chỉnh sửa, kích hoạt nhiều mẫu quy trình duyệt cho từng module (MR, PR, PO, GRN, STO, Issue, MaterialReturn) mà không cần sửa code.
- 👤 **Phân quyền 2 cấp linh hoạt** – Vừa phân quyền theo role, vừa phân quyền theo từng user (ưu tiên user). Quản lý trực quan qua giao diện Admin.
- 📊 **Dashboard thông minh** – Tổng hợp dữ liệu theo thời gian thực, hỗ trợ ra quyết định nhanh chóng.

---

## 🚀 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| 🖥️ Frontend | HTML, CSS, JavaScript (thuần) |
| ☕ Backend | Spring Boot (Java) với JWT, Spring Security, JPA/Hibernate |
| 🗄️ Database | MySQL |
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
| 📊 **Dashboard** | Thống kê tổng quan: dự án, NCC, vật tư, kho, MR, PR, PO, GRN, STO, Cấp phát, Hoàn trả, Cảnh báo tồn kho, Đơn hàng tự động. Hiển thị biểu đồ và widget tương tác. |
| 📋 **Dự án (Projects)** | CRUD dự án, xem chi tiết với 4 tab: Thông tin, PR, PO, Kho. Tự động tạo kho khi tạo dự án mới. |
| 🏢 **Nhà cung cấp (Vendors)** | CRUD nhà cung cấp, xem chi tiết, kiểm tra ràng buộc khi xóa. |
| 📦 **Vật tư (Items)** | CRUD vật tư, tự động thêm vào inventory khi tạo. Xem chi tiết tồn kho theo từng kho. |
| 📄 **MR (Material Request)** | Tạo yêu cầu vật tư, duyệt theo workflow động (mặc định 1 bước bởi Site Commander). |
| 📑 **PR (Purchase Request)** | Tạo từ MR hoặc thủ công. Duyệt theo workflow động (mặc định 3 bước: Planning → Project → CEO). |
| 🛒 **PO (Purchase Order)** | Tạo từ PR hoặc thủ công. Duyệt theo workflow động (mặc định 3 bước: Planning → Project → CEO). |
| 🏚️ **Kho (Warehouse)** | Quản lý danh sách kho, tồn kho. Xem chi tiết kho, vật tư, dự án liên quan. |
| 📥 **GRN (Nhập kho)** | Tạo phiếu nhập từ PO đã duyệt. Quy trình 4 bước: DRAFT → RECEIVED → QC_CHECKED → COMPLETED. |
| 📤 **STO (Chuyển kho)** | Tạo phiếu chuyển kho. Quy trình 3 bước: Lập phiếu → Duyệt → Xuất kho. |
| 📤 **Cấp phát (Issue)** | Quản lý cấp phát vật tư cho đội thi công. Quy trình 4 bước: Tạo phiếu → Duyệt → Cấp phát → Xác nhận. |
| 🔄 **Hoàn trả (Material Return)** | Quản lý hoàn trả vật tư từ công trường về kho. Quy trình 3 bước: Tạo phiếu → Thủ kho nhận → Xác nhận. |
| 📊 **Cảnh báo tồn kho (Min Stock)** | Cấu hình ngưỡng tồn kho tối thiểu theo từng kho. Lọc theo trạng thái. Widget trên Dashboard. |
| 🤖 **Đặt hàng tự động (Auto Reorder)** | Bật/tắt, cấu hình hệ số nhân, nhà cung cấp. Tự động tạo PR khi vật tư dưới ngưỡng. Quản lý quy tắc nâng cao. |
| 👑 **Admin (Quản trị hệ thống)** | **5 tab:** Người dùng, Phòng ban, Workflow (đa mẫu), Phân quyền role, Phân quyền user. Quản lý toàn diện hệ thống. |
| 📤 **Xuất Excel** | Hỗ trợ xuất tất cả danh sách dữ liệu. |
| 🔐 **Phân quyền 2 cấp** | Role-based + User-based (ưu tiên user). |
| 📝 **Audit Log** | Ghi lại toàn bộ hoạt động thay đổi dữ liệu (CREATE, UPDATE, DELETE) kèm IP, UserAgent. |

---

## 🔄 Luồng nghiệp vụ chính (với workflow động)

```text
[Site Staff] → MR → [Workflow MR] → PR → [Workflow PR] → PO → [Workflow PO] → GRN → STO → Issue → Material Return
Workflow động cho phép:

Thay đổi số lượng bước duyệt (ví dụ: PR có thể có 1, 2, 3 hoặc nhiều bước hơn).

Thay đổi thứ tự duyệt.

Thay đổi role được phép duyệt ở mỗi bước.

Thay đổi phòng ban được phép duyệt (nếu cần).

Tạo nhiều mẫu workflow khác nhau và lựa chọn áp dụng.

👥 Tài khoản mẫu
Email	Mật khẩu	Vai trò	Phòng ban	Quyền hạn chính
admin@mep.com	password	👑 Admin	Ban Giám đốc	Toàn quyền, quản trị hệ thống
ceo@mep.com	password	🏢 CEO	Ban Giám đốc	Duyệt PR/PO step cuối
planning@mep.com	password	📋 PLANNING	Phòng Kế hoạch	Duyệt PR/PO step 1
project@mep.com	password	📐 PROJECT	Phòng Dự án	Duyệt PR/PO step 2
purchasing@mep.com	password	🛒 PURCHASING	Phòng Mua hàng	Tạo PR, PO, GRN, STO
commander@mep.com	password	🎖️ SITE_COMMANDER	Ban Chỉ huy công trường	Duyệt MR, cấp phát, hoàn trả
qc@mep.com	password	🔬 QC	Phòng QC	Kiểm tra chất lượng GRN
🛠️ Hướng dẫn cài đặt
1. Cài đặt Database
sql
-- Chạy file mep_db.sql trong MySQL
mysql -u root -p < mep_db.sql
Lưu ý: File mep_db.sql đã được cập nhật để hỗ trợ workflow đa mẫu với các cột is_active, is_system, name, description.

2. Cấu hình Backend (Spring Boot)
Tạo file src/main/resources/application.properties:

properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/mep_db?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
jwt.secret=your_super_secret_key_for_jwt_token_at_least_32_characters
jwt.expiration=86400000  # 24 hours in milliseconds

# Logging
logging.level.com.mep.mepbackend=DEBUG
3. Chạy Backend
bash
./mvnw spring-boot:run
# hoặc
mvn spring-boot:run
4. Chạy Frontend
Mở thư mục frontend trong VS Code và dùng Live Server (hoặc http-server) để chạy index.html.

5. Kiểm tra API
Truy cập Swagger: http://localhost:8080/swagger-ui/index.html

🗂️ Cấu trúc thư mục (Tóm tắt)
Frontend
text
FRONTEND/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── api.js          # Gọi REST API + fallback localStorage
    ├── auth.js         # Session + phân quyền (ưu tiên user)
    ├── admin.js        # Quản trị: user, department, workflow, permissions
    ├── app.js          # Điều hướng menu
    ├── data.js         # LocalStorage helpers
    ├── utils.js        # Hàm tiện ích
    ├── dashboard.js    # Dashboard
    ├── projects.js     # Dự án
    ├── vendors.js      # Nhà cung cấp
    ├── items.js        # Vật tư
    ├── mr.js           # Material Request
    ├── pr.js           # Purchase Request
    ├── po.js           # Purchase Order
    ├── warehouse.js    # Kho + GRN + STO
    ├── issue.js        # Cấp phát
    ├── material-return.js # Hoàn trả
    ├── min-stock.js    # Cảnh báo tồn kho
    ├── auto-reorder.js # Đặt hàng tự động
    ├── export.js       # Xuất Excel
    ├── toast.js        # Thông báo
    └── loading.js      # Loading overlay
Backend (Spring Boot)
text
BACKEND/
└── src/main/java/com/mep/mepbackend/
    ├── aspect/         # LoggingAspect (Audit Log)
    ├── config/         # JWT, Security, CORS, OpenAPI
    ├── controller/     # REST Controllers
    ├── dto/            # Data Transfer Objects
    ├── entity/         # JPA Entities
    ├── exception/      # Global Exception Handler
    ├── repository/     # JPA Repositories
    ├── service/        # Business Logic
    └── util/           # DataInitializer, CurrentUserUtil, EntityMapper
🎯 Tính năng mới chi tiết
1. Workflow Động & Đa Mẫu
Quản lý qua Admin → Tab Workflow:

Hiển thị danh sách các mẫu workflow theo từng module.

Mỗi mẫu có trạng thái: Đang áp dụng / Không áp dụng, loại: Hệ thống / Tùy chỉnh.

Hành động: Kích hoạt, Sửa, Sao chép, Xóa (chỉ mẫu tùy chỉnh và không active).

Tạo mới workflow với JSON steps linh hoạt.

Tạo mặc định cho tất cả module.

Cấu trúc steps (JSON):

json
[
  {"step": 1, "role": "PLANNING", "label": "Kế hoạch duyệt", "departmentId": 2},
  {"step": 2, "role": "PROJECT", "label": "Dự án duyệt", "departmentId": 3},
  {"step": 3, "role": "CEO", "label": "Tổng Giám đốc duyệt", "departmentId": 1}
]
2. Phân quyền User (Ưu tiên hơn Role)
Quản lý qua Admin → Tab "Phân quyền user":

Chọn user, tick/bỏ tick từng quyền cụ thể.

Quyền user được lưu trong bảng user_permissions.

Khi kiểm tra quyền: User Permission → Role Permission → Fallback.

Các permission keys:

module.view, module.create, module.edit, module.delete

module.approve, module.submit, module.reject

module.receive, module.qc, module.complete, module.confirm

🔧 API Endpoints mới
Workflow
Method	Endpoint	Mô tả
GET	/api/workflows	Lấy tất cả workflow
GET	/api/workflows/module/{module}	Lấy workflow theo module
GET	/api/workflows/module/{module}/active	Lấy workflow đang active
PUT	/api/workflows/module/{module}/activate/{id}	Kích hoạt workflow
POST	/api/workflows/duplicate/{id}	Sao chép workflow
POST	/api/workflows	Tạo workflow mới
PUT	/api/workflows/{id}	Cập nhật workflow
DELETE	/api/workflows/{id}	Xóa workflow
User Permission
Method	Endpoint	Mô tả
GET	/api/permissions/user/{userId}	Lấy quyền của user
POST	/api/permissions/user/{userId}/assign?permissionKey=xxx&enabled=true/false	Gán quyền cho user
DELETE	/api/permissions/user/{userId}/remove?permissionKey=xxx	Xóa quyền của user
DELETE	/api/permissions/user/{userId}/remove-all	Xóa toàn bộ quyền của user



🔄 Lịch sử phiên bản
Ngày	Phiên bản	Nội dung
19/08/2025	1.0.0	🏗️ Khởi tạo dự án, xây dựng kiến trúc cơ bản và các module cốt lõi: MR, PR, PO, Kho.
19/08/2025	2.0.0	🚀 Hoàn thiện các module: Dashboard, Dự án, Nhà cung cấp, Vật tư; tích hợp GRN, STO; giao diện demo với localStorage.
20/08/2025	2.0.1	📂 Tách file thành các module riêng, thêm module GRN và STO.
20/08/2025	2.0.2	👁️ Bổ sung chức năng xem PR và PO theo dự án trong modal chi tiết dự án.
20/08/2025	2.0.3	📊 Tách riêng bảng PR và PO trong chi tiết dự án.
20/08/2025	2.0.4	🗂️ Tách PR và PO thành 2 tab riêng, xem chi tiết inline.
20/08/2025	2.0.5	🖱️ Thêm chức năng click vào mã hoặc tên dự án để mở chi tiết.
20/08/2025	2.0.6	🔗 MR/PR/PO: click mã → chi tiết, click tên dự án → chi tiết dự án.
20/08/2025	2.0.7	🎯 Cập nhật chi tiết dự án: 2 tab PR/PO, xem inline, progress bar.
20/08/2025	2.0.8	🏚️ Kho: click vật tư → chi tiết. GRN/STO: click liên kết đến PO, dự án, kho.
20/08/2025	2.0.9	📈 MR/PR/PO: hiển thị thanh tiến độ khi hoàn thành. STO: hiển thị tiến độ 3 bước, khóa ghi chú khi hoàn thành.
20/08/2025	2.0.10	🏗️ Chi tiết dự án: thêm tab Kho, đổi trạng thái kho, click tên kho xem chi tiết.
20/08/2025	2.0.11	🐛 Sửa lỗi click vào kho, nút "Chi tiết kho" và "Đổi trạng thái kho" hoạt động.
20/08/2025	2.0.12	🐛 Sửa lỗi click vào kho, điều chỉnh thứ tự load script.
20/08/2025	2.0.13	🎨 Tối ưu progress bar, sửa lỗi MR hiển thị 1 bước.
20/08/2025	2.0.14	✨ Hoàn thiện chức năng sửa GRN và STO: sửa ở DRAFT, điều chỉnh số lượng, serial, tình trạng, kiểm tra tồn kho.
21/08/2025	2.0.15	📤 Thêm module Cấp phát (Issue) với quy trình 4 bước, chọn kho xuất, điều chỉnh số lượng.
21/08/2025	2.0.16	🔄 Thêm module Hoàn trả (Material Return) với quy trình 3 bước, cập nhật tồn kho.
21/08/2025	2.0.17	📊 Thêm module Cảnh báo tồn kho tối thiểu (theo kho), lọc theo trạng thái, widget Dashboard.
21/08/2025	2.0.18	🤖 Thêm module Đặt hàng tự động (Auto Reorder), cấu hình theo kho, hiển thị trạng thái trên Dashboard.
21/08/2025	2.0.19	🎨 Cập nhật Dashboard: thêm widget Cấp phát & Hoàn trả, hiển thị trạng thái Auto Reorder.
21/08/2025	2.0.20	📄 Cập nhật toàn bộ tài liệu: README, SRS, UX/UI, Use Case phản ánh đúng phiên bản hiện tại.
25/08/2025	2.0.21	👑 Thêm module Admin với 5 tab quản trị: Người dùng, Phòng ban, Workflow, Phân quyền role, Phân quyền user.
26/08/2025	2.0.22	Hoàn thiện Backend Spring Boot với JWT, MySQL, Audit Log, toàn bộ Service/Repository/Controller. Cập nhật README đầy đủ.
26/08/2025	2.0.23	🚀 Nâng cấp lớn: Workflow động + đa mẫu; Phân quyền user (ưu tiên hơn role); Giao diện Admin quản lý workflow và user permissions.
🔐 Hệ thống phân quyền 2 cấp: Role-based + User-based (ưu tiên cao hơn).
📊 Phân quyền user giao diện box/module, cho phép gán quyền riêng cho từng user.
🏢 Quản lý phòng ban với trưởng phòng và danh sách thành viên.
⚙️ Cấu hình workflow linh hoạt cho từng module.
📱 Responsive toàn diện cho tất cả bảng biểu và modal.
🐛 Sửa nhiều lỗi nhỏ, cải thiện UX/UI.
26/08/2025	2.0.22	📝 Cập nhật README: bổ sung hướng dẫn đẩy code lên GitHub, đánh giá tổng quan dự án.
📦 Cập nhật danh sách module, tài khoản mẫu, và cấu trúc thư mục.
📊 Đánh giá tổng quan dự án
✅ Điểm mạnh
Kiến trúc module hóa tốt – Các chức năng được tách riêng thành từng file JS rõ ràng (mr.js, pr.js, po.js, warehouse.js, …), dễ bảo trì và mở rộng.

Phân quyền chi tiết – Hỗ trợ phân quyền theo role (Role-based) và theo user (User-based), với giao diện quản trị trực quan. Quyền user ưu tiên hơn quyền role.

Quy trình nghiệp vụ đầy đủ – Bao gồm MR → PR → PO → GRN → STO → Issue → Material Return, mỗi bước đều có luồng duyệt và trạng thái rõ ràng.

Giao diện responsive – Hoạt động tốt trên cả desktop và mobile, với sidebar thu gọn và overlay cho mobile.

Tích hợp sẵn các tiện ích – Xuất Excel (SheetJS), biểu đồ (Chart.js), toast notification, loading overlay, in phiếu (đang phát triển).

Dữ liệu mẫu phong phú – Giúp dễ dàng kiểm tra và demo ngay khi chạy.

Hỗ trợ quản trị linh hoạt – Admin có thể cấu hình workflow, phân quyền chi tiết, quản lý người dùng và phòng ban.

⚠️ Điểm cần cải thiện và kế hoạch phát triển
Backend & Database: Hiện tại dữ liệu lưu trên localStorage, chỉ phù hợp cho demo. Cần xây dựng backend (Spring Boot) và kết nối MySQL để triển khai thực tế.

Bảo mật: Mật khẩu lưu dạng plain text, cần mã hóa (bcrypt) và sử dụng JWT cho session khi có backend.

Tối ưu hiệu suất: Một số module render lại toàn bộ table khi có thay đổi nhỏ, có thể cải thiện bằng cách chỉ cập nhật phần thay đổi hoặc phân trang.

Tính năng bổ sung: Thông báo real-time (WebSocket), Audit Log, tìm kiếm nâng cao (filter nhiều trường), báo cáo thống kê chi tiết (biểu đồ tổng hợp theo tháng/quý).

Hoàn thiện các chức năng còn dang dở: In phiếu (GRN, STO, Issue, Material Return), gắn sự kiện cho các hàm export trong export.js (một số chưa được gọi).

🚀 Hướng dẫn đẩy code lên GitHub
Trường hợp 1: Dự án mới hoàn toàn (chưa có Git local, chưa có repo trên GitHub)
Mở Terminal và di chuyển đến thư mục dự án:

bash
cd đường_dẫn_đến_thư_mục_code
Khởi tạo Git:

bash
git init
Thêm tất cả file vào vùng theo dõi:

bash
git add .
Commit lần đầu:

bash
git commit -m "first commit"
Tạo repository mới trên GitHub (không tạo README để tránh conflict).

Kết nối remote và đẩy code:

bash
git remote add origin https://github.com/username/repository.git
git branch -M main
git push -u origin main
Trường hợp 2: Đã có remote, chỉ đẩy thay đổi
bash
git add .
git commit -m "Mô tả thay đổi"
git push
Xử lý conflict khi push bị từ chối
bash
git pull origin main --rebase
# hoặc
git pull origin main
Lưu ý: GitHub không còn hỗ trợ mật khẩu qua HTTPS. Hãy sử dụng Personal Access Token (PAT) thay thế. Bạn có thể tạo PAT tại Settings → Developer settings → Personal access tokens → Tokens (classic).

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
Tổng số dòng code hiện tại: ~13,500 dòng (JS + CSS + HTML)

