// ================================================================
// ADMIN DEPARTMENTS - Quản lý phòng ban
// ================================================================

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

// Export
window.renderDepartmentsTab = renderDepartmentsTab;
window.showAddDepartmentModal = showAddDepartmentModal;
window.saveDepartment = saveDepartment;
window.editDepartment = editDepartment;
window.updateDepartment = updateDepartment;
window.deleteDepartment = deleteDepartment;
window.showAddUserToDepartment = showAddUserToDepartment;
window.confirmAddUserToDept = confirmAddUserToDept;
window.editUserInDept = editUserInDept;
window.removeUserFromDept = removeUserFromDept;