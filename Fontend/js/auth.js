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
// PERMISSION HELPERS (ƯU TIÊN USER PERMISSION)
// ================================================================

/**
 * Lấy role permissions từ localStorage
 */
function getRolePermissions() {
    try {
        const perms = getData('permissions');
        return perms && typeof perms === 'object' ? perms : {};
    } catch (e) {
        return {};
    }
}

/**
 * Lấy user permissions từ localStorage (đã được cache khi login)
 * Cấu trúc: { userId: { permissionKey: true/false } }
 */
function getUserPermissionsCache() {
    try {
        const userPerms = getData('user_permissions');
        return userPerms && typeof userPerms === 'object' ? userPerms : {};
    } catch (e) {
        return {};
    }
}

/**
 * Kiểm tra quyền – Ưu tiên: UserPermission > RolePermission > Fallback
 */
function hasPermission(permissionKey) {
    const user = getUser();
    if (!user) return false;
    // Admin luôn có toàn quyền
    if (user.role === 'ADMIN') return true;

    // 1. Kiểm tra user permission (ghi đè role)
    try {
        const userPerms = getUserPermissionsCache();
        const userPermObj = userPerms[user.id] || {};
        if (userPermObj[permissionKey] === true) return true;
        if (userPermObj[permissionKey] === false) return false; // bị từ chối rõ ràng
    } catch (e) {}

    // 2. Kiểm tra role permission
    try {
        const rolePerms = getRolePermissions();
        const roleObj = rolePerms[user.role] || {};
        if (roleObj[permissionKey] === true) return true;
        if (roleObj[permissionKey] === false) return false;
        if (roleObj['*'] === true) return true; // wildcard
    } catch (e) {}

    // 3. Fallback cứng (chỉ khi chưa có dữ liệu từ API)
    const roleFallback = {
        'ADMIN': '*',
        'CEO': ['dashboard.view', 'pr.approve', 'po.approve'],
        'PLANNING': ['dashboard.view', 'pr.approve', 'po.approve', 'mr.view', 'pr.view', 'po.view'],
        'PROJECT': ['dashboard.view', 'pr.approve', 'po.approve', 'mr.view', 'pr.view', 'po.view'],
        'PURCHASING': ['dashboard.view', 'pr.create', 'pr.edit', 'po.create', 'po.edit',
                       'grn.create', 'grn.receive', 'sto.create', 'mr.view', 'pr.view', 'po.view',
                       'inventory.view', 'issue.view', 'materialreturn.view'],
        'SITE_COMMANDER': ['dashboard.view', 'mr.create', 'mr.approve', 'issue.create',
                           'issue.approve', 'materialreturn.create', 'mr.view', 'issue.view',
                           'materialreturn.view'],
        'QC': ['dashboard.view', 'grn.qc', 'grn.view']
    };
    const allowed = roleFallback[user.role] || [];
    if (allowed === '*') return true;
    if (Array.isArray(allowed) && allowed.includes(permissionKey)) return true;

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
// LOGIN – TỰ ĐỘNG LƯU PERMISSIONS VÀO CACHE
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    // Xóa listener cũ (tránh trùng lặp)
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

            // Lấy role permissions và user permissions
            try {
                const perms = await api.getPermissions();
                if (perms && typeof perms === 'object') {
                    saveData('permissions', perms);
                }
                // Lấy user permissions riêng
                if (response.user && response.user.id) {
                    await api.getUserPermissions(response.user.id);
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

    // Ẩn/hiện menu dựa trên permission
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

    // Render all
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
window.getRolePermissions = getRolePermissions;

console.log('✅ Auth module updated: user permission priority, workflow support');