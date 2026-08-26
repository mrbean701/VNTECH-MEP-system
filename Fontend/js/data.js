// ================================================================
// DATA LAYER - HÀM ĐỌC/GHI LOCALSTORAGE + KHỞI TẠO DỮ LIỆU MẪU
// ================================================================

// Đổi tiền tố để tránh dữ liệu cũ bị hỏng
const STORAGE_PREFIX = 'mep2_';

function getData(key) {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
}

function saveData(key, value) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

function generateId(arr) {
    if (!arr || arr.length === 0) return 1;
    const maxId = Math.max(...arr.map(item => parseInt(item.id) || 0));
    return maxId + 1;
}

// ====== KHỞI TẠO DỮ LIỆU MẪU (LUÔN CHẠY NẾU DỮ LIỆU KHÔNG HỢP LỆ) ======
function initData() {
    const usersData = getData('users');
    if (!Array.isArray(usersData) || usersData.length === 0) {
        console.log('🔄 Khởi tạo lại dữ liệu mẫu...');

        const departments = [
            { id: 1, code: 'BGD', name: 'Ban Giám đốc', managerId: 1, managerName: 'Admin' },
            { id: 2, code: 'KH', name: 'Phòng Kế hoạch', managerId: 3, managerName: 'Planning' },
            { id: 3, code: 'DA', name: 'Phòng Dự án', managerId: 4, managerName: 'Project' },
            { id: 4, code: 'MH', name: 'Phòng Mua hàng', managerId: 5, managerName: 'Purchasing' },
            { id: 5, code: 'CT', name: 'Ban Chỉ huy công trường', managerId: 6, managerName: 'Commander' },
            { id: 6, code: 'QC', name: 'Phòng QC', managerId: 7, managerName: 'QC' }
        ];
        saveData('departments', departments);

        const users = [
            { id: 1, name: 'Admin', email: 'admin@mep.com', password: 'password', role: 'ADMIN', departmentId: 1, position: 'Quản trị hệ thống' },
            { id: 2, name: 'CEO', email: 'ceo@mep.com', password: 'password', role: 'CEO', departmentId: 1, position: 'Tổng Giám đốc' },
            { id: 3, name: 'Planning', email: 'planning@mep.com', password: 'password', role: 'PLANNING', departmentId: 2, position: 'Trưởng phòng KH' },
            { id: 4, name: 'Project Manager', email: 'project@mep.com', password: 'password', role: 'PROJECT', departmentId: 3, position: 'Quản lý dự án' },
            { id: 5, name: 'Purchasing', email: 'purchasing@mep.com', password: 'password', role: 'PURCHASING', departmentId: 4, position: 'Nhân viên mua hàng' },
            { id: 6, name: 'Site Commander', email: 'commander@mep.com', password: 'password', role: 'SITE_COMMANDER', departmentId: 5, position: 'Chỉ huy trưởng' },
            { id: 7, name: 'QC', email: 'qc@mep.com', password: 'password', role: 'QC', departmentId: 6, position: 'QC' }
        ];
        saveData('users', users);

        const projects = [
            { id: 1, code: 'DA001', name: 'Dự án KCN Long Hậu', client: 'Cty TNHH Long Hậu', commander: 'Nguyễn Văn A', status: 'ACTIVE' },
            { id: 2, code: 'DA002', name: 'Dự án Nhà máy nhựa Đại Đồng', client: 'Cty Cổ phần Đại Đồng', commander: 'Trần Văn B', status: 'ACTIVE' }
        ];
        saveData('projects', projects);

        const warehouses = [
            { id: 1, code: 'KHO_TONG', name: 'Kho Tổng', type: 'CENTRAL', projectId: null, manager: 'Lê Thị C', address: 'KCN Long Hậu', status: 'ACTIVE' },
            { id: 2, code: 'KHO_DA001', name: 'Kho dự án DA001', type: 'SITE', projectId: 1, manager: 'Phạm Văn D', address: 'Công trường DA001', status: 'ACTIVE' },
            { id: 3, code: 'KHO_DA002', name: 'Kho dự án DA002', type: 'SITE', projectId: 2, manager: 'Hoàng Văn E', address: 'Công trường DA002', status: 'ACTIVE' }
        ];
        saveData('warehouses', warehouses);

        const items = [
            { id: 1, code: 'VT001', name: 'Ống thép DN21', itemGroup: 'Thép', model: 'DN21', unit: 'cây', standardPrice: 500000, status: 'ACTIVE' },
            { id: 2, code: 'VT002', name: 'Dây điện CVV 2x1.5', itemGroup: 'Điện', model: 'CVV 2x1.5', unit: 'mét', standardPrice: 20000, status: 'ACTIVE' },
            { id: 3, code: 'VT003', name: 'Đèn LED 18W', itemGroup: 'Điện', model: 'LED 18W', unit: 'cái', standardPrice: 150000, status: 'ACTIVE' }
        ];
        saveData('items', items);

        const vendors = [
            { id: 1, code: 'NCC001', name: 'Cty Vật tư Mạnh Cường', vendorGroup: 'Thép', contact: 'Mr. Mạnh', phone: '0901234567', email: 'manh@example.com', paymentTerm: '30 ngày' },
            { id: 2, code: 'NCC002', name: 'Cty Điện Trường Thịnh', vendorGroup: 'Điện', contact: 'Ms. Thịnh', phone: '0912345678', email: 'thinh@example.com', paymentTerm: '45 ngày' }
        ];
        saveData('vendors', vendors);

        const inventory = [];
        warehouses.forEach(wh => items.forEach(item => {
            inventory.push({ id: inventory.length + 1, warehouse_id: wh.id, item_id: item.id, quantity: 0 });
        }));
        inventory[0].quantity = 100;
        inventory[1].quantity = 200;
        inventory[2].quantity = 50;
        inventory[3].quantity = 20;
        inventory[4].quantity = 30;
        inventory[6].quantity = 10;
        saveData('inventory', inventory);

        const mrs = [
            { id: 1, code: 'MR-001', projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', items: JSON.stringify([{ itemId: 1, quantity: 10 }]), status: 'APPROVED', createdBy: 6, requester: 'Nguyễn Văn A' },
            { id: 2, code: 'MR-002', projectCode: 'DA002', projectName: 'Dự án Nhà máy nhựa Đại Đồng', items: JSON.stringify([{ itemId: 2, quantity: 50 }]), status: 'PENDING', createdBy: 6, requester: 'Trần Văn B' }
        ];
        saveData('mrs', mrs);

        const prs = [
            { id: 1, code: 'PR-001', projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', vendorCode: 'NCC001', vendorName: 'Cty Vật tư Mạnh Cường', items: JSON.stringify([{ itemId: 1, quantity: 10 }]), status: 'APPROVED', approvalStep: 3, mrId: 1, createdBy: 5 },
            { id: 2, code: 'PR-002', projectCode: 'DA002', projectName: 'Dự án Nhà máy nhựa Đại Đồng', vendorCode: 'NCC002', vendorName: 'Cty Điện Trường Thịnh', items: JSON.stringify([{ itemId: 2, quantity: 50 }]), status: 'PENDING', approvalStep: 1, mrId: 2, createdBy: 5 }
        ];
        saveData('prs', prs);

        const pos = [
            { id: 1, code: 'PO-001', projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', vendorCode: 'NCC001', vendorName: 'Cty Vật tư Mạnh Cường', items: JSON.stringify([{ itemId: 1, quantity: 10 }]), status: 'APPROVED', approvalStep: 3, prId: 1, createdBy: 5 }
        ];
        saveData('pos', pos);

        const grns = [
            { id: 1, code: 'GRN-001', poId: 1, projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', warehouseId: 1, vendorCode: 'NCC001', vendorName: 'Cty Vật tư Mạnh Cường', items: JSON.stringify([{ itemId: 1, poQty: 10, actualQty: 10, diff: 0, serial: '', condition: 'GOOD' }]), receiptDate: '2025-08-25', warehouseStaff: 'Lê Thị C', qcConfirm: 'QC', status: 'COMPLETED' }
        ];
        saveData('grns', grns);

        const stos = [
            { id: 1, code: 'STO-001', fromWarehouseId: 1, toWarehouseId: 2, projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', items: JSON.stringify([{ itemId: 1, requestedQty: 5, actualQty: 5 }]), status: 'COMPLETED' }
        ];
        saveData('stos', stos);

        const issues = [
            { id: 1, code: 'ISS-001', projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', date: '2025-08-27', area: 'Khu vực A', team: 'Đội 1', requester: 'Nguyễn Văn A', items: JSON.stringify([{ itemId: 1, requestedQty: 5, actualQty: 5, condition: 'GOOD' }]), status: 'CONFIRMED', warehouseId: 2 }
        ];
        saveData('issues', issues);

        const returns = [
            { id: 1, code: 'MRET-001', projectCode: 'DA001', projectName: 'Dự án KCN Long Hậu', returnDate: '2025-08-28', warehouseId: 1, returnFrom: 'Đội 1', returner: 'Nguyễn Văn A', items: JSON.stringify([{ itemId: 1, requestedQty: 2, actualQty: 2, condition: 'GOOD' }]), status: 'CONFIRMED' }
        ];
        saveData('material_returns', returns);

        const minStock = [
            { id: 1, warehouseId: 1, itemId: 1, minQuantity: 20 },
            { id: 2, warehouseId: 1, itemId: 2, minQuantity: 50 },
            { id: 3, warehouseId: 2, itemId: 1, minQuantity: 10 }
        ];
        saveData('min_stock', minStock);

        // ===== WORKFLOW MẪU CÓ DEPARTMENT ID =====
        const workflows = {
            mr: {
                name: 'Material Request',
                steps: [
                    { step: 1, role: 'SITE_COMMANDER', label: 'Chỉ huy trưởng duyệt', departmentId: 5 }
                ]
            },
            pr: {
                name: 'Purchase Request',
                steps: [
                    { step: 1, role: 'PLANNING', label: 'Kế hoạch duyệt', departmentId: 2 },
                    { step: 2, role: 'PROJECT', label: 'Dự án duyệt', departmentId: 3 },
                    { step: 3, role: 'CEO', label: 'Tổng Giám đốc duyệt', departmentId: 1 }
                ]
            },
            po: {
                name: 'Purchase Order',
                steps: [
                    { step: 1, role: 'PLANNING', label: 'Kế hoạch duyệt', departmentId: 2 },
                    { step: 2, role: 'PROJECT', label: 'Dự án duyệt', departmentId: 3 },
                    { step: 3, role: 'CEO', label: 'Tổng Giám đốc duyệt', departmentId: 1 }
                ]
            },
            grn: {
                name: 'Goods Receipt Note',
                steps: [
                    { step: 1, role: 'PURCHASING', label: 'Lập phiếu', departmentId: 4 },
                    { step: 2, role: 'WAREHOUSE', label: 'Thủ kho nhận', departmentId: null }, // không có role WAREHOUSE, có thể để null
                    { step: 3, role: 'QC', label: 'QC kiểm tra', departmentId: 6 },
                    { step: 4, role: 'PURCHASING', label: 'Hoàn thành', departmentId: 4 }
                ]
            },
            sto: {
                name: 'Stock Transfer',
                steps: [
                    { step: 1, role: 'PURCHASING', label: 'Lập phiếu', departmentId: 4 },
                    { step: 2, role: 'PURCHASING', label: 'Duyệt', departmentId: 4 },
                    { step: 3, role: 'PURCHASING', label: 'Xuất kho', departmentId: 4 }
                ]
            },
            issue: {
                name: 'Material Issue',
                steps: [
                    { step: 1, role: 'SITE_COMMANDER', label: 'Tạo phiếu', departmentId: 5 },
                    { step: 2, role: 'SITE_COMMANDER', label: 'Duyệt', departmentId: 5 },
                    { step: 3, role: 'PURCHASING', label: 'Cấp phát', departmentId: 4 },
                    { step: 4, role: 'SITE_COMMANDER', label: 'Xác nhận', departmentId: 5 }
                ]
            },
            materialreturn: {
                name: 'Material Return',
                steps: [
                    { step: 1, role: 'SITE_COMMANDER', label: 'Tạo phiếu', departmentId: 5 },
                    { step: 2, role: 'PURCHASING', label: 'Thủ kho nhận', departmentId: 4 },
                    { step: 3, role: 'SITE_COMMANDER', label: 'Xác nhận', departmentId: 5 }
                ]
            }
        };
        saveData('workflows', workflows);

        const permissions = {
            ADMIN: { '*': true },
            CEO: { 'dashboard.view': true, 'pr.approve': true, 'po.approve': true },
            PLANNING: { 'pr.approve': true, 'po.approve': true },
            PROJECT: { 'pr.approve': true, 'po.approve': true },
            PURCHASING: { 'pr.create': true, 'pr.edit': true, 'po.create': true, 'po.edit': true, 'grn.create': true, 'grn.receive': true, 'sto.create': true },
            SITE_COMMANDER: { 'mr.create': true, 'mr.approve': true, 'issue.create': true, 'issue.approve': true, 'materialreturn.create': true },
            QC: { 'grn.qc': true }
        };
        saveData('permissions', permissions);

        saveData('user_permissions', {});
        saveData('auto_reorder_config', { enabled: false, multiplier: 2, defaultVendor: 'NCC001' });
        saveData('auto_reorder_rules', []);
    }
}

// Gọi khởi tạo ngay khi load
initData();

// ====== CÁC HÀM ĐỒNG BỘ (SYNC) - LUÔN TRẢ VỀ MẢNG HỢP LỆ ======
function getItems() { return Array.isArray(getData('items')) ? getData('items') : []; }
function getProjects() { return Array.isArray(getData('projects')) ? getData('projects') : []; }
function getVendors() { return Array.isArray(getData('vendors')) ? getData('vendors') : []; }
function getWarehouses() { return Array.isArray(getData('warehouses')) ? getData('warehouses') : []; }
function getUsers() { return Array.isArray(getData('users')) ? getData('users') : []; }
function getDepartments() { return Array.isArray(getData('departments')) ? getData('departments') : []; }
function getInventory() { return Array.isArray(getData('inventory')) ? getData('inventory') : []; }
function getMRs() { return Array.isArray(getData('mrs')) ? getData('mrs') : []; }
function getPRs() { return Array.isArray(getData('prs')) ? getData('prs') : []; }
function getPOs() { return Array.isArray(getData('pos')) ? getData('pos') : []; }
function getGRNs() { return Array.isArray(getData('grns')) ? getData('grns') : []; }
function getSTOs() { return Array.isArray(getData('stos')) ? getData('stos') : []; }
function getIssues() { return Array.isArray(getData('issues')) ? getData('issues') : []; }
function getMaterialReturns() { return Array.isArray(getData('material_returns')) ? getData('material_returns') : []; }
function getMinStock() { return Array.isArray(getData('min_stock')) ? getData('min_stock') : []; }
function getPermissions() { return getData('permissions') || {}; }
function getUserPermissions() { return getData('user_permissions') || {}; }
function getWorkflows() { return getData('workflows') || {}; }
function getAutoReorderConfig() { return getData('auto_reorder_config') || { enabled: false, multiplier: 2 }; }
function getAutoReorderRules() { return Array.isArray(getData('auto_reorder_rules')) ? getData('auto_reorder_rules') : []; }

// ====== EXPORT RA WINDOW ======
window.getData = getData;
window.saveData = saveData;
window.generateId = generateId;
window.initData = initData;

window.getItems = getItems;
window.getProjects = getProjects;
window.getVendors = getVendors;
window.getWarehouses = getWarehouses;
window.getUsers = getUsers;
window.getDepartments = getDepartments;
window.getInventory = getInventory;
window.getMRs = getMRs;
window.getPRs = getPRs;
window.getPOs = getPOs;
window.getGRNs = getGRNs;
window.getSTOs = getSTOs;
window.getIssues = getIssues;
window.getMaterialReturns = getMaterialReturns;
window.getMinStock = getMinStock;
window.getPermissions = getPermissions;
window.getUserPermissions = getUserPermissions;
window.getWorkflows = getWorkflows;
window.getAutoReorderConfig = getAutoReorderConfig;
window.getAutoReorderRules = getAutoReorderRules;

console.log('✅ Data layer loaded with dynamic workflow (departmentId) support.');