🏗️ MEP Purchasing & Warehouse Management System
Phiên bản 2.1.0

Phần mềm quản lý quy trình mua hàng, kho vận và cấp phát vật tư cho các công ty MEP (Cơ điện).
Tự động hóa – Minh bạch – Kiểm soát chi phí & tiến độ dự án

📌 Giới thiệu
Hệ thống giúp số hóa và tự động hóa toàn bộ quy trình từ yêu cầu vật tư tại công trường → phê duyệt → mua hàng → nhập kho → chuyển kho → cấp phát vật tư → hoàn trả, đảm bảo minh bạch, kiểm soát chi phí và tiến độ dự án.

🚀 Điểm nổi bật (phiên bản 2.1.0)
📦 Modal chọn vật tư thông minh: Hỗ trợ tìm kiếm, chọn nhiều, hiển thị alias (tên khác) dạng badge + dropdown. Tích hợp cho MR, PR, PO, Issue, Material Return.

🔄 Item Alias (nhiều tên cùng mã): Cho phép một mã vật tư có nhiều tên gọi khác nhau. Đánh dấu tên chính, hiển thị đúng tên đã chọn trong đơn hàng.

✂️ Tách đơn từ PR: Từ 1 PR có thể tạo nhiều PO với các vendor khác nhau, phân bổ vật tư theo từng nhà cung cấp. Hỗ trợ trạng thái PARTIALLY_FULFILLED cho PR.

🔍 Tìm kiếm & Sắp xếp nâng cao: Tất cả các module danh sách (MR, PR, PO, Items, Projects, Vendors, GRN, STO, Issue, Material Return) đều có tìm kiếm đa trường, sắp xếp và bộ lọc theo trạng thái/dự án/nhà cung cấp/kho.

🏚️ Cải tiến quản lý kho: Toggle hiển thị kho đang hoạt động / tất cả kho. Khi dự án ngừng hoạt động, hiển thị danh sách kho, kiểm tra tồn kho và hỏi chuyển vật tư về kho tổng.

🏢 Tách tab Quản lý Đội/Nhóm: Đội/Nhóm được tách thành tab riêng trong Admin, với CRUD và quản lý thành viên, liên kết với dự án.

🚀 Điểm nổi bật (phiên bản 2.0.27)
👤 Quản lý chức vụ & gán quyền tự động: Khi tạo/sửa user, nếu chọn chức vụ đặc biệt (Trưởng phòng, Giám đốc, ...), admin có thể chọn checkbox "Gán toàn bộ quyền phòng ban" để tự động cấp tất cả quyền của phòng ban đó cho user.

📊 Mở rộng quản lý trạng thái (Status): Hỗ trợ thêm các entity type mới: user, department, vendor, project, warehouse, workflow. Thêm trường group để nhóm các trạng thái.

🎨 Màu sắc trạng thái: Hiển thị màu sắc trực quan cho từng trạng thái.

🚀 Công nghệ sử dụng
Thành phần	Công nghệ
🖥️ Frontend	HTML, CSS, JavaScript (thuần)
☕ Backend	Spring Boot 3.2.5 (Java 17) với JWT, Spring Security, JPA/Hibernate
🗄️ Database	MySQL 8.0+
📊 Biểu đồ	Chart.js
📤 Xuất Excel	SheetJS (XLSX)
🎨 Icon	Font Awesome 6
📄 API Documentation	Swagger/OpenAPI 3
🔐 Bảo mật	JWT + BCrypt
📝 Audit Log	Spring AOP
🧩 Kiến trúc	Monolithic (RESTful API)
📦 Các module chính
Module	Mô tả
📊 Dashboard	Thống kê tổng quan, biểu đồ, widget tương tác. Click widget để chuyển nhanh đến module chi tiết. Hiển thị cảnh báo PR chưa hoàn thành.
📋 Dự án (Projects)	CRUD dự án, xem chi tiết với 4 tab: Thông tin, PR, PO, Kho, Thành viên. Tự động tạo kho khi tạo dự án mới. Xử lý ngừng hoạt động kèm chuyển kho.
🏢 Nhà cung cấp (Vendors)	CRUD nhà cung cấp, quản lý nhóm hàng (nhiều nhóm), trạng thái hợp tác.
📦 Vật tư (Items)	CRUD vật tư, hỗ trợ alias (nhiều tên cùng mã), đánh dấu tên chính. Tự động thêm vào inventory khi tạo.
📄 MR (Material Request)	Tạo yêu cầu vật tư, duyệt theo workflow động (có thể cấu hình số bước). Hỗ trợ modal chọn vật tư thông minh.
📑 PR (Purchase Request)	Tạo từ MR hoặc thủ công. Duyệt theo workflow động. Hỗ trợ tách đơn thành nhiều PO. Trạng thái PARTIALLY_FULFILLED.
🛒 PO (Purchase Order)	Tạo từ PR hoặc thủ công. Duyệt theo workflow động. Hỗ trợ nhiều PO từ 1 PR.
🏚️ Kho (Warehouse)	Quản lý danh sách kho, tồn kho. Xem chi tiết kho, vật tư, dự án liên quan. Toggle hiển thị kho active/inactive.
📥 GRN (Nhập kho)	Tạo phiếu nhập từ PO đã duyệt. Quy trình 4 bước: DRAFT → RECEIVED → QC_CHECKED → COMPLETED.
📤 STO (Chuyển kho)	Tạo phiếu chuyển kho. Quy trình 3 bước: Lập phiếu → Duyệt → Xuất kho.
📤 Cấp phát (Issue)	Quản lý cấp phát vật tư cho đội thi công. Quy trình 4 bước: Tạo phiếu → Duyệt → Cấp phát → Xác nhận.
🔄 Hoàn trả (Material Return)	Quản lý hoàn trả vật tư từ công trường về kho. Quy trình 3 bước: Tạo phiếu → Thủ kho nhận → Xác nhận.
📊 Cảnh báo tồn kho (Min Stock)	Cấu hình ngưỡng tồn kho tối thiểu, số lượng an toàn và phần trăm cảnh báo theo từng kho.
🤖 Đặt hàng tự động (Auto Reorder)	Bật/tắt, cấu hình hệ số nhân, nhà cung cấp, lịch hẹn giờ. Tự động tạo MR/PR khi vật tư dưới ngưỡng.
👑 Admin (Quản trị hệ thống)	9 tab: Người dùng, Phòng ban, Đội/Nhóm, Chức vụ, Workflow, Trạng thái, Phân quyền phòng ban, Phân quyền user, Nhật ký.
📤 Xuất Excel	Hỗ trợ xuất tất cả danh sách dữ liệu với định dạng .xlsx.
🔐 Phân quyền 2 cấp	Phòng ban + User (ưu tiên user). Khi user chuyển phòng ban, quyền phòng ban tự động thay đổi.
📝 Audit Log	Ghi lại toàn bộ hoạt động thay đổi dữ liệu (CREATE, UPDATE, DELETE, SUBMIT, APPROVE, REJECT, LOGIN) kèm IP, UserAgent.
🔄 Luồng nghiệp vụ chính (với workflow động)
text
[Site Staff] → MR → [Workflow MR] → PR → [Workflow PR] → PO → [Workflow PO] → GRN → STO → Issue → Material Return
Workflow động cho phép:

Thay đổi số lượng bước duyệt.

Thay đổi thứ tự duyệt.

Thay đổi permissionKey được phép duyệt ở mỗi bước (bất kỳ user có quyền đó đều có thể duyệt).

Gán trạng thái (statusCode) tùy chỉnh cho từng bước.

Tạo nhiều mẫu workflow khác nhau và lựa chọn áp dụng.

👥 Tài khoản mẫu
Mặc định (tự động tạo khi chạy lần đầu qua DataInitializer):

Email	Mật khẩu	Vai trò	Phòng ban	Quyền hạn chính
admin@mep.com	password	👑 Admin	Ban Giám đốc	Toàn quyền, quản trị hệ thống
Các tài khoản khác cần được tạo thủ công qua giao diện Admin → Người dùng.

🛠️ Hướng dẫn cài đặt
Cài đặt Database
sql
-- Chạy file mep_db.sql trong MySQL
mysql -u root -p < mep_db.sql
Cấu hình Backend (Spring Boot)
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
jwt.expiration=86400000

# Logging
logging.level.com.mep.mepbackend=DEBUG

# ✅ Tắt DevTools auto-restart
spring.devtools.restart.enabled=false
spring.devtools.livereload.enabled=false
Chạy Backend
bash
./mvnw spring-boot:run
Chạy Frontend
Mở thư mục frontend trong VS Code và dùng Live Server (hoặc http-server) để chạy index.html.

Kiểm tra API
Truy cập Swagger: http://localhost:8080/swagger-ui/index.html

🗂️ Cấu trúc thư mục (Tóm tắt)
Frontend
text
FRONTEND/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── admin/
    │   ├── admin-core.js          # Quản lý tab, render chính
    │   ├── admin-helpers.js       # Hàm dùng chung
    │   ├── admin-users.js         # Quản lý người dùng
    │   ├── admin-departments.js   # Quản lý phòng ban
    │   ├── admin-teams.js         # Quản lý đội/nhóm (tab riêng)
    │   ├── admin-positions.js     # Quản lý chức vụ
    │   ├── admin-statuses.js      # Quản lý trạng thái
    │   ├── admin-workflows.js     # Quản lý workflow
    │   ├── admin-department-permissions.js
    │   ├── admin-user-permissions.js
    │   └── admin-audit.js         # Nhật ký hoạt động
    ├── api.js                     # Gọi REST API + fallback localStorage
    ├── auth.js                    # Session + phân quyền
    ├── data.js                    # LocalStorage helpers
    ├── utils.js                   # Hàm tiện ích (debounce, cache, ...)
    ├── app.js                     # Điều hướng menu + lưu trang
    ├── dashboard.js               # Dashboard
    ├── projects.js                # Dự án
    ├── vendors.js                 # Nhà cung cấp
    ├── items.js                   # Vật tư (hỗ trợ alias)
    ├── item-selector-modal.js     # Modal chọn vật tư (dùng chung)
    ├── mr.js                      # Material Request
    ├── pr.js                      # Purchase Request (hỗ trợ tách đơn)
    ├── po.js                      # Purchase Order
    ├── warehouse.js               # Kho + GRN + STO
    ├── issue.js                   # Cấp phát
    ├── material-return.js         # Hoàn trả
    ├── min-stock.js               # Cảnh báo tồn kho
    ├── auto-reorder.js            # Đặt hàng tự động
    ├── export.js                  # Xuất Excel
    ├── toast.js                   # Thông báo
    └── loading.js                 # Loading overlay
Backend (Spring Boot)
text
BACKEND/
└── src/main/java/com/mep/mepbackend/
    ├── aspect/                    # LoggingAspect (Audit Log)
    ├── config/                    # JWT, Security, CORS, OpenAPI
    ├── controller/                # REST Controllers
    ├── dto/                       # Data Transfer Objects
    ├── entity/                    # JPA Entities
    ├── exception/                 # Global Exception Handler
    ├── repository/                # JPA Repositories
    ├── service/                   # Business Logic
    └── util/                      # DataInitializer, CurrentUserUtil
📄 Lịch sử phiên bản
Ngày	Phiên bản	Nội dung
19/08/2025	1.0.0	🏗️ Khởi tạo dự án, xây dựng kiến trúc cơ bản và các module cốt lõi: MR, PR, PO, Kho.
19/08/2025	2.0.0	🚀 Hoàn thiện các module: Dashboard, Dự án, Nhà cung cấp, Vật tư; tích hợp GRN, STO.
20/08/2025	2.0.1	📂 Tách file thành các module riêng, thêm module GRN và STO.
20/08/2025	2.0.2	👁️ Bổ sung chức năng xem PR và PO theo dự án trong modal chi tiết dự án.
20/08/2025	2.0.3	📊 Tách riêng bảng PR và PO trong chi tiết dự án.
20/08/2025	2.0.4	🗂️ Tách PR và PO thành 2 tab riêng, xem chi tiết inline.
20/08/2025	2.0.5	🖱️ Thêm chức năng click vào mã hoặc tên dự án để mở chi tiết.
20/08/2025	2.0.6	🔗 MR/PR/PO: click mã → chi tiết, click tên dự án → chi tiết dự án.
20/08/2025	2.0.7	🎯 Cập nhật chi tiết dự án: 2 tab PR/PO, xem inline, progress bar.
20/08/2025	2.0.8	🏚️ Kho: click vật tư → chi tiết. GRN/STO: click liên kết đến PO, dự án, kho.
20/08/2025	2.0.9	📈 MR/PR/PO: hiển thị thanh tiến độ khi hoàn thành. STO: hiển thị tiến độ 3 bước.
20/08/2025	2.0.10	🏗️ Chi tiết dự án: thêm tab Kho, đổi trạng thái kho, click tên kho xem chi tiết.
20/08/2025	2.0.11	🐛 Sửa lỗi click vào kho, nút "Chi tiết kho" và "Đổi trạng thái kho" hoạt động.
20/08/2025	2.0.12	🐛 Sửa lỗi click vào kho, điều chỉnh thứ tự load script.
20/08/2025	2.0.13	🎨 Tối ưu progress bar, sửa lỗi MR hiển thị 1 bước.
20/08/2025	2.0.14	✨ Hoàn thiện chức năng sửa GRN và STO: sửa ở DRAFT, điều chỉnh số lượng, serial, tình trạng.
21/08/2025	2.0.15	📤 Thêm module Cấp phát (Issue) với quy trình 4 bước.
21/08/2025	2.0.16	🔄 Thêm module Hoàn trả (Material Return) với quy trình 3 bước.
21/08/2025	2.0.17	📊 Thêm module Cảnh báo tồn kho tối thiểu, widget Dashboard.
21/08/2025	2.0.18	🤖 Thêm module Đặt hàng tự động (Auto Reorder).
21/08/2025	2.0.19	🎨 Cập nhật Dashboard: thêm widget Cấp phát & Hoàn trả.
21/08/2025	2.0.20	📄 Cập nhật toàn bộ tài liệu: README, SRS, UX/UI, Use Case.
25/08/2025	2.0.21	👑 Thêm module Admin với 5 tab quản trị.
26/08/2025	2.0.22	🚀 Hoàn thiện Backend Spring Boot với JWT, MySQL, Audit Log.
26/08/2025	2.0.23	🚀 Nâng cấp workflow động + đa mẫu; phân quyền user ưu tiên role.
27/08/2025	2.0.24	🔐 Chuyển sang phân quyền phòng ban (module-action). Thêm bảng statuses và workflow_step_status.
28/08/2025	2.0.25	🛠️ Sửa lỗi duyệt workflow: mở rộng pendingStatuses. Cập nhật renderApprovalProgress.
29/08/2025	2.0.26	🚀 Hoàn thiện các tính năng nâng cao: Cảnh báo tồn kho với safe_quantity, Đặt hàng tự động với lịch hẹn giờ, Audit Log, Phân trang.
29/08/2025	2.0.27	👤 Mở rộng quản lý chức vụ & gán quyền tự động. Mở rộng quản lý trạng thái (Status) với entity type và group mới.
04/09/2026	2.0.28	🚀 Cập nhật lớn: Modal chọn vật tư thông minh (item-selector-modal), Item Alias (nhiều tên cùng mã), Tách đơn từ PR, Tìm kiếm & Sắp xếp nâng cao cho tất cả module, Cải tiến quản lý kho (toggle + xử lý ngừng hoạt động), Tách tab Đội/Nhóm riêng trong Admin. Sửa lỗi ProjectMember (LocalDate cast), Vendor groups, Workflow approvalStep, Autoload.
📝 Ghi chú
Hệ thống đã được chuyển sang sử dụng MySQL và Spring Boot backend hoàn chỉnh với JWT.

Dữ liệu được lưu trữ và quản lý tập trung trên database.

Dự án đã được tách thành các module riêng biệt, sẵn sàng cho việc mở rộng và bảo trì.

Mọi đóng góp và phản hồi đều được hoan nghênh. 💬

📄 Tài liệu liên quan
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)

Thiết kế Giao diện (UX/UI)

Sơ đồ Use Case

© 2026 MEP System. All rights reserved.
Tổng số dòng code hiện tại: ~16,500+ dòng (JS + CSS + HTML + Java)


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
Phần	    Mô tả	                                                                    File cần sửa	                                            Ưu tiên
IV	    Phòng ban (Department) – Tách Team	                Team.java, TeamMember.java, TeamService, TeamController, admin-departments.js	        🔴 Cao
V	    Dự án (Project) – Quản lý thành viên	            ProjectMember.java, ProjectMemberService, ProjectMemberController, projects.js	        🔴 Cao
VI	    Nhà cung cấp (Vendor) – Nhóm hàng, trạng thái	    Vendor.java (thêm status), VendorGroup.java, vendors.js	                                🟡 Trung bình
VII	    MR – Modal chọn vật tư	                            item-selector-modal.js, mr.js, pr.js, po.js	                                            🟡 Trung bình
VIII	Vật tư (Item) – Nhiều tên cùng mã	                Item.java (bỏ unique code, thêm isMain), items.js	                                    🟢 Thấp


📌 Ghi chú
Phiên bản hiện tại: 2.0.27 (chưa chính thức triển khai trên server, vẫn đang ở môi trường phát triển)

Cần chạy migration database (ALTER TABLE statuses ADD COLUMN group) trước khi khởi động lại ứng dụng

Các phần còn lại sẽ được triển khai trong các phiên bản tiếp theo, dự kiến hoàn thành trước khi nâng cấp lên phiên bản 2.1 chính thức