// ================================================================
// AUTO REORDER - Đặt hàng tự động (dùng API backend)
// ================================================================

// ====== HÀM RENDER PAGE ======
async function renderAutoReorderPage() {
    console.log('🔄 renderAutoReorderPage được gọi');

    // Kiểm tra quyền xem
    if (!hasPermission('po.view') && !hasPermission('admin.view')) {
        let page = document.getElementById('page-auto-reorder');
        if (!page) {
            const content = document.querySelector('.content');
            if (content) {
                page = document.createElement('div');
                page.className = 'page';
                page.id = 'page-auto-reorder';
                const container = document.createElement('div');
                container.id = 'auto-reorder-container';
                page.appendChild(container);
                content.appendChild(page);
            }
        }
        if (page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            page.classList.add('active');
            document.getElementById('auto-reorder-container').innerHTML = `
                <div style="padding:20px; text-align:center; color:#e74c3c;">
                    <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                    Bạn không có quyền xem đặt hàng tự động
                </div>
            `;
        }
        return;
    }

    let page = document.getElementById('page-auto-reorder');
    if (!page) {
        const content = document.querySelector('.content');
        if (!content) { console.error('❌ Không tìm thấy .content'); return; }
        page = document.createElement('div');
        page.className = 'page';
        page.id = 'page-auto-reorder';
        const container = document.createElement('div');
        container.id = 'auto-reorder-container';
        page.appendChild(container);
        content.appendChild(page);
    } else {
        if (!document.getElementById('auto-reorder-container')) {
            const container = document.createElement('div');
            container.id = 'auto-reorder-container';
            page.appendChild(container);
        }
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');

    await renderAutoReorderConfig();
}

// ====== RENDER UI ======
async function renderAutoReorderConfig() {
    const container = document.getElementById('auto-reorder-container');
    if (!container) return;

    // Kiểm tra quyền view
    if (!hasPermission('po.view') && !hasPermission('admin.view')) {
        container.innerHTML = `
            <div style="padding:20px; text-align:center; color:#e74c3c;">
                <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                Bạn không có quyền xem đặt hàng tự động
            </div>
        `;
        return;
    }

    try {
        const canEdit = hasPermission('po.create') || hasPermission('admin.view');

        // Lấy config, vendors, PRs từ API
        const [config, vendors, prs] = await Promise.all([
            api.getAutoReorderConfig(),
            api.getVendors(),
            api.getPRs()
        ]);
        window._autoReorderConfig = config;

        const vendorOpts = vendors.map(v =>
            `<option value="${v.code}" ${v.code === config.defaultVendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`
        ).join('');

        // Lấy danh sách PR tự động
        const autoPRs = (Array.isArray(prs) ? prs : []).filter(pr => pr.note && String(pr.note).includes('Auto Reorder')).slice(0, 10);
        let prHtml = '';
        if (autoPRs.length) {
            prHtml = `<div class="table-responsive"><table><thead><tr><th>Mã PR</th><th>Dự án</th><th>Vật tư (SL)</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>
                ${autoPRs.map(pr => `
                    <tr>
                        <td style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewPR(${pr.id})">${pr.code}</td>
                        <td>${pr.projectName || ''}</td>
                        <td>${pr.items ? safeJsonParse(pr.items).map(it => getItemName(it.itemId)).join(', ') : ''}</td>
                        <td>${getStatusBadge(pr.status)}</td>
                        <td>${pr.createdAt || ''}</td>
                    </tr>
                `).join('')}
            </tbody></table></div>`;
        } else {
            prHtml = '<p style="color:#999;">Chưa có đơn hàng tự động nào được tạo.</p>';
        }

        const enabled = !!(config && config.enabled);
        const multiplier = (config && config.multiplier) || 2;
        const defaultVendorCode = (config && config.defaultVendorCode) || '';

        let html = `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
            <h2 style="margin:0;">⚙️ Đặt hàng tự động (Auto Reorder)</h2>
            <button class="btn btn-success" onclick="exportAutoReorderHistory()"><i class="fas fa-file-excel"></i> Xuất Excel</button>
        </div>
        <div style="margin-bottom:16px; background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0;">
            <p style="margin:0;"><i class="fas fa-info-circle" style="color:#1a3c6e;"></i> Khi bật, hệ thống sẽ tự động tạo PR cho vật tư có tồn kho dưới ngưỡng (đã cấu hình trong Cảnh báo tồn).</p>
        </div>
        <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
            <div class="form-group" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <label style="font-weight:600; margin:0;">Trạng thái:</label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox" id="f-auto-reorder-enabled" ${enabled ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                    ${enabled ? '🟢 Đã bật' : '🔴 Đã tắt'}
                </label>
            </div>
            <div class="form-group">
                <label>Hệ số nhân số lượng đặt:</label>
                <input type="number" id="f-auto-reorder-multiplier" value="${multiplier}" min="1" step="0.5" style="width:120px; padding:8px; border:1px solid #ccc; border-radius:4px;" ${!canEdit ? 'readonly' : ''}>
                <span style="font-size:13px; color:#888; margin-left:8px;">(ngưỡng × hệ số)</span>
            </div>
            <div class="form-group">
                <label>Nhà cung cấp mặc định:</label>
                <select id="f-auto-reorder-vendor" style="padding:8px; border:1px solid #ccc; border-radius:4px; width:100%; max-width:300px;" ${!canEdit ? 'disabled' : ''}>
                    <option value="">-- Chọn --</option>
                    ${vendorOpts}
                </select>
            </div>
            <div class="form-group" style="display:flex; gap:8px; flex-wrap:wrap;">
                ${canEdit ? `
                    <button class="btn" onclick="saveAutoReorderConfig()"><i class="fas fa-save"></i> Lưu cấu hình</button>
                    <button class="btn btn-success" onclick="runAutoReorder()"><i class="fas fa-play"></i> Kiểm tra & tạo đơn ngay</button>
                    <button class="btn btn-info" onclick="showAutoReorderRules()"><i class="fas fa-list"></i> Quản lý quy tắc (nâng cao)</button>
                ` : `
                    <span style="color:#999; font-size:14px; padding:8px 0;">
                        <i class="fas fa-lock"></i> Bạn không có quyền chỉnh sửa cấu hình
                    </span>
                `}
            </div>
        </div>
        <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin-top:0;">📦 Đơn hàng tự động gần đây</h3>
            ${prHtml}
        </div>
    `;
        container.innerHTML = html;

        // Sự kiện thay đổi checkbox
        const checkbox = document.getElementById('f-auto-reorder-enabled');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const label = this.parentElement;
                label.innerHTML = this.checked ? '🟢 Đã bật' : '🔴 Đã tắt';
            });
        }
    } catch (error) {
        console.error('renderAutoReorderConfig error:', error);
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#e74c3c;">
            <i class="fas fa-exclamation-triangle"></i> Lỗi tải dữ liệu đặt hàng tự động: ${error.message}
        </div>`;
    }
}

function safeJsonParse(str) {
    try { return (typeof str === 'string') ? JSON.parse(str) : (str || []); } catch(e) { return []; }
}

// ====== LƯU CẤU HÌNH ======
async function saveAutoReorderConfig() {
    if (!hasPermission('po.create') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền cập nhật cấu hình đặt hàng tự động!');
        return;
    }

    const enabled = document.getElementById('f-auto-reorder-enabled').checked;
    const multiplier = parseFloat(document.getElementById('f-auto-reorder-multiplier').value) || 2;
    const defaultVendor = document.getElementById('f-auto-reorder-vendor').value;
    if (multiplier < 1) { showError('Hệ số nhân phải >= 1'); return; }

    const config = {
        enabled,
        multiplier,
        defaultVendorCode: defaultVendor
    };

    try {
        await api.updateAutoReorderConfig(config);
        saveData('auto_reorder_config', { enabled, multiplier, defaultVendorCode: defaultVendor });
        showSuccess('Đã lưu cấu hình!');
        await renderAutoReorderConfig();
    } catch (error) {
        console.warn('updateAutoReorderConfig fallback:', error);
        saveData('auto_reorder_config', { enabled, multiplier, defaultVendorCode: defaultVendor });
        showSuccess('Đã lưu cấu hình (local)!');
        await renderAutoReorderConfig();
    }
}

// ====== CHẠY KIỂM TRA VÀ TẠO ĐƠN ======
async function runAutoReorder() {
    if (!hasPermission('po.create') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền thực hiện đặt hàng tự động!');
        return;
    }

    withLoading(async () => {
        const created = await checkAndCreateAutoOrders();
        if (created.length === 0) {
            showInfo('Không có vật tư nào cần đặt hàng.');
        } else {
            showSuccess(`Đã tạo ${created.length} đơn hàng tự động!`);
            renderAutoReorderConfig();
        }
    }, 'Đang kiểm tra và tạo đơn hàng...');
}

// ====== QUẢN LÝ QUY TẮC (NÂNG CAO) ======
async function showAutoReorderRules() {
    if (!hasPermission('po.create') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền quản lý quy tắc đặt hàng tự động!');
        return;
    }

    let rules = [];
    try {
        rules = await api.getAutoReorderRules();
        saveData('auto_reorder_rules', rules);
    } catch (error) {
        console.warn('getAutoReorderRules fallback:', error);
        rules = getData('auto_reorder_rules') || [];
    }

    const items = window._itemsCache || (await api.getItems());
    const warehouses = window._warehousesCache || (await api.getWarehouses());

    let html = `
        <div style="margin-bottom:12px;">
            <h4>📋 Quy tắc đặt hàng tự động</h4>
            <p style="font-size:13px; color:#888;">Cấu hình ngưỡng và số lượng đặt cho từng vật tư.</p>
        </div>
        <div style="max-height:400px; overflow-y:auto;">
            ${rules.length === 0 ? '<p style="color:#999;">Chưa có quy tắc nào. Sử dụng ngưỡng từ Cảnh báo tồn.</p>' : ''}
            ${rules.map(r => {
                const item = items.find(i => i.id === (r.itemId || r.item_id));
                const wh = r.warehouseId ? warehouses.find(w => w.id === r.warehouseId) : null;
                return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f0f0f0;">
                    <div>
                        <span style="font-weight:500;">${item ? item.name : (r.itemName || 'N/A')}</span>
                        <span style="font-size:13px; color:#888;"> (${item ? item.code : 'N/A'})</span>
                        <div style="font-size:13px; color:#555;">
                            Ngưỡng: <strong>${r.minStock}</strong> | SL đặt: <strong>${r.reorderQuantity}</strong>
                            ${wh ? `| Kho: ${wh.code}` : '| Toàn hệ thống'}
                        </div>
                    </div>
                    <div>
                        <span class="badge ${r.enabled !== false ? 'badge-approved' : 'badge-draft'}" style="font-size:11px;">${r.enabled !== false ? 'Bật' : 'Tắt'}</span>
                        <button class="btn btn-sm btn-danger" onclick="deleteAutoReorderRule('${r.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            }).join('')}
        </div>
        <div style="margin-top:12px;">
            <button class="btn" onclick="showAddAutoReorderRule()"><i class="fas fa-plus"></i> Thêm quy tắc</button>
        </div>
    `;
    showModal('Quản lý quy tắc Auto Reorder', html);
}

// ====== LẤY QUY TẮC ======
function getAutoReorderRules() {
    return Array.isArray(getData('auto_reorder_rules')) ? getData('auto_reorder_rules') : [];
}

function saveAutoReorderRules(data) {
    saveData('auto_reorder_rules', data);
}

// ====== THÊM QUY TẮC ======
async function showAddAutoReorderRule() {
    if (!hasPermission('po.create') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền thêm quy tắc!');
        return;
    }

    const items = window._itemsCache || (await api.getItems());
    const warehouses = window._warehousesCache || (await api.getWarehouses());
    const vendors = await api.getVendors();

    const itemOpts = items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('');
    const whOpts = warehouses.map(w => `<option value="${w.id}">${w.code} - ${w.name}</option>`).join('');
    const vendorOpts = vendors.map(v => `<option value="${v.code}">${v.code} - ${v.name}</option>`).join('');

    showModal('Thêm quy tắc đặt hàng tự động', `
        <div class="form-group">
            <label>Vật tư</label>
            <select id="f-ar-rule-item">${itemOpts}</select>
        </div>
        <div class="form-group">
            <label>Kho áp dụng (để trống nếu áp dụng toàn hệ thống)</label>
            <select id="f-ar-rule-warehouse"><option value="">-- Toàn hệ thống --</option>${whOpts}</select>
        </div>
        <div class="form-group">
            <label>Ngưỡng tồn kho (khi nào cần đặt)</label>
            <input id="f-ar-rule-minstock" type="number" value="10" min="0" step="1">
        </div>
        <div class="form-group">
            <label>Số lượng đặt hàng mỗi lần</label>
            <input id="f-ar-rule-reorderqty" type="number" value="20" min="1" step="1">
        </div>
        <div class="form-group">
            <label>Nhà cung cấp ưu tiên</label>
            <select id="f-ar-rule-vendor"><option value="">-- Chọn --</option>${vendorOpts}</select>
        </div>
        <div class="form-group">
            <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="f-ar-rule-enabled" checked> Bật quy tắc
            </label>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveAutoReorderRule()">Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveAutoReorderRule() {
    if (!hasPermission('po.create') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền thêm quy tắc!');
        return;
    }

    const itemId = parseInt(document.getElementById('f-ar-rule-item').value);
    const warehouseId = parseInt(document.getElementById('f-ar-rule-warehouse').value) || null;
    const minStock = parseFloat(document.getElementById('f-ar-rule-minstock').value) || 0;
    const reorderQuantity = parseFloat(document.getElementById('f-ar-rule-reorderqty').value) || 0;
    const vendorId = document.getElementById('f-ar-rule-vendor').value || null;
    const enabled = document.getElementById('f-ar-rule-enabled').checked;

    if (!itemId) { showError('Vui lòng chọn vật tư'); return; }
    if (minStock < 0) { showError('Ngưỡng tồn kho không được âm'); return; }
    if (reorderQuantity <= 0) { showError('Số lượng đặt hàng phải > 0'); return; }

    const items = window._itemsCache || [];
    const item = items.find(i => i.id === itemId);
    const newRule = {
        id: 'ar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        itemId,
        itemName: item ? item.name : '',
        unit: item ? item.unit : 'Cái',
        warehouseId,
        minStock,
        reorderQuantity,
        vendorId,
        orderType: 'PR',
        enabled,
        notes: '',
        createdAt: new Date().toISOString()
    };
    try {
        await api.createAutoReorderRule(newRule);
    } catch (error) {
        console.warn('createAutoReorderRule fallback:', error);
    }
    let rules = getData('auto_reorder_rules') || [];
    rules.push(newRule);
    saveData('auto_reorder_rules', rules);
    closeModal();
    await showAutoReorderRules();
    showSuccess('Thêm quy tắc thành công!');
}

async function deleteAutoReorderRule(id) {
    if (!hasPermission('po.create') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền xóa quy tắc!');
        return;
    }
    if (!confirm('Xóa quy tắc này?')) return;
    try {
        await api.deleteAutoReorderRule(id);
    } catch (error) {
        console.warn('deleteAutoReorderRule fallback:', error);
    }
    let rules = getData('auto_reorder_rules') || [];
    rules = rules.filter(r => r.id !== id);
    saveData('auto_reorder_rules', rules);
    await showAutoReorderRules();
    showSuccess('Đã xóa quy tắc.');
}

// ====== THÊM MENU ======
function addAutoReorderMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    if (document.querySelector('#menu > li[data-page="auto-reorder"]')) return;
    const li = document.createElement('li');
    li.dataset.page = 'auto-reorder';
    li.innerHTML = '<i class="fas fa-robot"></i><span>Đặt hàng tự động</span>';
    li.addEventListener('click', function(e) {
        document.querySelectorAll('#menu > li').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        renderAutoReorderPage();
        if (typeof closeSidebarOnMobile === 'function') closeSidebarOnMobile();
    });
    const minStockItem = document.querySelector('#menu > li[data-page="min-stock"]');
    if (minStockItem) minStockItem.parentNode.insertBefore(li, minStockItem.nextSibling);
    else menu.appendChild(li);
    console.log('✅ Menu Đặt hàng tự động đã được thêm.');
}

// ====== KHỞI TẠO ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM ready, thêm menu Đặt hàng tự động...');
    setTimeout(addAutoReorderMenu, 300);
});

// ====== HÀM KIỂM TRA VÀ TẠO ĐƠN (GỌI API BACKEND NẾU CÓ) ======
async function checkAndCreateAutoOrders() {
    try {
        const result = await api.checkAutoReorder();
        return result || [];
    } catch (e) {
        console.warn('Không thể gọi API checkAutoReorder, fallback về []');
        return [];
    }
}

// ====== EXPORT GLOBAL ======
window.renderAutoReorderPage = renderAutoReorderPage;
window.renderAutoReorderConfig = renderAutoReorderConfig;
window.saveAutoReorderConfig = saveAutoReorderConfig;
window.runAutoReorder = runAutoReorder;
window.showAutoReorderRules = showAutoReorderRules;
window.showAddAutoReorderRule = showAddAutoReorderRule;
window.saveAutoReorderRule = saveAutoReorderRule;
window.deleteAutoReorderRule = deleteAutoReorderRule;
window.getAutoReorderRules = getAutoReorderRules;
window.checkAndCreateAutoOrders = checkAndCreateAutoOrders;

console.log('✅ Auto Reorder module updated with full permission checks.');