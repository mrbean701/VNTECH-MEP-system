// ================================================================
// MIN STOCK ALERT - Cảnh báo tồn kho tối thiểu
// ================================================================

async function renderMinStockPage() {
    console.log('🔄 renderMinStockPage được gọi');

    // Đảm bảo dữ liệu mẫu luôn có nếu localStorage trống
    if (typeof initData === 'function') initData();

    let page = document.getElementById('page-min-stock');
    if (!page) {
        const content = document.querySelector('.content');
        if (!content) { console.error('❌ Không tìm thấy .content'); return; }
        page = document.createElement('div');
        page.className = 'page';
        page.id = 'page-min-stock';
        const container = document.createElement('div');
        container.id = 'min-stock-container';
        page.appendChild(container);
        content.appendChild(page);
    } else {
        if (!document.getElementById('min-stock-container')) {
            const container = document.createElement('div');
            container.id = 'min-stock-container';
            page.appendChild(container);
        }
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');

    // Nạp dữ liệu từ API (nếu backend chạy) hoặc localStorage (fallback)
    try { await api.getWarehouses(); } catch(e) {}
    try { await api.getInventory(); } catch(e) {}
    try { await api.getItems(); } catch(e) {}

    renderMinStockList();
}

function renderMinStockList() {
    const container = document.getElementById('min-stock-container');
    if (!container) return;

    const warehouses = getWarehouses();
    const selectedWh = parseInt(document.getElementById('min-stock-wh-filter')?.value) || 0;
    const statusFilter = document.getElementById('min-stock-status-filter')?.value || 'all';

    let html = `
        <div class="page-header">
            <h2>📊 Cảnh báo tồn kho tối thiểu</h2>
            <div>
                <button class="btn btn-success" onclick="exportMinStock()"><i class="fas fa-file-excel"></i> Xuất Excel</button>
            </div>
        </div>
        <div class="filter-bar">
            <select id="min-stock-wh-filter" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <option value="0">-- Tất cả kho --</option>
                ${warehouses.map(w => `<option value="${w.id}" ${selectedWh === w.id ? 'selected' : ''}>${w.code} - ${w.name}</option>`).join('')}
            </select>
            <select id="min-stock-status-filter" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Tất cả</option>
                <option value="under" ${statusFilter === 'under' ? 'selected' : ''}>⚠️ Dưới ngưỡng</option>
                <option value="warning" ${statusFilter === 'warning' ? 'selected' : ''}>⚡ Gần ngưỡng</option>
                <option value="safe" ${statusFilter === 'safe' ? 'selected' : ''}>✅ An toàn</option>
            </select>
            <button class="btn btn-sm" onclick="renderMinStockList()"><i class="fas fa-search"></i></button>
        </div>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Kho</th>
                        <th>Mã vật tư</th>
                        <th>Tên vật tư</th>
                        <th>ĐVT</th>
                        <th>Tồn kho</th>
                        <th>Ngưỡng</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let hasData = false;
    const warehousesToShow = selectedWh === 0 ? warehouses : warehouses.filter(w => w.id === selectedWh);

    warehousesToShow.forEach(wh => {
        const items = getItemsByMinStockStatus(wh.id, statusFilter);
        items.forEach(item => {
            hasData = true;
            const statusText = item.status === 'under' ? '⚠️ Dưới ngưỡng' : (item.status === 'warning' ? '⚡ Gần ngưỡng' : '✅ An toàn');
            const statusColor = item.status === 'under' ? '#dc3545' : (item.status === 'warning' ? '#f39c12' : '#28a745');
            html += `
                <tr>
                    <td><strong>${wh.code}</strong></td>
                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewItem(${item.id})">${item.code}</td>
                    <td style="cursor:pointer; color:#1a3c6e;" onclick="viewItem(${item.id})">${item.name}</td>
                    <td>${item.unit || '--'}</td>
                    <td><strong>${item.currentQty}</strong></td>
                    <td>
                        <input type="number" class="min-stock-input" data-warehouse="${wh.id}" data-item="${item.id}" value="${item.minQty}" style="width:80px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0" step="1">
                    </td>
                    <td><span style="color:${statusColor}; font-weight:600;">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="saveMinStockItem(${wh.id}, ${item.id})"><i class="fas fa-save"></i> Lưu</button>
                    </td>
                </tr>
            `;
        });
    });

    if (!hasData) {
        html += `<tr><td colspan="8" style="text-align:center; color:#999;">Không có dữ liệu hoặc không có vật tư nào ở trạng thái này</td></tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px; font-size:13px; color:#888; padding:8px 0;">
            <i class="fas fa-info-circle"></i> 
            <strong>Chú thích:</strong> 
            <span style="margin-left:12px;">🔴 Dưới ngưỡng (cần đặt hàng)</span>
            <span style="margin-left:12px;">🟡 Gần ngưỡng (sắp hết)</span>
            <span style="margin-left:12px;">🟢 An toàn (đủ dùng)</span>
        </div>
    `;
    container.innerHTML = html;

    document.getElementById('min-stock-wh-filter')?.addEventListener('change', renderMinStockList);
    document.getElementById('min-stock-status-filter')?.addEventListener('change', renderMinStockList);
}

// ====== LẤY DỮ LIỆU THEO TRẠNG THÁI ======
function getItemsByMinStockStatus(warehouseId, status) {
    const inventory = getInventory();
    const items = getItems();
    const minStock = getMinStock();

    let result = [];
    inventory.filter(inv => inv.warehouse_id === warehouseId || inv.warehouseId === warehouseId).forEach(inv => {
        const item = items.find(i => i.id === inv.item_id);
        if (!item) return;
        const min = minStock.find(m => m.warehouseId === warehouseId && m.itemId === inv.item_id);
        const minQty = min ? min.minQuantity : 0;
        const currentQty = inv.quantity || 0;
        let itemStatus = 'safe';
        if (currentQty < minQty) itemStatus = 'under';
        else if (currentQty < minQty * 1.2) itemStatus = 'warning';

        if (status === 'all' || status === itemStatus) {
            result.push({
                id: item.id,
                code: item.code,
                name: item.name,
                unit: item.unit,
                currentQty,
                minQty,
                status: itemStatus
            });
        }
    });
    return result;
}

// ====== LƯU NGƯỠNG ======
function saveMinStockItem(warehouseId, itemId) {
    const input = document.querySelector(`.min-stock-input[data-warehouse="${warehouseId}"][data-item="${itemId}"]`);
    if (!input) { showError('Không tìm thấy ô nhập!'); return; }
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        showError('Vui lòng nhập số hợp lệ (>= 0)');
        input.focus();
        return;
    }
    
    let minStock = getMinStock();
    const existing = minStock.find(m => m.warehouseId === warehouseId && m.itemId === itemId);
    if (existing) {
        existing.minQuantity = value;
    } else {
        minStock.push({ warehouseId, itemId, minQuantity: value });
    }
    saveData('min_stock', minStock);
    renderMinStockList();
    const item = getItems().find(i => i.id === itemId);
    showSuccess(`Đã cập nhật ngưỡng cho ${item ? item.name : itemId} tại kho ${getWarehouseCode(warehouseId)}`);
}

// ====== XUẤT EXCEL ======
function exportMinStock() {
    const warehouses = getWarehouses();
    const data = [];
    warehouses.forEach(wh => {
        const items = getItemsByMinStockStatus(wh.id, 'all');
        items.forEach(item => {
            data.push({
                'Kho': wh.code,
                'Tên kho': wh.name,
                'Mã vật tư': item.code,
                'Tên vật tư': item.name,
                'ĐVT': item.unit || '',
                'Tồn kho': item.currentQty,
                'Ngưỡng': item.minQty,
                'Trạng thái': item.status === 'under' ? 'Dưới ngưỡng' : (item.status === 'warning' ? 'Gần ngưỡng' : 'An toàn')
            });
        });
    });
    if (!data.length) { showWarning('Không có dữ liệu cảnh báo tồn kho để xuất!'); return; }
    exportToExcel(data, 'Canh_bao_ton_kho_toi_thieu', Object.keys(data[0]));
}

// ====== THÊM MENU ======
function addMinStockMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    if (document.querySelector('#menu > li[data-page="min-stock"]')) return;
    const li = document.createElement('li');
    li.dataset.page = 'min-stock';
    li.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Cảnh báo tồn</span>';
    li.addEventListener('click', function(e) {
        document.querySelectorAll('#menu > li').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        renderMinStockPage();
        if (typeof closeSidebarOnMobile === 'function') closeSidebarOnMobile();
    });
    const inventoryItem = document.querySelector('#menu > li[data-page="inventory"]');
    if (inventoryItem) inventoryItem.parentNode.insertBefore(li, inventoryItem.nextSibling);
    else menu.appendChild(li);
    console.log('✅ Menu Cảnh báo tồn đã được thêm.');
}

// ====== KHỞI TẠO ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM ready, thêm menu Cảnh báo tồn...');
    setTimeout(addMinStockMenu, 300);
});

// ====== EXPORT GLOBAL ======
window.renderMinStockPage = renderMinStockPage;
window.renderMinStockList = renderMinStockList;
window.saveMinStockItem = saveMinStockItem;
window.exportMinStock = exportMinStock;
window.getItemsByMinStockStatus = getItemsByMinStockStatus;

console.log('✅ Min Stock module loaded successfully.');