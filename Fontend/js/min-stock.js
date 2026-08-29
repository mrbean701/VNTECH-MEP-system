// ================================================================
// MIN STOCK ALERT - Cảnh báo tồn kho tối thiểu - ĐÃ TÍCH HỢP PHÂN QUYỀN
// (Sử dụng API backend với Promise.all)
// ================================================================
let minStockPageState = { page: 1, perPage: 10 };

// ====== RENDER PAGE ======
async function renderMinStockPage() {
    console.log('🔄 renderMinStockPage được gọi');

    // Kiểm tra quyền xem
    if (!hasPermission('inventory.view')) {
        let page = document.getElementById('page-min-stock');
        if (!page) {
            const content = document.querySelector('.content');
            if (content) {
                page = document.createElement('div');
                page.className = 'page';
                page.id = 'page-min-stock';
                const container = document.createElement('div');
                container.id = 'min-stock-container';
                page.appendChild(container);
                content.appendChild(page);
            }
        }
        if (page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            page.classList.add('active');
            document.getElementById('min-stock-container').innerHTML = `
                <div style="padding:20px; text-align:center; color:#e74c3c;">
                    <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                    Bạn không có quyền xem cảnh báo tồn kho
                </div>
            `;
        }
        return;
    }

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

    await renderMinStockList();
}

// ====== RENDER DANH SÁCH ======
async function renderMinStockList(page = null) {
    const container = document.getElementById('min-stock-container');
    if (!container) return;

    // Kiểm tra quyền view
    if (!hasPermission('inventory.view')) {
        container.innerHTML = `
            <div style="padding:20px; text-align:center; color:#e74c3c;">
                <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                Bạn không có quyền xem cảnh báo tồn kho
            </div>
        `;
        return;
    }

    window._minStockLoading = true;
    try {
        const [warehouses, inventory, items, minStock] = await Promise.all([
            api.getWarehouses(),
            api.getInventory(),
            api.getItems(),
            api.getMinStock()
        ]);

        // Lưu cache để dùng cho các hàm khác
        window._warehousesCache = warehouses;
        window._itemsCache = items;
        window._inventoryCache = inventory;
        window._minStockCache = minStock;
        if (typeof updateItemsCache === 'function') updateItemsCache(items);
        if (typeof fetchWarehouses === 'function') fetchWarehouses(warehouses);

        const canEdit = hasPermission('inventory.edit');
        const selectedWh = parseInt(document.getElementById('min-stock-wh-filter')?.value) || 0;
        const statusFilter = document.getElementById('min-stock-status-filter')?.value || 'all';

        // Lọc theo warehouse
        let warehousesToShow = selectedWh === 0 ? warehouses : warehouses.filter(w => w.id === selectedWh);

        // Tạo HTML
        let html = `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
            <h2 style="margin:0;">📊 Cảnh báo tồn kho tối thiểu</h2>
            <button class="btn btn-success" onclick="exportMinStock()"><i class="fas fa-file-excel"></i> Xuất Excel</button>
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
                        <th>% (an toàn)</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const rows = [];
        warehousesToShow.forEach(wh => {
            const invList = inventory.filter(inv => (inv.warehouseId || inv.warehouse_id) === wh.id);
            invList.forEach(inv => {
                const item = items.find(i => i.id === (inv.itemId || inv.item_id));
                if (!item) return;
                const min = minStock.find(m => m.warehouseId === wh.id && m.itemId === (inv.itemId || inv.item_id));
                const minQty = min ? (parseFloat(min.minQuantity) || 0) : 0;
                const safeQty = min && min.safeQuantity ? (parseFloat(min.safeQuantity) || 0) : Math.max(minQty * 5, minQty);
                const currentQty = inv.quantity || 0;
                const threshold = min && min.alertPercent ? (parseFloat(min.alertPercent) || 20) : 20;
                const thresholdQty = safeQty * (threshold / 100);
                let itemStatus = 'safe';
                if (currentQty <= 0 || (minQty > 0 && currentQty < minQty)) itemStatus = 'under';
                else if (thresholdQty > 0 && currentQty < thresholdQty) itemStatus = 'under';
                else if (currentQty < safeQty) itemStatus = 'warning';
                else itemStatus = 'safe';

                rows.push({
                    wh, item, minQty, safeQty, threshold, currentQty, status: itemStatus
                });
            });
        });

        // Lọc theo trạng thái
        const filteredRows = statusFilter === 'all' ? rows : rows.filter(r => r.status === statusFilter);

        // Phân trang
        if (page) minStockPageState.page = page;
        const perPage = getPageSize('minstock');
        minStockPageState.perPage = perPage;
        const paging = paginate(filteredRows, minStockPageState.page, perPage);

        if (!paging.items.length) {
            html += `<tr><td colspan="9" style="text-align:center; color:#999;">Không có dữ liệu hoặc không có vật tư nào ở trạng thái này</td></tr>`;
        }

        paging.items.forEach(r => {
            const { wh, item, minQty, safeQty, threshold, currentQty, status } = r;
            const statusText = status === 'under' ? '⚠️ Dưới ngưỡng' : (status === 'warning' ? '⚡ Gần ngưỡng' : '✅ An toàn');
            const statusColor = status === 'under' ? '#dc3545' : (status === 'warning' ? '#f39c12' : '#28a745');
            const percent = safeQty > 0 ? Math.round((currentQty / safeQty) * 100) : 0;
            html += `
                <tr>
                    <td><strong>${wh.code}</strong></td>
                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewItem(${item.id})">${item.code}</td>
                    <td style="cursor:pointer; color:#1a3c6e;" onclick="viewItem(${item.id})">${item.name}</td>
                    <td>${item.unit || '--'}</td>
                    <td><strong>${currentQty}</strong></td>
                    <td>
                        ${canEdit ? `
                            <input type="number" class="min-stock-input" data-warehouse="${wh.id}" data-item="${item.id}" value="${minQty}" style="width:80px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0" step="1">
                        ` : `
                            <span>${minQty}</span>
                        `}
                    </td>
                    <td><span style="color:${currentQty < thresholdQty && status === 'under' ? '#dc3545' : '#555'};">${percent}%</span></td>
                    <td><span style="color:${statusColor}; font-weight:600;">${statusText}</span></td>
                    <td>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-info" onclick="saveMinStockItem(${wh.id}, ${item.id})"><i class="fas fa-save"></i> Lưu</button>
                        ` : `
                            <span style="color:#999; font-size:12px;">--</span>
                        `}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </div>
        `;
        html += buildPaginationHTML(paging, 'renderMinStockList', 'minstock');
        html += `
        <div style="margin-top:12px; font-size:13px; color:#888; padding:8px 0;">
            <i class="fas fa-info-circle"></i> 
            <strong>Chú thích:</strong> 
            <span style="margin-left:12px;">🔴 Dưới ngưỡng (cần đặt hàng)</span>
            <span style="margin-left:12px;">🟡 Gần ngưỡng (sắp hết)</span>
            <span style="margin-left:12px;">🟢 An toàn (đủ dùng)</span>
            ${threshold > 0 ? `<span style="margin-left:12px;">| Cảnh báo khi tồn &lt; ${threshold}% số lượng an toàn</span>` : ''}
        </div>
        `;
        container.innerHTML = html;

        // Gắn sự kiện cho filter
        document.getElementById('min-stock-wh-filter')?.addEventListener('change', () => { minStockPageState.page = 1; renderMinStockList(); });
        document.getElementById('min-stock-status-filter')?.addEventListener('change', () => { minStockPageState.page = 1; renderMinStockList(); });
    } catch (error) {
        console.error('renderMinStockList error:', error);
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#e74c3c;">
            <i class="fas fa-exclamation-triangle"></i> Lỗi tải dữ liệu cảnh báo tồn kho: ${error.message}
        </div>`;
    } finally {
        window._minStockLoading = false;
    }
}

// ====== LẤY DỮ LIỆU THEO TRẠNG THÁI ======
function getItemsByMinStockStatus(warehouseId, status) {
    // Ưu tiên cache API, fallback localStorage
    const inventory = window._inventoryCache || getInventory();
    const items = window._itemsCache || getItems();
    const minStock = window._minStockCache || getMinStock();

    let result = [];
    const invList = (Array.isArray(inventory) ? inventory : []).filter(inv => (inv.warehouse_id === warehouseId || inv.warehouseId === warehouseId));
    
    (invList || []).forEach(inv => {
        const item = (Array.isArray(items) ? items : []).find(i => i.id === (inv.item_id || inv.itemId));
        if (!item) return;
        const min = (Array.isArray(minStock) ? minStock : []).find(m => m.warehouseId === warehouseId && m.itemId === (inv.item_id || inv.itemId));
        const minQty = min ? (parseFloat(min.minQuantity) || 0) : 0;
        const safeQty = min && min.safeQuantity ? (parseFloat(min.safeQuantity) || 0) : Math.max(minQty * 5, minQty);
        const currentQty = inv.quantity || 0;
        const threshold = min && min.alertPercent ? (parseFloat(min.alertPercent) || 20) : 20;
        const thresholdQty = safeQty * (threshold / 100);
        let itemStatus = 'safe';
        if (currentQty <= 0 || (minQty > 0 && currentQty < minQty)) itemStatus = 'under';
        else if (thresholdQty > 0 && currentQty < thresholdQty) itemStatus = 'under';
        else if (currentQty < safeQty) itemStatus = 'warning';

        if (status === 'all' || status === itemStatus) {
            result.push({
                id: item.id,
                code: item.code,
                name: item.name,
                unit: item.unit,
                currentQty,
                minQty,
                safeQty,
                status: itemStatus
            });
        }
    });
    return result;
}

// ====== LƯU NGƯỠNG ======
async function saveMinStockItem(warehouseId, itemId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền cập nhật ngưỡng tồn kho!');
        return;
    }

    const input = document.querySelector(`.min-stock-input[data-warehouse="${warehouseId}"][data-item="${itemId}"]`);
    if (!input) { showError('Không tìm thấy ô nhập!'); return; }
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        showError('Vui lòng nhập số hợp lệ (>= 0)');
        input.focus();
        return;
    }

    try {
        // Gọi API backend (saveOrUpdate theo warehouse+item)
        await api.saveMinStock(warehouseId, itemId, value);
        const item = (window._itemsCache || []).find(i => i.id === itemId);
        showSuccess(`Đã cập nhật ngưỡng cho ${item ? item.name : itemId} tại kho ${getWarehouseCode(warehouseId)}`);
        await renderMinStockList();
    } catch (error) {
        // Fallback: nếu backend không có, lưu localStorage
        console.warn('saveMinStock API error, fallback localStorage:', error);
        let minStock = getMinStock();
        const existing = minStock.find(m => m.warehouseId === warehouseId && m.itemId === itemId);
        if (existing) {
            existing.minQuantity = value;
        } else {
            minStock.push({ warehouseId, itemId, minQuantity: value });
        }
        saveData('min_stock', minStock);
        const item = (window._itemsCache || []).find(i => i.id === itemId);
        showSuccess(`Đã cập nhật ngưỡng cho ${item ? item.name : itemId} tại kho ${getWarehouseCode(warehouseId)}`);
        renderMinStockList();
    }
}

// ====== XUẤT EXCEL ======
async function exportMinStock() {
    if (!hasPermission('inventory.view')) {
        showWarning('Bạn không có quyền xuất dữ liệu cảnh báo tồn kho!');
        return;
    }

    const warehouses = window._warehousesCache || getWarehouses();
    const data = [];
    (Array.isArray(warehouses) ? warehouses : []).forEach(wh => {
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
                'SL an toàn': item.safeQty || '',
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

console.log('✅ Min Stock module updated with full permission checks.');