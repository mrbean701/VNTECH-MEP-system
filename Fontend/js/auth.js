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
// PERMISSION HELPERS (CẬP NHẬT GIAI ĐOẠN 3)
// ================================================================

function getUserPermissionsCache() {
    try {
        const data = getData('user_permissions');
        return data && typeof data === 'object' ? data : {};
    } catch (e) {
        return {};
    }
}

function getAdminPermissions() {
    try {
        const data = getData('permissions');
        return data && typeof data === 'object' ? data : {};
    } catch (e) {
        return {};
    }
}

function getDepartmentPermissionMap(deptId) {
    if (!deptId) return {};
    const perms = getAdminPermissions();
    const result = {};
    if (Array.isArray(perms)) {
        perms.forEach(p => {
            if (p.departmentId === deptId && p.enabled) {
                result[p.permissionKey] = true;
            }
        });
        return result;
    }
    Object.keys(perms).forEach(role => {
        const roleData = perms[role];
        if (typeof roleData === 'object') {
            Object.keys(roleData).forEach(key => {
                if (!isNaN(key) && parseInt(key) === deptId) {
                    const deptPerms = roleData[key];
                    if (typeof deptPerms === 'object') {
                        Object.keys(deptPerms).forEach(pk => {
                            if (deptPerms[pk]) result[pk] = true;
                        });
                    }
                }
            });
        }
    });
    return result;
}

/**
 * Kiểm tra quyền dựa trên:
 * 1. ADMIN -> true
 * 2. UserPermission (nếu có) -> theo enabled
 * 3. DepartmentPermission (nếu user có departmentId) -> theo enabled
 * 4. Mặc định -> false
 */
function hasPermission(permissionKey) {
    const user = getUser();
    if (!user) return false;

    // ADMIN luôn có toàn quyền
    if (user.role === 'ADMIN') return true;

    // Kiểm tra user_permissions (ghi đè)
    const userPerms = getUserPermissionsCache();
    const userPermObj = userPerms[user.id] || {};
    if (userPermObj[permissionKey] === true) return true;
    if (userPermObj[permissionKey] === false) return false;

    // Kiểm tra department_permissions
    if (user.departmentId) {
        const deptPermMap = getDepartmentPermissionMap(user.departmentId);
        if (deptPermMap[permissionKey] === true) return true;
        if (deptPermMap[permissionKey] === false) return false;
    }

    // Không có quyền
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
// LOGIN
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

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

            try {
                const perms = await api.getPermissions();
                if (perms && typeof perms === 'object') {
                    saveData('permissions', perms);
                }
                if (response.user && response.user.id) {
                    const userPerms = await api.getUserPermissions(response.user.id);
                    if (userPerms && typeof userPerms === 'object') {
                        const allUserPerms = getData('user_permissions') || {};
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

    // Click tên user để mở hồ sơ cá nhân
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.style.cursor = 'pointer';
        userNameEl.title = 'Xem hồ sơ của tôi';
        userNameEl.onclick = function() {
            if (typeof showUserProfileModal === 'function') {
                showUserProfileModal();
            }
        };
    }

    // ======== QUẢN LÝ MENU ========
    const menuMap = {
        'mr': 'mr.view',
        'pr': 'pr.view',
        'po': 'po.view',
        'inventory': 'inventory.view',
        'issue': 'issue.view',
        'material-return': 'materialreturn.view',
        'min-stock': 'inventory.view',
        'auto-reorder': 'po.view',
        'admin': 'admin.view',
        'projects': 'projects.view',
        'vendors': 'vendors.view',
        'items': 'items.view'
    };

    Object.keys(menuMap).forEach(page => {
        const menuItem = document.querySelector(`#menu > li[data-page="${page}"]`);
        if (menuItem) {
            menuItem.style.display = hasPermission(menuMap[page]) ? 'flex' : 'none';
        }
    });

    // ======== ẨN/HIỆN NÚT CHỨC NĂNG (các nút trong header) ========
    const btnAddItem = document.getElementById('btn-add-item');
    if (btnAddItem) btnAddItem.style.display = hasPermission('items.create') ? 'inline-block' : 'none';

    const btnCreateProject = document.getElementById('btn-create-project');
    if (btnCreateProject) btnCreateProject.style.display = hasPermission('projects.create') ? 'inline-block' : 'none';

    const btnCreateVendor = document.getElementById('btn-create-vendor');
    if (btnCreateVendor) btnCreateVendor.style.display = hasPermission('vendors.create') ? 'inline-block' : 'none';

    const btnCreateMR = document.getElementById('btn-create-mr');
    if (btnCreateMR) btnCreateMR.style.display = hasPermission('mr.create') ? 'inline-block' : 'none';

    const btnCreatePR = document.getElementById('btn-create-pr');
    if (btnCreatePR) btnCreatePR.style.display = hasPermission('pr.create') ? 'inline-block' : 'none';

    const btnCreatePO = document.getElementById('btn-create-po');
    if (btnCreatePO) btnCreatePO.style.display = hasPermission('po.create') ? 'inline-block' : 'none';

    const btnCreateIssue = document.getElementById('btn-create-issue');
    if (btnCreateIssue) btnCreateIssue.style.display = hasPermission('issue.create') ? 'inline-block' : 'none';

    const btnCreateReturn = document.getElementById('btn-create-return');
    if (btnCreateReturn) btnCreateReturn.style.display = hasPermission('materialreturn.create') ? 'inline-block' : 'none';

    // Render tất cả
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

console.log('✅ Auth module updated – role-based permission removed (only ADMIN).');