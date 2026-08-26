// ================================================================
// MENU - ĐIỀU HƯỚNG TRANG
// ================================================================

// Hàm an toàn để gọi render
function safeRender(renderFn, moduleName) {
    try {
        if (typeof renderFn === 'function') {
            renderFn();
        } else {
            console.warn(`Module ${moduleName} chưa được định nghĩa`);
        }
    } catch (error) {
        console.error(`Lỗi khi render ${moduleName}:`, error);
        showError(`Lỗi tải module ${moduleName}, vui lòng tải lại trang.`);
    }
}

document.querySelectorAll('#menu > li').forEach(li => {
    li.addEventListener('click', function(e) {
        document.querySelectorAll('#menu > li').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        const page = this.dataset.page;

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        switch (page) {
            case 'dashboard':
    ensurePageAndActivate('page-dashboard', renderDashboard, 'Dashboard');
    break;
case 'projects':
    ensurePageAndActivate('page-projects', renderProjects, 'Projects');
    break;
case 'vendors':
    ensurePageAndActivate('page-vendors', renderVendors, 'Vendors');
    break;
case 'items':
    ensurePageAndActivate('page-items', renderItems, 'Items');
    break;
case 'mr':
    ensurePageAndActivate('page-mr', renderMR, 'MR');
    break;
case 'pr':
    ensurePageAndActivate('page-pr', renderPR, 'PR');
    break;
case 'po':
    ensurePageAndActivate('page-po', renderPO, 'PO');
    break;
case 'inventory':
    ensurePageAndActivate('page-inventory', () => renderWarehousePage('wh-list'), 'Warehouse');
    break;
case 'issue':
    ensurePageAndActivate('page-issue', renderIssuePage, 'Issue');
    break;
case 'material-return':
    ensurePageAndActivate('page-material-return', renderMaterialReturnPage, 'Material Return');
    break;
case 'min-stock':
    ensurePageAndActivate('page-min-stock', renderMinStockPage, 'Min Stock');
    break;
case 'auto-reorder':
    ensurePageAndActivate('page-auto-reorder', renderAutoReorderPage, 'Auto Reorder');
    break;
case 'admin':
    ensurePageAndActivate('page-admin', renderAdminPage, 'Admin');
    break;
            default:
                console.warn('Trang không xác định:', page);
        }

        // Đóng sidebar trên mobile
        if (typeof closeSidebarOnMobile === 'function') {
            closeSidebarOnMobile();
        }
    });
});

// Hàm chuyển tab trong module Kho
window.switchWarehouseTab = function(tab) {
    if (!tab) tab = 'wh-list';
    ensurePageAndActivate('page-inventory', () => renderWarehousePage(tab), 'Warehouse');
};

// ================================================================
// NAVIGATION HELPER
// ================================================================
window.navigateTo = function(page) {
    const menuItem = document.querySelector('#menu > li[data-page="' + page + '"]');
    if (menuItem) {
        menuItem.click();
    } else if (page === 'grn') {
        const khoItem = document.querySelector('#menu > li[data-page="inventory"]');
        if (khoItem) {
            khoItem.click();
            setTimeout(() => switchWarehouseTab('wh-grn'), 100);
        }
    } else if (page === 'sto') {
        const khoItem = document.querySelector('#menu > li[data-page="inventory"]');
        if (khoItem) {
            khoItem.click();
            setTimeout(() => switchWarehouseTab('wh-sto'), 100);
        }
    } else if (page === 'warehouse') {
        const khoItem = document.querySelector('#menu > li[data-page="inventory"]');
        if (khoItem) {
            khoItem.click();
            setTimeout(() => switchWarehouseTab('wh-list'), 100);
        }
    } else if (page === 'admin') {
        const adminItem = document.querySelector('#menu > li[data-page="admin"]');
        if (adminItem) adminItem.click();
    }
};

window.switchWarehouseTab = switchWarehouseTab;

// ================================================================
// FILTER EVENTS
// ================================================================
document.getElementById('project-filter')?.addEventListener('input', () => safeRender(renderProjects, 'Projects'));
document.getElementById('vendor-filter')?.addEventListener('input', () => safeRender(renderVendors, 'Vendors'));
document.getElementById('item-filter')?.addEventListener('input', () => safeRender(renderItems, 'Items'));
document.getElementById('mr-filter')?.addEventListener('input', () => safeRender(renderMR, 'MR'));
document.getElementById('mr-status-filter')?.addEventListener('change', () => safeRender(renderMR, 'MR'));
document.getElementById('pr-filter')?.addEventListener('input', () => safeRender(renderPR, 'PR'));
document.getElementById('pr-status-filter')?.addEventListener('change', () => safeRender(renderPR, 'PR'));
document.getElementById('po-filter')?.addEventListener('input', () => safeRender(renderPO, 'PO'));
document.getElementById('po-status-filter')?.addEventListener('change', () => safeRender(renderPO, 'PO'));

// ================================================================
// RENDER ALL (định nghĩa, không tự gọi)
// ================================================================
function renderAll() {
    // Sử dụng safeRender cho từng module để không bị lỗi một module làm hỏng toàn bộ
    safeRender(renderDashboard, 'Dashboard');
    safeRender(renderProjects, 'Projects');
    safeRender(renderVendors, 'Vendors');
    safeRender(renderItems, 'Items');
    safeRender(renderMR, 'MR');
    safeRender(renderPR, 'PR');
    safeRender(renderPO, 'PO');
    // Các module khác sẽ render khi click menu
}

// ================================================================
// SIDEBAR TOGGLE
// ================================================================
const app = document.getElementById('app');
const toggleBtn = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('sidebar-overlay');

function isMobile() {
    return window.innerWidth <= 992;
}

function openSidebar() {
    if (!isMobile()) return;
    app.classList.remove('sidebar-hidden');
    if (overlay) overlay.classList.add('active');
    toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
}

function closeSidebarOnMobile() {
    if (!isMobile()) return;
    app.classList.add('sidebar-hidden');
    if (overlay) overlay.classList.remove('active');
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
}

function toggleSidebar() {
    if (!isMobile()) {
        app.classList.toggle('sidebar-collapsed');
        app.classList.remove('sidebar-hidden');
        if (overlay) overlay.classList.remove('active');
        return;
    }
    const isHidden = app.classList.contains('sidebar-hidden');
    if (isHidden) {
        openSidebar();
    } else {
        closeSidebarOnMobile();
    }
}

toggleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleSidebar();
});

if (overlay) {
    overlay.addEventListener('click', function() {
        if (isMobile() && !app.classList.contains('sidebar-hidden')) {
            closeSidebarOnMobile();
        }
    });
}

document.addEventListener('click', function(e) {
    if (!isMobile()) return;
    if (toggleBtn.contains(e.target)) return;
    if (sidebar && sidebar.contains(e.target)) return;
    if (overlay && overlay.contains(e.target)) return;
    if (!app.classList.contains('sidebar-hidden')) {
        closeSidebarOnMobile();
    }
});

// Khởi tạo trạng thái ban đầu
(function initSidebarState() {
    if (isMobile()) {
        app.classList.add('sidebar-hidden');
        if (overlay) overlay.classList.remove('active');
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.style.display = 'block';
    } else {
        app.classList.remove('sidebar-hidden');
        if (overlay) overlay.classList.remove('active');
        toggleBtn.style.display = 'none';
    }
})();

window.closeSidebarOnMobile = closeSidebarOnMobile;
window.openSidebar = openSidebar;
window.toggleSidebar = toggleSidebar;

// ================================================================
// ẨN MENU ADMIN (kiểm tra hàm getUser tồn tại)
// ================================================================
window.updateMenuVisibility = function() {
    if (typeof getUser !== 'function') return;
    const user = getUser();
    if (!user) return;
    const adminMenuItem = document.querySelector('#menu > li[data-page="admin"]');
    if (adminMenuItem) {
        const hasAdminPerm = typeof hasPermission === 'function' && hasPermission('admin.view');
        adminMenuItem.style.display = (user.role === 'ADMIN' || hasAdminPerm) ? 'flex' : 'none';
    }
};


function ensurePageAndActivate(pageId, renderFn, moduleName) {
    let page = document.getElementById(pageId);
    if (!page) {
        const content = document.querySelector('.content');
        if (!content) return;
        page = document.createElement('div');
        page.className = 'page';
        page.id = pageId;
        content.appendChild(page);
    }
    // Ẩn tất cả các page khác
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');
    // Gọi render
    if (typeof renderFn === 'function') {
        try {
            renderFn();
        } catch (e) {
            console.error(`Lỗi render ${moduleName}:`, e);
            showError(`Lỗi tải module ${moduleName}`);
        }
    }
}

// Gọi ngay nếu đã login
if (typeof getUser === 'function' && getUser() && typeof hasPermission === 'function') {
    window.updateMenuVisibility();
}

console.log('✅ App module loaded successfully (safe render added).');

