// ================================================================
// ADMIN USERS - Quản lý người dùng (Cập nhật Giai đoạn 3)
// ================================================================

// Cache positions
let _positionsCache = [];

async function fetchPositions() {
    try {
        const positions = await api.getPositions();
        _positionsCache = Array.isArray(positions) ? positions : [];
        return _positionsCache;
    } catch (e) {
        console.warn('fetchPositions fallback:', e);
        _positionsCache = getData('positions') || [];
        return _positionsCache;
    }
}

function renderUsersTab() {
    const users = getUsersData();
    const departments = getDepartmentsData();
    const currentUser = getUser();

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <div class="filter-bar" style="flex:1; margin:0;">
                <input type="text" id="admin-user-filter" placeholder="Tìm theo tên hoặc email..." style="flex:1;" />
                <select id="admin-role-filter">
                    <option value="">Tất cả role</option>
                    ${getRoles().map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
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
                        <th>Chức vụ</th>
                        <th>Điện thoại</th>
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
        html += `<tr><td colspan="8" style="text-align:center; color:#999;">Không có người dùng nào</td></tr>`;
    }

    for (const u of filtered) {
        const roleLabel = getRoles().find(r => r.value === u.role)?.label || u.role;
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
                <td>${u.phone || '--'}</td>
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
    }

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

    const dept = getDepartmentsData().find(d => d.id === u.departmentId);
    const roleLabel = getRoles().find(r => r.value === u.role)?.label || u.role;

    showModal('Chi tiết người dùng', `
        <div class="detail-grid">
            <div><span class="label">ID:</span> <span class="value">${u.id}</span></div>
            <div><span class="label">Họ tên:</span> <span class="value">${u.name}</span></div>
            <div><span class="label">Email:</span> <span class="value">${u.email}</span></div>
            <div><span class="label">Role:</span> <span class="value">${roleLabel}</span></div>
            <div><span class="label">Phòng ban:</span> <span class="value">${dept ? dept.name : (u.department || '--')}</span></div>
            <div><span class="label">Chức vụ:</span> <span class="value">${u.position || '--'}</span></div>
            <div><span class="label">Điện thoại:</span> <span class="value">${u.phone || '--'}</span></div>
            <div><span class="label">Địa chỉ:</span> <span class="value">${u.address || '--'}</span></div>
            <div><span class="label">Trình độ học vấn:</span> <span class="value">${u.education || '--'}</span></div>
            <div><span class="label">Ngày tạo:</span> <span class="value">${u.createdAt || '--'}</span></div>
        </div>
        <div class="modal-actions">
            ${u.id === getUser()?.id ? `<button class="btn btn-primary" onclick="editProfile()"><i class="fas fa-user-edit"></i> Sửa hồ sơ của tôi</button>` : ''}
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

// ===== USER PROFILE MODAL =====
function showUserProfileModal() {
    const currentUser = getUser();
    if (!currentUser) return;
    const users = getUsersData();
    const u = users.find(x => x.id === currentUser.id) || currentUser;
    const departments = getDepartmentsData();
    const deptOpts = departments.map(d =>
        `<option value="${d.id}" ${d.id === u.departmentId ? 'selected' : ''}>${d.code} - ${d.name}</option>`
    ).join('');

    fetchPositions().then(positions => {
        const positionOpts = positions.map(p =>
            `<option value="${p.name}" ${p.name === u.position ? 'selected' : ''}>${p.name}</option>`
        ).join('');

        showModal('👤 Hồ sơ của tôi', `
            <div class="detail-grid">
                <div><span class="label">Họ tên:</span> <span class="value">${u.name}</span></div>
                <div><span class="label">Email:</span> <span class="value">${u.email}</span></div>
                <div><span class="label">Role:</span> <span class="value">${getRoles().find(r => r.value === u.role)?.label || u.role}</span></div>
            </div>
            <hr/>
            <h4 style="margin:8px 0;">Sửa thông tin cá nhân</h4>
            <div class="form-group">
                <label>Họ tên</label>
                <input id="f-profile-name" value="${u.name}">
            </div>
            <div class="form-group">
                <label>Phòng ban</label>
                <select id="f-profile-dept"><option value="">-- Chọn --</option>${deptOpts}</select>
            </div>
            <div class="form-group">
                <label>Chức vụ</label>
                <select id="f-profile-position"><option value="">-- Chọn chức vụ --</option>${positionOpts}</select>
            </div>
            <div class="form-group">
                <label>Điện thoại</label>
                <input id="f-profile-phone" value="${u.phone || ''}" placeholder="Số điện thoại">
            </div>
            <div class="form-group">
                <label>Địa chỉ</label>
                <input id="f-profile-address" value="${u.address || ''}" placeholder="Địa chỉ">
            </div>
            <div class="form-group">
                <label>Trình độ học vấn</label>
                <input id="f-profile-education" value="${u.education || ''}" placeholder="Trình độ học vấn">
            </div>
            <div class="form-group">
                <label>Mật khẩu mới (để trống nếu không đổi)</label>
                <input id="f-profile-password" type="password" placeholder="Nhập mật khẩu mới">
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="saveProfile()"><i class="fas fa-save"></i> Lưu hồ sơ</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    });
}

async function saveProfile() {
    const currentUser = getUser();
    if (!currentUser) return;
    const name = document.getElementById('f-profile-name').value.trim();
    const departmentId = parseInt(document.getElementById('f-profile-dept').value) || null;
    const position = document.getElementById('f-profile-position').value;
    const phone = document.getElementById('f-profile-phone').value.trim();
    const address = document.getElementById('f-profile-address').value.trim();
    const education = document.getElementById('f-profile-education').value.trim();
    const password = document.getElementById('f-profile-password').value.trim();

    if (!name) { showError('Họ tên không được để trống'); return; }

    try {
        const payload = { name, departmentId, position, phone, address, education };
        if (password) payload.password = password;
        await api.updateUser(currentUser.id, payload);
        // Cập nhật session
        const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
        stored.name = name;
        const u = getUsersData().find(x => x.id === currentUser.id);
        if (u) {
            u.name = name;
            u.position = position;
            u.departmentId = departmentId;
            u.phone = phone;
            u.address = address;
            u.education = education;
        }
        sessionStorage.setItem('user', JSON.stringify(stored));
        setUser(stored);
        closeModal();
        showSuccess('Cập nhật hồ sơ thành công!');
        renderAdminUI('users');
    } catch (error) {
        showError('Lỗi khi cập nhật hồ sơ: ' + error.message);
    }
}

// ===== SHOW ADD USER MODAL (cập nhật với checkbox) =====
function showAddUserModal() {
    const departments = getDepartmentsData();
    const deptOpts = departments.map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');
    const roles = getRoles();
    const roleOpts = roles.map(r => `<option value="${r.value}">${r.label}</option>`).join('');

    fetchPositions().then(positions => {
        const positionOpts = positions.map(p =>
            `<option value="${p.name}">${p.name}</option>`
        ).join('');

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
            ${getUser()?.role === 'ADMIN' ? `
                <div class="form-group">
                    <label>Role (Phân quyền)</label>
                    <select id="f-admin-role">${roleOpts}</select>
                </div>
            ` : `
                <input type="hidden" id="f-admin-role" value="USER">
            `}
            <div class="form-group">
                <label>Phòng ban</label>
                <select id="f-admin-department">
                    <option value="">-- Chọn --</option>
                    ${deptOpts}
                </select>
            </div>
            <div class="form-group">
                <label>Chức vụ</label>
                <select id="f-admin-position">
                    <option value="">-- Chọn chức vụ --</option>
                    ${positionOpts}
                </select>
            </div>
            <!-- ✅ Checkbox gán quyền -->
            <div id="grant-permission-group" style="display:none; padding:8px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; margin-bottom:12px;">
                <label style="display:flex; align-items:center; gap:8px; font-weight:500; cursor:pointer;">
                    <input type="checkbox" id="f-admin-grant-permissions" checked>
                    <span>🔑 Gán toàn bộ quyền của phòng ban cho user này</span>
                </label>
                <div style="font-size:12px; color:#666; margin-top:4px; padding-left:28px;">
                    <i class="fas fa-info-circle"></i> 
                    User sẽ được cấp tất cả quyền hiện có của phòng ban được chọn.
                </div>
            </div>
            <div class="form-group">
                <label>Điện thoại</label>
                <input id="f-admin-phone" placeholder="Số điện thoại">
            </div>
            <div class="form-group">
                <label>Địa chỉ</label>
                <input id="f-admin-address" placeholder="Địa chỉ">
            </div>
            <div class="form-group">
                <label>Trình độ học vấn</label>
                <input id="f-admin-education" placeholder="Trình độ học vấn">
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="saveUser()"><i class="fas fa-save"></i> Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        // ✅ Gắn sự kiện: khi chọn position đặc biệt, hiện checkbox
        const positionSelect = document.getElementById('f-admin-position');
        const grantGroup = document.getElementById('grant-permission-group');
        const specialPositions = getSpecialPositions();

        function toggleGrantPermission() {
            const selected = positionSelect.value;
            const isSpecial = specialPositions.includes(selected);
            grantGroup.style.display = isSpecial ? 'block' : 'none';
            if (!isSpecial) {
                document.getElementById('f-admin-grant-permissions').checked = false;
            }
        }

        positionSelect.addEventListener('change', toggleGrantPermission);
        setTimeout(toggleGrantPermission, 100);
    });
}

async function saveUser() {
    const name = document.getElementById('f-admin-name').value.trim();
    const email = document.getElementById('f-admin-email').value.trim();
    const password = document.getElementById('f-admin-password').value.trim() || 'password';
    const role = document.getElementById('f-admin-role').value || 'USER';
    const departmentId = parseInt(document.getElementById('f-admin-department').value) || null;
    const position = document.getElementById('f-admin-position').value.trim();
    const phone = document.getElementById('f-admin-phone').value.trim();
    const address = document.getElementById('f-admin-address').value.trim();
    const education = document.getElementById('f-admin-education').value.trim();
    // ✅ Lấy flag grant permissions
    const grantAllDeptPermissions = document.getElementById('f-admin-grant-permissions')?.checked || false;

    if (!name || !email) {
        showError('Vui lòng nhập họ tên và email');
        return;
    }
    if (!email.includes('@')) {
        showError('Email không hợp lệ');
        return;
    }

    try {
        const newUser = { 
            name, email, password, role, departmentId, position, phone, address, education,
            grantAllDeptPermissions // ✅ Thêm flag
        };
        await api.createUser(newUser);
        closeModal();
        await refreshAdminUsers();
        renderAdminUI('users');
        showSuccess(`Thêm người dùng ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm user: ' + error.message);
    }
}

// ===== EDIT USER MODAL (cập nhật với checkbox) =====
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

    const positions = await fetchPositions();
    const positionOpts = positions.map(p =>
        `<option value="${p.name}" ${p.name === u.position ? 'selected' : ''}>${p.name}</option>`
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
        ${currentUser.role === 'ADMIN' ? `
            <div class="form-group">
                <label>Role (Phân quyền)</label>
                <select id="f-admin-role">${roleOpts}</select>
            </div>
        ` : `
            <input type="hidden" id="f-admin-role" value="${u.role}">
        `}
        <div class="form-group">
            <label>Phòng ban</label>
            <select id="f-admin-department">
                <option value="">-- Chọn --</option>
                ${deptOpts}
            </select>
        </div>
        <div class="form-group">
            <label>Chức vụ</label>
            <select id="f-admin-position">
                <option value="">-- Chọn chức vụ --</option>
                ${positionOpts}
            </select>
        </div>
        <!-- ✅ Checkbox gán quyền -->
        <div id="grant-permission-group" style="display:none; padding:8px 12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; margin-bottom:12px;">
            <label style="display:flex; align-items:center; gap:8px; font-weight:500; cursor:pointer;">
                <input type="checkbox" id="f-admin-grant-permissions" checked>
                <span>🔑 Gán toàn bộ quyền của phòng ban cho user này</span>
            </label>
            <div style="font-size:12px; color:#666; margin-top:4px; padding-left:28px;">
                <i class="fas fa-info-circle"></i> 
                User sẽ được cấp tất cả quyền hiện có của phòng ban được chọn.
            </div>
        </div>
        <div class="form-group">
            <label>Điện thoại</label>
            <input id="f-admin-phone" value="${u.phone || ''}">
        </div>
        <div class="form-group">
            <label>Địa chỉ</label>
            <input id="f-admin-address" value="${u.address || ''}">
        </div>
        <div class="form-group">
            <label>Trình độ học vấn</label>
            <input id="f-admin-education" value="${u.education || ''}">
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="updateUser(${id})"><i class="fas fa-save"></i> Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);

    // ✅ Gắn sự kiện tương tự
    const positionSelect = document.getElementById('f-admin-position');
    const grantGroup = document.getElementById('grant-permission-group');
    const specialPositions = getSpecialPositions();

    function toggleGrantPermission() {
        const selected = positionSelect.value;
        const isSpecial = specialPositions.includes(selected);
        grantGroup.style.display = isSpecial ? 'block' : 'none';
        if (!isSpecial) {
            document.getElementById('f-admin-grant-permissions').checked = false;
        }
    }

    positionSelect.addEventListener('change', toggleGrantPermission);
    setTimeout(toggleGrantPermission, 100);
}

async function updateUser(id) {
    const name = document.getElementById('f-admin-name').value.trim();
    const email = document.getElementById('f-admin-email').value.trim();
    const password = document.getElementById('f-admin-password').value.trim();
    const role = document.getElementById('f-admin-role').value;
    const departmentId = parseInt(document.getElementById('f-admin-department').value) || null;
    const position = document.getElementById('f-admin-position').value.trim();
    const phone = document.getElementById('f-admin-phone').value.trim();
    const address = document.getElementById('f-admin-address').value.trim();
    const education = document.getElementById('f-admin-education').value.trim();
    // ✅ Lấy flag grant permissions
    const grantAllDeptPermissions = document.getElementById('f-admin-grant-permissions')?.checked || false;

    if (!name || !email) {
        showError('Vui lòng nhập họ tên và email');
        return;
    }
    if (!email.includes('@')) {
        showError('Email không hợp lệ');
        return;
    }

    try {
        const updatedUser = { 
            name, email, role, departmentId, position, phone, address, education,
            grantAllDeptPermissions // ✅ Thêm flag
        };
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

// Export
window.renderUsersTab = renderUsersTab;
window.viewUser = viewUser;
window.showAddUserModal = showAddUserModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.showUserProfileModal = showUserProfileModal;
window.saveProfile = saveProfile;
window.editProfile = editProfile;
window.fetchPositions = fetchPositions;