// ================================================================
// ADMIN USER PERMISSIONS - Phân quyền user (ghi đè phòng ban)
// ================================================================

let _userSearchKeyword = '';

function renderUserPermissionsTab() {
    console.log('🔄 renderUserPermissionsTab called');

    const users = getUsersData();
    const departments = getDepartmentsData();
    const userPermissions = getUserPermissionsCache();

    if (!users || users.length === 0) {
        return `<div style="padding:20px; text-align:center; color:#999;">Chưa có người dùng nào</div>`;
    }

    const keyword = _userSearchKeyword.toLowerCase().trim();
    const filteredUsers = keyword ? users.filter(u => 
        (u.name || '').toLowerCase().includes(keyword) || 
        (u.email || '').toLowerCase().includes(keyword)
    ) : users;

    const userFilter = document.getElementById('user-perm-user-filter');
    let selectedUserId = userFilter ? parseInt(userFilter.value) : null;
    
    if (!selectedUserId || !users.find(u => u.id === selectedUserId)) {
        if (filteredUsers.length > 0) {
            selectedUserId = filteredUsers[0].id;
            if (userFilter) userFilter.value = selectedUserId;
        } else {
            return `<div style="padding:20px; text-align:center; color:#999;">Không có user nào phù hợp</div>`;
        }
    }
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
        return `<div style="padding:20px; text-align:center; color:#999;">Không tìm thấy user</div>`;
    }

    console.log('Selected user:', selectedUser.name, selectedUser.email, 'department:', selectedUser.departmentId);

    // Lấy quyền của phòng ban user (từ _adminPermissions)
    const deptPerms = getDepartmentPermissionMap(selectedUser.departmentId);
    const deptPermKeys = Object.keys(deptPerms).filter(k => deptPerms[k] === true);

    if (!userPermissions[selectedUser.id]) {
        userPermissions[selectedUser.id] = {};
        saveData('user_permissions', userPermissions);
    }
    const userPerms = userPermissions[selectedUser.id] || {};

    const deptName = selectedUser.departmentId 
        ? departments.find(d => d.id === selectedUser.departmentId)?.name || 'N/A' 
        : 'Chưa có phòng ban';

    const moduleActions = getModuleActions();
    const modules = Object.keys(moduleActions);

    const userOpts = filteredUsers.map(u => 
        `<option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>${u.name} (${u.email})</option>`
    ).join('');

    // ===== THÊM NÚT COPY QUYỀN PHÒNG BAN =====
    const canCopy = selectedUser.departmentId && deptPermKeys.length > 0;

    let html = `
        <div style="margin-bottom:16px; display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                <label style="font-weight:600;">Tìm kiếm user:</label>
                <input type="text" id="user-perm-search" placeholder="Nhập tên hoặc email..." value="${_userSearchKeyword}" style="padding:8px 12px; border:1px solid #ccc; border-radius:4px; min-width:200px;">
                <button class="btn btn-sm" onclick="searchUserPermissions()"><i class="fas fa-search"></i> Tìm</button>
                <button class="btn btn-sm btn-secondary" onclick="resetUserSearch()">Xóa</button>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-left:auto;">
                <label style="font-weight:600;">Chọn user:</label>
                <select id="user-perm-user-filter" onchange="renderAdminUI('user-permissions')" style="padding:8px 14px; border:1px solid #ccc; border-radius:4px; min-width:200px;">
                    ${userOpts}
                </select>
                ${canCopy ? `<button class="btn btn-sm btn-info" onclick="copyDepartmentPermissions(${selectedUser.id})"><i class="fas fa-copy"></i> Copy quyền phòng ban</button>` : ''}
                <button class="btn btn-sm btn-success" onclick="saveUserPermissions()"><i class="fas fa-save"></i> Lưu</button>
                <button class="btn btn-sm btn-warning" onclick="resetUserPermissions()"><i class="fas fa-undo"></i> Reset</button>
            </div>
        </div>
        <div style="background:#f8fafc; padding:12px 16px; border-radius:8px; margin-bottom:16px; border:1px solid #e2e8f0; display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
            <span style="font-weight:600; font-size:15px;">👤 ${selectedUser.name}</span>
            <span style="color:#888;">${selectedUser.email}</span>
            <span class="badge badge-info">${selectedUser.role}</span>
            <span>🏢 ${deptName}</span>
            <span style="color:#888; margin-left:auto;">Phòng ban có <strong>${deptPermKeys.length}</strong> quyền</span>
        </div>
    `;

    if (!selectedUser.departmentId) {
        html += `<div style="padding:20px; text-align:center; color:#999; background:white; border-radius:12px; border:1px solid #e2e8f0;">
            User chưa có phòng ban. Vui lòng gán phòng ban trước.
        </div>`;
        return html;
    }

    if (deptPermKeys.length === 0) {
        html += `<div style="padding:20px; text-align:center; color:#999; background:white; border-radius:12px; border:1px solid #e2e8f0;">
            Phòng ban <strong>${deptName}</strong> chưa có quyền nào. Vui lòng cấp quyền cho phòng ban trước.
        </div>`;
        return html;
    }

    html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">`;

    modules.forEach(module => {
        const moduleLabel = getModuleLabel(module);
        const actions = moduleActions[module];
        const availableActions = actions.filter(action => {
            const key = `${module}.${action}`;
            return deptPermKeys.includes(key);
        });
        if (availableActions.length === 0) return;

        const perms = availableActions.map(action => ({ key: `${module}.${action}`, action }));
        const checkedCount = perms.filter(p => userPerms[p.key] === true).length;
        const totalCount = perms.length;

        html += `
            <div style="background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
                <div style="background:#f0f4f8; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border-bottom:1px solid #e2e8f0;" onclick="toggleModuleUserPermissions(${selectedUser.id}, '${module}')">
                    <span style="font-weight:600; font-size:14px; color:#1a3c6e;">📁 ${moduleLabel}</span>
                    <span style="font-size:12px; color:#888;">
                        <span class="module-count" data-module="${module}" data-user="${selectedUser.id}">${checkedCount}</span>/${totalCount}
                        <span style="margin-left:8px; font-size:11px; color:#1a3c6e;">Chọn tất cả</span>
                    </span>
                </div>
                <div style="padding:8px 12px;">
        `;
        perms.forEach(({ key, action }) => {
            const actionLabel = getActionLabel(action);
            const checked = (userPerms[key] === true) ? 'checked' : '';
            html += `
                <label style="display:flex; align-items:center; gap:8px; padding:4px 0; font-size:13px; cursor:pointer; border-bottom:1px solid #f5f5f5;">
                    <input type="checkbox" class="user-perm-checkbox" data-user="${selectedUser.id}" data-perm="${key}" data-module="${module}" ${checked} style="width:15px; height:15px; cursor:pointer; accent-color:#1a3c6e;" onchange="togglePermissionAndUpdate(${selectedUser.id}, '${key}', this.checked)">
                    <span>${actionLabel}</span>
                </label>
            `;
        });
        html += `</div></div>`;
    });

    html += `</div>`;

    html += `
        <div style="margin-top:16px; font-size:13px; color:#888; display:flex; gap:20px; flex-wrap:wrap; padding:8px 0; border-top:1px solid #e2e8f0;">
            <span><i class="fas fa-info-circle"></i> <strong>Chú thích:</strong></span>
            <span>✅ Quyền được gán riêng cho user (ghi đè phòng ban).</span>
            <span>🔒 User chỉ có thể được cấp các quyền mà phòng ban đã có.</span>
            <span>📋 Nút "Copy quyền phòng ban" sẽ gán cho user tất cả quyền mà phòng ban hiện có.</span>
        </div>
    `;

    return html;
}

// ===== HÀM COPY QUYỀN PHÒNG BAN =====
function copyDepartmentPermissions(userId) {
    const user = getUsersData().find(u => u.id === userId);
    if (!user) {
        showError('Không tìm thấy user!');
        return;
    }
    if (!user.departmentId) {
        showError('User chưa có phòng ban!');
        return;
    }

    const deptPerms = getDepartmentPermissionMap(user.departmentId);
    const deptPermKeys = Object.keys(deptPerms).filter(k => deptPerms[k] === true);
    if (deptPermKeys.length === 0) {
        showWarning('Phòng ban này chưa có quyền nào để copy!');
        return;
    }

    if (!confirm(`Copy tất cả ${deptPermKeys.length} quyền của phòng ban vào user này?`)) return;

    // Cập nhật userPermissions
    const userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) {
        userPermissions[userId] = {};
    }
    deptPermKeys.forEach(key => {
        userPermissions[userId][key] = true;
    });
    saveUserPermissionsData(userPermissions);

    // Cập nhật UI
    // Tick tất cả checkbox của user
    document.querySelectorAll(`.user-perm-checkbox[data-user="${userId}"]`).forEach(cb => {
        const permKey = cb.dataset.perm;
        if (deptPermKeys.includes(permKey)) {
            cb.checked = true;
        }
    });

    // Cập nhật số đếm cho từng module
    const allKeys = getAllPermissionKeys();
    const modules = getModuleActions();
    Object.keys(modules).forEach(module => {
        const modulePerms = allKeys.filter(k => k.startsWith(module + '.') && deptPermKeys.includes(k));
        if (modulePerms.length > 0) {
            const checkedCount = modulePerms.filter(k => userPermissions[userId][k] === true).length;
            const countSpan = document.querySelector(`.module-count[data-user="${userId}"][data-module="${module}"]`);
            if (countSpan) {
                countSpan.textContent = checkedCount;
            }
        }
    });

    showSuccess(`Đã copy ${deptPermKeys.length} quyền từ phòng ban vào user!`);
}

// ===== HÀM CẬP NHẬT KHI TICK CHECKBOX =====
function togglePermissionAndUpdate(userId, permKey, checked) {
    const userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) {
        userPermissions[userId] = {};
    }
    userPermissions[userId][permKey] = checked;
    saveUserPermissionsData(userPermissions);
    
    const module = permKey.split('.')[0];
    updateModuleCount(userId, module);
}

// ===== CẬP NHẬT SỐ ĐẾM CỦA MODULE =====
function updateModuleCount(userId, module) {
    const userPermissions = getUserPermissionsCache();
    const userPerms = userPermissions[userId] || {};
    const allPerms = getAllPermissionKeys();
    
    const user = getUsersData().find(u => u.id === userId);
    if (!user) return;
    const deptPerms = getDepartmentPermissionMap(user.departmentId);
    const deptPermKeys = Object.keys(deptPerms).filter(k => deptPerms[k] === true);
    const modulePerms = allPerms.filter(k => k.startsWith(module + '.') && deptPermKeys.includes(k));
    
    const checkedCount = modulePerms.filter(k => userPerms[k] === true).length;
    const totalCount = modulePerms.length;
    
    const countSpan = document.querySelector(`.module-count[data-user="${userId}"][data-module="${module}"]`);
    if (countSpan) {
        countSpan.textContent = checkedCount;
    }
}

// ===== TOGGLE TẤT CẢ QUYỀN CỦA MODULE =====
function toggleModuleUserPermissions(userId, module) {
    const checkboxes = document.querySelectorAll(`.user-perm-checkbox[data-user="${userId}"][data-module="${module}"]`);
    if (checkboxes.length === 0) return;
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const newChecked = !allChecked;
    
    const userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) {
        userPermissions[userId] = {};
    }
    checkboxes.forEach(cb => {
        cb.checked = newChecked;
        const permKey = cb.dataset.perm;
        userPermissions[userId][permKey] = newChecked;
    });
    saveUserPermissionsData(userPermissions);
    
    updateModuleCount(userId, module);
}

// ===== TÌM KIẾM =====
function searchUserPermissions() {
    const searchInput = document.getElementById('user-perm-search');
    if (searchInput) {
        _userSearchKeyword = searchInput.value;
    }
    if (typeof renderAdminUI === 'function') {
        renderAdminUI('user-permissions');
    } else {
        renderUserPermissionsTab();
    }
}

function resetUserSearch() {
    const searchInput = document.getElementById('user-perm-search');
    if (searchInput) {
        searchInput.value = '';
        _userSearchKeyword = '';
    }
    if (typeof renderAdminUI === 'function') {
        renderAdminUI('user-permissions');
    } else {
        renderUserPermissionsTab();
    }
}

// ===== LƯU / RESET =====
function saveUserPermissions() {
    const userFilter = document.getElementById('user-perm-user-filter');
    if (!userFilter) { showError('Không tìm thấy dropdown chọn user'); return; }
    
    const selectedUserId = parseInt(userFilter.value);
    if (!selectedUserId) { showError('Vui lòng chọn user'); return; }

    const userPermissions = getUserPermissionsCache();
    if (!userPermissions[selectedUserId]) {
        userPermissions[selectedUserId] = {};
    }
    document.querySelectorAll('.user-perm-checkbox[data-user="' + selectedUserId + '"]').forEach(cb => {
        userPermissions[selectedUserId][cb.dataset.perm] = cb.checked;
    });

    saveUserPermissionsData(userPermissions);
    showSuccess('Đã lưu phân quyền cho user!');
    if (typeof renderAdminUI === 'function') {
        renderAdminUI('user-permissions');
    } else {
        renderUserPermissionsTab();
    }
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
    if (typeof renderAdminUI === 'function') {
        renderAdminUI('user-permissions');
    } else {
        renderUserPermissionsTab();
    }
    showSuccess('Đã reset quyền của user.');
}

// ===== HELPER: LẤY QUYỀN CỦA PHÒNG BAN =====
function getDepartmentPermissionMap(deptId) {
    if (!deptId) return {};
    const key = `dept_${deptId}`;
    if (!window._deptPermMap) {
        window._deptPermMap = {};
        const perms = _adminPermissions || {};
        if (Array.isArray(perms)) {
            perms.forEach(p => {
                if (p.departmentId) {
                    const k = `dept_${p.departmentId}`;
                    if (!window._deptPermMap[k]) window._deptPermMap[k] = {};
                    window._deptPermMap[k][p.permissionKey] = p.enabled;
                }
            });
        } else {
            Object.keys(perms).forEach(role => {
                const roleData = perms[role];
                if (typeof roleData === 'object') {
                    Object.keys(roleData).forEach(k => {
                        if (!isNaN(k)) {
                            const deptIdKey = parseInt(k);
                            const kMap = `dept_${deptIdKey}`;
                            if (!window._deptPermMap[kMap]) window._deptPermMap[kMap] = {};
                            const deptPerms = roleData[k];
                            Object.keys(deptPerms).forEach(pk => {
                                window._deptPermMap[kMap][pk] = deptPerms[pk];
                            });
                        }
                    });
                }
            });
        }
    }
    return window._deptPermMap[key] || {};
}

function getUserPermissionsCache() {
    return getData('user_permissions') || {};
}

function saveUserPermissionsData(data) {
    saveData('user_permissions', data);
}

// Export ra window
window.renderUserPermissionsTab = renderUserPermissionsTab;
window.searchUserPermissions = searchUserPermissions;
window.resetUserSearch = resetUserSearch;
window.toggleModuleUserPermissions = toggleModuleUserPermissions;
window.togglePermissionAndUpdate = togglePermissionAndUpdate;
window.updateModuleCount = updateModuleCount;
window.saveUserPermissions = saveUserPermissions;
window.resetUserPermissions = resetUserPermissions;
window.copyDepartmentPermissions = copyDepartmentPermissions;
window.getUserPermissionsCache = getUserPermissionsCache;
window.getDepartmentPermissionMap = getDepartmentPermissionMap;