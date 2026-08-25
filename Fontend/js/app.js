// ================================================================
// MENU
// ================================================================
document.querySelectorAll('#menu > li').forEach(li => {
    li.addEventListener('click', function(e) {
        document.querySelectorAll('#menu > li').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        const page = this.dataset.page;

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        switch (page) {
            case 'dashboard':
                document.getElementById('page-dashboard').classList.add('active');
                renderDashboard();
                break;
            case 'projects':
                document.getElementById('page-projects').classList.add('active');
                renderProjects();
                break;
            case 'vendors':
                document.getElementById('page-vendors').classList.add('active');
                renderVendors();
                break;
            case 'items':
                document.getElementById('page-items').classList.add('active');
                renderItems();
                break;
            case 'mr':
                document.getElementById('page-mr').classList.add('active');
                renderMR();
                break;
            case 'pr':
                document.getElementById('page-pr').classList.add('active');
                renderPR();
                break;
            case 'po':
                document.getElementById('page-po').classList.add('active');
                renderPO();
                break;
            case 'inventory':
                document.getElementById('page-inventory').classList.add('active');
                switchWarehouseTab('wh-list');
                break;
            case 'issue':
                if (typeof renderIssuePage === 'function') {
                    renderIssuePage();
                } else {
                    showError('Lỗi tải module Cấp phát, vui lòng tải lại trang.');
                }
                break;
            case 'material-return':
                if (typeof renderMaterialReturnPage === 'function') {
                    renderMaterialReturnPage();
                } else {
                    showError('Lỗi tải module Hoàn trả, vui lòng tải lại trang.');
                }
                break;
            case 'min-stock':
                if (typeof renderMinStockPage === 'function') {
                    renderMinStockPage();
                } else {
                    showError('Lỗi tải module Cảnh báo tồn, vui lòng tải lại trang.');
                }
                break;
            case 'auto-reorder':
                if (typeof renderAutoReorderPage === 'function') {
                    renderAutoReorderPage();
                } else {
                    showError('Lỗi tải module Đặt hàng tự động, vui lòng tải lại trang.');
                }
                break;
            case 'admin':
                if (typeof renderAdminPage === 'function') {
                    renderAdminPage();
                } else {
                    showError('Lỗi tải module Admin, vui lòng tải lại trang.');
                }
                break;
            default:
                console.warn('Trang không xác định:', page);
        }

        // Đóng sidebar trên mobile (nếu có hàm)
        if (typeof closeSidebarOnMobile === 'function') {
            closeSidebarOnMobile();
        }
    });
});

// Hàm chuyển tab trong module Kho
function switchWarehouseTab(tab) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-inventory').classList.add('active');
    renderWarehousePage(tab);
}

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
document.getElementById('project-filter')?.addEventListener('input', renderProjects);
document.getElementById('vendor-filter')?.addEventListener('input', renderVendors);
document.getElementById('item-filter')?.addEventListener('input', renderItems);
document.getElementById('mr-filter')?.addEventListener('input', renderMR);
document.getElementById('mr-status-filter')?.addEventListener('change', renderMR);
document.getElementById('pr-filter')?.addEventListener('input', renderPR);
document.getElementById('pr-status-filter')?.addEventListener('change', renderPR);
document.getElementById('po-filter')?.addEventListener('input', renderPO);
document.getElementById('po-status-filter')?.addEventListener('change', renderPO);

// app.js - chỉ định nghĩa renderAll, không gọi
function renderAll() {
    renderDashboard();
    renderProjects();
    renderVendors();
    renderItems();
    renderMR();
    renderPR();
    renderPO();
    // Các module khác sẽ render khi click menu
}

// ================================================================
// SIDEBAR TOGGLE - ĐƠN GIẢN (giữ nguyên)
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
// ẨN MENU ADMIN
// ================================================================
window.updateMenuVisibility = function() {
    const user = getUser();
    if (!user) return;
    const adminMenuItem = document.querySelector('#menu > li[data-page="admin"]');
    if (adminMenuItem) {
        adminMenuItem.style.display = (user.role === 'ADMIN' || hasPermission('admin.view')) ? 'flex' : 'none';
    }
};

// Gọi ngay nếu đã login
if (getUser() && typeof hasPermission === 'function') {
    window.updateMenuVisibility();
}

console.log('✅ App module loaded successfully.');