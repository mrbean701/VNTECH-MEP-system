// ================================================================
// API LAYER - GỌI BACKEND + FALLBACK LOCALSTORAGE
// ================================================================

const API_BASE_URL = 'http://localhost:8080/api';

function getAuthToken() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.token || null;
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch(e) {}
        throw new Error(errorMessage);
    }
    
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

function extractArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return null;
}

function extractObject(data) {
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    if (data && data.data && typeof data.data === 'object') return data.data;
    return null;
}

// ====== AUTH ======
async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

// ====== CÁC HÀM GET (fallback localStorage) ======
async function getProjects() {
    try {
        const data = await apiRequest('/projects');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('projects', arr);
            return arr;
        }
    } catch(e) { console.warn('getProjects fallback:', e); }
    return getData('projects') || [];
}

async function getVendors() {
    try {
        const data = await apiRequest('/vendors');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('vendors', arr);
            return arr;
        }
    } catch(e) { console.warn('getVendors fallback:', e); }
    return getData('vendors') || [];
}

async function getItems() {
    try {
        const data = await apiRequest('/items');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('items', arr);
            return arr;
        }
    } catch(e) { console.warn('getItems fallback:', e); }
    return getData('items') || [];
}

async function getMRs() {
    try {
        const data = await apiRequest('/mr');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('mrs', arr);
            return arr;
        }
    } catch(e) { console.warn('getMRs fallback:', e); }
    return getData('mrs') || [];
}

async function getPRs() {
    try {
        const data = await apiRequest('/pr');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('prs', arr);
            return arr;
        }
    } catch(e) { console.warn('getPRs fallback:', e); }
    return getData('prs') || [];
}

async function getPOs() {
    try {
        const data = await apiRequest('/po');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('pos', arr);
            return arr;
        }
    } catch(e) { console.warn('getPOs fallback:', e); }
    return getData('pos') || [];
}

async function getWarehouses() {
    try {
        const data = await apiRequest('/warehouses');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('warehouses', arr);
            return arr;
        }
    } catch(e) { console.warn('getWarehouses fallback:', e); }
    return getData('warehouses') || [];
}

async function getInventory() {
    try {
        const data = await apiRequest('/inventory');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('inventory', arr);
            return arr;
        }
    } catch(e) { console.warn('getInventory fallback:', e); }
    return getData('inventory') || [];
}

async function getInventoryByWarehouse(warehouseId) {
    try {
        const data = await apiRequest(`/inventory/warehouse/${warehouseId}`);
        return extractArray(data) || [];
    } catch(e) {
        console.warn('getInventoryByWarehouse fallback:', e);
        const all = await getInventory();
        return (all || []).filter(i => (i.warehouseId || i.warehouse_id) === warehouseId);
    }
}

// ====== WAREHOUSE CRUD ======
async function createWarehouse(warehouse) { return apiRequest('/warehouses', 'POST', warehouse); }
async function updateWarehouse(id, warehouse) { return apiRequest(`/warehouses/${id}`, 'PUT', warehouse); }
async function deleteWarehouse(id) { return apiRequest(`/warehouses/${id}`, 'DELETE'); }

// ====== INVENTORY CRUD ======
async function updateInventoryQuantity(warehouseId, itemId, quantity) {
    return apiRequest(`/inventory/warehouse/${warehouseId}/item/${itemId}?quantity=${quantity}`, 'PATCH');
}

async function getGRNs() {
    try {
        const data = await apiRequest('/grn');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('grns', arr);
            return arr;
        }
    } catch(e) { console.warn('getGRNs fallback:', e); }
    return getData('grns') || [];
}

async function getSTOs() {
    try {
        const data = await apiRequest('/sto');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('stos', arr);
            return arr;
        }
    } catch(e) { console.warn('getSTOs fallback:', e); }
    return getData('stos') || [];
}

async function getIssues() {
    try {
        const data = await apiRequest('/issue');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('issues', arr);
            return arr;
        }
    } catch(e) { console.warn('getIssues fallback:', e); }
    return getData('issues') || [];
}

async function getMaterialReturns() {
    try {
        const data = await apiRequest('/material-return');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('material_returns', arr);
            return arr;
        }
    } catch(e) { console.warn('getMaterialReturns fallback:', e); }
    return getData('material_returns') || [];
}

async function getMinStock() {
    try {
        const data = await apiRequest('/min-stock');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('min_stock', arr);
            return arr;
        }
    } catch(e) { console.warn('getMinStock fallback:', e); }
    return getData('min_stock') || [];
}

async function getUsers() {
    try {
        const data = await apiRequest('/users');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('users', arr);
            return arr;
        }
    } catch(e) { console.warn('getUsers fallback:', e); }
    return getData('users') || [];
}

async function getDepartments() {
    try {
        const data = await apiRequest('/departments');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('departments', arr);
            return arr;
        }
    } catch(e) { console.warn('getDepartments fallback:', e); }
    return getData('departments') || [];
}

async function getPermissions() {
    try {
        const data = await apiRequest('/permissions');
        console.log('getPermissions raw data:', data);
        const arr = extractArray(data);
        console.log('getPermissions extracted array:', arr);
        if (arr && arr.length > 0) {
            saveData('permissions', arr);
            return arr;
        }
    } catch(e) { console.warn('getPermissions fallback:', e); }
    return getData('permissions') || {};
}

// ====== WORKFLOW API ======
async function getWorkflows() {
    try {
        const data = await apiRequest('/workflows');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('workflows', arr);
            return arr;
        }
    } catch(e) { console.warn('getWorkflows fallback:', e); }
    return getData('workflows') || [];
}

async function getWorkflowsByModule(module) {
    try {
        const data = await apiRequest(`/workflows/module/${module}`);
        const arr = extractArray(data);
        if (arr && arr.length > 0) return arr;
    } catch(e) { console.warn('getWorkflowsByModule fallback:', e); }
    const all = getData('workflows') || [];
    return all.filter(w => w.module === module);
}

async function getActiveWorkflow(module) {
    try {
        const data = await apiRequest(`/workflows/module/${module}/active`);
        const obj = extractObject(data);
        if (obj && obj.id) return obj;
    } catch(e) { console.warn('getActiveWorkflow fallback:', e); }
    const all = getData('workflows') || [];
    return all.find(w => w.module === module && w.isActive === true) || null;
}

async function createWorkflow(workflow) {
    return apiRequest('/workflows', 'POST', workflow);
}

async function updateWorkflow(id, workflow) {
    return apiRequest(`/workflows/${id}`, 'PUT', workflow);
}

async function activateWorkflow(module, id) {
    return apiRequest(`/workflows/module/${module}/activate/${id}`, 'PUT');
}

async function duplicateWorkflow(id) {
    return apiRequest(`/workflows/duplicate/${id}`, 'POST');
}

async function deleteWorkflow(id) {
    return apiRequest(`/workflows/${id}`, 'DELETE');
}

// ====== WORKFLOW STEP-STATUS MAPPING ======
async function getStepsWithStatus(module) {
    return apiRequest(`/workflows/module/${module}/steps-with-status`);
}

async function getStatusForStep(module, step) {
    return apiRequest(`/workflows/module/${module}/step/${step}/status`);
}

async function getWorkflowStepStatuses(workflowId) {
    return apiRequest(`/workflows/${workflowId}/step-statuses`);
}

async function createWorkflowWithStatuses(payload) {
    return apiRequest('/workflows/with-statuses', 'POST', payload);
}

async function updateWorkflowWithStatuses(id, payload) {
    return apiRequest(`/workflows/${id}/with-statuses`, 'PUT', payload);
}

// ====== WORKFLOW BY ID (mới thêm) ======
async function getWorkflowById(id) {
    try {
        const data = await apiRequest(`/workflows/${id}`);
        return data;
    } catch(e) {
        console.warn('getWorkflowById fallback:', e);
        const all = getData('workflows') || [];
        return all.find(w => w.id === id) || null;
    }
}

// ====== STATUS API ======
async function getStatuses(entityType) {
    if (entityType) {
        return apiRequest(`/statuses/entity/${entityType}`);
    }
    return apiRequest('/statuses');
}

async function getDefaultStatus(entityType) {
    return apiRequest(`/statuses/entity/${entityType}/default`);
}

async function getFinalStatuses(entityType) {
    return apiRequest(`/statuses/entity/${entityType}/final`);
}

async function getStatusByEntityAndCode(entityType, code) {
    return apiRequest(`/statuses/entity/${entityType}/code/${code}`);
}

async function createStatus(data) {
    return apiRequest('/statuses', 'POST', data);
}

async function updateStatus(id, data) {
    return apiRequest(`/statuses/${id}`, 'PUT', data);
}

async function deleteStatus(id) {
    return apiRequest(`/statuses/${id}`, 'DELETE');
}

async function deleteStatusesByEntityType(entityType) {
    return apiRequest(`/statuses/entity/${entityType}`, 'DELETE');
}

// ====== USER PERMISSIONS ======
async function getUserPermissions(userId) {
    try {
        const data = await apiRequest(`/permissions/user/${userId}`);
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            const map = {};
            arr.forEach(p => { map[p.permissionKey] = p.enabled; });
            const allUserPerms = getData('user_permissions') || {};
            allUserPerms[userId] = map;
            saveData('user_permissions', allUserPerms);
            return map;
        }
    } catch(e) { console.warn('getUserPermissions fallback:', e); }
    const all = getData('user_permissions') || {};
    return all[userId] || {};
}

async function assignUserPermission(userId, permissionKey, enabled = true) {
    const result = await apiRequest(`/permissions/user/${userId}/assign?permissionKey=${permissionKey}&enabled=${enabled}`, 'POST');
    await getUserPermissions(userId);
    return result;
}

async function removeUserPermission(userId, permissionKey) {
    await apiRequest(`/permissions/user/${userId}/remove?permissionKey=${permissionKey}`, 'DELETE');
    await getUserPermissions(userId);
}

// ====== CRUD CHUNG ======
async function createProject(project) { return apiRequest('/projects', 'POST', project); }
async function updateProject(id, project) { return apiRequest(`/projects/${id}`, 'PUT', project); }
async function deleteProject(id) { return apiRequest(`/projects/${id}`, 'DELETE'); }

async function createVendor(vendor) { return apiRequest('/vendors', 'POST', vendor); }
async function updateVendor(id, vendor) { return apiRequest(`/vendors/${id}`, 'PUT', vendor); }
async function deleteVendor(id) { return apiRequest(`/vendors/${id}`, 'DELETE'); }

async function createItem(item) { return apiRequest('/items', 'POST', item); }
async function updateItem(id, item) { return apiRequest(`/items/${id}`, 'PUT', item); }
async function deleteItem(id) { return apiRequest(`/items/${id}`, 'DELETE'); }

async function createMR(mr) { return apiRequest('/mr', 'POST', mr); }
async function updateMR(id, mr) { return apiRequest(`/mr/${id}`, 'PUT', mr); }
async function deleteMR(id) { return apiRequest(`/mr/${id}`, 'DELETE'); }
async function submitMR(id) { return apiRequest(`/mr/${id}/submit`, 'POST'); }
async function approveMR(id) { return apiRequest(`/mr/${id}/approve`, 'POST'); }
async function rejectMR(id) { return apiRequest(`/mr/${id}/reject`, 'POST'); }

async function createPR(pr) { return apiRequest('/pr', 'POST', pr); }
async function updatePR(id, pr) { return apiRequest(`/pr/${id}`, 'PUT', pr); }
async function deletePR(id) { return apiRequest(`/pr/${id}`, 'DELETE'); }
async function submitPR(id) { return apiRequest(`/pr/${id}/submit`, 'POST'); }
async function approvePR(id) { return apiRequest(`/pr/${id}/approve`, 'POST'); }
async function rejectPR(id) { return apiRequest(`/pr/${id}/reject`, 'POST'); }

async function createPO(po) { return apiRequest('/po', 'POST', po); }
async function updatePO(id, po) { return apiRequest(`/po/${id}`, 'PUT', po); }
async function deletePO(id) { return apiRequest(`/po/${id}`, 'DELETE'); }
async function submitPO(id) { return apiRequest(`/po/${id}/submit`, 'POST'); }
async function approvePO(id) { return apiRequest(`/po/${id}/approve`, 'POST'); }
async function rejectPO(id) { return apiRequest(`/po/${id}/reject`, 'POST'); }

async function createGRN(grn) { return apiRequest('/grn', 'POST', grn); }
async function updateGRN(id, grn) { return apiRequest(`/grn/${id}`, 'PUT', grn); }
async function deleteGRN(id) { return apiRequest(`/grn/${id}`, 'DELETE'); }
async function receiveGRN(id, warehouseStaff, receiptDate) {
    return apiRequest(`/grn/${id}/receive?warehouseStaff=${warehouseStaff}&receiptDate=${receiptDate}`, 'POST');
}
async function qcCheckGRN(id, qcName, result, note) {
    return apiRequest(`/grn/${id}/qc?qcName=${qcName}&result=${result}&note=${note || ''}`, 'POST');
}
async function completeGRN(id) { return apiRequest(`/grn/${id}/complete`, 'POST'); }

async function createSTO(sto) { return apiRequest('/sto', 'POST', sto); }
async function updateSTO(id, sto) { return apiRequest(`/sto/${id}`, 'PUT', sto); }
async function deleteSTO(id) { return apiRequest(`/sto/${id}`, 'DELETE'); }
async function submitSTO(id) { return apiRequest(`/sto/${id}/submit`, 'POST'); }
async function approveSTO(id) { return apiRequest(`/sto/${id}/approve`, 'POST'); }
async function completeSTO(id) { return apiRequest(`/sto/${id}/complete`, 'POST'); }

async function createIssue(issue) { return apiRequest('/issue', 'POST', issue); }
async function updateIssue(id, issue) { return apiRequest(`/issue/${id}`, 'PUT', issue); }
async function deleteIssue(id) { return apiRequest(`/issue/${id}`, 'DELETE'); }
async function submitIssue(id) { return apiRequest(`/issue/${id}/submit`, 'POST'); }
async function approveIssue(id) { return apiRequest(`/issue/${id}/approve`, 'POST'); }
async function rejectIssue(id) { return apiRequest(`/issue/${id}/reject`, 'POST'); }
async function completeIssue(id, warehouseId, itemsUpdateJson) {
    return apiRequest(`/issue/${id}/complete?warehouseId=${warehouseId}`, 'POST', itemsUpdateJson);
}
async function confirmIssue(id) { return apiRequest(`/issue/${id}/confirm`, 'POST'); }

async function createMaterialReturn(data) { return apiRequest('/material-return', 'POST', data); }
async function updateMaterialReturn(id, data) { return apiRequest(`/material-return/${id}`, 'PUT', data); }
async function deleteMaterialReturn(id) { return apiRequest(`/material-return/${id}`, 'DELETE'); }
async function submitMaterialReturn(id) { return apiRequest(`/material-return/${id}/submit`, 'POST'); }
async function approveMaterialReturn(id, itemsUpdateJson) {
    return apiRequest(`/material-return/${id}/approve`, 'POST', itemsUpdateJson);
}
async function confirmMaterialReturn(id) { return apiRequest(`/material-return/${id}/confirm`, 'POST'); }
async function rejectMaterialReturn(id) { return apiRequest(`/material-return/${id}/reject`, 'POST'); }

async function saveMinStock(warehouseId, itemId, minQuantity) {
    return apiRequest(`/min-stock/save?warehouseId=${warehouseId}&itemId=${itemId}&minQuantity=${minQuantity}`, 'POST');
}
async function deleteMinStock(id) { return apiRequest(`/min-stock/${id}`, 'DELETE'); }

async function updateAutoReorderConfig(config) { return apiRequest('/auto-reorder/config', 'PUT', config); }
async function checkAutoReorder() { return apiRequest('/auto-reorder/check', 'POST'); }

async function getAutoReorderConfig() {
    try {
        const data = await apiRequest('/auto-reorder/config');
        const obj = extractObject(data);
        if (obj && obj.id) {
            saveData('auto_reorder_config', obj);
            return obj;
        }
    } catch(e) { console.warn('getAutoReorderConfig fallback:', e); }
    return getData('auto_reorder_config') || { enabled: false, multiplier: 2 };
}

async function getAutoReorderRules() {
    try {
        const data = await apiRequest('/auto-reorder/rules');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('auto_reorder_rules', arr);
            return arr;
        }
    } catch(e) { console.warn('getAutoReorderRules fallback:', e); }
    return getData('auto_reorder_rules') || [];
}

async function createAutoReorderRule(rule) { return apiRequest('/auto-reorder/rules', 'POST', rule); }
async function updateAutoReorderRule(id, rule) { return apiRequest(`/auto-reorder/rules/${id}`, 'PUT', rule); }
async function deleteAutoReorderRule(id) { return apiRequest(`/auto-reorder/rules/${id}`, 'DELETE'); }

async function createUser(user) { return apiRequest('/users', 'POST', user); }
async function updateUser(id, user) { return apiRequest(`/users/${id}`, 'PUT', user); }
async function deleteUser(id) { return apiRequest(`/users/${id}`, 'DELETE'); }

async function createDepartment(dept) { return apiRequest('/departments', 'POST', dept); }
async function updateDepartment(id, dept) { return apiRequest(`/departments/${id}`, 'PUT', dept); }
async function deleteDepartment(id) { return apiRequest(`/departments/${id}`, 'DELETE'); }
async function getDepartmentSubs(id) { return apiRequest(`/departments/${id}/sub`); }

// ====== POSITIONS ======
async function getPositions() {
    try {
        const data = await apiRequest('/positions');
        const arr = extractArray(data);
        if (arr && arr.length > 0) {
            saveData('positions', arr);
            return arr;
        }
    } catch(e) { console.warn('getPositions fallback:', e); }
    return getData('positions') || [];
}

async function getActivePositions() {
    try {
        const data = await apiRequest('/positions/active');
        return extractArray(data) || [];
    } catch(e) { console.warn('getActivePositions fallback:', e); }
    return getData('positions') || [];
}

async function createPosition(pos) { return apiRequest('/positions', 'POST', pos); }
async function updatePosition(id, pos) { return apiRequest(`/positions/${id}`, 'PUT', pos); }
async function deletePosition(id) { return apiRequest(`/positions/${id}`, 'DELETE'); }

// ====== AUDIT LOG ======
async function getAuditLogs() {
    try {
        const data = await apiRequest('/audit');
        return extractArray(data) || [];
    } catch(e) { console.warn('getAuditLogs fallback:', e); }
    return getData('audit_logs') || [];
}
async function clearAuditLogs() { return apiRequest('/audit/clear', 'DELETE'); }

// ====== DEPARTMENT PERMISSIONS ======
async function getDepartmentPermissions(departmentId) {
    return apiRequest(`/permissions/department/${departmentId}`);
}

async function assignDepartmentPermission(departmentId, permissionKey, enabled = true) {
    return apiRequest(`/permissions/department/${departmentId}/assign?permissionKey=${permissionKey}&enabled=${enabled}`, 'POST');
}

async function removeDepartmentPermission(departmentId, permissionKey) {
    return apiRequest(`/permissions/department/${departmentId}/remove?permissionKey=${permissionKey}`, 'DELETE');
}

// ====== EXPORT RA WINDOW ======
window.api = {
    // Auth
    login,
    // GETs
    getProjects, getVendors, getItems, getMRs, getPRs, getPOs,
    getWarehouses, getInventory, getGRNs, getSTOs, getIssues, getMaterialReturns,
    getMinStock, getUsers, getDepartments, getPermissions,
    // Workflow
    getWorkflows, getWorkflowsByModule, getActiveWorkflow,
    createWorkflow, updateWorkflow, activateWorkflow,
    duplicateWorkflow, deleteWorkflow,
    // Workflow Step-Status
    getStepsWithStatus, getStatusForStep, getWorkflowStepStatuses,
    createWorkflowWithStatuses, updateWorkflowWithStatuses,
    // Workflow by ID
    getWorkflowById,
    // Status
    getStatuses, getDefaultStatus, getFinalStatuses, getStatusByEntityAndCode,
    createStatus, updateStatus, deleteStatus, deleteStatusesByEntityType,
    // User Permissions
    getUserPermissions, assignUserPermission, removeUserPermission,
    // CRUD
    createProject, updateProject, deleteProject,
    createVendor, updateVendor, deleteVendor,
    createItem, updateItem, deleteItem,
    createWarehouse, updateWarehouse, deleteWarehouse,
    getInventoryByWarehouse, updateInventoryQuantity,
    createMR, updateMR, deleteMR, submitMR, approveMR, rejectMR,
    createPR, updatePR, deletePR, submitPR, approvePR, rejectPR,
    createPO, updatePO, deletePO, submitPO, approvePO, rejectPO,
    createGRN, updateGRN, deleteGRN, receiveGRN, qcCheckGRN, completeGRN,
    createSTO, updateSTO, deleteSTO, submitSTO, approveSTO, completeSTO,
    createIssue, updateIssue, deleteIssue, submitIssue, approveIssue, rejectIssue, completeIssue, confirmIssue,
    createMaterialReturn, updateMaterialReturn, deleteMaterialReturn,
    submitMaterialReturn, approveMaterialReturn, confirmMaterialReturn, rejectMaterialReturn,
    saveMinStock, deleteMinStock,
    updateAutoReorderConfig, checkAutoReorder,
    getAutoReorderConfig, getAutoReorderRules,
    createAutoReorderRule, updateAutoReorderRule, deleteAutoReorderRule,
    createUser, updateUser, deleteUser,
    createDepartment, updateDepartment, deleteDepartment, getDepartmentSubs,
    getPositions, getActivePositions, createPosition, updatePosition, deletePosition,
    getAuditLogs, clearAuditLogs,
    getDepartmentPermissions,
    assignDepartmentPermission,
    removeDepartmentPermission,
};

console.log('✅ API layer loaded successfully');