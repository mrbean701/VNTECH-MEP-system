-- ================================================================
-- TẠO DATABASE MEP
-- ================================================================
DROP DATABASE IF EXISTS mep_db;
CREATE DATABASE IF NOT EXISTS mep_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mep_db;

-- ================================================================
-- 1. BẢNG USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id BIGINT NULL,
    position VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- ================================================================
-- 2. BẢNG DEPARTMENTS (Phòng ban)
-- ================================================================
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    manager_id BIGINT NULL,
    manager_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code)
);

-- ================================================================
-- 3. BẢNG PROJECTS (Dự án)
-- ================================================================
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    client VARCHAR(200) NULL,
    commander VARCHAR(100) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code),
    INDEX idx_status (status)
);

-- ================================================================
-- 4. BẢNG VENDORS (Nhà cung cấp)
-- ================================================================
CREATE TABLE IF NOT EXISTS vendors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    vendor_group VARCHAR(100) NULL,
    contact VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    payment_term VARCHAR(50) NULL,
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code)
);

-- ================================================================
-- 5. BẢNG ITEMS (Vật tư)
-- ================================================================
CREATE TABLE IF NOT EXISTS items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    item_group VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    unit VARCHAR(20) NULL,
    standard_price DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code),
    INDEX idx_status (status)
);

-- ================================================================
-- 6. BẢNG MR (Material Request)
-- ================================================================
CREATE TABLE IF NOT EXISTS mr (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    items JSON NOT NULL, -- [{itemId, quantity}]
    need_date DATE NULL,
    purpose TEXT NULL,
    requester VARCHAR(100) NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (code),
    INDEX idx_project_code (project_code),
    INDEX idx_status (status)
);

-- ================================================================
-- 7. BẢNG PR (Purchase Request)
-- ================================================================
CREATE TABLE IF NOT EXISTS pr (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    mr_id BIGINT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL, -- [{itemId, quantity, price?}]
    status VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT DEFAULT 1,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (code),
    INDEX idx_project_code (project_code),
    INDEX idx_status (status),
    INDEX idx_mr_id (mr_id)
);

-- ================================================================
-- 8. BẢNG PO (Purchase Order)
-- ================================================================
CREATE TABLE IF NOT EXISTS po (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    pr_id BIGINT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL, -- [{itemId, quantity, price?}]
    status VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT DEFAULT 1,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (code),
    INDEX idx_project_code (project_code),
    INDEX idx_status (status),
    INDEX idx_pr_id (pr_id)
);

-- ================================================================
-- 9. BẢNG WAREHOUSES (Kho)
-- ================================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) DEFAULT 'CENTRAL', -- CENTRAL, SITE
    project_id BIGINT NULL,
    manager VARCHAR(100) NULL,
    address TEXT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code),
    INDEX idx_project_id (project_id),
    INDEX idx_status (status)
);

-- ================================================================
-- 10. BẢNG INVENTORY (Tồn kho)
-- ================================================================
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity DECIMAL(15,2) DEFAULT 0,
    updated_at DATE NULL,
    UNIQUE KEY uk_warehouse_item (warehouse_id, item_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_item_id (item_id)
);

-- ================================================================
-- 11. BẢNG GRN (Goods Receipt Note - Nhập kho)
-- ================================================================
CREATE TABLE IF NOT EXISTS grn (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    po_id BIGINT NULL,
    project_code VARCHAR(50) NULL,
    project_name VARCHAR(200) NULL,
    warehouse_id BIGINT NOT NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL, -- [{itemId, poQty, actualQty, diff, serial, condition}]
    receipt_date DATE NULL,
    receiver VARCHAR(100) NULL,
    warehouse_staff VARCHAR(100) NULL,
    qc_confirm VARCHAR(100) NULL,
    accountant_confirm VARCHAR(100) NULL,
    invoice VARCHAR(100) NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code),
    INDEX idx_po_id (po_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_status (status)
);

-- ================================================================
-- 12. BẢNG STO (Stock Transfer Order - Chuyển kho)
-- ================================================================
CREATE TABLE IF NOT EXISTS sto (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id BIGINT NOT NULL,
    to_warehouse_id BIGINT NOT NULL,
    project_code VARCHAR(50) NULL,
    project_name VARCHAR(200) NULL,
    items JSON NOT NULL, -- [{itemId, requestedQty, actualQty}]
    transfer_date DATE NULL,
    requested_by VARCHAR(100) NULL,
    approved_by VARCHAR(100) NULL,
    warehouse_staff VARCHAR(100) NULL,
    transporter VARCHAR(100) NULL,
    departure_time VARCHAR(10) NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (code),
    INDEX idx_from_warehouse (from_warehouse_id),
    INDEX idx_to_warehouse (to_warehouse_id),
    INDEX idx_status (status)
);

-- ================================================================
-- 13. BẢNG ISSUE (Cấp phát vật tư)
-- ================================================================
CREATE TABLE IF NOT EXISTS issues (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    date DATE NULL,
    area VARCHAR(200) NULL,
    team VARCHAR(100) NULL,
    requester VARCHAR(100) NULL,
    items JSON NOT NULL, -- [{itemId, requestedQty, actualQty, condition}]
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    approved_by VARCHAR(100) NULL,
    completed_by VARCHAR(100) NULL,
    confirmed_by VARCHAR(100) NULL,
    completion_date DATE NULL,
    warehouse_id BIGINT NULL,
    note TEXT NULL,
    INDEX idx_code (code),
    INDEX idx_project_code (project_code),
    INDEX idx_status (status)
);

-- ================================================================
-- 14. BẢNG MATERIAL_RETURNS (Hoàn trả vật tư)
-- ================================================================
CREATE TABLE IF NOT EXISTS material_returns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    return_date DATE NULL,
    warehouse_id BIGINT NOT NULL,
    return_from VARCHAR(200) NULL,
    items JSON NOT NULL, -- [{itemId, requestedQty, actualQty, condition, note}]
    returner VARCHAR(100) NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    approved_by VARCHAR(100) NULL,
    confirmed_by VARCHAR(100) NULL,
    completion_date DATE NULL,
    note TEXT NULL,
    INDEX idx_code (code),
    INDEX idx_project_code (project_code),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_status (status)
);

-- ================================================================
-- 15. BẢNG MIN_STOCK (Ngưỡng tồn kho tối thiểu)
-- ================================================================
CREATE TABLE IF NOT EXISTS min_stock (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    min_quantity DECIMAL(15,2) DEFAULT 0,
    updated_at DATE NULL,
    UNIQUE KEY uk_warehouse_item (warehouse_id, item_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_item_id (item_id)
);

-- ================================================================
-- 16. BẢNG AUTO_REORDER_CONFIG (Cấu hình đặt hàng tự động)
-- ================================================================
CREATE TABLE IF NOT EXISTS auto_reorder_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    enabled BOOLEAN DEFAULT FALSE,
    multiplier DECIMAL(5,2) DEFAULT 2.0,
    default_vendor_code VARCHAR(50) NULL,
    updated_at DATE NULL
);

-- ================================================================
-- 17. BẢNG WORKFLOWS (Cấu hình luồng duyệt)
-- ================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    steps JSON NOT NULL, -- [{step, role, label}]
    updated_at DATE NULL
);

-- ================================================================
-- 18. BẢNG PERMISSIONS (Phân quyền theo role)
-- ================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uk_role_permission (role, permission_key),
    INDEX idx_role (role)
);

-- ================================================================
-- 19. BẢNG USER_PERMISSIONS (Phân quyền riêng theo user)
-- ================================================================
CREATE TABLE IF NOT EXISTS user_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uk_user_permission (user_id, permission_key),
    INDEX idx_user_id (user_id)
);

-- ================================================================
-- 20. BẢNG AUTO_REORDER_RULES (Quy tắc đặt hàng tự động - nâng cao)
-- ================================================================
CREATE TABLE IF NOT EXISTS auto_reorder_rules (
    id VARCHAR(50) PRIMARY KEY,
    item_id BIGINT NOT NULL,
    item_name VARCHAR(200) NULL,
    unit VARCHAR(20) NULL,
    warehouse_id BIGINT NULL,
    min_stock DECIMAL(15,2) DEFAULT 0,
    reorder_quantity DECIMAL(15,2) DEFAULT 0,
    vendor_id VARCHAR(50) NULL,
    order_type VARCHAR(20) DEFAULT 'PR',
    enabled BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    INDEX idx_item_id (item_id),
    INDEX idx_warehouse_id (warehouse_id)
);

-- ================================================================
-- THÊM KHÓA NGOẠI (Foreign Keys)
-- ================================================================

ALTER TABLE users ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE warehouses ADD CONSTRAINT fk_warehouses_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE inventory ADD CONSTRAINT fk_inventory_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;
ALTER TABLE inventory ADD CONSTRAINT fk_inventory_item
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE min_stock ADD CONSTRAINT fk_minstock_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;
ALTER TABLE min_stock ADD CONSTRAINT fk_minstock_item
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE user_permissions ADD CONSTRAINT fk_userperm_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ================================================================
-- DỮ LIỆU MẪU CƠ BẢN
-- ================================================================

-- ================================================================
-- BƯỚC 2: DEPARTMENTS
-- ================================================================
INSERT INTO departments (id, code, name, manager_id, manager_name, created_at, updated_at) VALUES
(1, 'ADMIN', 'Ban Giám đốc', 1, 'Admin System', CURDATE(), CURDATE()),
(2, 'PLANNING', 'Phòng Kế hoạch', NULL, 'Lê Văn Hoàng', CURDATE(), CURDATE()),
(3, 'PROJECT', 'Phòng Dự án', NULL, 'Trần Văn Đức', CURDATE(), CURDATE()),
(4, 'CEO', 'Tổng Giám đốc', NULL, 'Nguyễn Văn Tùng', CURDATE(), CURDATE()),
(5, 'PURCHASING', 'Phòng Mua hàng', NULL, 'Nguyễn Thị Hoa', CURDATE(), CURDATE()),
(6, 'SITE', 'Ban Chỉ huy công trường', NULL, 'Đặng Văn Quân', CURDATE(), CURDATE()),
(7, 'QC', 'Phòng QC', NULL, 'Phạm Văn Chất', CURDATE(), CURDATE());

-- ================================================================
-- BƯỚC 3: USERS
-- ================================================================
UPDATE users SET department_id = 1 WHERE id = 1;

INSERT INTO users (id, email, password, name, role, department_id, position, created_at, updated_at) VALUES
(2, 'ceo@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Nguyễn Văn Tùng', 'CEO', 1, 'Tổng Giám đốc', CURDATE(), CURDATE()),
(3, 'director@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Trần Thị Mai', 'CEO', 1, 'Phó Tổng Giám đốc', CURDATE(), CURDATE()),
(4, 'planning@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Lê Văn Hoàng', 'PLANNING', 2, 'Trưởng phòng Kế hoạch', CURDATE(), CURDATE()),
(5, 'planning1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Phạm Minh Tuấn', 'PLANNING', 2, 'Chuyên viên Kế hoạch', CURDATE(), CURDATE()),
(6, 'planning2@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Ngô Thị Lan', 'PLANNING', 2, 'Chuyên viên Kế hoạch', CURDATE(), CURDATE()),
(7, 'project@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Trần Văn Đức', 'PROJECT', 3, 'Trưởng phòng Dự án', CURDATE(), CURDATE()),
(8, 'project1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Lương Văn Hải', 'PROJECT', 3, 'Kỹ sư Dự án', CURDATE(), CURDATE()),
(9, 'project2@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Vũ Thị Hương', 'PROJECT', 3, 'Kỹ sư Dự án', CURDATE(), CURDATE()),
(10, 'purchasing@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Nguyễn Thị Hoa', 'PURCHASING', 5, 'Trưởng phòng Mua hàng', CURDATE(), CURDATE()),
(11, 'purchasing1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Hoàng Văn Nam', 'PURCHASING', 5, 'Chuyên viên Mua hàng', CURDATE(), CURDATE()),
(12, 'purchasing2@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Phan Thị Thanh', 'PURCHASING', 5, 'Chuyên viên Mua hàng', CURDATE(), CURDATE()),
(13, 'commander@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Đặng Văn Quân', 'SITE_COMMANDER', 6, 'Chỉ huy trưởng', CURDATE(), CURDATE()),
(14, 'commander1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Nguyễn Văn Hùng', 'SITE_COMMANDER', 6, 'Phó Chỉ huy', CURDATE(), CURDATE()),
(15, 'site1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Trần Văn Long', 'SITE_COMMANDER', 6, 'Kỹ sư công trường', CURDATE(), CURDATE()),
(16, 'site2@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Lê Thị Thu', 'SITE_COMMANDER', 6, 'Kỹ sư công trường', CURDATE(), CURDATE()),
(17, 'qc@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Phạm Văn Chất', 'QC', 7, 'Trưởng phòng QC', CURDATE(), CURDATE()),
(18, 'qc1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Nguyễn Minh Anh', 'QC', 7, 'Chuyên viên QC', CURDATE(), CURDATE()),
(19, 'qc2@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Trần Văn Kiểm', 'QC', 7, 'Chuyên viên QC', CURDATE(), CURDATE()),
(20, 'staff1@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Nguyễn Văn A', 'PURCHASING', NULL, 'Thực tập sinh', CURDATE(), CURDATE()),
(21, 'staff2@mep.com', '$2a$10$nXZxW5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', 'Trần Thị B', 'PLANNING', NULL, 'Thực tập sinh', CURDATE(), CURDATE());

-- ================================================================
-- BƯỚC 4: CÁC BẢNG KHÁC (Projects, Vendors, Items, Warehouses, Inventory...)
-- ================================================================

-- 4.1 PROJECTS
INSERT INTO projects (id, code, name, client, commander, start_date, end_date, status, note, created_at, updated_at) VALUES
(1, 'DA001', 'Khu đô thị Xanh', 'CĐT ABC', 'Nguyễn Văn A', '2025-01-01', '2025-12-31', 'ACTIVE', '', CURDATE(), CURDATE()),
(2, 'DA002', 'Nhà máy thép Mỹ Đình', 'Tổng thầu DEF', 'Trần Văn B', '2025-03-01', '2025-09-30', 'ACTIVE', '', CURDATE(), CURDATE()),
(3, 'DA003', 'Khu công nghiệp X', 'CĐT XYZ', 'Lê Văn C', '2025-05-01', '2026-04-30', 'ACTIVE', '', CURDATE(), CURDATE()),
(4, 'DA004', 'Trung tâm thương mại Sài Gòn', 'CĐT VinGroup', 'Phạm Văn D', '2025-06-01', '2026-05-31', 'ACTIVE', 'Dự án mới', CURDATE(), CURDATE());

-- 4.2 VENDORS
INSERT INTO vendors (id, code, name, vendor_group, contact, phone, email, payment_term, note, created_at, updated_at) VALUES
(1, 'NCC001', 'Công ty Thép Việt', 'Thép', 'Ms. Hoa', '0912345678', 'hoa@thepviet.com', '30 ngày', '', CURDATE(), CURDATE()),
(2, 'NCC002', 'Điện lực Hà Nội', 'Điện', 'Mr. Tuấn', '0987654321', 'tuan@dienluc.com', '45 ngày', '', CURDATE(), CURDATE()),
(3, 'NCC003', 'Vật tư xây dựng Hoàng Gia', 'VLXD', 'Mr. Hùng', '0909090909', 'hung@hoanggia.com', '15 ngày', '', CURDATE(), CURDATE()),
(4, 'NCC004', 'Công ty Cáp Điện Ánh Sáng', 'Điện', 'Ms. Lan', '0912345678', 'lan@anhsang.com', '30 ngày', '', CURDATE(), CURDATE()),
(5, 'NCC005', 'Xi măng Hà Tiên', 'VLXD', 'Mr. Minh', '0933333333', 'minh@hatien.com', '60 ngày', 'Nhà cung cấp chính', CURDATE(), CURDATE());

-- 4.3 ITEMS
INSERT INTO items (id, code, name, item_group, model, unit, standard_price, status, note, created_at, updated_at) VALUES
(1, 'VT001', 'Ống thép phi 21', 'Thép', 'DN21', 'cây', 150000, 'ACTIVE', '', CURDATE(), CURDATE()),
(2, 'VT002', 'Cáp điện 2x1.5', 'Điện', 'CVV 2x1.5', 'mét', 12000, 'ACTIVE', '', CURDATE(), CURDATE()),
(3, 'VT003', 'Đèn LED 30W', 'Điện', 'LED-30W', 'cái', 250000, 'ACTIVE', '', CURDATE(), CURDATE()),
(4, 'VT004', 'Xi măng PCB40', 'VLXD', 'PCB40', 'bao', 80000, 'ACTIVE', '', CURDATE(), CURDATE()),
(5, 'VT005', 'Sắt thép phi 12', 'Thép', 'D12', 'kg', 15000, 'ACTIVE', '', CURDATE(), CURDATE()),
(6, 'VT006', 'Cáp điện 3x2.5', 'Điện', 'CVV 3x2.5', 'mét', 18000, 'ACTIVE', '', CURDATE(), CURDATE()),
(7, 'VT007', 'Đèn LED 50W', 'Điện', 'LED-50W', 'cái', 350000, 'ACTIVE', 'Đèn công suất lớn', CURDATE(), CURDATE()),
(8, 'VT008', 'Ống thép phi 27', 'Thép', 'DN27', 'cây', 200000, 'ACTIVE', '', CURDATE(), CURDATE()),
(9, 'VT009', 'Gạch ốp lát', 'VLXD', 'Gạch men', 'viên', 50000, 'ACTIVE', '', CURDATE(), CURDATE()),
(10, 'VT010', 'Sơn tường', 'VLXD', 'Sơn nội thất', 'thùng', 450000, 'ACTIVE', '', CURDATE(), CURDATE());

-- 4.4 WAREHOUSES
INSERT INTO warehouses (id, code, name, type, project_id, manager, address, status, note, created_at, updated_at) VALUES
(1, 'KHO_TONG', 'Kho tổng', 'CENTRAL', NULL, 'Nguyễn Văn Kho', '123 Đường ABC, Quận 1, TP.HCM', 'ACTIVE', '', CURDATE(), CURDATE()),
(2, 'KHO_DA001', 'Kho dự án - Khu đô thị Xanh', 'SITE', 1, 'Thủ kho Khu đô thị Xanh', 'Địa chỉ công trường Khu đô thị Xanh', 'ACTIVE', '', CURDATE(), CURDATE()),
(3, 'KHO_DA002', 'Kho dự án - Nhà máy thép Mỹ Đình', 'SITE', 2, 'Thủ kho Nhà máy thép', 'Địa chỉ công trường Nhà máy thép Mỹ Đình', 'ACTIVE', '', CURDATE(), CURDATE()),
(4, 'KHO_DA003', 'Kho dự án - Khu công nghiệp X', 'SITE', 3, 'Thủ kho Khu công nghiệp X', 'Địa chỉ công trường Khu công nghiệp X', 'ACTIVE', '', CURDATE(), CURDATE());

-- 4.5 INVENTORY
INSERT INTO inventory (warehouse_id, item_id, quantity, updated_at) VALUES
(1, 1, 150, CURDATE()),
(1, 2, 200, CURDATE()),
(1, 3, 50, CURDATE()),
(1, 4, 100, CURDATE()),
(1, 5, 500, CURDATE()),
(1, 6, 80, CURDATE()),
(1, 7, 30, CURDATE()),
(1, 8, 60, CURDATE()),
(1, 9, 200, CURDATE()),
(1, 10, 40, CURDATE()),
(2, 1, 20, CURDATE()),
(2, 2, 50, CURDATE()),
(2, 4, 30, CURDATE()),
(2, 6, 10, CURDATE()),
(3, 2, 30, CURDATE()),
(3, 3, 15, CURDATE()),
(3, 5, 100, CURDATE()),
(3, 7, 5, CURDATE()),
(4, 5, 200, CURDATE()),
(4, 8, 20, CURDATE()),
(4, 9, 50, CURDATE());

-- 4.6 MR
INSERT INTO mr (id, code, project_code, project_name, items, need_date, purpose, requester, status, created_by, created_by_name, created_at, updated_at, note) VALUES
(1, 'MR-001', 'DA001', 'Khu đô thị Xanh', '[{"itemId":1,"quantity":20},{"itemId":2,"quantity":50},{"itemId":4,"quantity":100}]', '2025-02-15', 'Lắp đặt hệ thống cấp thoát nước', 'Nguyễn Văn A', 'APPROVED', 13, 'Chỉ huy trưởng', '2025-01-10', '2025-01-10', ''),
(2, 'MR-002', 'DA002', 'Nhà máy thép Mỹ Đình', '[{"itemId":2,"quantity":100},{"itemId":3,"quantity":20}]', '2025-04-01', 'Cấp điện cho dây chuyền sản xuất', 'Trần Văn B', 'APPROVED', 13, 'Chỉ huy trưởng', '2025-01-12', '2025-01-12', ''),
(3, 'MR-003', 'DA003', 'Khu công nghiệp X', '[{"itemId":5,"quantity":500}]', '2025-06-01', 'Xây dựng nhà xưởng', 'Lê Văn C', 'PENDING', 13, 'Chỉ huy trưởng', '2025-01-15', '2025-01-15', ''),
(4, 'MR-004', 'DA004', 'Trung tâm thương mại Sài Gòn', '[{"itemId":7,"quantity":10},{"itemId":8,"quantity":30}]', '2025-07-01', 'Lắp đặt hệ thống chiếu sáng', 'Phạm Văn D', 'DRAFT', 13, 'Chỉ huy trưởng', '2025-01-20', '2025-01-20', 'Chờ duyệt');

-- 4.7 PR
INSERT INTO pr (id, code, mr_id, project_code, project_name, vendor_code, vendor_name, items, status, approval_step, created_by, created_by_name, created_at, updated_at, note) VALUES
(1, 'PR-001', 1, 'DA001', 'Khu đô thị Xanh', 'NCC001', 'Công ty Thép Việt', '[{"itemId":1,"quantity":20},{"itemId":2,"quantity":50},{"itemId":4,"quantity":100}]', 'APPROVED', 3, 10, 'Mua hàng', '2025-01-11', '2025-01-11', ''),
(2, 'PR-002', 2, 'DA002', 'Nhà máy thép Mỹ Đình', 'NCC002', 'Điện lực Hà Nội', '[{"itemId":2,"quantity":100},{"itemId":3,"quantity":20}]', 'PENDING', 1, 10, 'Mua hàng', '2025-01-13', '2025-01-13', ''),
(3, 'PR-003', NULL, 'DA003', 'Khu công nghiệp X', 'NCC003', 'Vật tư xây dựng Hoàng Gia', '[{"itemId":5,"quantity":500}]', 'DRAFT', 1, 10, 'Mua hàng', '2025-01-16', '2025-01-16', 'Tạo thủ công'),
(4, 'PR-004', 4, 'DA004', 'Trung tâm thương mại Sài Gòn', 'NCC004', 'Công ty Cáp Điện Ánh Sáng', '[{"itemId":7,"quantity":10},{"itemId":8,"quantity":30}]', 'PENDING', 2, 10, 'Mua hàng', '2025-01-21', '2025-01-21', 'Đang chờ duyệt');

-- 4.8 PO
INSERT INTO po (id, code, pr_id, project_code, project_name, vendor_code, vendor_name, items, status, approval_step, created_by, created_by_name, created_at, updated_at, note) VALUES
(1, 'PO-001', 1, 'DA001', 'Khu đô thị Xanh', 'NCC001', 'Công ty Thép Việt', '[{"itemId":1,"quantity":20},{"itemId":2,"quantity":50},{"itemId":4,"quantity":100}]', 'APPROVED', 3, 10, 'Mua hàng', '2025-01-12', '2025-01-12', ''),
(2, 'PO-002', 2, 'DA002', 'Nhà máy thép Mỹ Đình', 'NCC002', 'Điện lực Hà Nội', '[{"itemId":2,"quantity":100},{"itemId":3,"quantity":20}]', 'PENDING', 2, 10, 'Mua hàng', '2025-01-14', '2025-01-14', ''),
(3, 'PO-003', NULL, 'DA003', 'Khu công nghiệp X', 'NCC003', 'Vật tư xây dựng Hoàng Gia', '[{"itemId":5,"quantity":500}]', 'DRAFT', 1, 10, 'Mua hàng', '2025-01-17', '2025-01-17', 'Tạo thủ công'),
(4, 'PO-004', 4, 'DA004', 'Trung tâm thương mại Sài Gòn', 'NCC004', 'Công ty Cáp Điện Ánh Sáng', '[{"itemId":7,"quantity":10},{"itemId":8,"quantity":30}]', 'PENDING', 1, 10, 'Mua hàng', '2025-01-22', '2025-01-22', 'Chờ duyệt');

-- 4.9 GRN
INSERT INTO grn (id, code, po_id, project_code, project_name, warehouse_id, vendor_code, vendor_name, items, receipt_date, receiver, warehouse_staff, qc_confirm, accountant_confirm, invoice, status, note, created_at, updated_at) VALUES
(1, 'GRN-001', 1, 'DA001', 'Khu đô thị Xanh', 1, 'NCC001', 'Công ty Thép Việt', '[{"itemId":1,"poQty":20,"actualQty":20,"diff":0,"serial":"SER001","condition":"GOOD"},{"itemId":2,"poQty":50,"actualQty":48,"diff":-2,"serial":"SER002","condition":"GOOD"},{"itemId":4,"poQty":100,"actualQty":100,"diff":0,"serial":"SER003","condition":"GOOD"}]', '2025-01-15', 'Nguyễn Văn Nhận', 'Thủ kho A', 'QC Nguyễn', 'Kế toán Lê', 'INV-001', 'COMPLETED', '', '2025-01-15', '2025-01-15'),
(2, 'GRN-002', 2, 'DA002', 'Nhà máy thép Mỹ Đình', 2, 'NCC002', 'Điện lực Hà Nội', '[{"itemId":2,"poQty":100,"actualQty":95,"diff":-5,"serial":"SER004","condition":"GOOD"},{"itemId":3,"poQty":20,"actualQty":20,"diff":0,"serial":"SER005","condition":"GOOD"}]', '2025-01-18', 'Trần Văn Nhận', 'Thủ kho B', '', '', 'INV-002', 'RECEIVED', 'Đang chờ QC kiểm tra chất lượng', '2025-01-18', '2025-01-18'),
(3, 'GRN-003', 1, 'DA001', 'Khu đô thị Xanh', 1, 'NCC001', 'Công ty Thép Việt', '[{"itemId":1,"poQty":10,"actualQty":10,"diff":0,"serial":"SER006","condition":"GOOD"},{"itemId":4,"poQty":50,"actualQty":48,"diff":-2,"serial":"SER007","condition":"GOOD"}]', '2025-08-20', 'Phạm Văn Nhận', 'Thủ kho C', 'QC Trần', '', 'INV-003', 'QC_CHECKED', 'QC đã kiểm tra, chất lượng đạt yêu cầu', '2025-08-20', '2025-08-20'),
(4, 'GRN-004', 4, 'DA004', 'Trung tâm thương mại Sài Gòn', 3, 'NCC004', 'Công ty Cáp Điện Ánh Sáng', '[{"itemId":7,"poQty":10,"actualQty":10,"diff":0,"serial":"SER008","condition":"GOOD"},{"itemId":8,"poQty":30,"actualQty":28,"diff":-2,"serial":"SER009","condition":"GOOD"}]', '2025-01-25', 'Lê Văn Nhận', 'Thủ kho D', '', '', 'INV-004', 'DRAFT', 'Chờ nhận hàng', '2025-01-23', '2025-01-23');

-- 4.10 STO
INSERT INTO sto (id, code, from_warehouse_id, to_warehouse_id, project_code, project_name, items, transfer_date, requested_by, approved_by, warehouse_staff, transporter, departure_time, status, note, created_at, updated_at) VALUES
(1, 'STO-001', 1, 2, 'DA001', 'Khu đô thị Xanh', '[{"itemId":1,"requestedQty":10,"actualQty":10},{"itemId":2,"requestedQty":20,"actualQty":20}]', '2025-01-16', 'Nguyễn Văn Yêu', 'Trần Văn Duyệt', 'Thủ kho Xuất', 'Công ty Vận tải Z', '08:30', 'COMPLETED', '', '2025-01-16', '2025-01-16'),
(2, 'STO-002', 1, 3, 'DA003', 'Khu công nghiệp X', '[{"itemId":5,"requestedQty":200,"actualQty":200}]', '2025-01-20', 'Lê Văn Yêu', NULL, 'Thủ kho Xuất', 'Công ty Vận tải H', '09:00', 'PENDING', 'Chờ duyệt', '2025-01-20', '2025-01-20'),
(3, 'STO-003', 2, 4, 'DA004', 'Trung tâm thương mại Sài Gòn', '[{"itemId":8,"requestedQty":15,"actualQty":15},{"itemId":9,"requestedQty":30,"actualQty":30}]', '2025-01-26', 'Phạm Văn Yêu', NULL, 'Thủ kho Xuất', '', '10:30', 'DRAFT', '', '2025-01-25', '2025-01-25');

-- 4.11 ISSUES (đã sửa completion_date)
INSERT INTO issues (id, code, project_code, project_name, date, area, team, requester, items, status, created_by, created_by_name, created_at, updated_at, approved_by, completed_by, confirmed_by, completion_date, warehouse_id, note) VALUES
(1, 'ISS-001', 'DA001', 'Khu đô thị Xanh', '2025-01-20', 'Khu A - Lắp đặt hệ thống điện', 'Đội điện 1', 'Nguyễn Văn A', '[{"itemId":1,"requestedQty":10,"actualQty":10,"condition":"Tốt"},{"itemId":2,"requestedQty":50,"actualQty":48,"condition":"Tốt"}]', 'CONFIRMED', 13, 'Chỉ huy trưởng', '2025-01-18', '2025-01-20', 'Chỉ huy trưởng', 'Thủ kho Nguyễn', 'Chỉ huy trưởng', '2025-01-20', 2, 'Cấp phát cho đội điện thi công khu A'),
(2, 'ISS-002', 'DA002', 'Nhà máy thép Mỹ Đình', '2025-01-22', 'Phân xưởng 1', 'Đội cơ khí', 'Trần Văn B', '[{"itemId":3,"requestedQty":5,"actualQty":5,"condition":"Tốt"},{"itemId":5,"requestedQty":100,"actualQty":100,"condition":"Tốt"}]', 'PENDING', 13, 'Chỉ huy trưởng', '2025-01-21', '2025-01-21', NULL, NULL, NULL, NULL, NULL, 'Cấp phát cho đội cơ khí'),
(3, 'ISS-003', 'DA003', 'Khu công nghiệp X', '2025-01-25', 'Nhà xưởng 1', 'Đội xây dựng', 'Lê Văn C', '[{"itemId":5,"requestedQty":200,"actualQty":200,"condition":"Tốt"},{"itemId":8,"requestedQty":10,"actualQty":10,"condition":"Tốt"}]', 'APPROVED', 13, 'Chỉ huy trưởng', '2025-01-23', '2025-01-24', 'Chỉ huy trưởng', NULL, NULL, NULL, NULL, 'Chờ thủ kho cấp phát'),
(4, 'ISS-004', 'DA004', 'Trung tâm thương mại Sài Gòn', '2025-01-28', 'Khu vực chiếu sáng', 'Đội điện 2', 'Phạm Văn D', '[{"itemId":7,"requestedQty":8,"actualQty":8,"condition":"Mới"},{"itemId":9,"requestedQty":50,"actualQty":50,"condition":"Tốt"}]', 'DRAFT', 13, 'Chỉ huy trưởng', '2025-01-27', '2025-01-27', NULL, NULL, NULL, NULL, NULL, 'Chờ duyệt');

-- 4.12 MATERIAL_RETURNS (đã sửa completion_date)
INSERT INTO material_returns (id, code, project_code, project_name, return_date, warehouse_id, return_from, items, returner, status, created_by, created_by_name, created_at, updated_at, approved_by, confirmed_by, completion_date, note) VALUES
(1, 'MRET-001', 'DA001', 'Khu đô thị Xanh', '2025-01-20', 1, 'Đội thi công 1 - Khu A', '[{"itemId":1,"requestedQty":5,"actualQty":5,"condition":"Tốt","note":""},{"itemId":2,"requestedQty":10,"actualQty":8,"condition":"Đã qua sử dụng","note":"Còn mới 80%"}]', 'Nguyễn Văn A', 'CONFIRMED', 13, 'Chỉ huy trưởng', '2025-01-18', '2025-01-20', 'Thủ kho Nguyễn', 'Chỉ huy trưởng', '2025-01-20', 'Hoàn trả vật tư thừa sau thi công'),
(2, 'MRET-002', 'DA002', 'Nhà máy thép Mỹ Đình', '2025-01-22', 2, 'Đội cơ khí - Phân xưởng 1', '[{"itemId":3,"requestedQty":2,"actualQty":2,"condition":"Mới","note":""},{"itemId":5,"requestedQty":50,"actualQty":50,"condition":"Tốt","note":""}]', 'Trần Văn B', 'PENDING', 13, 'Chỉ huy trưởng', '2025-01-21', '2025-01-21', NULL, NULL, NULL, 'Hoàn trả vật tư chưa sử dụng hết'),
(3, 'MRET-003', 'DA003', 'Khu công nghiệp X', '2025-01-26', 3, 'Đội xây dựng - Nhà xưởng 1', '[{"itemId":5,"requestedQty":30,"actualQty":30,"condition":"Tốt","note":""}]', 'Lê Văn C', 'APPROVED', 13, 'Chỉ huy trưởng', '2025-01-24', '2025-01-25', 'Thủ kho Nguyễn', NULL, NULL, 'Chờ xác nhận hoàn tất'),
(4, 'MRET-004', 'DA004', 'Trung tâm thương mại Sài Gòn', '2025-01-29', 4, 'Đội điện 2 - Khu vực chiếu sáng', '[{"itemId":7,"requestedQty":3,"actualQty":3,"condition":"Mới","note":""}]', 'Phạm Văn D', 'DRAFT', 13, 'Chỉ huy trưởng', '2025-01-28', '2025-01-28', NULL, NULL, NULL, 'Chờ thủ kho nhận');

-- 4.13 MIN_STOCK
INSERT INTO min_stock (warehouse_id, item_id, min_quantity, updated_at) VALUES
(1, 1, 10, CURDATE()),
(1, 2, 30, CURDATE()),
(1, 3, 5, CURDATE()),
(1, 4, 20, CURDATE()),
(1, 5, 50, CURDATE()),
(1, 6, 15, CURDATE()),
(1, 7, 10, CURDATE()),
(2, 1, 5, CURDATE()),
(2, 2, 15, CURDATE()),
(2, 4, 10, CURDATE()),
(3, 2, 20, CURDATE()),
(3, 3, 10, CURDATE()),
(3, 5, 50, CURDATE()),
(4, 5, 30, CURDATE()),
(4, 8, 10, CURDATE());

-- 4.14 AUTO_REORDER_RULES
INSERT INTO auto_reorder_rules (id, item_id, item_name, unit, warehouse_id, min_stock, reorder_quantity, vendor_id, order_type, enabled, notes, created_at, updated_at) VALUES
('ar_001', 1, 'Ống thép phi 21', 'cây', 1, 10, 20, 'NCC001', 'PR', TRUE, 'Tự động đặt khi tồn dưới 10', NOW(), NOW()),
('ar_002', 2, 'Cáp điện 2x1.5', 'mét', 2, 15, 30, 'NCC002', 'PR', TRUE, '', NOW(), NOW()),
('ar_003', 5, 'Sắt thép phi 12', 'kg', 4, 30, 100, 'NCC003', 'PR', TRUE, 'Ưu tiên NCC003', NOW(), NOW());

-- 4.15 WORKFLOWS
INSERT INTO workflows (module, name, steps, updated_at) VALUES
('mr', 'MR (Material Request)', '[{"step":1,"role":"SITE_COMMANDER","label":"Chỉ huy trưởng duyệt"}]', CURDATE()),
('pr', 'PR (Purchase Request)', '[{"step":1,"role":"PLANNING","label":"Phòng Kế hoạch"},{"step":2,"role":"PROJECT","label":"Phòng Dự án"},{"step":3,"role":"CEO","label":"Tổng Giám đốc"}]', CURDATE()),
('po', 'PO (Purchase Order)', '[{"step":1,"role":"PLANNING","label":"Phòng Kế hoạch"},{"step":2,"role":"PROJECT","label":"Phòng Dự án"},{"step":3,"role":"CEO","label":"Tổng Giám đốc"}]', CURDATE()),
('sto', 'STO (Stock Transfer Order)', '[{"step":1,"role":"PURCHASING","label":"Phòng Mua hàng"}]', CURDATE()),
('grn', 'GRN (Goods Receipt Note)', '[{"step":1,"role":"PURCHASING","label":"Thủ kho nhận"},{"step":2,"role":"QC","label":"QC kiểm tra"},{"step":3,"role":"PURCHASING","label":"Hoàn thành nhập kho"}]', CURDATE()),
('issue', 'Cấp phát vật tư', '[{"step":1,"role":"SITE_COMMANDER","label":"Chỉ huy trưởng duyệt"},{"step":2,"role":"PURCHASING","label":"Thủ kho cấp phát"},{"step":3,"role":"SITE_COMMANDER","label":"Xác nhận hoàn tất"}]', CURDATE()),
('materialreturn', 'Hoàn trả vật tư', '[{"step":1,"role":"SITE_COMMANDER","label":"Chỉ huy trưởng tạo"},{"step":2,"role":"PURCHASING","label":"Thủ kho nhận"},{"step":3,"role":"SITE_COMMANDER","label":"Xác nhận hoàn tất"}]', CURDATE());

-- 4.16 AUTO_REORDER_CONFIG
INSERT INTO auto_reorder_config (enabled, multiplier, default_vendor_code, updated_at) VALUES
(FALSE, 2.0, 'NCC001', CURDATE());

-- 4.17 PERMISSIONS
INSERT INTO permissions (role, permission_key, enabled) VALUES
('ADMIN', 'dashboard.view', TRUE),
('ADMIN', 'mr.view', TRUE),
('ADMIN', 'mr.create', TRUE),
('ADMIN', 'mr.edit', TRUE),
('ADMIN', 'mr.delete', TRUE),
('ADMIN', 'mr.approve', TRUE),
('ADMIN', 'pr.view', TRUE),
('ADMIN', 'pr.create', TRUE),
('ADMIN', 'pr.edit', TRUE),
('ADMIN', 'pr.delete', TRUE),
('ADMIN', 'pr.approve', TRUE),
('ADMIN', 'po.view', TRUE),
('ADMIN', 'po.create', TRUE),
('ADMIN', 'po.edit', TRUE),
('ADMIN', 'po.delete', TRUE),
('ADMIN', 'po.approve', TRUE),
('ADMIN', 'inventory.view', TRUE),
('ADMIN', 'inventory.edit', TRUE),
('ADMIN', 'inventory.delete', TRUE),
('ADMIN', 'grn.view', TRUE),
('ADMIN', 'grn.create', TRUE),
('ADMIN', 'grn.edit', TRUE),
('ADMIN', 'grn.delete', TRUE),
('ADMIN', 'grn.receive', TRUE),
('ADMIN', 'grn.qc', TRUE),
('ADMIN', 'grn.complete', TRUE),
('ADMIN', 'sto.view', TRUE),
('ADMIN', 'sto.create', TRUE),
('ADMIN', 'sto.edit', TRUE),
('ADMIN', 'sto.delete', TRUE),
('ADMIN', 'sto.submit', TRUE),
('ADMIN', 'sto.approve', TRUE),
('ADMIN', 'sto.complete', TRUE),
('ADMIN', 'issue.view', TRUE),
('ADMIN', 'issue.create', TRUE),
('ADMIN', 'issue.edit', TRUE),
('ADMIN', 'issue.delete', TRUE),
('ADMIN', 'issue.submit', TRUE),
('ADMIN', 'issue.approve', TRUE),
('ADMIN', 'issue.complete', TRUE),
('ADMIN', 'issue.confirm', TRUE),
('ADMIN', 'materialreturn.view', TRUE),
('ADMIN', 'materialreturn.create', TRUE),
('ADMIN', 'materialreturn.edit', TRUE),
('ADMIN', 'materialreturn.delete', TRUE),
('ADMIN', 'materialreturn.submit', TRUE),
('ADMIN', 'materialreturn.approve', TRUE),
('ADMIN', 'materialreturn.confirm', TRUE),
('ADMIN', 'admin.view', TRUE),
('PLANNING', 'dashboard.view', TRUE),
('PLANNING', 'pr.view', TRUE),
('PLANNING', 'pr.approve', TRUE),
('PLANNING', 'po.view', TRUE),
('PLANNING', 'po.approve', TRUE),
('PLANNING', 'inventory.view', TRUE),
('PLANNING', 'grn.view', TRUE),
('PLANNING', 'sto.view', TRUE),
('PLANNING', 'issue.view', TRUE),
('PLANNING', 'materialreturn.view', TRUE),
('PROJECT', 'dashboard.view', TRUE),
('PROJECT', 'pr.view', TRUE),
('PROJECT', 'pr.approve', TRUE),
('PROJECT', 'po.view', TRUE),
('PROJECT', 'po.approve', TRUE),
('PROJECT', 'inventory.view', TRUE),
('PROJECT', 'grn.view', TRUE),
('PROJECT', 'sto.view', TRUE),
('PROJECT', 'issue.view', TRUE),
('PROJECT', 'materialreturn.view', TRUE),
('CEO', 'dashboard.view', TRUE),
('CEO', 'pr.view', TRUE),
('CEO', 'pr.approve', TRUE),
('CEO', 'po.view', TRUE),
('CEO', 'po.approve', TRUE),
('CEO', 'inventory.view', TRUE),
('CEO', 'grn.view', TRUE),
('CEO', 'sto.view', TRUE),
('CEO', 'issue.view', TRUE),
('CEO', 'materialreturn.view', TRUE),
('PURCHASING', 'dashboard.view', TRUE),
('PURCHASING', 'mr.view', TRUE),
('PURCHASING', 'pr.view', TRUE),
('PURCHASING', 'pr.create', TRUE),
('PURCHASING', 'pr.edit', TRUE),
('PURCHASING', 'pr.delete', TRUE),
('PURCHASING', 'po.view', TRUE),
('PURCHASING', 'po.create', TRUE),
('PURCHASING', 'po.edit', TRUE),
('PURCHASING', 'po.delete', TRUE),
('PURCHASING', 'inventory.view', TRUE),
('PURCHASING', 'inventory.edit', TRUE),
('PURCHASING', 'grn.view', TRUE),
('PURCHASING', 'grn.create', TRUE),
('PURCHASING', 'grn.edit', TRUE),
('PURCHASING', 'grn.delete', TRUE),
('PURCHASING', 'grn.receive', TRUE),
('PURCHASING', 'grn.complete', TRUE),
('PURCHASING', 'sto.view', TRUE),
('PURCHASING', 'sto.create', TRUE),
('PURCHASING', 'sto.edit', TRUE),
('PURCHASING', 'sto.delete', TRUE),
('PURCHASING', 'sto.submit', TRUE),
('PURCHASING', 'sto.approve', TRUE),
('PURCHASING', 'sto.complete', TRUE),
('PURCHASING', 'issue.view', TRUE),
('PURCHASING', 'issue.create', TRUE),
('PURCHASING', 'issue.edit', TRUE),
('PURCHASING', 'issue.delete', TRUE),
('PURCHASING', 'issue.submit', TRUE),
('PURCHASING', 'issue.approve', TRUE),
('PURCHASING', 'issue.complete', TRUE),
('PURCHASING', 'materialreturn.view', TRUE),
('PURCHASING', 'materialreturn.create', TRUE),
('PURCHASING', 'materialreturn.edit', TRUE),
('PURCHASING', 'materialreturn.delete', TRUE),
('PURCHASING', 'materialreturn.submit', TRUE),
('PURCHASING', 'materialreturn.approve', TRUE),
('SITE_COMMANDER', 'dashboard.view', TRUE),
('SITE_COMMANDER', 'mr.view', TRUE),
('SITE_COMMANDER', 'mr.create', TRUE),
('SITE_COMMANDER', 'mr.edit', TRUE),
('SITE_COMMANDER', 'mr.delete', TRUE),
('SITE_COMMANDER', 'mr.approve', TRUE),
('SITE_COMMANDER', 'pr.view', TRUE),
('SITE_COMMANDER', 'po.view', TRUE),
('SITE_COMMANDER', 'inventory.view', TRUE),
('SITE_COMMANDER', 'grn.view', TRUE),
('SITE_COMMANDER', 'sto.view', TRUE),
('SITE_COMMANDER', 'issue.view', TRUE),
('SITE_COMMANDER', 'issue.create', TRUE),
('SITE_COMMANDER', 'issue.edit', TRUE),
('SITE_COMMANDER', 'issue.delete', TRUE),
('SITE_COMMANDER', 'issue.submit', TRUE),
('SITE_COMMANDER', 'issue.approve', TRUE),
('SITE_COMMANDER', 'issue.confirm', TRUE),
('SITE_COMMANDER', 'materialreturn.view', TRUE),
('SITE_COMMANDER', 'materialreturn.create', TRUE),
('SITE_COMMANDER', 'materialreturn.edit', TRUE),
('SITE_COMMANDER', 'materialreturn.delete', TRUE),
('SITE_COMMANDER', 'materialreturn.submit', TRUE),
('SITE_COMMANDER', 'materialreturn.approve', TRUE),
('SITE_COMMANDER', 'materialreturn.confirm', TRUE),
('QC', 'dashboard.view', TRUE),
('QC', 'grn.view', TRUE),
('QC', 'grn.qc', TRUE),
('QC', 'inventory.view', TRUE);

-- 4.18 USER_PERMISSIONS
INSERT INTO user_permissions (user_id, permission_key, enabled) VALUES
(10, 'mr.create', TRUE),
(10, 'mr.edit', TRUE),
(13, 'admin.view', TRUE);

-- =============================================
-- 1. BỔ SUNG TRƯỜNG AUDIT CHO CÁC BẢNG HIỆN CÓ
-- =============================================

-- =============================================
-- KIỂM TRA VÀ BỔ SUNG TRƯỜNG AUDIT CHO CÁC BẢNG
-- =============================================

-- Sử dụng stored procedure để kiểm tra và thêm cột nếu chưa tồn tại
DELIMITER $$

DROP PROCEDURE IF EXISTS AddColumnIfNotExists $$
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN columnDefinition VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = tableName 
          AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

-- Thêm các cột audit cho từng bảng (chỉ thêm nếu chưa có)
CALL AddColumnIfNotExists('projects', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('projects', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('projects', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('projects', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('vendors', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('vendors', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('vendors', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('vendors', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('items', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('items', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('items', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('items', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('warehouses', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('warehouses', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('warehouses', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('warehouses', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('material_requests', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('material_requests', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('material_requests', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('material_requests', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('purchase_requests', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('purchase_requests', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('purchase_requests', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('purchase_requests', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('purchase_orders', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('purchase_orders', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('purchase_orders', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('purchase_orders', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('goods_receipts', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('goods_receipts', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('goods_receipts', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('goods_receipts', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('stock_transfers', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('stock_transfers', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('stock_transfers', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('stock_transfers', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Xóa procedure sau khi sử dụng (tùy chọn)
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- =============================================
-- 2. TẠO BẢNG ACTIVITY_LOGS (NẾU CHƯA TỒN TẠI)
-- =============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(100) NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. TẠO INDEX (BỎ QUA NẾU ĐÃ TỒN TẠI)
-- =============================================


-- Index cho các bảng chính (sử dụng cú pháp kiểm tra tồn tại nếu MySQL hỗ trợ)
-- Nếu không, có thể chạy riêng từng lệnh và bỏ qua lỗi.
-- Dưới đây là các lệnh thêm index (sẽ báo lỗi nếu đã có, bạn có thể bỏ qua)
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_vendors_name ON vendors(vendor_name);
CREATE INDEX idx_items_name ON items(item_name);
CREATE INDEX idx_items_project ON items(project_id);
CREATE INDEX idx_mr_project ON material_requests(project_id);
CREATE INDEX idx_mr_status ON material_requests(status);
CREATE INDEX idx_pr_project ON purchase_requests(project_id);
CREATE INDEX idx_pr_status ON purchase_requests(status);
CREATE INDEX idx_po_project ON purchase_orders(project_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_grn_po ON goods_receipts(purchase_order_id);
CREATE INDEX idx_sto_from ON stock_transfers(from_warehouse_id);
CREATE INDEX idx_sto_to ON stock_transfers(to_warehouse_id);
-- ================================================================
-- KẾT THÚC
-- ================================================================

SELECT '✅ Đã insert toàn bộ dữ liệu mẫu thành công (đã sửa lỗi DATE).' AS Message;