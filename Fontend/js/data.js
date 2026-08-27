// ================================================================
// DATA LAYER - HÀM ĐỌC/GHI LOCALSTORAGE (KHÔNG TẠO DỮ LIỆU MẪU)
// ================================================================

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

// ====== ĐỒNG BỘ DỮ LIỆU (GETTERS) – TRẢ VỀ MẢNG HOẶC OBJECT RỖNG ======

function getItems() { return getData('items') || []; }
function getProjects() { return getData('projects') || []; }
function getVendors() { return getData('vendors') || []; }
function getWarehouses() { return getData('warehouses') || []; }
function getUsers() { return getData('users') || []; }
function getDepartments() { return getData('departments') || []; }
function getInventory() { return getData('inventory') || []; }
function getMRs() { return getData('mrs') || []; }
function getPRs() { return getData('prs') || []; }
function getPOs() { return getData('pos') || []; }
function getGRNs() { return getData('grns') || []; }
function getSTOs() { return getData('stos') || []; }
function getIssues() { return getData('issues') || []; }
function getMaterialReturns() { return getData('material_returns') || []; }
function getMinStock() { return getData('min_stock') || []; }
function getPermissions() { return getData('permissions') || {}; }
function getUserPermissions() { return getData('user_permissions') || {}; }
function getWorkflows() { return getData('workflows') || {}; }
function getAutoReorderConfig() { return getData('auto_reorder_config') || { enabled: false, multiplier: 2 }; }
function getAutoReorderRules() { return getData('auto_reorder_rules') || []; }

// ====== EXPORT RA WINDOW ======

window.getData = getData;
window.saveData = saveData;
window.generateId = generateId;

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

console.log('✅ Data layer loaded (no sample data)');