-- ================================================================
-- RESET DATABASE - MEP SYSTEM
-- PHIÊN BẢN 2.1.0 (Ngày 04/09/2026)
-- BAO GỒM: Tất cả cập nhật mới nhất
-- ================================================================

DROP DATABASE IF EXISTS mep_db;
CREATE DATABASE IF NOT EXISTS mep_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mep_db;

-- ================================================================
-- TẠO CÁC BẢNG
-- ================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    department_id BIGINT NULL,
    `position` VARCHAR(100) NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    education VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_email (email),
    INDEX idx_role (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    manager_id BIGINT NULL,
    manager_name VARCHAR(100) NULL,
    parent_id BIGINT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `client` VARCHAR(200) NULL,
    commander VARCHAR(100) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    `status` VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VENDORS
CREATE TABLE IF NOT EXISTS vendors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    vendor_group VARCHAR(100) NULL,
    contact VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    payment_term VARCHAR(50) NULL,
    note TEXT NULL,
    `status` VARCHAR(20) DEFAULT 'ACTIVE',
    inactive_date DATE NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. VENDOR_GROUPS
CREATE TABLE IF NOT EXISTS vendor_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vendor_id BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_vendor_id (vendor_id),
    CONSTRAINT fk_vendor_groups_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ITEMS (Hỗ trợ alias - nhiều tên cùng mã)
CREATE TABLE IF NOT EXISTS items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,               -- ✅ KHÔNG UNIQUE
    `name` VARCHAR(200) NOT NULL,
    item_group VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    unit VARCHAR(20) NULL,
    standard_price DECIMAL(15,2) DEFAULT 0,
    `status` VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    is_main BOOLEAN DEFAULT TRUE,              -- ✅ Đánh dấu tên chính
    created_at DATE NULL,
    updated_at DATE NULL,
    KEY idx_code (`code`),
    KEY idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. MR
CREATE TABLE IF NOT EXISTS mr (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    items JSON NOT NULL,
    need_date DATE NULL,
    purpose TEXT NULL,
    requester VARCHAR(100) NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT DEFAULT 1,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    workflow_id BIGINT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PR (Hỗ trợ trạng thái PARTIALLY_FULFILLED)
CREATE TABLE IF NOT EXISTS pr (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    mr_id BIGINT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL,
    `status` VARCHAR(30) DEFAULT 'DRAFT',      -- ✅ Thêm PARTIALLY_FULFILLED
    approval_step INT DEFAULT 1,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    workflow_id BIGINT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`),
    INDEX idx_mr_id (mr_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. PO
CREATE TABLE IF NOT EXISTS po (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    pr_id BIGINT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT DEFAULT 1,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    workflow_id BIGINT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`),
    INDEX idx_pr_id (pr_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. WAREHOUSES
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` VARCHAR(20) DEFAULT 'CENTRAL',
    project_id BIGINT NULL,
    manager VARCHAR(100) NULL,
    address TEXT NULL,
    `status` VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_id (project_id),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity DECIMAL(15,2) DEFAULT 0,
    updated_at DATE NULL,
    UNIQUE KEY uk_warehouse_item (warehouse_id, item_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. GRN
CREATE TABLE IF NOT EXISTS grn (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    po_id BIGINT NULL,
    project_code VARCHAR(50) NULL,
    project_name VARCHAR(200) NULL,
    warehouse_id BIGINT NOT NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL,
    receipt_date DATE NULL,
    receiver VARCHAR(100) NULL,
    warehouse_staff VARCHAR(100) NULL,
    qc_confirm VARCHAR(100) NULL,
    accountant_confirm VARCHAR(100) NULL,
    invoice VARCHAR(100) NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT NULL,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    workflow_id BIGINT NULL,
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_po_id (po_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. STO
CREATE TABLE IF NOT EXISTS sto (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id BIGINT NOT NULL,
    to_warehouse_id BIGINT NOT NULL,
    project_code VARCHAR(50) NULL,
    project_name VARCHAR(200) NULL,
    items JSON NOT NULL,
    transfer_date DATE NULL,
    requested_by VARCHAR(100) NULL,
    approved_by VARCHAR(100) NULL,
    warehouse_staff VARCHAR(100) NULL,
    transporter VARCHAR(100) NULL,
    departure_time VARCHAR(10) NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT NULL,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    workflow_id BIGINT NULL,
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_from_warehouse (from_warehouse_id),
    INDEX idx_to_warehouse (to_warehouse_id),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. ISSUES
CREATE TABLE IF NOT EXISTS issues (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    `date` DATE NULL,
    area VARCHAR(200) NULL,
    team VARCHAR(100) NULL,
    requester VARCHAR(100) NULL,
    items JSON NOT NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    approval_step INT NULL,
    workflow_id BIGINT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    approved_by VARCHAR(100) NULL,
    completed_by VARCHAR(100) NULL,
    confirmed_by VARCHAR(100) NULL,
    completion_date DATE NULL,
    warehouse_id BIGINT NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. MATERIAL_RETURNS
CREATE TABLE IF NOT EXISTS material_returns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    return_date DATE NULL,
    warehouse_id BIGINT NOT NULL,
    return_from VARCHAR(200) NULL,
    items JSON NOT NULL,
    returner VARCHAR(100) NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    approval_step INT NULL,
    workflow_id BIGINT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    approved_by VARCHAR(100) NULL,
    confirmed_by VARCHAR(100) NULL,
    completion_date DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. MIN_STOCK
CREATE TABLE IF NOT EXISTS min_stock (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    min_quantity DECIMAL(15,2) DEFAULT 0,
    safe_quantity DECIMAL(15,2) DEFAULT 0,
    alert_percent DECIMAL(5,2) DEFAULT 20,
    updated_at DATE NULL,
    UNIQUE KEY uk_warehouse_item (warehouse_id, item_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. AUTO_REORDER_CONFIG
CREATE TABLE IF NOT EXISTS auto_reorder_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    enabled BOOLEAN DEFAULT FALSE,
    multiplier DECIMAL(5,2) DEFAULT 2.0,
    default_vendor_code VARCHAR(50) NULL,
    schedule VARCHAR(100) NULL,
    note TEXT NULL,
    created_by BIGINT NULL,
    updated_at DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. WORKFLOWS
CREATE TABLE IF NOT EXISTS workflows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    description TEXT NULL,
    steps JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_workflows_module (module),
    INDEX idx_workflows_active (is_active),
    INDEX idx_workflows_module_active (module, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. STATUSES
CREATE TABLE IF NOT EXISTS statuses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    color VARCHAR(20) NULL,
    status_group VARCHAR(50) NULL,           -- ✅ Đã đổi tên từ group
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_statuses_entity_type (entity_type),
    INDEX idx_statuses_code (code),
    INDEX idx_statuses_group (status_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. WORKFLOW_STEP_STATUS
CREATE TABLE IF NOT EXISTS workflow_step_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workflow_id BIGINT NOT NULL,
    step INT NOT NULL,
    status_code VARCHAR(50) NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    INDEX idx_wf_step_status_workflow (workflow_id),
    INDEX idx_wf_step_status_step (step),
    INDEX idx_wf_step_status_code (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `role` VARCHAR(50) DEFAULT 'DEPARTMENT',
    department_id BIGINT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uk_dept_permission (department_id, permission_key),
    INDEX idx_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. USER_PERMISSIONS
CREATE TABLE IF NOT EXISTS user_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uk_user_permission (user_id, permission_key),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. AUTO_REORDER_RULES
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
    schedule VARCHAR(100) NULL,
    note TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    INDEX idx_item_id (item_id),
    INDEX idx_warehouse_id (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. ACTIVITY_LOGS
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NULL,
    entity_type VARCHAR(100) NULL,
    entity_id VARCHAR(100) NULL,
    description VARCHAR(200) NULL,
    performed_by VARCHAR(100) NULL,
    performed_by_id BIGINT NULL,
    performed_at DATETIME NULL,
    details TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. APPROVAL_HISTORY
CREATE TABLE IF NOT EXISTS approval_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    workflow_id BIGINT NULL,
    step INT NOT NULL,
    approver_id BIGINT NULL,
    approver_name VARCHAR(100) NULL,
    status_before VARCHAR(50) NULL,
    status_after VARCHAR(50) NULL,
    note TEXT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. TEAMS
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_name (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. TEAM_MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    `role` VARCHAR(100) NULL,
    joined_at DATE NULL,
    left_at DATE NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    UNIQUE KEY uk_team_user (team_id, user_id),
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. PROJECT_MEMBERS
CREATE TABLE IF NOT EXISTS project_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    `role` VARCHAR(100) NULL,
    joined_at DATE NULL,
    left_at DATE NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    UNIQUE KEY uk_project_user (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_left_at (left_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. POSITIONS
CREATE TABLE IF NOT EXISTS positions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    department_id BIGINT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_name (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- KHÓA NGOẠI
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
-- DỮ LIỆU MẪU
-- ================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (code, name, manager_id, manager_name, parent_id, created_at, updated_at) VALUES
('BGD', 'Ban Giám đốc', 1, 'Admin', NULL, CURDATE(), CURDATE()),
('PURCHASING', 'Phòng Mua hàng', NULL, NULL, NULL, CURDATE(), CURDATE()),
('PLANNING', 'Phòng Kế hoạch', NULL, NULL, NULL, CURDATE(), CURDATE()),
('PROJECT', 'Phòng Dự án', NULL, NULL, NULL, CURDATE(), CURDATE()),
('QC', 'Phòng QC', NULL, NULL, NULL, CURDATE(), CURDATE()),
('CT', 'Công trường', NULL, NULL, NULL, CURDATE(), CURDATE());

-- 2. USERS (admin - password = 'password')
INSERT INTO users (email, password, name, role, department_id, position, created_at, updated_at) VALUES
('admin@mep.com', '$2a$10$3dvJVZpby4ubWv7J/mn/a.zW.6Mu6ydQ/yV3lwC61BEXZLg1U48t.', 'Admin', 'ADMIN', 1, 'Quản trị hệ thống', CURDATE(), CURDATE());

-- 3. STATUSES (CẬP NHẬT VỚI status_group)
DELIMITER $$
DROP PROCEDURE IF EXISTS InsertStatusIfNotExists $$
CREATE PROCEDURE InsertStatusIfNotExists(
    IN p_entity_type VARCHAR(50),
    IN p_name VARCHAR(100),
    IN p_code VARCHAR(50),
    IN p_description TEXT,
    IN p_is_default BOOLEAN,
    IN p_is_final BOOLEAN,
    IN p_sort_order INT,
    IN p_color VARCHAR(20),
    IN p_status_group VARCHAR(50)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM statuses WHERE code = p_code) THEN
        INSERT INTO statuses (entity_type, name, code, description, is_default, is_final, sort_order, color, status_group, created_at, updated_at)
        VALUES (p_entity_type, p_name, p_code, p_description, p_is_default, p_is_final, p_sort_order, p_color, p_status_group, CURDATE(), CURDATE());
    END IF;
END $$
DELIMITER ;

-- MR
CALL InsertStatusIfNotExists('mr', 'Nháp', 'DRAFT', 'Trạng thái nháp', TRUE, FALSE, 0, '#6b7280', 'order');
CALL InsertStatusIfNotExists('mr', 'Chờ duyệt', 'PENDING', 'Đã gửi duyệt', FALSE, FALSE, 1, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('mr', 'Đã duyệt', 'APPROVED', 'Đã được duyệt', FALSE, FALSE, 2, '#22c55e', 'order');
CALL InsertStatusIfNotExists('mr', 'Từ chối', 'REJECTED', 'Bị từ chối', FALSE, TRUE, 3, '#ef4444', 'order');

-- PR (Thêm PARTIALLY_FULFILLED)
CALL InsertStatusIfNotExists('pr', 'Nháp', 'DRAFT', 'Nháp', TRUE, FALSE, 0, '#6b7280', 'order');
CALL InsertStatusIfNotExists('pr', 'Chờ duyệt KH', 'PENDING_PLANNING', 'Chờ KH duyệt', FALSE, FALSE, 1, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('pr', 'KH đã duyệt', 'PLANNING_APPROVED', 'KH đã duyệt', FALSE, FALSE, 2, '#3b82f6', 'order');
CALL InsertStatusIfNotExists('pr', 'Chờ duyệt DA', 'PENDING_PROJECT', 'Chờ DA duyệt', FALSE, FALSE, 3, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('pr', 'DA đã duyệt', 'PROJECT_APPROVED', 'DA đã duyệt', FALSE, FALSE, 4, '#3b82f6', 'order');
CALL InsertStatusIfNotExists('pr', 'Chờ duyệt CEO', 'PENDING_CEO', 'Chờ CEO duyệt', FALSE, FALSE, 5, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('pr', 'Đã duyệt', 'APPROVED', 'Đã duyệt', FALSE, FALSE, 6, '#22c55e', 'order');
CALL InsertStatusIfNotExists('pr', 'Từ chối', 'REJECTED', 'Từ chối', FALSE, TRUE, 7, '#ef4444', 'order');
CALL InsertStatusIfNotExists('pr', 'Chưa hoàn thành', 'PARTIALLY_FULFILLED', 'Chưa hoàn thành tất cả PO', FALSE, FALSE, 8, '#f59e0b', 'order');

-- PO
CALL InsertStatusIfNotExists('po', 'Nháp', 'DRAFT', 'Nháp', TRUE, FALSE, 0, '#6b7280', 'order');
CALL InsertStatusIfNotExists('po', 'Chờ duyệt KH', 'PENDING_PLANNING', 'Chờ KH duyệt', FALSE, FALSE, 1, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('po', 'KH đã duyệt', 'PLANNING_APPROVED', 'KH đã duyệt', FALSE, FALSE, 2, '#3b82f6', 'order');
CALL InsertStatusIfNotExists('po', 'Chờ duyệt DA', 'PENDING_PROJECT', 'Chờ DA duyệt', FALSE, FALSE, 3, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('po', 'DA đã duyệt', 'PROJECT_APPROVED', 'DA đã duyệt', FALSE, FALSE, 4, '#3b82f6', 'order');
CALL InsertStatusIfNotExists('po', 'Chờ duyệt CEO', 'PENDING_CEO', 'Chờ CEO duyệt', FALSE, FALSE, 5, '#f59e0b', 'order');
CALL InsertStatusIfNotExists('po', 'Đã duyệt', 'APPROVED', 'Đã duyệt', FALSE, FALSE, 6, '#22c55e', 'order');
CALL InsertStatusIfNotExists('po', 'Từ chối', 'REJECTED', 'Từ chối', FALSE, TRUE, 7, '#ef4444', 'order');

-- GRN
CALL InsertStatusIfNotExists('grn', 'Nháp', 'DRAFT', 'Nháp', TRUE, FALSE, 0, '#6b7280', 'warehouse');
CALL InsertStatusIfNotExists('grn', 'Đã nhận', 'RECEIVED', 'Đã nhận', FALSE, FALSE, 1, '#3b82f6', 'warehouse');
CALL InsertStatusIfNotExists('grn', 'QC kiểm tra', 'QC_CHECKED', 'QC đã kiểm tra', FALSE, FALSE, 2, '#8b5cf6', 'warehouse');
CALL InsertStatusIfNotExists('grn', 'Hoàn thành', 'COMPLETED', 'Hoàn thành', FALSE, TRUE, 3, '#22c55e', 'warehouse');
CALL InsertStatusIfNotExists('grn', 'Từ chối', 'REJECTED', 'Từ chối', FALSE, TRUE, 4, '#ef4444', 'warehouse');

-- STO
CALL InsertStatusIfNotExists('sto', 'Nháp', 'DRAFT', 'Nháp', TRUE, FALSE, 0, '#6b7280', 'warehouse');
CALL InsertStatusIfNotExists('sto', 'Chờ duyệt', 'PENDING', 'Chờ duyệt', FALSE, FALSE, 1, '#f59e0b', 'warehouse');
CALL InsertStatusIfNotExists('sto', 'Đã duyệt', 'APPROVED', 'Đã duyệt', FALSE, FALSE, 2, '#3b82f6', 'warehouse');
CALL InsertStatusIfNotExists('sto', 'Hoàn thành', 'COMPLETED', 'Hoàn thành', FALSE, TRUE, 3, '#22c55e', 'warehouse');

-- Issue
CALL InsertStatusIfNotExists('issue', 'Nháp', 'DRAFT', 'Nháp', TRUE, FALSE, 0, '#6b7280', 'warehouse');
CALL InsertStatusIfNotExists('issue', 'Chờ duyệt', 'PENDING', 'Chờ duyệt', FALSE, FALSE, 1, '#f59e0b', 'warehouse');
CALL InsertStatusIfNotExists('issue', 'Đã duyệt', 'APPROVED', 'Đã duyệt', FALSE, FALSE, 2, '#3b82f6', 'warehouse');
CALL InsertStatusIfNotExists('issue', 'Đã cấp phát', 'COMPLETED', 'Đã cấp phát', FALSE, FALSE, 3, '#8b5cf6', 'warehouse');
CALL InsertStatusIfNotExists('issue', 'Đã xác nhận', 'CONFIRMED', 'Đã xác nhận', FALSE, TRUE, 4, '#22c55e', 'warehouse');
CALL InsertStatusIfNotExists('issue', 'Từ chối', 'REJECTED', 'Từ chối', FALSE, TRUE, 5, '#ef4444', 'warehouse');

-- Material Return
CALL InsertStatusIfNotExists('materialreturn', 'Nháp', 'DRAFT', 'Nháp', TRUE, FALSE, 0, '#6b7280', 'warehouse');
CALL InsertStatusIfNotExists('materialreturn', 'Chờ duyệt', 'PENDING', 'Chờ duyệt', FALSE, FALSE, 1, '#f59e0b', 'warehouse');
CALL InsertStatusIfNotExists('materialreturn', 'Đã nhận', 'APPROVED', 'Thủ kho đã nhận', FALSE, FALSE, 2, '#3b82f6', 'warehouse');
CALL InsertStatusIfNotExists('materialreturn', 'Đã xác nhận', 'CONFIRMED', 'Đã xác nhận', FALSE, TRUE, 3, '#22c55e', 'warehouse');
CALL InsertStatusIfNotExists('materialreturn', 'Từ chối', 'REJECTED', 'Từ chối', FALSE, TRUE, 4, '#ef4444', 'warehouse');

-- User
CALL InsertStatusIfNotExists('user', 'Hoạt động', 'ACTIVE', 'User đang hoạt động', TRUE, FALSE, 0, '#22c55e', 'user');
CALL InsertStatusIfNotExists('user', 'Bị khóa', 'LOCKED', 'User bị khóa', FALSE, TRUE, 1, '#ef4444', 'user');
CALL InsertStatusIfNotExists('user', 'Chờ kích hoạt', 'PENDING', 'Chờ kích hoạt', FALSE, FALSE, 2, '#f59e0b', 'user');

-- Department
CALL InsertStatusIfNotExists('department', 'Hoạt động', 'ACTIVE', 'Phòng ban hoạt động', TRUE, FALSE, 0, '#22c55e', 'department');
CALL InsertStatusIfNotExists('department', 'Đã đóng', 'INACTIVE', 'Phòng ban đã đóng', FALSE, TRUE, 1, '#ef4444', 'department');

-- Vendor
CALL InsertStatusIfNotExists('vendor', 'Đang hợp tác', 'ACTIVE', 'Đang hợp tác', TRUE, FALSE, 0, '#22c55e', 'vendor');
CALL InsertStatusIfNotExists('vendor', 'Ngừng hợp tác', 'INACTIVE', 'Ngừng hợp tác', FALSE, TRUE, 1, '#ef4444', 'vendor');

-- Project
CALL InsertStatusIfNotExists('project', 'Đang hoạt động', 'ACTIVE', 'Dự án đang hoạt động', TRUE, FALSE, 0, '#22c55e', 'project');
CALL InsertStatusIfNotExists('project', 'Đã đóng', 'INACTIVE', 'Dự án đã đóng', FALSE, TRUE, 1, '#ef4444', 'project');
CALL InsertStatusIfNotExists('project', 'Tạm dừng', 'SUSPENDED', 'Dự án tạm dừng', FALSE, FALSE, 2, '#f59e0b', 'project');

-- Warehouse
CALL InsertStatusIfNotExists('warehouse', 'Đang hoạt động', 'ACTIVE', 'Kho đang hoạt động', TRUE, FALSE, 0, '#22c55e', 'warehouse');
CALL InsertStatusIfNotExists('warehouse', 'Đã đóng', 'INACTIVE', 'Kho đã đóng', FALSE, TRUE, 1, '#ef4444', 'warehouse');

-- Workflow
CALL InsertStatusIfNotExists('workflow', 'Nháp', 'DRAFT', 'Workflow nháp', TRUE, FALSE, 0, '#6b7280', 'workflow');
CALL InsertStatusIfNotExists('workflow', 'Đang áp dụng', 'ACTIVE', 'Workflow đang áp dụng', FALSE, FALSE, 1, '#22c55e', 'workflow');
CALL InsertStatusIfNotExists('workflow', 'Ngừng áp dụng', 'INACTIVE', 'Workflow ngừng áp dụng', FALSE, FALSE, 2, '#ef4444', 'workflow');

DROP PROCEDURE IF EXISTS InsertStatusIfNotExists;

-- 4. WORKFLOWS
INSERT INTO workflows (module, name, description, steps, is_active, is_system, status, created_at, updated_at) VALUES
('mr', 'MR - Mặc định', 'Quy trình duyệt MR', '[{"step":1,"permissionKey":"mr.approve","label":"Chỉ huy trưởng duyệt","departmentId":5}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE()),
('pr', 'PR - 3 bước mặc định', 'Planning → Project → CEO', '[{"step":1,"permissionKey":"pr.approve","label":"Kế hoạch duyệt","departmentId":2},{"step":2,"permissionKey":"pr.approve","label":"Dự án duyệt","departmentId":3},{"step":3,"permissionKey":"pr.approve","label":"CEO duyệt","departmentId":1}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE()),
('po', 'PO - 3 bước mặc định', 'Planning → Project → CEO', '[{"step":1,"permissionKey":"po.approve","label":"Kế hoạch duyệt","departmentId":2},{"step":2,"permissionKey":"po.approve","label":"Dự án duyệt","departmentId":3},{"step":3,"permissionKey":"po.approve","label":"CEO duyệt","departmentId":1}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE()),
('grn', 'GRN - 4 bước mặc định', 'Lập phiếu → Nhận → QC → Hoàn thành', '[{"step":1,"permissionKey":"grn.create","label":"Lập phiếu","departmentId":4},{"step":2,"permissionKey":"grn.receive","label":"Thủ kho nhận","departmentId":null},{"step":3,"permissionKey":"grn.qc","label":"QC kiểm tra","departmentId":6},{"step":4,"permissionKey":"grn.complete","label":"Hoàn thành","departmentId":4}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE()),
('sto', 'STO - 3 bước mặc định', 'Lập phiếu → Duyệt → Xuất kho', '[{"step":1,"permissionKey":"sto.create","label":"Lập phiếu","departmentId":4},{"step":2,"permissionKey":"sto.approve","label":"Duyệt","departmentId":4},{"step":3,"permissionKey":"sto.complete","label":"Xuất kho","departmentId":4}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE()),
('issue', 'Issue - 4 bước mặc định', 'Tạo phiếu → Duyệt → Cấp phát → Xác nhận', '[{"step":1,"permissionKey":"issue.create","label":"Tạo phiếu","departmentId":5},{"step":2,"permissionKey":"issue.approve","label":"Duyệt","departmentId":5},{"step":3,"permissionKey":"issue.complete","label":"Cấp phát","departmentId":4},{"step":4,"permissionKey":"issue.confirm","label":"Xác nhận","departmentId":5}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE()),
('materialreturn', 'Material Return - 3 bước mặc định', 'Tạo phiếu → Nhận → Xác nhận', '[{"step":1,"permissionKey":"materialreturn.create","label":"Tạo phiếu","departmentId":5},{"step":2,"permissionKey":"materialreturn.approve","label":"Thủ kho nhận","departmentId":4},{"step":3,"permissionKey":"materialreturn.confirm","label":"Xác nhận","departmentId":5}]', TRUE, TRUE, 'ACTIVE', CURDATE(), CURDATE());

-- 5. PERMISSIONS (cấp full quyền cho BGD)
INSERT INTO permissions (department_id, permission_key, enabled) VALUES
(1, 'dashboard.view', TRUE),
(1, 'mr.view', TRUE), (1, 'mr.create', TRUE), (1, 'mr.edit', TRUE), (1, 'mr.delete', TRUE), (1, 'mr.approve', TRUE), (1, 'mr.submit', TRUE), (1, 'mr.reject', TRUE),
(1, 'pr.view', TRUE), (1, 'pr.create', TRUE), (1, 'pr.edit', TRUE), (1, 'pr.delete', TRUE), (1, 'pr.approve', TRUE), (1, 'pr.submit', TRUE), (1, 'pr.reject', TRUE),
(1, 'po.view', TRUE), (1, 'po.create', TRUE), (1, 'po.edit', TRUE), (1, 'po.delete', TRUE), (1, 'po.approve', TRUE), (1, 'po.submit', TRUE), (1, 'po.reject', TRUE),
(1, 'inventory.view', TRUE), (1, 'inventory.edit', TRUE), (1, 'inventory.delete', TRUE),
(1, 'grn.view', TRUE), (1, 'grn.create', TRUE), (1, 'grn.edit', TRUE), (1, 'grn.delete', TRUE), (1, 'grn.receive', TRUE), (1, 'grn.qc', TRUE), (1, 'grn.complete', TRUE),
(1, 'sto.view', TRUE), (1, 'sto.create', TRUE), (1, 'sto.edit', TRUE), (1, 'sto.delete', TRUE), (1, 'sto.submit', TRUE), (1, 'sto.approve', TRUE), (1, 'sto.complete', TRUE),
(1, 'issue.view', TRUE), (1, 'issue.create', TRUE), (1, 'issue.edit', TRUE), (1, 'issue.delete', TRUE), (1, 'issue.submit', TRUE), (1, 'issue.approve', TRUE), (1, 'issue.complete', TRUE), (1, 'issue.confirm', TRUE), (1, 'issue.reject', TRUE),
(1, 'materialreturn.view', TRUE), (1, 'materialreturn.create', TRUE), (1, 'materialreturn.edit', TRUE), (1, 'materialreturn.delete', TRUE), (1, 'materialreturn.submit', TRUE), (1, 'materialreturn.approve', TRUE), (1, 'materialreturn.confirm', TRUE), (1, 'materialreturn.reject', TRUE),
(1, 'admin.view', TRUE),
(1, 'workflow.override', TRUE);

-- 6. AUTO_REORDER_CONFIG
INSERT INTO auto_reorder_config (enabled, multiplier, default_vendor_code, updated_at) VALUES
(FALSE, 2.0, NULL, CURDATE());

-- 7. PROJECTS MẪU
INSERT INTO projects (code, name, client, commander, status, created_at, updated_at) VALUESapproval_history
('DA001', 'Dự án mẫu', 'Khách hàng A', 'Nguyễn Văn A', 'ACTIVE', CURDATE(), CURDATE()),
('DA002', 'Dự án thử nghiệm', 'Khách hàng B', 'Trần Văn B', 'ACTIVE', CURDATE(), CURDATE());

-- ================================================================
-- KIỂM TRA
-- ================================================================

SELECT '✅ Database reset thành công! (Phiên bản 2.1.0)' AS Message;
SELECT '👤 Tài khoản admin: admin@mep.com / password' AS Credential;
SELECT entity_type, COUNT(*) AS total, GROUP_CONCAT(DISTINCT status_group) AS `groups` FROM statuses GROUP BY entity_type ORDER BY entity_type;
SELECT COUNT(*) AS total_workflows FROM workflows;
SELECT COUNT(*) AS total_permissions FROM permissions;
SELECT COUNT(*) AS total_projects FROM projects;