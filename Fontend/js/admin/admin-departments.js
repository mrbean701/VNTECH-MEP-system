// ================================================================
// ADMIN DEPARTMENTS - Quản lý phòng ban (Giai đoạn 3)
// ================================================================

function renderDepartmentsTab() {
    const departments = getDepartmentsData();
    const users = getUsersData();
    const currentUser = getUser();

    // Lọc chỉ hiển thị department gốc (parentId = null) và hiển thị sub theo cấu trúc cây
    const rootDepts = departments.filter(d => !d.parentId);

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <div class="filter-bar" style="flex:1; margin:0;">
                <input type="text" id="dept-filter" placeholder="Tìm theo mã hoặc tên..." style="flex:1;" />
                <button class="btn btn-sm" onclick="renderAdminUI('departments')"><i class="fas fa-search"></i></button>
            </div>
            <button class="btn" onclick="showAddDepartmentModal()"><i class="fas fa-plus"></i> Thêm phòng ban</button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:16px;">
    `;

    const filter = document.getElementById('dept-filter')?.value?.toLowerCase() || '';
    const filtered = rootDepts.filter(d =>
        (d.code || '').toLowerCase().includes(filter) || (d.name || '').toLowerCase().includes(filter)
    );

    if (!filtered.length) {
        html += `<div style="grid-column:1/-1; text-align:center; color:#999;">Chưa có phòng ban nào</div>`;
    }

    for (const d of filtered) {
        html += renderDepartmentCard(d, departments, users);
        // Render sub-departments
        const subDepts = departments.filter(sub => sub.parentId === d.id);
        for (const sub of subDepts) {
            if ((sub.code || '').toLowerCase().includes(filter) || (sub.name || '').toLowerCase().includes(filter)) {
                html += renderDepartmentCard(sub, departments, users, true);
            }
        }
    }

    html += `</div>`;
    return html;
}

function renderDepartmentCard(dept, departments, users, isSub = false) {
    const members = users.filter(u => u.departmentId === dept.id);
    const manager = users.find(u => u.id === dept.managerId);
    const managerName = manager ? manager.name : (dept.managerName || 'Chưa có');
    const permissionCount = getDepartmentPermissionCount(dept.id);

    const indent = isSub ? 'margin-left: 32px; border-left: 3px solid #3498db;' : '';

    return `
        <div style="background:white; border-radius:12px; padding:16px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.04); ${indent}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="margin:0; color:#1a3c6e;">${dept.name} ${isSub ? '<span class="badge badge-info">Sub</span>' : ''}</h4>
                    <div style="font-size:13px; color:#888; margin-top:4px;">
                        <span class="badge badge-info">${dept.code}</span>
                        <span>Trưởng phòng: <strong>${managerName}</strong></span>
                        ${isSub ? `<span> | Parent: ${getDepartmentName(dept.parentId)}</span>` : ''}
                    </div>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-info btn-sm" onclick="viewDepartmentDetail(${dept.id})" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-warning btn-sm" onclick="editDepartment(${dept.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDepartment(${dept.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div style="margin-top:12px; border-top:1px solid #f0f0f0; padding-top:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:600; font-size:14px;">👥 Thành viên (${members.length})</span>
                    <div style="display:flex; gap:8px;">
                        <span style="font-size:13px; color:#888; cursor:pointer;" onclick="viewDepartmentDetail(${dept.id})">
                            🔑 Quyền: <strong style="color:#1a3c6e;">${permissionCount}</strong>
                        </span>
                        <button class="btn btn-sm btn-info" onclick="showAddUserToDepartment(${dept.id})"><i class="fas fa-plus"></i> Thêm</button>
                        <button class="btn btn-sm btn-success" onclick="showAddSubDepartment(${dept.id})"><i class="fas fa-sitemap"></i> Tạo sub</button>
                    </div>
                </div>
                ${members.length === 0 ? '<div style="color:#999; font-size:13px;">Chưa có thành viên</div>' : ''}
                ${members.slice(0, 5).map(m => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px; cursor:pointer;" onclick="viewUserFromDept(${m.id})">
                        <div>
                            <span style="font-weight:500;">${m.name}</span>
                            <span style="font-size:12px; color:#888;">(${m.position || '--'})</span>
                            <span class="badge badge-draft" style="font-size:10px;">${m.role}</span>
                        </div>
                        <div>
                            <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); editUserInDept(${m.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); removeUserFromDept(${m.id})"><i class="fas fa-user-minus"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${members.length > 5 ? `<div style="color:#888; font-size:12px; margin-top:4px;">... và ${members.length - 5} thành viên khác</div>` : ''}
            </div>
        </div>
    `;
}

function getDepartmentPermissionCount(deptId) {
    const perms = getAdminPermissions();
    if (Array.isArray(perms)) {
        return perms.filter(p => p.departmentId === deptId && p.enabled).length;
    }
    let count = 0;
    Object.keys(perms).forEach(role => {
        const roleData = perms[role];
        if (typeof roleData === 'object') {
            Object.keys(roleData).forEach(key => {
                if (!isNaN(key) && parseInt(key) === deptId) {
                    const deptPerms = roleData[key];
                    if (typeof deptPerms === 'object') {
                        count += Object.keys(deptPerms).filter(pk => deptPerms[pk]).length;
                    }
                }
            });
        }
    });
    return count;
}

function getDepartmentName(id) {
    const dept = getDepartmentsData().find(d => d.id === id);
    return dept ? dept.name : 'N/A';
}

// ===== VIEW DEPARTMENT DETAIL (Modal) =====
async function viewDepartmentDetail(id) {
    const departments = getDepartmentsData();
    const dept = departments.find(d => d.id === id);
    if (!dept) { showError('Không tìm thấy phòng ban!'); return; }

    const users = getUsersData();
    const members = users.filter(u => u.departmentId === id);
    const subDepts = departments.filter(d => d.parentId === id);
    const manager = users.find(u => u.id === dept.managerId);
    const permissionCount = getDepartmentPermissionCount(id);

    const membersHtml = members.length === 0 ? '<p style="color:#999;">Chưa có thành viên</p>' :
        members.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px; cursor:pointer;" onclick="viewUserFromDept(${m.id})">
                <span style="font-weight:500;">${m.name}</span>
                <span style="font-size:12px; color:#888;">${m.position || '--'}</span>
                <span class="badge badge-draft" style="font-size:10px;">${m.role}</span>
                <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); editUserInDept(${m.id})"><i class="fas fa-edit"></i></button>
            </div>
        `).join('');

    const subHtml = subDepts.length === 0 ? '<p style="color:#999;">Chưa có sub-department</p>' :
        subDepts.map(s => `<div style="padding:4px 8px; background:#f0f4f8; border-radius:4px; margin-bottom:4px;">${s.code} - ${s.name}</div>`).join('');

    showModal('Chi tiết phòng ban', `
        <div class="detail-grid">
            <div><span class="label">Mã:</span> <span class="value">${dept.code}</span></div>
            <div><span class="label">Tên:</span> <span class="value">${dept.name}</span></div>
            <div><span class="label">Trưởng phòng:</span> <span class="value">${manager ? manager.name : (dept.managerName || 'Chưa có')}</span></div>
            <div><span class="label">Parent:</span> <span class="value">${dept.parentId ? getDepartmentName(dept.parentId) : '--'}</span></div>
            <div><span class="label" style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); switchAdminTab('department-permissions')">🔑 Số quyền:</span> <span class="value">${permissionCount}</span></div>
            <div><span class="label">Số thành viên:</span> <span class="value">${members.length}</span></div>
        </div>
        <div style="margin-top:12px;">
            <h4>👥 Thành viên</h4>
            <div style="max-height:200px; overflow-y:auto;">${membersHtml}</div>
        </div>
        <div style="margin-top:12px;">
            <h4>📂 Sub-department</h4>
            <div>${subHtml}</div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

// ===== VIEW USER FROM DEPARTMENT =====
function viewUserFromDept(userId) {
    if (typeof viewUser === 'function') {
        viewUser(userId);
    } else {
        showError('Hàm viewUser chưa được định nghĩa!');
    }
}

// ===== SHOW ADD SUB-DEPARTMENT =====
function showAddSubDepartment(parentId) {
    const parent = getDepartmentsData().find(d => d.id === parentId);
    if (!parent) { showError('Không tìm thấy phòng ban cha!'); return; }

    showModal(`Thêm Sub-department cho ${parent.name}`, `
        <div class="form-group">
            <label>Mã phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-code" placeholder="Ví dụ: TEAM1" required>
        </div>
        <div class="form-group">
            <label>Tên phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-name" placeholder="Ví dụ: Đội thi công 1" required>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager">
                <option value="">-- Chọn --</option>
                ${getUsersData().map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('')}
            </select>
        </div>
        <input type="hidden" id="f-dept-parent" value="${parentId}">
        <div class="modal-actions">
            <button class="btn" onclick="saveSubDepartment()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveSubDepartment() {
    const code = document.getElementById('f-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('f-dept-name').value.trim();
    const managerId = parseInt(document.getElementById('f-dept-manager').value) || null;
    const parentId = parseInt(document.getElementById('f-dept-parent').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const newDept = { code, name, managerId, parentId };
        await api.createDepartment(newDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Thêm sub-department ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm sub-department: ' + error.message);
    }
}

// ===== SHOW ADD DEPARTMENT (root) =====
function showAddDepartmentModal() {
    const users = getUsersData();
    const userOpts = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
    const parentOpts = getDepartmentsData().map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');

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
            <label>Phòng ban cha (để trống nếu là root)</label>
            <select id="f-dept-parent">
                <option value="">-- Chọn --</option>
                ${parentOpts}
            </select>
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
    const parentId = parseInt(document.getElementById('f-dept-parent').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const newDept = { code, name, managerId, parentId };
        await api.createDepartment(newDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Thêm phòng ban ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm phòng ban: ' + error.message);
    }
}

// ===== EDIT DEPARTMENT =====
async function editDepartment(id) {
    const departments = getDepartmentsData();
    const dept = departments.find(d => d.id === id);
    if (!dept) { showError('Không tìm thấy phòng ban!'); return; }

    const users = getUsersData();
    const userOpts = users.map(u =>
        `<option value="${u.id}" ${u.id === dept.managerId ? 'selected' : ''}>${u.name} (${u.email})</option>`
    ).join('');
    const parentOpts = departments
        .filter(d => d.id !== id)
        .map(d => `<option value="${d.id}" ${d.id === dept.parentId ? 'selected' : ''}>${d.code} - ${d.name}</option>`).join('');

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
            <label>Phòng ban cha</label>
            <select id="f-dept-parent"><option value="">-- Không có --</option>${parentOpts}</select>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager"><option value="">-- Chọn --</option>${userOpts}</select>
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
    const parentId = parseInt(document.getElementById('f-dept-parent').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const updatedDept = { code, name, managerId, parentId };
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

// ===== ADD/REMOVE USER FROM DEPARTMENT =====
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
    if (typeof editUser === 'function') {
        editUser(userId);
    } else {
        showError('Hàm editUser chưa được định nghĩa!');
    }
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

// Export
window.renderDepartmentsTab = renderDepartmentsTab;
window.viewDepartmentDetail = viewDepartmentDetail;
window.viewUserFromDept = viewUserFromDept;
window.showAddDepartmentModal = showAddDepartmentModal;
window.saveDepartment = saveDepartment;
window.editDepartment = editDepartment;
window.updateDepartment = updateDepartment;
window.deleteDepartment = deleteDepartment;
window.showAddUserToDepartment = showAddUserToDepartment;
window.confirmAddUserToDept = confirmAddUserToDept;
window.editUserInDept = editUserInDept;
window.removeUserFromDept = removeUserFromDept;
window.showAddSubDepartment = showAddSubDepartment;
window.saveSubDepartment = saveSubDepartment;
window.getDepartmentPermissionCount = getDepartmentPermissionCount;