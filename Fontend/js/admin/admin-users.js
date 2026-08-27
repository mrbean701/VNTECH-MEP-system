// ================================================================
// ADMIN USERS - Quản lý người dùng
// ================================================================

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
        await refreshAdminUsers();   // ✅ Refresh dữ liệu
        renderAdminUI('users');      // ✅ Render lại tab users
        showSuccess(`Đã xóa người dùng ${u.name}`);
    } catch (error) {
        showError('Lỗi khi xóa user: ' + error.message);
    }
}

// Export
window.renderUsersTab = renderUsersTab;
window.viewUser = viewUser;
window.showAddUserModal = showAddUserModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;