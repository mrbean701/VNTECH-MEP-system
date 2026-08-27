// ================================================================
// SESSION MANAGEMENT
// ================================================================
let currentUser = null;

function setUser(user) {
    currentUser = user;
    sessionStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
    if (!currentUser) {
        const u = sessionStorage.getItem('user');
        currentUser = u ? JSON.parse(u) : null;
    }
    return currentUser;
}

function clearUser() {
    currentUser = null;
    sessionStorage.removeItem('user');
}

// ================================================================
// PERMISSION HELPERS (KHÔNG FALLBACK CỨNG)
// ================================================================

/**
 * Lấy user permissions từ localStorage
 * Cấu trúc: { userId: { permissionKey: true/false } }
 */
function getUserPermissionsCache() {
    try {
        const data = getData('user_permissions');
        return data && typeof data === 'object' ? data : {};
    } catch (e) {
        return {};
    }
}

/**
 * Lấy department permissions từ localStorage (_adminPermissions)
 * Cấu trúc: [ { departmentId, permissionKey, enabled } ] hoặc object
 */
function getAdminPermissions() {
    try {
        const data = getData('permissions');
        return data && typeof data === 'object' ? data : {};
    } catch (e) {
        return {};
    }
}

/**
 * Xây dựng map quyền của department từ dữ liệu _adminPermissions
 * Trả về object: { permissionKey: true/false }
 */
function getDepartmentPermissionMap(deptId) {
    if (!deptId) return {};

    const perms = getAdminPermissions();
    const result = {};

    // Nếu perms là mảng (từ API mới)
    if (Array.isArray(perms)) {
        perms.forEach(p => {
            if (p.departmentId === deptId && p.enabled) {
                result[p.permissionKey] = true;
            }
        });
        return result;
    }

    // Nếu perms là object (từ localStorage cũ)
    Object.keys(perms).forEach(role => {
        const roleData = perms[role];
        if (typeof roleData === 'object') {
            Object.keys(roleData).forEach(key => {
                // Nếu key là departmentId
                if (!isNaN(key) && parseInt(key) === deptId) {
                    const deptPerms = roleData[key];
                    if (typeof deptPerms === 'object') {
                        Object.keys(deptPerms).forEach(pk => {
                            if (deptPerms[pk]) {
                                result[pk] = true;
                            }
                        });
                    }
                }
            });
        }
    });

    return result;
}

/**
 * Kiểm tra quyền – KHÔNG CÓ FALLBACK CỨNG
 * Ưu tiên: UserPermission (ghi đè) > DepartmentPermission
 */
function hasPermission(permissionKey) {
    const user = getUser();
    if (!user) return false;

    // Admin luôn có toàn quyền
    if (user.role === 'ADMIN') return true;

    // Bước 1: User permission (ghi đè)
    const userPerms = getUserPermissionsCache();
    const userPermObj = userPerms[user.id] || {};
    if (userPermObj[permissionKey] === true) return true;
    if (userPermObj[permissionKey] === false) return false;

    // Bước 2: Department permission (nếu có)
    if (user.departmentId) {
        const deptPermMap = getDepartmentPermissionMap(user.departmentId);
        if (deptPermMap[permissionKey] === true) return true;
        if (deptPermMap[permissionKey] === false) return false;
    }

    // Bước 3: Không có quyền
    return false;
}

function hasAnyPermission(permissionKeys) {
    if (!Array.isArray(permissionKeys)) return false;
    return permissionKeys.some(key => hasPermission(key));
}

function hasAllPermissions(permissionKeys) {
    if (!Array.isArray(permissionKeys)) return false;
    return permissionKeys.every(key => hasPermission(key));
}

// ================================================================
// LOGIN – GỌI API VÀ LƯU PERMISSIONS
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    // Xóa listener cũ (clone để tránh trùng lặp)
    const newLoginForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newLoginForm, loginForm);

    newLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            errorEl.textContent = 'Vui lòng nhập email và mật khẩu';
            return;
        }

        if (typeof api === 'undefined' || typeof api.login !== 'function') {
            errorEl.textContent = 'Lỗi: API chưa được tải. Vui lòng tải lại trang.';
            return;
        }

        try {
            showLoading('Đang đăng nhập...');
            const response = await api.login(email, password);
            setUser({
                ...response.user,
                token: response.token
            });
            errorEl.textContent = '';

            // Lấy permissions từ API và lưu vào localStorage
            try {
                const perms = await api.getPermissions();
                if (perms && typeof perms === 'object') {
                    saveData('permissions', perms);
                }
                // Lấy user permissions riêng (nếu API có)
                if (response.user && response.user.id) {
                    const userPerms = await api.getUserPermissions(response.user.id);
                    if (userPerms && typeof userPerms === 'object') {
                        const allUserPerms = getData('user_permissions') || {};
                        // Chuyển đổi thành map { permissionKey: enabled }
                        const map = {};
                        if (Array.isArray(userPerms)) {
                            userPerms.forEach(p => {
                                map[p.permissionKey] = p.enabled;
                            });
                        } else {
                            Object.assign(map, userPerms);
                        }
                        allUserPerms[response.user.id] = map;
                        saveData('user_permissions', allUserPerms);
                    }
                }
            } catch (permError) {
                console.warn('Không thể lấy permissions:', permError);
            }

            showApp();
        } catch (error) {
            errorEl.textContent = error.message || 'Sai email hoặc mật khẩu';
        } finally {
            hideLoading();
        }
    });
});

// ================================================================
// HIỂN THỊ APP SAU LOGIN
// ================================================================
function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    const user = getUser();
    if (!user) return;

    document.getElementById('user-name').textContent = user.name || 'User';
    document.getElementById('user-role').textContent = user.role || '--';

    // Ẩn/hiện menu dựa trên quyền (không fallback)
    const menuMap = {
        'mr': 'mr.view',
        'pr': 'pr.view',
        'po': 'po.view',
        'inventory': 'inventory.view',
        'issue': 'issue.view',
        'material-return': 'materialreturn.view',
        'min-stock': 'inventory.view',
        'auto-reorder': 'po.view',
        'admin': 'admin.view'
    };
    Object.keys(menuMap).forEach(page => {
        const menuItem = document.querySelector(`#menu > li[data-page="${page}"]`);
        if (menuItem) {
            menuItem.style.display = hasPermission(menuMap[page]) ? 'flex' : 'none';
        }
    });

    // Ẩn/hiện nút chức năng
    const btnAddItem = document.getElementById('btn-add-item');
    if (btnAddItem) btnAddItem.style.display = hasPermission('items.create') ? 'inline-block' : 'none';

    const btnCreateProject = document.getElementById('btn-create-project');
    if (btnCreateProject) btnCreateProject.style.display = hasPermission('projects.create') ? 'inline-block' : 'none';

    const btnCreateVendor = document.getElementById('btn-create-vendor');
    if (btnCreateVendor) btnCreateVendor.style.display = hasPermission('vendors.create') ? 'inline-block' : 'none';

    // Render all (nếu có)
    if (typeof renderAll === 'function') {
        try { renderAll(); } catch(e) { console.error('renderAll error:', e); }
    }

    if (typeof window.updateMenuVisibility === 'function') {
        window.updateMenuVisibility();
    }
}

// ================================================================
// ĐĂNG XUẤT
// ================================================================
document.getElementById('logout-btn')?.addEventListener('click', function() {
    clearUser();
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-page').style.display = 'block';
    document.querySelectorAll('#menu > li').forEach(li => {
        li.style.display = 'flex';
    });
    document.getElementById('login-error').textContent = '';
});

// Tự động đăng nhập nếu có session
if (getUser()) {
    showApp();
}

// ================================================================
// EXPORT GLOBAL
// ================================================================
window.hasPermission = hasPermission;
window.hasAnyPermission = hasAnyPermission;
window.hasAllPermissions = hasAllPermissions;
window.getUserPermissionsCache = getUserPermissionsCache;
window.getDepartmentPermissionMap = getDepartmentPermissionMap;
window.getAdminPermissions = getAdminPermissions;

console.log('✅ Auth module loaded – no hardcoded fallback, only DB permissions');