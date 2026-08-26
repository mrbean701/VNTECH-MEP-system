// ================================================================
// ADMIN - Quản lý người dùng, Phòng ban, Workflow, Phân quyền (FULL API)
// ================================================================

let currentAdminTab = 'users';

// Biến toàn cục lưu dữ liệu từ API
let _adminUsers = [];
let _adminDepartments = [];
let _adminWorkflows = [];

// ====== HELPER AN TOÀN ======
function safeArray(data) {
    return Array.isArray(data) ? data : [];
}
function safeObject(data) {
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

// ====== HÀM HELPERS ======
function getRoles() {
    return [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'PLANNING', label: 'Kế hoạch' },
        { value: 'PROJECT', label: 'Dự án' },
        { value: 'CEO', label: 'CEO' },
        { value: 'PURCHASING', label: 'Mua hàng' },
        { value: 'SITE_COMMANDER', label: 'Chỉ huy' },
        { value: 'QC', label: 'QC' }
    ];
}

function getAllPermissionKeys() {
    return [
        'dashboard.view',
        'mr.view', 'mr.create', 'mr.edit', 'mr.delete', 'mr.approve', 'mr.submit', 'mr.reject',
        'pr.view', 'pr.create', 'pr.edit', 'pr.delete', 'pr.approve', 'pr.submit', 'pr.reject',
        'po.view', 'po.create', 'po.edit', 'po.delete', 'po.approve', 'po.submit', 'po.reject',
        'inventory.view', 'inventory.edit', 'inventory.delete',
        'grn.view', 'grn.create', 'grn.edit', 'grn.delete', 'grn.receive', 'grn.qc', 'grn.complete',
        'sto.view', 'sto.create', 'sto.edit', 'sto.delete', 'sto.submit', 'sto.approve', 'sto.complete',
        'issue.view', 'issue.create', 'issue.edit', 'issue.delete', 'issue.submit', 'issue.approve', 'issue.complete', 'issue.confirm', 'issue.reject',
        'materialreturn.view', 'materialreturn.create', 'materialreturn.edit', 'materialreturn.delete',
        'materialreturn.submit', 'materialreturn.approve', 'materialreturn.confirm', 'materialreturn.reject',
        'admin.view'
    ];
}

function getModuleLabel(module) {
    const map = {
        'dashboard': 'Dashboard',
        'mr': 'MR',
        'pr': 'PR',
        'po': 'PO',
        'inventory': 'Kho / Tồn kho',
        'grn': 'GRN',
        'sto': 'STO',
        'issue': 'Cấp phát',
        'materialreturn': 'Hoàn trả',
        'admin': 'Admin'
    };
    return map[module] || module;
}

function getActionLabel(action) {
    const map = {
        'view': '👁️ Xem',
        'create': '➕ Tạo',
        'edit': '✏️ Sửa',
        'delete': '🗑️ Xóa',
        'approve': '✅ Duyệt',
        'receive': '📥 Nhận',
        'qc': '🔬 QC',
        'complete': '✔️ Hoàn thành',
        'submit': '📤 Gửi duyệt',
        'confirm': '✅ Xác nhận',
        'reject': '❌ Từ chối'
    };
    return map[action] || action;
}

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
    return safeObject(getPermissions());
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

// ===================================================================
// RENDER CHÍNH
// ===================================================================
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
        await api.getPermissions();
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
            <div class="tab ${currentAdminTab === 'workflows' ? 'active' : ''}" onclick="switchAdminTab('workflows')">⚙️ Workflow</div>
            <div class="tab ${currentAdminTab === 'role-permissions' ? 'active' : ''}" onclick="switchAdminTab('role-permissions')">🔑 Phân quyền role</div>
            <div class="tab ${currentAdminTab === 'user-permissions' ? 'active' : ''}" onclick="switchAdminTab('user-permissions')">👤 Phân quyền user</div>
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
        } else if (currentAdminTab === 'role-permissions') {
            html += renderRolePermissionsTab();
        } else if (currentAdminTab === 'user-permissions') {
            html += renderUserPermissionsTab();
        }
    } catch (error) {
        console.error('Lỗi render tab admin:', error);
        html += `<div style="color:red; padding:20px;">Có lỗi xảy ra khi hiển thị tab: ${error.message}</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

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

// ===================================================================
// 1. TAB NGƯỜI DÙNG
// ===================================================================
function renderUsersTab() {
    const users = getUsersData();
    const departments = getDepartmentsData();
    const currentUser = getUser();
    const roles = getRoles();

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <div class="filter-bar" style="flex:1; margin:0;">
                <input type="text" id="admin-user-filter" placeholder="Tìm theo tên hoặc email..." style="flex:1;" />
                <select id="admin-role-filter">
                    <option value="">Tất cả role</option>
                    ${roles.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
                </select>
                <button class="btn btn-sm" onclick="renderAdminUI('users')"><i class="fas fa-search"></i></button>
            </div>
            <button class="btn" onclick="showAddUserModal()"><i class="fas fa-plus"></i> Thêm người dùng</button>
        </div>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phòng ban</th>
                        <th>Chức danh</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const filter = document.getElementById('admin-user-filter')?.value?.toLowerCase() || '';
    const roleFilter = document.getElementById('admin-role-filter')?.value || '';

    const filtered = users.filter(u => {
        const matchName = (u.name || '').toLowerCase().includes(filter);
        const matchEmail = (u.email || '').toLowerCase().includes(filter);
        const matchRole = roleFilter ? u.role === roleFilter : true;
        return (matchName || matchEmail) && matchRole;
    });

    if (!filtered.length) {
        html += `<tr><td colspan="7" style="text-align:center; color:#999;">Không có người dùng nào</td></tr>`;
    }

    filtered.forEach(u => {
        const roleLabel = roles.find(r => r.value === u.role)?.label || u.role;
        const dept = departments.find(d => d.id === u.departmentId);
        const deptName = dept ? dept.name : (u.department || '--');
        const isCurrent = u.id === currentUser.id;
        html += `
            <tr>
                <td>${u.id}</td>
                <td>${u.name} ${isCurrent ? '<span class="badge badge-approved">Bạn</span>' : ''}</td>
                <td>${u.email}</td>
                <td>${roleLabel}</td>
                <td>${deptName}</td>
                <td>${u.position || '--'}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="viewUser(${u.id})"><i class="fas fa-eye"></i></button>
                    ${!isCurrent ? `
                        <button class="btn btn-warning btn-sm" onclick="editUser(${u.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
                    ` : `
                        <span style="font-size:12px; color:#888;">(Không thể tự sửa/xóa)</span>
                    `}
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top:16px; font-size:13px; color:#888;">
            <i class="fas fa-info-circle"></i> <strong>Lưu ý:</strong> Bạn không thể sửa hoặc xóa chính mình.
        </div>
    `;
    return html;
}

// ===================================================================
// 2. TAB PHÒNG BAN
// ===================================================================
function renderDepartmentsTab() {
    const departments = getDepartmentsData();
    const users = getUsersData();

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <div class="filter-bar" style="flex:1; margin:0;">
                <input type="text" id="dept-filter" placeholder="Tìm theo mã hoặc tên..." style="flex:1;" />
                <button class="btn btn-sm" onclick="renderAdminUI('departments')"><i class="fas fa-search"></i></button>
            </div>
            <button class="btn" onclick="showAddDepartmentModal()"><i class="fas fa-plus"></i> Thêm phòng ban</button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap:16px;">
    `;

    const filter = document.getElementById('dept-filter')?.value?.toLowerCase() || '';
    const filtered = departments.filter(d =>
        (d.code || '').toLowerCase().includes(filter) || (d.name || '').toLowerCase().includes(filter)
    );

    if (!filtered.length) {
        html += `<div style="grid-column:1/-1; text-align:center; color:#999;">Chưa có phòng ban nào</div>`;
    }

    filtered.forEach(d => {
        const members = users.filter(u => u.departmentId === d.id);
        const manager = users.find(u => u.id === d.managerId);
        const managerName = manager ? manager.name : (d.managerName || 'Chưa có');

        html += `
            <div style="background:white; border-radius:12px; padding:16px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h4 style="margin:0; color:#1a3c6e;">${d.name}</h4>
                        <div style="font-size:13px; color:#888; margin-top:4px;">
                            <span class="badge badge-info">${d.code}</span>
                            <span>Trưởng phòng: <strong>${managerName}</strong></span>
                        </div>
                    </div>
                    <div style="display:flex; gap:4px;">
                        <button class="btn btn-warning btn-sm" onclick="editDepartment(${d.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteDepartment(${d.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div style="margin-top:12px; border-top:1px solid #f0f0f0; padding-top:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:600; font-size:14px;">👥 Thành viên (${members.length})</span>
                        <button class="btn btn-sm btn-info" onclick="showAddUserToDepartment(${d.id})"><i class="fas fa-plus"></i> Thêm</button>
                    </div>
                    ${members.length === 0 ? '<div style="color:#999; font-size:13px;">Chưa có thành viên</div>' : ''}
                    ${members.map(m => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px;">
                            <div>
                                <span style="font-weight:500;">${m.name}</span>
                                <span style="font-size:12px; color:#888;">(${m.position || '--'})</span>
                                <span class="badge badge-draft" style="font-size:10px;">${m.role}</span>
                            </div>
                            <div>
                                <button class="btn btn-warning btn-sm" onclick="editUserInDept(${m.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm" onclick="removeUserFromDept(${m.id})"><i class="fas fa-user-minus"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

// ===================================================================
// 3. TAB WORKFLOW (QUẢN LÝ ĐA MẪU)
// ===================================================================
function renderWorkflowsTab() {
    const workflows = _adminWorkflows || [];
    const modules = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn'];
    
    // Nhóm theo module
    const grouped = {};
    modules.forEach(mod => {
        grouped[mod] = workflows.filter(w => w.module === mod);
    });

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">⚙️ Quản lý Workflow</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-success" onclick="createDefaultWorkflows()"><i class="fas fa-plus"></i> Tạo mặc định</button>
                <button class="btn btn-info" onclick="refreshWorkflows()"><i class="fas fa-sync"></i> Làm mới</button>
            </div>
        </div>
        <div style="font-size:13px; color:#888; margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
            <i class="fas fa-info-circle"></i> 
            <strong>Hướng dẫn:</strong> Mỗi module chỉ có <strong>1</strong> workflow được kích hoạt (is_active = true). 
            Mẫu hệ thống (is_system = true) không thể xóa. 
            <span style="display:block; margin-top:4px;">
                <span class="badge badge-approved">✅ Đang áp dụng</span>
                <span class="badge badge-draft">⏸️ Không áp dụng</span>
                <span class="badge badge-info">Hệ thống</span>
                <span class="badge badge-draft">Tùy chỉnh</span>
            </span>
        </div>
    `;

    for (const module of modules) {
        const list = grouped[module] || [];
        const active = list.find(w => w.isActive === true);

        html += `
            <div style="background:white; border-radius:8px; padding:16px; margin-bottom:16px; border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:#1a3c6e; text-transform:uppercase; font-size:16px;">
                        ${module.toUpperCase()}
                        <span style="font-size:13px; font-weight:400; color:#888; margin-left:8px;">${list.length} mẫu</span>
                    </h4>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <button class="btn btn-sm btn-info" onclick="showCreateWorkflowModal('${module}')"><i class="fas fa-plus"></i> Thêm mẫu</button>
                        ${active ? `<span class="badge badge-approved" style="font-size:13px;">✅ Đang áp dụng: ${active.name}</span>` : '<span class="badge badge-draft" style="font-size:13px;">⚠️ Chưa có workflow active</span>'}
                    </div>
                </div>
                <div style="max-height:500px; overflow-y:auto;">
                    ${list.length === 0 ? '<div style="color:#999; padding:12px; text-align:center;">Chưa có workflow nào</div>' : ''}
                    ${list.map(w => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; margin-bottom:6px; background:${w.isActive ? '#f0fdf4' : '#f8fafc'}; border-radius:6px; border-left:4px solid ${w.isActive ? '#22c55e' : '#94a3b8'};">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:600; font-size:14px;">${w.name}</div>
                                <div style="font-size:12px; color:#888; flex-wrap:wrap; display:flex; gap:6px; margin-top:2px;">
                                    ${w.isSystem ? '<span class="badge badge-info">Hệ thống</span>' : '<span class="badge badge-draft">Tùy chỉnh</span>'}
                                    ${w.isActive ? '<span class="badge badge-approved">✅ Đang áp dụng</span>' : '<span class="badge badge-draft">⏸️ Không áp dụng</span>'}
                                    ${w.description ? `<span style="color:#94a3b8;">${w.description}</span>` : ''}
                                    <span style="color:#94a3b8;">| ${w.steps ? JSON.parse(w.steps).length : 0} bước</span>
                                </div>
                            </div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-left:8px;">
                                ${!w.isActive ? `<button class="btn btn-success btn-sm" onclick="activateWorkflow('${module}', ${w.id})" title="Kích hoạt"><i class="fas fa-check"></i></button>` : ''}
                                <button class="btn btn-info btn-sm" onclick="editWorkflow(${w.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-warning btn-sm" onclick="duplicateWorkflow(${w.id})" title="Sao chép"><i class="fas fa-copy"></i></button>
                                ${!w.isSystem && !w.isActive ? `<button class="btn btn-danger btn-sm" onclick="deleteWorkflow(${w.id})" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

// ====== WORKFLOW ACTIONS ======
async function activateWorkflow(module, id) {
    if (!confirm(`Xác nhận kích hoạt workflow ID ${id} cho module ${module}? Các workflow khác sẽ bị hủy kích hoạt.`)) return;
    try {
        await api.activateWorkflow(module, id);
        showSuccess('Kích hoạt workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi kích hoạt: ' + error.message);
    }
}

async function duplicateWorkflow(id) {
    try {
        const result = await api.duplicateWorkflow(id);
        showSuccess(`Đã sao chép workflow "${result.name}"`);
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi sao chép: ' + error.message);
    }
}

async function deleteWorkflow(id) {
    if (!confirm('Xóa workflow này? (Chỉ xóa được mẫu tùy chỉnh và không active)')) return;
    try {
        await api.deleteWorkflow(id);
        showSuccess('Xóa workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi xóa: ' + error.message);
    }
}

function showCreateWorkflowModal(module) {
    const roles = getRoles();
    const roleOpts = roles.map(r => `<option value="${r.value}">${r.label}</option>`).join('');
    const departments = getDepartmentsData();
    const deptOpts = `<option value="">-- Không giới hạn --</option>` + departments.map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');

    showModal('Tạo workflow mới', `
        <div class="form-group">
            <label>Module</label>
            <input id="f-wf-module" value="${module}" readonly style="background:#f0f0f0; width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div class="form-group">
            <label>Tên workflow <span style="color:red;">*</span></label>
            <input id="f-wf-name" placeholder="Ví dụ: Quy trình 4 bước nâng cao" class="form-control">
        </div>
        <div class="form-group">
            <label>Mô tả</label>
            <textarea id="f-wf-desc" rows="2" class="form-control"></textarea>
        </div>
        <div class="form-group">
            <label>Các bước duyệt (JSON) <span style="color:red;">*</span></label>
            <textarea id="f-wf-steps" rows="6" class="form-control" placeholder='[{"step":1,"role":"PLANNING","label":"Kế hoạch duyệt","departmentId":2}]'></textarea>
            <div style="font-size:12px; color:#888; margin-top:4px;">
                <i class="fas fa-info-circle"></i> Mỗi bước gồm: step, role, label, departmentId (có thể null)
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveNewWorkflow()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveNewWorkflow() {
    const module = document.getElementById('f-wf-module').value.trim();
    const name = document.getElementById('f-wf-name').value.trim();
    const description = document.getElementById('f-wf-desc').value.trim();
    const stepsRaw = document.getElementById('f-wf-steps').value.trim();
    if (!name || !stepsRaw) {
        showError('Vui lòng nhập tên và steps');
        return;
    }
    let steps;
    try { steps = JSON.parse(stepsRaw); } catch(e) { showError('Steps không đúng định dạng JSON'); return; }
    if (!Array.isArray(steps) || steps.length === 0) {
        showError('Steps phải là mảng và có ít nhất 1 bước');
        return;
    }

    try {
        await api.createWorkflow({ module, name, description, steps: JSON.stringify(steps) });
        closeModal();
        showSuccess('Tạo workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi tạo workflow: ' + error.message);
    }
}

async function editWorkflow(id) {
    try {
        const wf = _adminWorkflows.find(w => w.id === id);
        if (!wf) { showError('Không tìm thấy workflow'); return; }

        showModal('Sửa workflow', `
            <div class="form-group">
                <label>Module</label>
                <input value="${wf.module}" readonly style="background:#f0f0f0; width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div class="form-group">
                <label>Tên workflow <span style="color:red;">*</span></label>
                <input id="f-wf-edit-name" value="${wf.name || ''}" class="form-control">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea id="f-wf-edit-desc" rows="2" class="form-control">${wf.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Các bước duyệt (JSON) <span style="color:red;">*</span></label>
                <textarea id="f-wf-edit-steps" rows="6" class="form-control">${wf.steps || '[]'}</textarea>
                <div style="font-size:12px; color:#888; margin-top:4px;">
                    <i class="fas fa-info-circle"></i> Mỗi bước gồm: step, role, label, departmentId (có thể null)
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateWorkflow(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi tải workflow: ' + error.message);
    }
}

async function updateWorkflow(id) {
    const name = document.getElementById('f-wf-edit-name').value.trim();
    const description = document.getElementById('f-wf-edit-desc').value.trim();
    const stepsRaw = document.getElementById('f-wf-edit-steps').value.trim();
    if (!name || !stepsRaw) {
        showError('Vui lòng nhập tên và steps');
        return;
    }
    let steps;
    try { steps = JSON.parse(stepsRaw); } catch(e) { showError('Steps không đúng định dạng JSON'); return; }
    if (!Array.isArray(steps) || steps.length === 0) {
        showError('Steps phải là mảng và có ít nhất 1 bước');
        return;
    }

    try {
        await api.updateWorkflow(id, { name, description, steps: JSON.stringify(steps) });
        closeModal();
        showSuccess('Cập nhật workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi cập nhật: ' + error.message);
    }
}

async function createDefaultWorkflows() {
    if (!confirm('Tạo các workflow mặc định cho tất cả module? (sẽ không ghi đè nếu đã có)')) return;
    try {
        const defaults = {
            mr: [{ step: 1, role: 'SITE_COMMANDER', label: 'Chỉ huy trưởng duyệt', departmentId: 5 }],
            pr: [
                { step: 1, role: 'PLANNING', label: 'Kế hoạch duyệt', departmentId: 2 },
                { step: 2, role: 'PROJECT', label: 'Dự án duyệt', departmentId: 3 },
                { step: 3, role: 'CEO', label: 'Tổng Giám đốc duyệt', departmentId: 1 }
            ],
            po: [
                { step: 1, role: 'PLANNING', label: 'Kế hoạch duyệt', departmentId: 2 },
                { step: 2, role: 'PROJECT', label: 'Dự án duyệt', departmentId: 3 },
                { step: 3, role: 'CEO', label: 'Tổng Giám đốc duyệt', departmentId: 1 }
            ],
            grn: [
                { step: 1, role: 'PURCHASING', label: 'Lập phiếu', departmentId: 4 },
                { step: 2, role: 'WAREHOUSE', label: 'Thủ kho nhận', departmentId: null },
                { step: 3, role: 'QC', label: 'QC kiểm tra', departmentId: 6 },
                { step: 4, role: 'PURCHASING', label: 'Hoàn thành', departmentId: 4 }
            ],
            sto: [
                { step: 1, role: 'PURCHASING', label: 'Lập phiếu', departmentId: 4 },
                { step: 2, role: 'PURCHASING', label: 'Duyệt', departmentId: 4 },
                { step: 3, role: 'PURCHASING', label: 'Xuất kho', departmentId: 4 }
            ],
            issue: [
                { step: 1, role: 'SITE_COMMANDER', label: 'Tạo phiếu', departmentId: 5 },
                { step: 2, role: 'SITE_COMMANDER', label: 'Duyệt', departmentId: 5 },
                { step: 3, role: 'PURCHASING', label: 'Cấp phát', departmentId: 4 },
                { step: 4, role: 'SITE_COMMANDER', label: 'Xác nhận', departmentId: 5 }
            ],
            materialreturn: [
                { step: 1, role: 'SITE_COMMANDER', label: 'Tạo phiếu', departmentId: 5 },
                { step: 2, role: 'PURCHASING', label: 'Thủ kho nhận', departmentId: 4 },
                { step: 3, role: 'SITE_COMMANDER', label: 'Xác nhận', departmentId: 5 }
            ]
        };

        for (const [module, steps] of Object.entries(defaults)) {
            const existing = await api.getWorkflowsByModule(module);
            if (existing && existing.length > 0) {
                console.log(`Module ${module} đã có workflow, bỏ qua`);
                continue;
            }
            const name = `${module.toUpperCase()} - Mặc định`;
            await api.createWorkflow({
                module,
                name,
                description: `Quy trình mặc định cho ${module}`,
                steps: JSON.stringify(steps)
            });
        }
        showSuccess('Đã tạo workflow mặc định cho các module chưa có!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi tạo workflow mặc định: ' + error.message);
    }
}

async function refreshWorkflows() {
    showLoading('Đang tải workflow...');
    try {
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
        showSuccess('Làm mới thành công!');
    } catch(e) {
        showError('Lỗi làm mới: ' + e.message);
    } finally {
        hideLoading();
    }
}

// ===================================================================
// 4. TAB PHÂN QUYỀN THEO ROLE
// ===================================================================
function renderRolePermissionsTab() {
    const permissions = getPermissionsSafe();
    const roles = getRoles();
    const allPermissions = getAllPermissionKeys();

    const grouped = {};
    allPermissions.forEach(key => {
        const parts = key.split('.');
        const module = parts[0];
        const action = parts[1] || 'view';
        if (!grouped[module]) grouped[module] = [];
        grouped[module].push({ key, action });
    });

    const roleCounts = {};
    roles.forEach(r => {
        const perms = permissions[r.value] || {};
        roleCounts[r.value] = Object.values(perms).filter(v => v === true).length;
    });

    let html = `
        <div style="margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <button class="btn btn-sm" onclick="setAllPermissions(true)"><i class="fas fa-check-double"></i> Chọn tất cả</button>
                <button class="btn btn-sm btn-danger" onclick="setAllPermissions(false)"><i class="fas fa-times"></i> Bỏ chọn tất cả</button>
                <button class="btn btn-sm btn-success" onclick="saveRolePermissions()"><i class="fas fa-save"></i> Lưu phân quyền</button>
                <button class="btn btn-sm btn-warning" onclick="resetRolePermissions()"><i class="fas fa-undo"></i> Reset role</button>
            </div>
            <span style="font-size:13px; color:#888;">
                <i class="fas fa-info-circle"></i> Tick vào ô để cấp quyền cho role đó
            </span>
        </div>
        <div class="table-responsive" style="max-height:600px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px;">
            <table style="min-width:800px; font-size:13px;">
                <thead>
                    <tr>
                        <th style="position:sticky; left:0; background:#f8fafc; z-index:3; min-width:200px; border-right:1px solid #e2e8f0;">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span>Quyền / Module</span>
                                <span style="font-size:11px; color:#888; font-weight:400;">(click vào tên module để toggle)</span>
                            </div>
                        </th>
                        ${roles.map(r => `
                            <th style="text-align:center; min-width:90px; background:#f8fafc; position:sticky; top:0; z-index:2;">
                                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                                    <span>${r.label}</span>
                                    <span style="font-size:11px; color:#888; font-weight:400;">
                                        (${roleCounts[r.value] || 0}/${allPermissions.length})
                                    </span>
                                    <button class="btn btn-xs btn-outline" onclick="toggleAllPermissionsForRole('${r.value}')" style="font-size:10px; padding:1px 6px;">Chọn tất cả</button>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    Object.keys(grouped).forEach(module => {
        const moduleLabel = getModuleLabel(module);
        const perms = grouped[module];
        
        html += `
            <tr style="background:#f0f4f8; font-weight:600; cursor:pointer;" onclick="toggleModulePermissions('${module}')" title="Click để toggle tất cả quyền trong module này">
                <td style="position:sticky; left:0; background:#f0f4f8; z-index:2; border-right:1px solid #e2e8f0; padding:8px 12px;">
                    <span style="display:flex; align-items:center; gap:6px;">
                        📁 ${moduleLabel}
                        <span style="font-size:11px; color:#888; font-weight:400;">(click để toggle)</span>
                    </span>
                </td>
                ${roles.map(r => {
                    const modulePerms = perms.map(p => p.key);
                    const rolePerms = permissions[r.value] || {};
                    const checkedCount = modulePerms.filter(key => rolePerms[key] === true).length;
                    const total = modulePerms.length;
                    return `<td style="text-align:center; font-size:11px; color:#888; padding:8px 4px;">${checkedCount}/${total}</td>`;
                }).join('')}
            </tr>
        `;
        
        perms.forEach(({ key, action }) => {
            const actionLabel = getActionLabel(action);
            html += `<tr>
                <td style="position:sticky; left:0; background:white; z-index:2; border-right:1px solid #e2e8f0; padding:6px 12px; padding-left:32px; font-size:12px;">
                    ${actionLabel}
                </td>
                ${roles.map(r => {
                    const checked = (permissions[r.value] && permissions[r.value][key]) ? 'checked' : '';
                    return `<td style="text-align:center; padding:4px;">
                        <input type="checkbox" class="perm-checkbox" data-role="${r.value}" data-perm="${key}" ${checked} style="width:16px; height:16px; cursor:pointer; accent-color:#1a3c6e;">
                    </td>`;
                }).join('')}
            </tr>`;
        });
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px; font-size:13px; color:#888; display:flex; gap:20px; flex-wrap:wrap;">
            <span><i class="fas fa-info-circle"></i> <strong>Chú thích:</strong></span>
            <span>📁 Module - Click vào tên module để toggle tất cả quyền trong module đó</span>
            <span>✅ Đã cấp quyền</span>
            <span>⬜ Chưa cấp quyền</span>
            <span>📊 Số quyền đã chọn / Tổng số quyền</span>
        </div>
    `;
    return html;
}

// ====== HÀM HỖ TRỢ CHO BẢNG PHÂN QUYỀN ROLE ======
function setAllPermissions(checked) {
    document.querySelectorAll('.perm-checkbox').forEach(cb => cb.checked = checked);
    updatePermissionCounts();
}

function toggleAllPermissionsForRole(role) {
    const checkboxes = document.querySelectorAll(`.perm-checkbox[data-role="${role}"]`);
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updatePermissionCounts();
}

function toggleModulePermissions(module) {
    const checkboxes = document.querySelectorAll(`.perm-checkbox[data-perm^="${module}."]`);
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updatePermissionCounts();
}

function updatePermissionCounts() {
    const roles = getRoles();
    const allPermissions = getAllPermissionKeys();
    
    roles.forEach(r => {
        const checkboxes = document.querySelectorAll(`.perm-checkbox[data-role="${r.value}"]`);
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const ths = document.querySelectorAll('thead th');
        const index = roles.findIndex(r2 => r2.value === r.value) + 1;
        if (ths[index]) {
            const span = ths[index].querySelector('span:last-child');
            if (span) span.textContent = `(${checkedCount}/${allPermissions.length})`;
        }
    });
    
    const grouped = {};
    allPermissions.forEach(key => {
        const module = key.split('.')[0];
        if (!grouped[module]) grouped[module] = [];
        grouped[module].push(key);
    });
    
    Object.keys(grouped).forEach(module => {
        const moduleKeys = grouped[module];
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell && firstCell.textContent.includes(`📁 ${getModuleLabel(module)}`)) {
                const tds = row.querySelectorAll('td');
                roles.forEach((r, idx) => {
                    const td = tds[idx + 1];
                    if (td) {
                        const checkboxes = document.querySelectorAll(`.perm-checkbox[data-role="${r.value}"][data-perm^="${module}."]`);
                        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                        td.textContent = `${checkedCount}/${moduleKeys.length}`;
                    }
                });
            }
        });
    });
}

function saveRolePermissions() {
    const permissions = getPermissionsSafe();
    const roles = getRoles();

    roles.forEach(r => { if (!permissions[r.value]) permissions[r.value] = {}; });

    document.querySelectorAll('.perm-checkbox').forEach(cb => {
        const role = cb.dataset.role;
        const perm = cb.dataset.perm;
        if (!permissions[role]) permissions[role] = {};
        permissions[role][perm] = cb.checked;
    });

    saveData('permissions', permissions);
    showSuccess('Đã lưu phân quyền role thành công!');
    updatePermissionCounts();
}

function resetRolePermissions() {
    if (!confirm('Reset toàn bộ quyền của tất cả role về mặc định?')) return;
    saveData('permissions', {});
    if (typeof initData === 'function') initData();
    renderAdminUI('role-permissions');
    showSuccess('Đã reset phân quyền role');
}

// ===================================================================
// 5. TAB PHÂN QUYỀN THEO USER
// ===================================================================
function renderUserPermissionsTab() {
    const users = getUsersData();
    const allPermissions = getAllPermissionKeys();
    let userPermissions = getUserPermissionsCache();
    
    const userFilter = document.getElementById('user-perm-user-filter');
    let selectedUserId = userFilter ? parseInt(userFilter.value) : null;
    
    if (!selectedUserId || !users.find(u => u.id === selectedUserId)) {
        if (users.length > 0) {
            selectedUserId = users[0].id;
            if (userFilter) userFilter.value = selectedUserId;
        } else {
            return `<div style="color:#999;">Không có user nào</div>`;
        }
    }
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
        return `<div style="color:#999;">Không tìm thấy user</div>`;
    }

    if (!userPermissions[selectedUser.id]) {
        userPermissions[selectedUser.id] = {};
        saveData('user_permissions', userPermissions);
    }
    const userPerms = userPermissions[selectedUser.id] || {};

    const grouped = {};
    allPermissions.forEach(key => {
        const parts = key.split('.');
        const module = parts[0];
        const action = parts[1] || 'view';
        if (!grouped[module]) grouped[module] = [];
        grouped[module].push({ key, action });
    });

    let html = `
        <div style="margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
            <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <label style="font-weight:600;">Chọn user:</label>
                    <select id="user-perm-user-filter" onchange="renderUserPermissionsTab()" style="padding:8px 14px; border:1px solid #ccc; border-radius:4px; min-width:200px;">
                        ${users.map(u => `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.name} (${u.email})</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-sm btn-success" onclick="saveUserPermissions()"><i class="fas fa-save"></i> Lưu phân quyền</button>
                <button class="btn btn-sm btn-warning" onclick="resetUserPermissions()"><i class="fas fa-undo"></i> Reset</button>
                <span style="font-size:13px; color:#888;">
                    <i class="fas fa-info-circle"></i> Phân quyền riêng cho từng user, ưu tiên hơn role
                </span>
            </div>
        </div>
    `;

    html += `
        <div style="background:#f8fafc; padding:10px 16px; border-radius:8px; margin-bottom:16px; border:1px solid #e2e8f0;">
            <span style="font-weight:600;">👤 ${selectedUser.name}</span>
            <span style="color:#888; margin-left:12px;">${selectedUser.email}</span>
            <span style="color:#888; margin-left:12px;">Role: ${selectedUser.role}</span>
            ${selectedUser.department ? `<span style="color:#888; margin-left:12px;">🏢 ${selectedUser.department}</span>` : ''}
        </div>
    `;

    html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">`;

    Object.keys(grouped).forEach(module => {
        const moduleLabel = getModuleLabel(module);
        const perms = grouped[module];
        const checkedCount = perms.filter(p => userPerms[p.key] === true).length;

        html += `
            <div style="background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.04); overflow:hidden;">
                <div style="background:#f0f4f8; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border-bottom:1px solid #e2e8f0;" onclick="toggleModuleUserPermissions(${selectedUser.id}, '${module}')">
                    <span style="font-weight:600; font-size:14px; color:#1a3c6e;">📁 ${moduleLabel}</span>
                    <span style="font-size:12px; color:#888;">
                        ${checkedCount}/${perms.length}
                        <span style="margin-left:8px; font-size:11px; color:#1a3c6e;">(click để toggle)</span>
                    </span>
                </div>
                <div style="padding:8px 12px;">
        `;

        perms.forEach(({ key, action }) => {
            const actionLabel = getActionLabel(action);
            const checked = (userPerms[key] === true) ? 'checked' : '';
            html += `
                <label style="display:flex; align-items:center; gap:8px; padding:4px 0; font-size:13px; cursor:pointer; border-bottom:1px solid #f5f5f5;">
                    <input type="checkbox" class="user-perm-checkbox" data-user="${selectedUser.id}" data-perm="${key}" ${checked} style="width:16px; height:16px; cursor:pointer; accent-color:#1a3c6e;">
                    <span>${actionLabel}</span>
                </label>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `</div>`;

    html += `
        <div style="margin-top:16px; font-size:13px; color:#888; display:flex; gap:20px; flex-wrap:wrap; padding:8px 0;">
            <span><i class="fas fa-info-circle"></i> <strong>Chú thích:</strong></span>
            <span>📁 Module - Click vào tên module để toggle tất cả quyền trong module đó</span>
            <span>✅ Quyền được gán riêng cho user này (ghi đè role)</span>
            <span>⬜ Chưa được gán (sẽ dùng quyền của role)</span>
        </div>
    `;

    return html;
}

// ====== HÀM LƯU USER PERMISSIONS ======
function getUserPermissionsCache() {
    return getData('user_permissions') || {};
}

function saveUserPermissionsData(data) {
    saveData('user_permissions', data);
}

function saveUserPermissions() {
    const userFilter = document.getElementById('user-perm-user-filter');
    if (!userFilter) { showError('Không tìm thấy dropdown chọn user'); return; }
    
    const selectedUserId = parseInt(userFilter.value);
    if (!selectedUserId) { showError('Vui lòng chọn user'); return; }

    const userPermissions = getUserPermissionsCache();
    if (!userPermissions[selectedUserId]) userPermissions[selectedUserId] = {};

    document.querySelectorAll('.user-perm-checkbox').forEach(cb => {
        const userId = parseInt(cb.dataset.user);
        const perm = cb.dataset.perm;
        if (!userPermissions[userId]) userPermissions[userId] = {};
        userPermissions[userId][perm] = cb.checked;
    });

    saveUserPermissionsData(userPermissions);
    showSuccess('Đã lưu phân quyền cho user!');
    renderUserPermissionsTab();
}

function resetUserPermissions() {
    const userFilter = document.getElementById('user-perm-user-filter');
    if (!userFilter) { showError('Không tìm thấy dropdown chọn user'); return; }
    
    const selectedUserId = parseInt(userFilter.value);
    if (!selectedUserId) { showError('Vui lòng chọn user'); return; }
    
    if (!confirm(`Reset toàn bộ quyền của user này?`)) return;

    const userPermissions = getUserPermissionsCache();
    if (userPermissions[selectedUserId]) {
        delete userPermissions[selectedUserId];
        saveUserPermissionsData(userPermissions);
    }
    renderUserPermissionsTab();
    showSuccess('Đã reset quyền của user.');
}

function toggleModuleUserPermissions(userId, module) {
    const checkboxes = document.querySelectorAll(`.user-perm-checkbox[data-user="${userId}"][data-perm^="${module}."]`);
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

// ===================================================================
// QUẢN LÝ USER (CRUD)
// ===================================================================
function viewUser(id) {
    const users = getUsersData();
    const u = users.find(user => user.id === id);
    if (!u) { showError('Không tìm thấy người dùng!'); return; }

    const roles = {
        'ADMIN': 'Admin (Toàn quyền)',
        'PLANNING': 'Phòng Kế hoạch',
        'PROJECT': 'Phòng Dự án',
        'CEO': 'Tổng Giám đốc',
        'PURCHASING': 'Phòng Mua hàng',
        'SITE_COMMANDER': 'Chỉ huy trưởng',
        'QC': 'QC'
    };

    const dept = getDepartmentsData().find(d => d.id === u.departmentId);
    showModal('Chi tiết người dùng', `
        <div class="detail-grid">
            <div><span class="label">ID:</span> <span class="value">${u.id}</span></div>
            <div><span class="label">Họ tên:</span> <span class="value">${u.name}</span></div>
            <div><span class="label">Email:</span> <span class="value">${u.email}</span></div>
            <div><span class="label">Role:</span> <span class="value">${roles[u.role] || u.role}</span></div>
            <div><span class="label">Phòng ban:</span> <span class="value">${dept ? dept.name : (u.department || '--')}</span></div>
            <div><span class="label">Chức danh:</span> <span class="value">${u.position || '--'}</span></div>
            <div><span class="label">Ngày tạo:</span> <span class="value">${u.createdAt || '--'}</span></div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

function showAddUserModal() {
    const departments = getDepartmentsData();
    const deptOpts = departments.map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');
    const roles = getRoles();
    const roleOpts = roles.map(r => `<option value="${r.value}">${r.label}</option>`).join('');

    showModal('Thêm người dùng mới', `
        <div class="form-group">
            <label>Họ tên <span style="color:red;">*</span></label>
            <input id="f-admin-name" placeholder="Nguyễn Văn A" required>
        </div>
        <div class="form-group">
            <label>Email <span style="color:red;">*</span></label>
            <input id="f-admin-email" type="email" placeholder="user@mep.com" required>
        </div>
        <div class="form-group">
            <label>Mật khẩu <span style="color:red;">*</span></label>
            <input id="f-admin-password" type="password" placeholder="Mật khẩu (mặc định: password)" value="password">
        </div>
        <div class="form-group">
            <label>Role (Phân quyền)</label>
            <select id="f-admin-role">${roleOpts}</select>
        </div>
        <div class="form-group">
            <label>Phòng ban</label>
            <select id="f-admin-department">
                <option value="">-- Chọn --</option>
                ${deptOpts}
            </select>
        </div>
        <div class="form-group">
            <label>Chức danh</label>
            <input id="f-admin-position" placeholder="Ví dụ: Trưởng phòng, Chuyên viên...">
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveUser()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveUser() {
    const name = document.getElementById('f-admin-name').value.trim();
    const email = document.getElementById('f-admin-email').value.trim();
    const password = document.getElementById('f-admin-password').value.trim() || 'password';
    const role = document.getElementById('f-admin-role').value;
    const departmentId = parseInt(document.getElementById('f-admin-department').value) || null;
    const position = document.getElementById('f-admin-position').value.trim();

    if (!name || !email) {
        showError('Vui lòng nhập họ tên và email');
        return;
    }
    if (!email.includes('@')) {
        showError('Email không hợp lệ');
        return;
    }

    try {
        const newUser = { name, email, password, role, departmentId, position: position || '' };
        await api.createUser(newUser);
        closeModal();
        await refreshAdminUsers();
        renderAdminUI('users');
        showSuccess(`Thêm người dùng ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm user: ' + error.message);
    }
}

async function editUser(id) {
    const users = getUsersData();
    const u = users.find(user => user.id === id);
    if (!u) { showError('Không tìm thấy người dùng!'); return; }

    const currentUser = getUser();
    if (u.id === currentUser.id) {
        showWarning('Bạn không thể sửa chính mình!');
        return;
    }

    const departments = getDepartmentsData();
    const deptOpts = departments.map(d =>
        `<option value="${d.id}" ${d.id === u.departmentId ? 'selected' : ''}>${d.code} - ${d.name}</option>`
    ).join('');
    const roles = getRoles();
    const roleOpts = roles.map(r =>
        `<option value="${r.value}" ${r.value === u.role ? 'selected' : ''}>${r.label}</option>`
    ).join('');

    showModal('Sửa người dùng', `
        <div class="form-group">
            <label>Họ tên</label>
            <input id="f-admin-name" value="${u.name}" required>
        </div>
        <div class="form-group">
            <label>Email</label>
            <input id="f-admin-email" type="email" value="${u.email}" required>
        </div>
        <div class="form-group">
            <label>Mật khẩu (để trống nếu không đổi)</label>
            <input id="f-admin-password" type="password" placeholder="Nhập mật khẩu mới">
        </div>
        <div class="form-group">
            <label>Role (Phân quyền)</label>
            <select id="f-admin-role">${roleOpts}</select>
        </div>
        <div class="form-group">
            <label>Phòng ban</label>
            <select id="f-admin-department">
                <option value="">-- Chọn --</option>
                ${deptOpts}
            </select>
        </div>
        <div class="form-group">
            <label>Chức danh</label>
            <input id="f-admin-position" value="${u.position || ''}">
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="updateUser(${id})"><i class="fas fa-save"></i> Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function updateUser(id) {
    const name = document.getElementById('f-admin-name').value.trim();
    const email = document.getElementById('f-admin-email').value.trim();
    const password = document.getElementById('f-admin-password').value.trim();
    const role = document.getElementById('f-admin-role').value;
    const departmentId = parseInt(document.getElementById('f-admin-department').value) || null;
    const position = document.getElementById('f-admin-position').value.trim();

    if (!name || !email) {
        showError('Vui lòng nhập họ tên và email');
        return;
    }
    if (!email.includes('@')) {
        showError('Email không hợp lệ');
        return;
    }

    try {
        const updatedUser = { name, email, role, departmentId, position: position || '' };
        if (password) updatedUser.password = password;
        await api.updateUser(id, updatedUser);
        closeModal();
        await refreshAdminUsers();
        renderAdminUI('users');
        showSuccess('Cập nhật người dùng thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật user: ' + error.message);
    }
}

async function deleteUser(id) {
    const users = getUsersData();
    const u = users.find(user => user.id === id);
    if (!u) { showError('Không tìm thấy người dùng!'); return; }

    const currentUser = getUser();
    if (u.id === currentUser.id) {
        showWarning('Bạn không thể xóa chính mình!');
        return;
    }

    if (!confirm(`Xóa người dùng "${u.name}" (${u.email})?`)) return;

    try {
        await api.deleteUser(id);
        await refreshAdminUsers();
        renderAdminUI('users');
        showSuccess(`Đã xóa người dùng ${u.name}`);
    } catch (error) {
        showError('Lỗi khi xóa user: ' + error.message);
    }
}

// ===================================================================
// QUẢN LÝ THÀNH VIÊN TRONG PHÒNG BAN
// ===================================================================
function showAddUserToDepartment(deptId) {
    const users = getUsersData();
    const dept = getDepartmentsData().find(d => d.id === deptId);
    if (!dept) { showError('Không tìm thấy phòng ban'); return; }

    const availableUsers = users.filter(u => !u.departmentId);
    if (!availableUsers.length) {
        showWarning('Không có user nào chưa có phòng ban. Vui lòng tạo user mới.');
        return;
    }

    const userOpts = availableUsers.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

    showModal(`Thêm thành viên vào ${dept.name}`, `
        <div class="form-group">
            <label>Chọn người dùng</label>
            <select id="f-add-user-dept">${userOpts}</select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="confirmAddUserToDept(${deptId})">Thêm</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function confirmAddUserToDept(deptId) {
    const userId = parseInt(document.getElementById('f-add-user-dept').value);
    if (!userId) { showError('Vui lòng chọn user'); return; }

    try {
        const users = await api.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) { showError('Không tìm thấy user'); return; }

        user.departmentId = deptId;
        await api.updateUser(userId, user);
        closeModal();
        await refreshAdminUsers();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Đã thêm ${user.name} vào phòng ban`);
    } catch (error) {
        showError('Lỗi khi thêm user vào phòng ban: ' + error.message);
    }
}

function editUserInDept(userId) {
    editUser(userId);
}

async function removeUserFromDept(userId) {
    if (!confirm('Xóa user khỏi phòng ban này?')) return;

    try {
        const users = await api.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) { showError('Không tìm thấy user'); return; }

        user.departmentId = null;
        await api.updateUser(userId, user);
        await refreshAdminUsers();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Đã xóa ${user.name} khỏi phòng ban`);
    } catch (error) {
        showError('Lỗi khi xóa user khỏi phòng ban: ' + error.message);
    }
}

// ===================================================================
// QUẢN LÝ PHÒNG BAN (CRUD)
// ===================================================================
function showAddDepartmentModal() {
    const users = getUsersData();
    const userOpts = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

    showModal('Thêm phòng ban mới', `
        <div class="form-group">
            <label>Mã phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-code" placeholder="Ví dụ: HR, FINANCE..." required>
        </div>
        <div class="form-group">
            <label>Tên phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-name" placeholder="Ví dụ: Phòng Nhân sự" required>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager">
                <option value="">-- Chọn --</option>
                ${userOpts}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveDepartment()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveDepartment() {
    const code = document.getElementById('f-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('f-dept-name').value.trim();
    const managerId = parseInt(document.getElementById('f-dept-manager').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const newDept = { code, name, managerId };
        await api.createDepartment(newDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Thêm phòng ban ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm phòng ban: ' + error.message);
    }
}

async function editDepartment(id) {
    const departments = getDepartmentsData();
    const dept = departments.find(d => d.id === id);
    if (!dept) { showError('Không tìm thấy phòng ban!'); return; }

    const users = getUsersData();
    const userOpts = users.map(u =>
        `<option value="${u.id}" ${u.id === dept.managerId ? 'selected' : ''}>${u.name} (${u.email})</option>`
    ).join('');

    showModal('Sửa phòng ban', `
        <div class="form-group">
            <label>Mã phòng ban</label>
            <input id="f-dept-code" value="${dept.code}" required>
        </div>
        <div class="form-group">
            <label>Tên phòng ban</label>
            <input id="f-dept-name" value="${dept.name}" required>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager">
                <option value="">-- Chọn --</option>
                ${userOpts}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="updateDepartment(${id})"><i class="fas fa-save"></i> Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function updateDepartment(id) {
    const code = document.getElementById('f-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('f-dept-name').value.trim();
    const managerId = parseInt(document.getElementById('f-dept-manager').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const updatedDept = { code, name, managerId };
        await api.updateDepartment(id, updatedDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess('Cập nhật phòng ban thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật phòng ban: ' + error.message);
    }
}

async function deleteDepartment(id) {
    if (!confirm('Xóa phòng ban này? Các user thuộc phòng ban sẽ bị xóa phòng ban.')) return;

    try {
        await api.deleteDepartment(id);
        await refreshAdminDepartments();
        await refreshAdminUsers();
        renderAdminUI('departments');
        showSuccess('Xóa phòng ban thành công!');
    } catch (error) {
        showError('Lỗi khi xóa phòng ban: ' + error.message);
    }
}

// ===================================================================
// EXPORT GLOBAL (QUAN TRỌNG - ĐỂ DÙNG TỪ HTML)
// ===================================================================
window.renderAdminPage = renderAdminPage;
window.renderAdminUI = renderAdminUI;
window.switchAdminTab = switchAdminTab;

// Users
window.viewUser = viewUser;
window.showAddUserModal = showAddUserModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;

// Departments
window.showAddDepartmentModal = showAddDepartmentModal;
window.saveDepartment = saveDepartment;
window.editDepartment = editDepartment;
window.updateDepartment = updateDepartment;
window.deleteDepartment = deleteDepartment;
window.showAddUserToDepartment = showAddUserToDepartment;
window.confirmAddUserToDept = confirmAddUserToDept;
window.editUserInDept = editUserInDept;
window.removeUserFromDept = removeUserFromDept;

// Workflows
window.renderWorkflowsTab = renderWorkflowsTab;
window.activateWorkflow = activateWorkflow;
window.duplicateWorkflow = duplicateWorkflow;
window.deleteWorkflow = deleteWorkflow;
window.showCreateWorkflowModal = showCreateWorkflowModal;
window.saveNewWorkflow = saveNewWorkflow;
window.editWorkflow = editWorkflow;
window.updateWorkflow = updateWorkflow;
window.createDefaultWorkflows = createDefaultWorkflows;
window.refreshWorkflows = refreshWorkflows;

// Role Permissions
window.renderRolePermissionsTab = renderRolePermissionsTab;
window.setAllPermissions = setAllPermissions;
window.toggleAllPermissionsForRole = toggleAllPermissionsForRole;
window.toggleModulePermissions = toggleModulePermissions;
window.updatePermissionCounts = updatePermissionCounts;
window.saveRolePermissions = saveRolePermissions;
window.resetRolePermissions = resetRolePermissions;

// User Permissions
window.renderUserPermissionsTab = renderUserPermissionsTab;
window.saveUserPermissions = saveUserPermissions;
window.resetUserPermissions = resetUserPermissions;
window.toggleModuleUserPermissions = toggleModuleUserPermissions;

// Helpers
window.getRoles = getRoles;
window.getAllPermissionKeys = getAllPermissionKeys;
window.getModuleLabel = getModuleLabel;
window.getActionLabel = getActionLabel;

console.log('✅ Admin module loaded successfully (FULL API + Workflow dynamic + User Permission)');