// ================================================================
// API LAYER - Gọi API từ Backend Spring Boot
// ================================================================

const API_BASE_URL = 'http://localhost:8080/api';

// Lấy token từ sessionStorage
function getAuthToken() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.token || null;
}

// Hàm gọi API với token
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// ====== AUTH ======
async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Login failed');
    }
    return response.json();
}

// ====== PROJECTS ======
async function getProjects() {
    return apiRequest('/projects');
}

async function getProjectById(id) {
    return apiRequest(`/projects/${id}`);
}

async function createProject(project) {
    return apiRequest('/projects', 'POST', project);
}

async function updateProject(id, project) {
    return apiRequest(`/projects/${id}`, 'PUT', project);
}

async function deleteProject(id) {
    return apiRequest(`/projects/${id}`, 'DELETE');
}

// ====== VENDORS ======
async function getVendors() {
    return apiRequest('/vendors');
}

async function createVendor(vendor) {
    return apiRequest('/vendors', 'POST', vendor);
}

async function updateVendor(id, vendor) {
    return apiRequest(`/vendors/${id}`, 'PUT', vendor);
}

async function deleteVendor(id) {
    return apiRequest(`/vendors/${id}`, 'DELETE');
}

// ====== ITEMS ======
async function getItems() {
    return apiRequest('/items');
}

async function createItem(item) {
    return apiRequest('/items', 'POST', item);
}

async function updateItem(id, item) {
    return apiRequest(`/items/${id}`, 'PUT', item);
}

async function deleteItem(id) {
    return apiRequest(`/items/${id}`, 'DELETE');
}

// MR
async function getMRs() { return apiRequest('/mr'); }
async function createMR(mr) { return apiRequest('/mr', 'POST', mr); }
async function updateMR(id, mr) { return apiRequest(`/mr/${id}`, 'PUT', mr); }
async function submitMR(id) { return apiRequest(`/mr/${id}/submit`, 'POST'); }
async function approveMR(id) { return apiRequest(`/mr/${id}/approve`, 'POST'); }
async function rejectMR(id) { return apiRequest(`/mr/${id}/reject`, 'POST'); }
async function deleteMR(id) { return apiRequest(`/mr/${id}`, 'DELETE'); }

// PR
async function getPRs() { return apiRequest('/pr'); }
async function createPR(pr) { return apiRequest('/pr', 'POST', pr); }
async function updatePR(id, pr) { return apiRequest(`/pr/${id}`, 'PUT', pr); }
async function submitPR(id) { return apiRequest(`/pr/${id}/submit`, 'POST'); }
async function approvePR(id) { return apiRequest(`/pr/${id}/approve`, 'POST'); }
async function rejectPR(id) { return apiRequest(`/pr/${id}/reject`, 'POST'); }
async function deletePR(id) { return apiRequest(`/pr/${id}`, 'DELETE'); }

// PO
async function getPOs() { return apiRequest('/po'); }
async function createPO(po) { return apiRequest('/po', 'POST', po); }
async function updatePO(id, po) { return apiRequest(`/po/${id}`, 'PUT', po); }
async function submitPO(id) { return apiRequest(`/po/${id}/submit`, 'POST'); }
async function approvePO(id) { return apiRequest(`/po/${id}/approve`, 'POST'); }
async function rejectPO(id) { return apiRequest(`/po/${id}/reject`, 'POST'); }
async function deletePO(id) { return apiRequest(`/po/${id}`, 'DELETE'); }

// ====== WAREHOUSES ======
async function getWarehouses() {
    return apiRequest('/warehouses');
}

async function createWarehouse(wh) {
    return apiRequest('/warehouses', 'POST', wh);
}

async function updateWarehouse(id, wh) {
    return apiRequest(`/warehouses/${id}`, 'PUT', wh);
}

async function deleteWarehouse(id) {
    return apiRequest(`/warehouses/${id}`, 'DELETE');
}

// ====== INVENTORY ======
async function getInventory() {
    return apiRequest('/inventory');
}

async function getInventoryByWarehouse(warehouseId) {
    return apiRequest(`/inventory/warehouse/${warehouseId}`);
}

async function updateInventoryQuantity(warehouseId, itemId, quantity) {
    return apiRequest(`/inventory/warehouse/${warehouseId}/item/${itemId}?quantity=${quantity}`, 'PATCH');
}

// ====== GRN ======
async function getGRNs() {
    return apiRequest('/grn');
}

async function createGRN(grn) {
    return apiRequest('/grn', 'POST', grn);
}

async function updateGRN(id, grn) {
    return apiRequest(`/grn/${id}`, 'PUT', grn);
}

async function receiveGRN(id, warehouseStaff, receiptDate) {
    return apiRequest(`/grn/${id}/receive?warehouseStaff=${warehouseStaff}&receiptDate=${receiptDate}`, 'POST');
}

async function qcCheckGRN(id, qcName, result, note) {
    return apiRequest(`/grn/${id}/qc?qcName=${qcName}&result=${result}&note=${note || ''}`, 'POST');
}

async function completeGRN(id) {
    return apiRequest(`/grn/${id}/complete`, 'POST');
}

async function deleteGRN(id) {
    return apiRequest(`/grn/${id}`, 'DELETE');
}

// ====== STO ======
async function getSTOs() {
    return apiRequest('/sto');
}

async function createSTO(sto) {
    return apiRequest('/sto', 'POST', sto);
}

async function updateSTO(id, sto) {
    return apiRequest(`/sto/${id}`, 'PUT', sto);
}

async function submitSTO(id) {
    return apiRequest(`/sto/${id}/submit`, 'POST');
}

async function approveSTO(id) {
    return apiRequest(`/sto/${id}/approve`, 'POST');
}

async function completeSTO(id) {
    return apiRequest(`/sto/${id}/complete`, 'POST');
}

async function deleteSTO(id) {
    return apiRequest(`/sto/${id}`, 'DELETE');
}

// ====== ISSUE ======
async function getIssues() {
    return apiRequest('/issue');
}

async function createIssue(issue) {
    return apiRequest('/issue', 'POST', issue);
}

async function updateIssue(id, issue) {
    return apiRequest(`/issue/${id}`, 'PUT', issue);
}

async function submitIssue(id) {
    return apiRequest(`/issue/${id}/submit`, 'POST');
}

async function approveIssue(id) {
    return apiRequest(`/issue/${id}/approve`, 'POST');
}

async function rejectIssue(id) {
    return apiRequest(`/issue/${id}/reject`, 'POST');
}

async function completeIssue(id, warehouseId, itemsUpdateJson) {
    return apiRequest(`/issue/${id}/complete?warehouseId=${warehouseId}`, 'POST', itemsUpdateJson);
}

async function confirmIssue(id) {
    return apiRequest(`/issue/${id}/confirm`, 'POST');
}

async function deleteIssue(id) {
    return apiRequest(`/issue/${id}`, 'DELETE');
}

// ====== MATERIAL RETURN ======
async function getMaterialReturns() {
    return apiRequest('/material-return');
}

async function createMaterialReturn(data) {
    return apiRequest('/material-return', 'POST', data);
}

async function updateMaterialReturn(id, data) {
    return apiRequest(`/material-return/${id}`, 'PUT', data);
}

async function submitMaterialReturn(id) {
    return apiRequest(`/material-return/${id}/submit`, 'POST');
}

async function approveMaterialReturn(id, itemsUpdateJson) {
    return apiRequest(`/material-return/${id}/approve`, 'POST', itemsUpdateJson);
}

async function confirmMaterialReturn(id) {
    return apiRequest(`/material-return/${id}/confirm`, 'POST');
}

async function rejectMaterialReturn(id) {
    return apiRequest(`/material-return/${id}/reject`, 'POST');
}

async function deleteMaterialReturn(id) {
    return apiRequest(`/material-return/${id}`, 'DELETE');
}

// ====== MIN STOCK ======
async function getMinStock() {
    return apiRequest('/min-stock');
}

async function saveMinStock(warehouseId, itemId, minQuantity) {
    return apiRequest(`/min-stock/save?warehouseId=${warehouseId}&itemId=${itemId}&minQuantity=${minQuantity}`, 'POST');
}

async function deleteMinStock(id) {
    return apiRequest(`/min-stock/${id}`, 'DELETE');
}

// ====== AUTO REORDER ======
async function getAutoReorderConfig() {
    return apiRequest('/auto-reorder/config');
}

async function updateAutoReorderConfig(config) {
    return apiRequest('/auto-reorder/config', 'PUT', config);
}

async function checkAutoReorder() {
    return apiRequest('/auto-reorder/check', 'POST');
}

// ====== USERS (ADMIN) ======
async function getUsers() {
    return apiRequest('/users');
}

async function createUser(user) {
    return apiRequest('/users', 'POST', user);
}

async function updateUser(id, user) {
    return apiRequest(`/users/${id}`, 'PUT', user);
}

async function deleteUser(id) {
    return apiRequest(`/users/${id}`, 'DELETE');
}

// ====== DEPARTMENTS (ADMIN) ======
async function getDepartments() {
    return apiRequest('/departments');
}

async function createDepartment(dept) {
    return apiRequest('/departments', 'POST', dept);
}

async function updateDepartment(id, dept) {
    return apiRequest(`/departments/${id}`, 'PUT', dept);
}

async function deleteDepartment(id) {
    return apiRequest(`/departments/${id}`, 'DELETE');
}

// ====== WORKFLOWS (ADMIN) ======
async function getWorkflows() {
    return apiRequest('/workflows');
}

async function updateWorkflow(id, workflow) {
    return apiRequest(`/workflows/${id}`, 'PUT', workflow);
}

// ====== PERMISSIONS (ADMIN) ======
async function getPermissions() {
    return apiRequest('/permissions');
}

async function updatePermission(id, permission) {
    return apiRequest(`/permissions/${id}`, 'PUT', permission);
}

// Export các hàm ra window để sử dụng trong các module khác
window.api = {
    login,
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    getItems,
    createItem,
    updateItem,
    deleteItem,
    getMRs,
    createMR,
    updateMR,
    submitMR,
    approveMR,
    rejectMR,
    deleteMR,
    getPRs,
    createPR,
    createPRFromMR,
    updatePR,
    submitPR,
    approvePR,
    rejectPR,
    deletePR,
    getPOs,
    createPO,
    createPOFromPR,
    updatePO,
    submitPO,
    approvePO,
    rejectPO,
    deletePO,
    getWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getInventory,
    getInventoryByWarehouse,
    updateInventoryQuantity,
    getGRNs,
    createGRN,
    updateGRN,
    receiveGRN,
    qcCheckGRN,
    completeGRN,
    deleteGRN,
    getSTOs,
    createSTO,
    updateSTO,
    submitSTO,
    approveSTO,
    completeSTO,
    deleteSTO,
    getIssues,
    createIssue,
    updateIssue,
    submitIssue,
    approveIssue,
    rejectIssue,
    completeIssue,
    confirmIssue,
    deleteIssue,
    getMaterialReturns,
    createMaterialReturn,
    updateMaterialReturn,
    submitMaterialReturn,
    approveMaterialReturn,
    confirmMaterialReturn,
    rejectMaterialReturn,
    deleteMaterialReturn,
    getMinStock,
    saveMinStock,
    deleteMinStock,
    getAutoReorderConfig,
    updateAutoReorderConfig,
    checkAutoReorder,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getWorkflows,
    updateWorkflow,
    getPermissions,
    updatePermission,
};

console.log('✅ API layer ready for backend integration.');