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

// Trong auth.js, thêm kiểm tra api trước khi gọi
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
        errorEl.textContent = 'Vui lòng nhập email và mật khẩu';
        return;
    }

    // ✅ KIỂM TRA API ĐÃ TẢI CHƯA
    if (typeof api === 'undefined' || typeof api.login !== 'function') {
        errorEl.textContent = 'Lỗi: API chưa được tải. Vui lòng tải lại trang.';
        console.error('api is not defined');
        return;
    }

    try {
        showLoading('Đang đăng nhập...');
        const response = await api.login(email, password);
        setUser({ ...response.user, token: response.token });
        errorEl.textContent = '';
        showApp();
    } catch (error) {
        errorEl.textContent = error.message || 'Sai email hoặc mật khẩu';
        console.error('Login error:', error);
    } finally {
        hideLoading();
    }
});

// ================================================================
// KIỂM TRA QUYỀN (sử dụng permissions từ API)
// ================================================================
function hasPermission(permissionKey) {
    const user = getUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    // TODO: Gọi API /permissions để kiểm tra quyền
    return false;
}

function hasAnyPermission(permissionKeys) {
    return permissionKeys.some(key => hasPermission(key));
}

function hasAllPermissions(permissionKeys) {
    return permissionKeys.every(key => hasPermission(key));
}

// ================================================================
// LOGIN - GỌI API THẬT
// ================================================================
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
        errorEl.textContent = 'Vui lòng nhập email và mật khẩu';
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
        showApp();
    } catch (error) {
        errorEl.textContent = error.message || 'Sai email hoặc mật khẩu';
        console.error('Login error:', error);
    } finally {
        hideLoading();
    }
});

// ================================================================
// HIỂN THỊ ỨNG DỤNG SAU LOGIN
// ================================================================
function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    const user = getUser();
    if (!user) return;

    const role = user.role;

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = role;

    // Ẩn/hiện nút theo quyền
    const btnAddItem = document.getElementById('btn-add-item');
    if (btnAddItem) btnAddItem.style.display = (role === 'ADMIN') ? 'inline-block' : 'none';

    const exportItemsBtn = document.getElementById('btn-export-items');
    if (exportItemsBtn) exportItemsBtn.style.display = (role === 'ADMIN') ? 'inline-block' : 'none';

    const canEditProject = ['ADMIN', 'PLANNING', 'PROJECT', 'CEO'].includes(role);
    const btnCreateProject = document.getElementById('btn-create-project');
    if (btnCreateProject) btnCreateProject.style.display = canEditProject ? 'inline-block' : 'none';

    const canEditVendor = ['ADMIN', 'PURCHASING'].includes(role);
    const btnCreateVendor = document.getElementById('btn-create-vendor');
    if (btnCreateVendor) btnCreateVendor.style.display = canEditVendor ? 'inline-block' : 'none';

    // Ẩn menu admin
    const adminMenuItem = document.querySelector('#menu > li[data-page="admin"]');
    if (adminMenuItem) {
        adminMenuItem.style.display = (role === 'ADMIN' || hasPermission('admin.view')) ? 'flex' : 'none';
    }

    // Ẩn menu theo permissions
    const menuMap = {
        'mr': 'mr.view',
        'pr': 'pr.view',
        'po': 'po.view',
        'inventory': 'inventory.view',
        'issue': 'issue.view',
        'material-return': 'materialreturn.view'
    };
    Object.keys(menuMap).forEach(page => {
        const menuItem = document.querySelector(`#menu > li[data-page="${page}"]`);
        if (menuItem) {
            menuItem.style.display = hasPermission(menuMap[page]) ? 'flex' : 'none';
        }
    });

    // Gọi renderAll (đã được định nghĩa trong app.js)
    if (typeof renderAll === 'function') {
        renderAll();
    } else {
        console.warn('renderAll chưa được định nghĩa');
    }
}

// Tự động đăng nhập nếu có session
if (getUser()) {
    showApp();
}

// Đăng xuất
document.getElementById('logout-btn').addEventListener('click', function() {
    clearUser();
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-page').style.display = 'block';
    document.querySelectorAll('#menu > li').forEach(li => {
        li.style.display = 'flex';
    });
    document.getElementById('login-error').textContent = '';
});

window.hasPermission = hasPermission;
window.hasAnyPermission = hasAnyPermission;
window.hasAllPermissions = hasAllPermissions;

console.log('✅ Auth module updated to use real API.');