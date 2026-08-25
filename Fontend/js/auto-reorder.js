// ================================================================
// AUTO REORDER - Đặt hàng tự động (Tổng hợp UI + Logic)
// ================================================================

// ====== HÀM RENDER PAGE ======
function renderAutoReorderPage() {
    console.log('🔄 renderAutoReorderPage được gọi');
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
    renderAutoReorderConfig();
}

// ====== RENDER UI ======
function renderAutoReorderConfig() {
    const container = document.getElementById('auto-reorder-container');
    if (!container) return;
    const config = getAutoReorderConfig();
    const vendors = getVendors();
    const vendorOpts = vendors.map(v =>
        `<option value="${v.code}" ${v.code === config.defaultVendor ? 'selected' : ''}>${v.code} - ${v.name}</option>`
    ).join('');

    // Lấy danh sách PR tự động
    const prs = getPRs();
    const autoPRs = prs.filter(pr => pr.note && pr.note.includes('Auto Reorder')).slice(0, 10);
    let prHtml = '';
    if (autoPRs.length) {
        prHtml = `<div class="table-responsive"><table><thead><tr><th>Mã PR</th><th>Dự án</th><th>Vật tư</th><th>Số lượng</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>
            ${autoPRs.map(pr => `
                <tr>
                    <td style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewPR(${pr.id})">${pr.code}</td>
                    <td>${pr.projectName || ''}</td>
                    <td>${pr.items.map(it => getItemName(it.itemId)).join(', ')}</td>
                    <td>${pr.items.reduce((sum, it) => sum + it.quantity, 0)}</td>
                    <td>${getStatusBadge(pr.status)}</td>
                    <td>${pr.createdAt || ''}</td>
                </tr>
            `).join('')}
        </tbody></table></div>`;
    } else {
        prHtml = '<p style="color:#999;">Chưa có đơn hàng tự động nào được tạo.</p>';
    }

    let html = `
        <div class="page-header"><h2>⚙️ Đặt hàng tự động (Auto Reorder)</h2></div>
        <div style="margin-bottom:16px; background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0;">
            <p style="margin:0;"><i class="fas fa-info-circle" style="color:#1a3c6e;"></i> Khi bật, hệ thống sẽ tự động tạo PR cho vật tư có tồn kho dưới ngưỡng (đã cấu hình trong Cảnh báo tồn).</p>
        </div>
        <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
            <div class="form-group" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <label style="font-weight:600; margin:0;">Trạng thái:</label>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox" id="f-auto-reorder-enabled" ${config.enabled ? 'checked' : ''}>
                    ${config.enabled ? '🟢 Đã bật' : '🔴 Đã tắt'}
                </label>
            </div>
            <div class="form-group">
                <label>Hệ số nhân số lượng đặt:</label>
                <input type="number" id="f-auto-reorder-multiplier" value="${config.multiplier || 2}" min="1" step="0.5" style="width:120px; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <span style="font-size:13px; color:#888; margin-left:8px;">(ngưỡng × hệ số)</span>
            </div>
            <div class="form-group">
                <label>Nhà cung cấp mặc định:</label>
                <select id="f-auto-reorder-vendor" style="padding:8px; border:1px solid #ccc; border-radius:4px; width:100%; max-width:300px;">
                    <option value="">-- Chọn --</option>
                    ${vendorOpts}
                </select>
            </div>
            <div class="form-group" style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn" onclick="saveAutoReorderConfig()"><i class="fas fa-save"></i> Lưu cấu hình</button>
                <button class="btn btn-success" onclick="runAutoReorder()"><i class="fas fa-play"></i> Kiểm tra & tạo đơn ngay</button>
                <button class="btn btn-info" onclick="showAutoReorderRules()"><i class="fas fa-list"></i> Quản lý quy tắc (nâng cao)</button>
            </div>
        </div>
        <div style="background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
            <h3 style="margin-top:0;">📦 Đơn hàng tự động gần đây</h3>
            ${prHtml}
        </div>
    `;
    container.innerHTML = html;

    // Gắn sự kiện cho checkbox
    document.getElementById('f-auto-reorder-enabled')?.addEventListener('change', function() {
        const label = this.parentElement;
        label.innerHTML = this.checked ? '🟢 Đã bật' : '🔴 Đã tắt';
    });
}

// ====== LƯU CẤU HÌNH ======
function saveAutoReorderConfig() {
    const enabled = document.getElementById('f-auto-reorder-enabled').checked;
    const multiplier = parseFloat(document.getElementById('f-auto-reorder-multiplier').value) || 2;
    const defaultVendor = document.getElementById('f-auto-reorder-vendor').value;
    if (multiplier < 1) { showError('Hệ số nhân phải >= 1'); return; }
    saveAutoReorderConfig({ enabled, multiplier, defaultVendor });
    showSuccess('Đã lưu cấu hình!');
    renderAutoReorderConfig();
}

// ====== CHẠY KIỂM TRA VÀ TẠO ĐƠN ======
function runAutoReorder() {
    withLoading(async () => {
        const created = checkAndCreateAutoOrders();
        if (created.length === 0) {
            showInfo('Không có vật tư nào cần đặt hàng.');
        } else {
            showSuccess(`Đã tạo ${created.length} đơn hàng tự động!`);
            renderAutoReorderConfig();
        }
    }, 'Đang kiểm tra và tạo đơn hàng...');
}

// ====== QUẢN LÝ QUY TẮC (NÂNG CAO) ======
function showAutoReorderRules() {
    const rules = getAutoReorderRules();
    let html = `
        <div style="margin-bottom:12px;">
            <h4>📋 Quy tắc đặt hàng tự động</h4>
            <p style="font-size:13px; color:#888;">Cấu hình ngưỡng và số lượng đặt cho từng vật tư.</p>
        </div>
        <div style="max-height:400px; overflow-y:auto;">
            ${rules.length === 0 ? '<p style="color:#999;">Chưa có quy tắc nào. Sử dụng ngưỡng từ Cảnh báo tồn.</p>' : ''}
            ${rules.map(r => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f0f0f0;">
                    <div>
                        <span style="font-weight:500;">${getItemName(r.itemId) || r.itemName}</span>
                        <span style="font-size:13px; color:#888;"> (${getItemCode(r.itemId) || 'N/A'})</span>
                        <div style="font-size:13px; color:#555;">
                            Ngưỡng: <strong>${r.minStock}</strong> | SL đặt: <strong>${r.reorderQuantity}</strong>
                            ${r.warehouseId ? `| Kho: ${getWarehouseCode(r.warehouseId)}` : '| Toàn hệ thống'}
                        </div>
                    </div>
                    <div>
                        <span class="badge ${r.enabled !== false ? 'badge-approved' : 'badge-draft'}" style="font-size:11px;">${r.enabled !== false ? 'Bật' : 'Tắt'}</span>
                        <button class="btn btn-sm btn-warning" onclick="editAutoReorderRule('${r.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAutoReorderRule('${r.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="margin-top:12px;">
            <button class="btn" onclick="showAddAutoReorderRule()"><i class="fas fa-plus"></i> Thêm quy tắc</button>
        </div>
    `;
    showModal('Quản lý quy tắc Auto Reorder', html);
}

// ====== LẤY QUY TẮC ======
function getAutoReorderRules() {
    return getData('auto-reorder-rules') || [];
}

function saveAutoReorderRules(data) {
    saveData('auto-reorder-rules', data);
}

// ====== THÊM QUY TẮC ======
function showAddAutoReorderRule() {
    const items = getItems();
    const warehouses = getWarehouses();
    const vendors = getVendors();

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

function saveAutoReorderRule() {
    const itemId = parseInt(document.getElementById('f-ar-rule-item').value);
    const warehouseId = parseInt(document.getElementById('f-ar-rule-warehouse').value) || null;
    const minStock = parseFloat(document.getElementById('f-ar-rule-minstock').value) || 0;
    const reorderQuantity = parseFloat(document.getElementById('f-ar-rule-reorderqty').value) || 0;
    const vendorId = document.getElementById('f-ar-rule-vendor').value || null;
    const enabled = document.getElementById('f-ar-rule-enabled').checked;

    if (!itemId) { showError('Vui lòng chọn vật tư'); return; }
    if (minStock < 0) { showError('Ngưỡng tồn kho không được âm'); return; }
    if (reorderQuantity <= 0) { showError('Số lượng đặt hàng phải > 0'); return; }

    let rules = getAutoReorderRules();
    const item = getItems().find(i => i.id === itemId);
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
    rules.push(newRule);
    saveAutoReorderRules(rules);
    closeModal();
    showAutoReorderRules();
    showSuccess('Thêm quy tắc thành công!');
}

function deleteAutoReorderRule(id) {
    if (!confirm('Xóa quy tắc này?')) return;
    let rules = getAutoReorderRules();
    rules = rules.filter(r => r.id !== id);
    saveAutoReorderRules(rules);
    showAutoReorderRules();
    showSuccess('Đã xóa quy tắc.');
}

// ====== THÊM MENU (đã có trong DOM) ======
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

console.log('✅ Auto Reorder module loaded successfully.');