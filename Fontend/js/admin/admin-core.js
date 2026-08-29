// ================================================================
// ADMIN CORE - Quản lý tab, render chính, refresh dữ liệu
// ================================================================

let currentAdminTab = 'users';

// Biến toàn cục lưu dữ liệu từ API
let _adminUsers = [];
let _adminDepartments = [];
let _adminWorkflows = [];
let _adminStatuses = [];
let _adminPermissions = [];

// ====== LẤY DỮ LIỆU ======
function getUsersData() {
    if (_adminUsers.length > 0) return _adminUsers;
    return safeArray(getUsers());
}

function getDepartmentsData() {
    if (_adminDepartments.length > 0) return _adminDepartments;
    return safeArray(getDepartments());
}

function getPermissionsSafe() {
    return safeObject(_adminPermissions);
}

// ====== REFRESH DỮ LIỆU TỪ API ======
async function refreshAdminUsers() {
    try {
        _adminUsers = await api.getUsers();
    } catch (e) {
        _adminUsers = [];
        console.error('Failed to refresh users:', e);
    }
}

async function refreshAdminDepartments() {
    try {
        _adminDepartments = await api.getDepartments();
    } catch (e) {
        _adminDepartments = [];
        console.error('Failed to refresh departments:', e);
    }
}

async function refreshAdminWorkflows() {
    try {
        const data = await api.getWorkflows();
        _adminWorkflows = Array.isArray(data) ? data : [];
        saveData('workflows', _adminWorkflows);
    } catch (e) {
        console.error('Failed to refresh workflows:', e);
        _adminWorkflows = getData('workflows') || [];
    }
}

async function refreshAdminStatuses() {
    try {
        const data = await api.getStatuses();
        _adminStatuses = Array.isArray(data) ? data : [];
        saveData('statuses', _adminStatuses);
    } catch (e) {
        console.error('Failed to refresh statuses:', e);
        _adminStatuses = getData('statuses') || [];
    }
}

async function refreshAdminPermissions() {
    try {
        const data = await api.getPermissions();
        if (Array.isArray(data)) {
            _adminPermissions = data;
        } else {
            _adminPermissions = safeObject(data);
        }
        saveData('permissions', _adminPermissions);
    } catch (e) {
        console.error('Failed to refresh permissions:', e);
        _adminPermissions = getData('permissions') || {};
    }
}

// ====== RENDER CHÍNH ======
async function renderAdminPage() {
    console.log('🔄 renderAdminPage được gọi');

    let page = document.getElementById('page-admin');
    if (!page) {
        const content = document.querySelector('.content');
        if (!content) { console.error('❌ Không tìm thấy .content'); return; }
        page = document.createElement('div');
        page.className = 'page';
        page.id = 'page-admin';
        const container = document.createElement('div');
        container.id = 'admin-container';
        page.appendChild(container);
        content.appendChild(page);
    } else {
        if (!document.getElementById('admin-container')) {
            const container = document.createElement('div');
            container.id = 'admin-container';
            page.appendChild(container);
        }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');

    const user = getUser();
    if (!user || (user.role !== 'ADMIN' && !hasPermission('admin.view'))) {
        document.getElementById('admin-container').innerHTML = `
            <div class="page-header"><h2>🔒 Truy cập bị từ chối</h2></div>
            <p style="color:#e74c3c; font-size:16px;">Bạn không có quyền truy cập trang này. Chỉ ADMIN mới được phép.</p>
        `;
        return;
    }

    try {
        await refreshAdminUsers();
        await refreshAdminDepartments();
        await refreshAdminWorkflows();
        await refreshAdminStatuses();
        await refreshAdminPermissions();
        if (typeof refreshAdminPositions === 'function') await refreshAdminPositions();
    } catch(e) { console.warn('Load data error:', e); }

    renderAdminUI();
}

function renderAdminUI(tab) {
    if (tab) currentAdminTab = tab;
    const container = document.getElementById('admin-container');
    if (!container) return;

    let html = `
        <div class="page-header">
            <h2><i class="fas fa-user-shield"></i> Quản trị hệ thống</h2>
        </div>
        <div class="tab-bar">
            <div class="tab ${currentAdminTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">👤 Người dùng</div>
            <div class="tab ${currentAdminTab === 'departments' ? 'active' : ''}" onclick="switchAdminTab('departments')">🏢 Phòng ban</div>
            <div class="tab ${currentAdminTab === 'positions' ? 'active' : ''}" onclick="switchAdminTab('positions')">🏷️ Chức vụ</div>
            <div class="tab ${currentAdminTab === 'workflows' ? 'active' : ''}" onclick="switchAdminTab('workflows')">⚙️ Workflow</div>
            <div class="tab ${currentAdminTab === 'statuses' ? 'active' : ''}" onclick="switchAdminTab('statuses')">📊 Trạng thái</div>
            <div class="tab ${currentAdminTab === 'department-permissions' ? 'active' : ''}" onclick="switchAdminTab('department-permissions')">🏢 Phân quyền phòng ban</div>
            <div class="tab ${currentAdminTab === 'user-permissions' ? 'active' : ''}" onclick="switchAdminTab('user-permissions')">👤 Phân quyền user</div>
            <div class="tab ${currentAdminTab === 'audit' ? 'active' : ''}" onclick="switchAdminTab('audit')">📜 Nhật ký</div>
        </div>
        <div id="admin-tab-content">
    `;

    try {
        if (currentAdminTab === 'users') {
            html += renderUsersTab();
        } else if (currentAdminTab === 'departments') {
            html += renderDepartmentsTab();
        } else if (currentAdminTab === 'workflows') {
            html += renderWorkflowsTab();
        } else if (currentAdminTab === 'statuses') {
            html += renderStatusesTab();
        } else if (currentAdminTab === 'department-permissions') {
            html += renderDepartmentPermissionsTab();
        } else if (currentAdminTab === 'user-permissions') {
            html += renderUserPermissionsTab();
        }
    } catch (error) {
        console.error('Lỗi render tab admin:', error);
        html += `<div style="color:red; padding:20px;">Có lỗi xảy ra khi hiển thị tab: ${error.message}</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Các tab async render riêng (positions, audit)
    if (currentAdminTab === 'positions' && typeof renderPositionsTab === 'function') {
        renderPositionsTab();
    } else if (currentAdminTab === 'audit' && typeof renderAuditTab === 'function') {
        renderAuditTab();
    }

    // Gán sự kiện cho filter
    if (currentAdminTab === 'users') {
        document.getElementById('admin-user-filter')?.addEventListener('input', () => renderAdminUI('users'));
        document.getElementById('admin-role-filter')?.addEventListener('change', () => renderAdminUI('users'));
    }
    if (currentAdminTab === 'departments') {
        document.getElementById('dept-filter')?.addEventListener('input', () => renderAdminUI('departments'));
    }
}

function switchAdminTab(tab) {
    renderAdminUI(tab);
}

// Export
window.renderAdminPage = renderAdminPage;
window.renderAdminUI = renderAdminUI;
window.switchAdminTab = switchAdminTab;
window.getUsersData = getUsersData;
window.getDepartmentsData = getDepartmentsData;
window.getPermissionsSafe = getPermissionsSafe;
window.refreshAdminUsers = refreshAdminUsers;
window.refreshAdminDepartments = refreshAdminDepartments;
window.refreshAdminWorkflows = refreshAdminWorkflows;
window.refreshAdminStatuses = refreshAdminStatuses;
window.refreshAdminPermissions = refreshAdminPermissions;