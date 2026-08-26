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
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    department_id BIGINT NULL,
    `position` VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_email (email),
    INDEX idx_role (`role`)
);

-- ================================================================
-- 2. BẢNG DEPARTMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    manager_id BIGINT NULL,
    manager_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`)
);

-- ================================================================
-- 3. BẢNG PROJECTS
-- ================================================================
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
);

-- ================================================================
-- 4. BẢNG VENDORS
-- ================================================================
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
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`)
);

-- ================================================================
-- 5. BẢNG ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    item_group VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    unit VARCHAR(20) NULL,
    standard_price DECIMAL(15,2) DEFAULT 0,
    `status` VARCHAR(20) DEFAULT 'ACTIVE',
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_status (`status`)
);

-- ================================================================
-- 6. BẢNG MR (Material Request)
-- ================================================================
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
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`)
);

-- ================================================================
-- 7. BẢNG PR (Purchase Request)
-- ================================================================
CREATE TABLE IF NOT EXISTS pr (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    mr_id BIGINT NULL,
    project_code VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NULL,
    vendor_code VARCHAR(50) NULL,
    vendor_name VARCHAR(200) NULL,
    items JSON NOT NULL,
    `status` VARCHAR(20) DEFAULT 'DRAFT',
    approval_step INT DEFAULT 1,
    created_by BIGINT NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`),
    INDEX idx_mr_id (mr_id)
);

-- ================================================================
-- 8. BẢNG PO (Purchase Order)
-- ================================================================
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
    created_at DATE NULL,
    updated_at DATE NULL,
    note TEXT NULL,
    INDEX idx_code (`code`),
    INDEX idx_project_code (project_code),
    INDEX idx_status (`status`),
    INDEX idx_pr_id (pr_id)
);

-- ================================================================
-- 9. BẢNG WAREHOUSES
-- ================================================================
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
);

-- ================================================================
-- 10. BẢNG INVENTORY
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
-- 11. BẢNG GRN (Goods Receipt Note)
-- ================================================================
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
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_po_id (po_id),
    INDEX idx_warehouse_id (warehouse_id),
    INDEX idx_status (`status`)
);

-- ================================================================
-- 12. BẢNG STO (Stock Transfer Order)
-- ================================================================
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
    note TEXT NULL,
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_code (`code`),
    INDEX idx_from_warehouse (from_warehouse_id),
    INDEX idx_to_warehouse (to_warehouse_id),
    INDEX idx_status (`status`)
);

-- ================================================================
-- 13. BẢNG ISSUE (Cấp phát vật tư)
-- ================================================================
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
);

-- ================================================================
-- 14. BẢNG MATERIAL_RETURNS (Hoàn trả vật tư)
-- ================================================================
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
);

-- ================================================================
-- 15. BẢNG MIN_STOCK
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
-- 16. BẢNG AUTO_REORDER_CONFIG
-- ================================================================
CREATE TABLE IF NOT EXISTS auto_reorder_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    enabled BOOLEAN DEFAULT FALSE,
    multiplier DECIMAL(5,2) DEFAULT 2.0,
    default_vendor_code VARCHAR(50) NULL,
    updated_at DATE NULL
);

-- ================================================================
-- 17. BẢNG WORKFLOWS (ĐÃ CẬP NHẬT - HỖ TRỢ ĐA MẪU)
-- ================================================================
CREATE TABLE IF NOT EXISTS workflows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module VARCHAR(50) NOT NULL,                -- KHÔNG UNIQUE (cho phép nhiều mẫu)
    `name` VARCHAR(100) NOT NULL,
    description TEXT NULL,
    steps JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE nếu đang áp dụng
    is_system BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE nếu là mẫu hệ thống
    created_at DATE NULL,
    updated_at DATE NULL,
    INDEX idx_workflows_module (module),
    INDEX idx_workflows_active (is_active),
    INDEX idx_workflows_module_active (module, is_active)
);

-- ================================================================
-- 18. BẢNG PERMISSIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    `role` VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uk_role_permission (`role`, permission_key),
    INDEX idx_role (`role`)
);

-- ================================================================
-- 19. BẢNG USER_PERMISSIONS
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
-- 20. BẢNG AUTO_REORDER_RULES
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
-- THÊM KHÓA NGOẠI
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
-- BỔ SUNG CÁC TRƯỜNG AUDIT (Procedure an toàn)
-- ================================================================
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

-- Thêm audit columns cho các bảng
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

CALL AddColumnIfNotExists('mr', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('mr', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('mr', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('mr', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('pr', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('pr', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('pr', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('pr', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('po', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('po', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('po', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('po', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('grn', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('grn', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('grn', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('grn', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('sto', 'created_by', 'INT NULL');
CALL AddColumnIfNotExists('sto', 'updated_by', 'INT NULL');
CALL AddColumnIfNotExists('sto', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('sto', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

CALL AddColumnIfNotExists('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
CALL AddColumnIfNotExists('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- ================================================================
-- TẠO BẢNG ACTIVITY_LOGS
-- ================================================================
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

-- ================================================================
-- THÊM INDEX (Procedure an toàn)
-- ================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS AddIndexIfNotExists $$
CREATE PROCEDURE AddIndexIfNotExists(
    IN tableName VARCHAR(100),
    IN indexName VARCHAR(100),
    IN columnList VARCHAR(200)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tableName
          AND INDEX_NAME = indexName
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, ' (', columnList, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$
DELIMITER ;

CALL AddIndexIfNotExists('activity_logs', 'idx_activity_user_id', 'user_id');
CALL AddIndexIfNotExists('activity_logs', 'idx_activity_entity', 'entity_type, entity_id');
CALL AddIndexIfNotExists('activity_logs', 'idx_activity_created', 'created_at');

-- Các index khác
CALL AddIndexIfNotExists('projects', 'idx_projects_code', 'code');
CALL AddIndexIfNotExists('vendors', 'idx_vendors_code', 'code');
CALL AddIndexIfNotExists('vendors', 'idx_vendors_name', 'name');
CALL AddIndexIfNotExists('items', 'idx_items_code', 'code');
CALL AddIndexIfNotExists('items', 'idx_items_status', 'status');
CALL AddIndexIfNotExists('mr', 'idx_mr_project', 'project_code');
CALL AddIndexIfNotExists('mr', 'idx_mr_status', 'status');
CALL AddIndexIfNotExists('pr', 'idx_pr_project', 'project_code');
CALL AddIndexIfNotExists('pr', 'idx_pr_status', 'status');
CALL AddIndexIfNotExists('po', 'idx_po_project', 'project_code');
CALL AddIndexIfNotExists('po', 'idx_po_status', 'status');
CALL AddIndexIfNotExists('grn', 'idx_grn_po', 'po_id');
CALL AddIndexIfNotExists('grn', 'idx_grn_warehouse', 'warehouse_id');
CALL AddIndexIfNotExists('sto', 'idx_sto_from', 'from_warehouse_id');
CALL AddIndexIfNotExists('sto', 'idx_sto_to', 'to_warehouse_id');
CALL AddIndexIfNotExists('issues', 'idx_issues_project', 'project_code');
CALL AddIndexIfNotExists('material_returns', 'idx_material_returns_project', 'project_code');

DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

-- ================================================================
-- DỮ LIỆU MẪU BỔ SUNG CHO WORKFLOW (2 MẪU NHANH)
-- ================================================================
INSERT INTO workflows (module, name, description, steps, is_active, is_system, created_at, updated_at)
SELECT 
    'pr', 
    'PR - 1 bước CEO duyệt', 
    'Quy trình nhanh chỉ cần CEO duyệt 1 bước duy nhất',
    '[{"step":1,"role":"CEO","label":"CEO duyệt","departmentId":1}]',
    FALSE,
    TRUE,
    CURDATE(),
    CURDATE()
WHERE NOT EXISTS (
    SELECT 1 FROM workflows WHERE module = 'pr' AND name LIKE '%1 bước%'
);

INSERT INTO workflows (module, name, description, steps, is_active, is_system, created_at, updated_at)
SELECT 
    'po', 
    'PO - 1 bước CEO duyệt', 
    'Quy trình nhanh chỉ cần CEO duyệt 1 bước duy nhất',
    '[{"step":1,"role":"CEO","label":"CEO duyệt","departmentId":1}]',
    FALSE,
    TRUE,
    CURDATE(),
    CURDATE()
WHERE NOT EXISTS (
    SELECT 1 FROM workflows WHERE module = 'po' AND name LIKE '%1 bước%'
);

-- ================================================================
-- HOÀN TẤT
-- ================================================================
SELECT '✅ Database MEP đã được tạo và cập nhật thành công!' AS Message;
SELECT '✅ Workflows đã được nâng cấp hỗ trợ đa mẫu (is_active, is_system)!' AS Message;