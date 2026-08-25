// ================================================================
// INVENTORY - QUẢN LÝ KHO VÀ TỒN KHO (TAB-READY)
// ================================================================

let selectedWarehouseId = null;

// ================================================================
// RENDER PAGE (gọi từ menu khi chưa có tab)
// ================================================================
function renderInventoryPage() {
    // Khi vào menu Kho, mặc định hiển thị tab wh-list
    switchWarehouseTab('wh-list');
}

// ================================================================
// CÁC HÀM RENDER TRONG TAB (dùng cho warehouse.js)
// ================================================================

// Render danh sách kho (dùng trong tab)
function renderWarehouseListInTab() {
    const warehouses = getWarehouses();
    const inventory = getInventory();
    const user = getUser();
    const isAdmin = user && user.role === 'ADMIN';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">📋 Danh sách kho</h3>
            ${isAdmin ? `<button class="btn" onclick="showAddWarehouseInTab()"><i class="fas fa-plus"></i> Thêm kho</button>` : ''}
        </div>
        <div class="warehouse-grid">
    `;

    if (!warehouses.length) {
        html += `<p style="grid-column:1/-1; text-align:center; color:#999;">Chưa có kho nào</p>`;
    }

    warehouses.forEach(w => {
        const itemCount = inventory.filter(i => i.warehouse_id === w.id).length;
        const totalQty = inventory.filter(i => i.warehouse_id === w.id)
            .reduce((sum, i) => sum + i.quantity, 0);

        let icon = w.type === 'CENTRAL' ? 'fa-warehouse' : 'fa-building';
        let typeLabel = w.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án';
        let statusBadge = w.status === 'ACTIVE' ?
            '<span class="badge badge-status-active"><i class="fas fa-check-circle"></i> Đang hoạt động</span>' :
            '<span class="badge badge-status-inactive"><i class="fas fa-times-circle"></i> Ngừng hoạt động</span>';

        html += `
            <div class="warehouse-card" onclick="viewWarehouseDetailInTab(${w.id})">
                <div class="wh-status-badge">${statusBadge}</div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <i class="fas ${icon} wh-icon"></i>
                    <span class="wh-code" style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="event.stopPropagation(); viewWarehouseDetailInTab(${w.id})">${w.code}</span>
                </div>
                <div class="wh-name" style="cursor:pointer; color:#1a3c6e;" onclick="event.stopPropagation(); viewWarehouseDetailInTab(${w.id})">${w.name}</div>
                <div>
                    <span class="badge-wh ${w.type === 'CENTRAL' ? 'badge-central' : 'badge-site'}">${typeLabel}</span>
                    ${w.type === 'SITE' ? ` <span style="font-size:13px; color:#666;">(Dự án: ${getProjectNameByProjectId(w.project_id)})</span>` : ''}
                </div>
                <div class="wh-meta">
                    <span><i class="fas fa-cubes"></i> ${itemCount} loại vật tư</span>
                    <span><i class="fas fa-weight-hanging"></i> ${totalQty.toLocaleString()} đvt</span>
                </div>
                <div style="font-size:13px; color:#888; margin-top:4px;">
                    <i class="fas fa-map-marker-alt"></i> ${w.address || 'Chưa có địa chỉ'}
                </div>
                <div style="font-size:13px; color:#888; margin-top:2px;">
                    <i class="fas fa-user"></i> ${w.manager || 'Chưa có quản lý'}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    document.getElementById('wh-tab-content').innerHTML = html;
}

// Xem chi tiết kho trong tab (không mất tab bar)
function viewWarehouseDetailInTab(whId) {
    const warehouses = getWarehouses();
    const wh = warehouses.find(w => w.id === whId);
    if (!wh) {
        renderWarehouseListInTab();
        return;
    }
    selectedWarehouseId = whId;

    const inventory = getInventory();
    const items = getItems();
    const invList = inventory.filter(i => i.warehouse_id === whId);
    invList.sort((a, b) => {
        const nameA = getItemName(a.item_id);
        const nameB = getItemName(b.item_id);
        return nameA.localeCompare(nameB);
    });

    const user = getUser();
    const isAdmin = user && user.role === 'ADMIN';

    let icon = wh.type === 'CENTRAL' ? 'fa-warehouse' : 'fa-building';
    let typeLabel = wh.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án';
    let statusBadge = wh.status === 'ACTIVE' ?
        '<span class="badge badge-status-active"><i class="fas fa-check-circle"></i> Đang hoạt động</span>' :
        '<span class="badge badge-status-inactive"><i class="fas fa-times-circle"></i> Ngừng hoạt động</span>';

    // Bảng vật tư
    let itemsHtml = '';
    if (!invList.length) {
        itemsHtml = `<tr><td colspan="${isAdmin ? 5 : 4}" style="text-align:center; color:#999;">Kho này chưa có vật tư nào</td></tr>`;
    } else {
        invList.forEach(inv => {
            const item = items.find(i => i.id === inv.item_id);
            if (!item) return;
            itemsHtml += `
                <tr>
                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="closeModal(); viewItem(${item.id})">${item.code}</td>
                    <td style="cursor:pointer; color:#1a3c6e;" onclick="closeModal(); viewItem(${item.id})">${item.name}</td>
                    <td>${item.unit || ''}</td>
                    <td>${inv.quantity}</td>
                    ${isAdmin ? `
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editInventoryItemInTab(${inv.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="deleteInventoryItemInTab(${inv.id})"><i class="fas fa-trash"></i></button>
                        </td>
                    ` : ''}
                </tr>
            `;
        });
    }

    const container = document.getElementById('wh-tab-content');
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;"><i class="fas fa-arrow-left" style="cursor:pointer; color:#1a3c6e; margin-right:12px;" onclick="renderWarehouseListInTab()"></i> ${wh.code} - ${wh.name}</h3>
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
                <button class="btn btn-outline btn-sm" onclick="renderWarehouseListInTab()"><i class="fas fa-arrow-left"></i> Quay lại</button>
                ${isAdmin ? `<button class="btn btn-sm" onclick="showEditWarehouseInTab(${wh.id})"><i class="fas fa-edit"></i> Sửa kho</button>` : ''}
                ${isAdmin ? `<button class="btn btn-sm" onclick="showAddInventoryItemInTab(${wh.id})"><i class="fas fa-plus"></i> Thêm tồn kho</button>` : ''}
            </div>
        </div>
        <div class="inventory-view">
            <div class="wh-detail-header">
                <i class="fas ${icon} wh-icon-large"></i>
                <div class="wh-info">
                    <div class="wh-title">${wh.code} - ${wh.name}</div>
                    <div class="wh-sub">
                        <span class="badge-wh ${wh.type === 'CENTRAL' ? 'badge-central' : 'badge-site'}">${typeLabel}</span>
                        ${wh.type === 'SITE' ? ` | Dự án: <span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${wh.project_id})">${getProjectNameByProjectId(wh.project_id)}</span>` : ''}
                        ${statusBadge}
                    </div>
                    <div class="wh-sub" style="margin-top:4px;">
                        <i class="fas fa-map-marker-alt"></i> ${wh.address || 'Chưa có địa chỉ'} &nbsp;|&nbsp;
                        <i class="fas fa-user"></i> ${wh.manager || 'Chưa có quản lý'}
                    </div>
                    ${wh.note ? `<div class="wh-sub"><i class="fas fa-comment"></i> ${wh.note}</div>` : ''}
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã vật tư</th>
                            <th>Tên vật tư</th>
                            <th>ĐVT</th>
                            <th>Số lượng tồn</th>
                            ${isAdmin ? '<th>Hành động</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Quay lại danh sách kho trong tab (gọi từ nút "Quay lại")
function backToWarehouseListInTab() {
    renderWarehouseListInTab();
}

// ================================================================
// QUẢN LÝ KHO (CRUD) - TAB VERSION
// ================================================================

function showAddWarehouseInTab() {
    const projects = getProjects();
    const projectOpts = projects.map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('');
    showModal('Thêm kho mới', `
        <div class="form-group"><label>Mã kho</label><input id="f-wh-code" placeholder="KHO_xxx"></div>
        <div class="form-group"><label>Tên kho</label><input id="f-wh-name"></div>
        <div class="form-group"><label>Loại kho</label>
            <select id="f-wh-type" onchange="toggleProjectFieldInTab()">
                <option value="CENTRAL">Kho tổng</option>
                <option value="SITE">Kho dự án</option>
            </select>
        </div>
        <div class="form-group" id="wh-project-group-in-tab">
            <label>Dự án (nếu là kho dự án)</label>
            <select id="f-wh-project"><option value="">-- Chọn --</option>${projectOpts}</select>
        </div>
        <div class="form-group"><label>Quản lý kho</label><input id="f-wh-manager"></div>
        <div class="form-group"><label>Địa chỉ</label><input id="f-wh-address"></div>
        <div class="form-group"><label>Trạng thái</label>
            <select id="f-wh-status"><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select>
        </div>
        <div class="form-group"><label>Ghi chú</label><textarea id="f-wh-note" rows="2"></textarea></div>
        <div class="modal-actions">
            <button class="btn" onclick="saveWarehouseInTab()">Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
    toggleProjectFieldInTab();
}

function toggleProjectFieldInTab() {
    const type = document.getElementById('f-wh-type').value;
    const group = document.getElementById('wh-project-group-in-tab');
    group.style.display = (type === 'SITE') ? 'block' : 'none';
}

function saveWarehouseInTab() {
    const code = document.getElementById('f-wh-code').value.trim();
    const name = document.getElementById('f-wh-name').value.trim();
    const type = document.getElementById('f-wh-type').value;
    const projectId = parseInt(document.getElementById('f-wh-project').value) || null;
    const manager = document.getElementById('f-wh-manager').value.trim();
    const address = document.getElementById('f-wh-address').value.trim();
    const status = document.getElementById('f-wh-status').value;
    const note = document.getElementById('f-wh-note').value.trim();

    if (!code || !name) { showError('Vui lòng nhập mã và tên kho'); return; }
    if (type === 'SITE' && !projectId) { showError('Vui lòng chọn dự án cho kho dự án'); return; }

    let warehouses = getWarehouses();
    if (warehouses.some(w => w.code === code)) { showError('Mã kho đã tồn tại'); return; }

    const newWh = {
        id: genId(warehouses),
        code,
        name,
        type,
        project_id: type === 'SITE' ? projectId : null,
        manager,
        address,
        status,
        note
    };
    warehouses.push(newWh);
    saveWarehouses(warehouses);

    const items = getItems();
    let inventory = getInventory();
    items.forEach(item => {
        inventory.push({
            id: genId(inventory),
            warehouse_id: newWh.id,
            item_id: item.id,
            quantity: 0
        });
    });
    saveInventory(inventory);

    closeModal();
    renderWarehouseListInTab();
    showSuccess('Thêm kho thành công!');
}

function showEditWarehouseInTab(whId) {
    const warehouses = getWarehouses();
    const wh = warehouses.find(w => w.id === whId);
    if (!wh) return;

    const projects = getProjects();
    const projectOpts = projects.map(p =>
        `<option value="${p.id}" ${p.id===wh.project_id?'selected':''}>${p.code} - ${p.name}</option>`).join('');

    showModal('Sửa kho', `
        <div class="form-group"><label>Mã kho</label><input id="f-wh-code" value="${wh.code}"></div>
        <div class="form-group"><label>Tên kho</label><input id="f-wh-name" value="${wh.name}"></div>
        <div class="form-group"><label>Loại kho</label>
            <select id="f-wh-type" onchange="toggleProjectFieldInTab()">
                <option value="CENTRAL" ${wh.type==='CENTRAL'?'selected':''}>Kho tổng</option>
                <option value="SITE" ${wh.type==='SITE'?'selected':''}>Kho dự án</option>
            </select>
        </div>
        <div class="form-group" id="wh-project-group-in-tab" style="${wh.type==='SITE'?'block':'none'}">
            <label>Dự án</label>
            <select id="f-wh-project">${projectOpts}</select>
        </div>
        <div class="form-group"><label>Quản lý kho</label><input id="f-wh-manager" value="${wh.manager||''}"></div>
        <div class="form-group"><label>Địa chỉ</label><input id="f-wh-address" value="${wh.address||''}"></div>
        <div class="form-group"><label>Trạng thái</label>
            <select id="f-wh-status"><option value="ACTIVE" ${wh.status==='ACTIVE'?'selected':''}>Đang hoạt động</option><option value="INACTIVE" ${wh.status==='INACTIVE'?'selected':''}>Ngừng hoạt động</option></select>
        </div>
        <div class="form-group"><label>Ghi chú</label><textarea id="f-wh-note" rows="2">${wh.note||''}</textarea></div>
        <div class="modal-actions">
            <button class="btn" onclick="updateWarehouseInTab(${whId})">Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
    toggleProjectFieldInTab();
}

function updateWarehouseInTab(whId) {
    const code = document.getElementById('f-wh-code').value.trim();
    const name = document.getElementById('f-wh-name').value.trim();
    const type = document.getElementById('f-wh-type').value;
    const projectId = parseInt(document.getElementById('f-wh-project').value) || null;
    const manager = document.getElementById('f-wh-manager').value.trim();
    const address = document.getElementById('f-wh-address').value.trim();
    const status = document.getElementById('f-wh-status').value;
    const note = document.getElementById('f-wh-note').value.trim();

    if (!code || !name) { showError('Vui lòng nhập mã và tên kho'); return; }
    if (type === 'SITE' && !projectId) { showError('Vui lòng chọn dự án cho kho dự án'); return; }

    let warehouses = getWarehouses();
    const idx = warehouses.findIndex(w => w.id === whId);
    if (idx === -1) return;
    if (warehouses.some((w, i) => w.code === code && i !== idx)) { showError('Mã kho đã tồn tại'); return; }

    warehouses[idx] = {
        ...warehouses[idx],
        code,
        name,
        type,
        project_id: type === 'SITE' ? projectId : null,
        manager,
        address,
        status,
        note
    };
    saveWarehouses(warehouses);
    closeModal();
    renderWarehouseListInTab();
    showSuccess('Cập nhật kho thành công!');
}

// ================================================================
// QUẢN LÝ TỒN KHO (CRUD) - TAB VERSION
// ================================================================

function showAddInventoryItemInTab(whId) {
    const items = getItems();
    const itemOpts = items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('');
    showModal('Thêm tồn kho', `
        <div class="form-group"><label>Vật tư</label>
            <select id="f-inv-item">${itemOpts}</select>
        </div>
        <div class="form-group"><label>Số lượng</label><input id="f-inv-qty" type="number" step="0.01" value="0"></div>
        <div class="modal-actions">
            <button class="btn" onclick="saveInventoryItemInTab(${whId})">Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

function saveInventoryItemInTab(whId) {
    const itemId = parseInt(document.getElementById('f-inv-item').value);
    const quantity = parseFloat(document.getElementById('f-inv-qty').value) || 0;
    if (!itemId) { showError('Vui lòng chọn vật tư'); return; }

    let inventory = getInventory();
    const exist = inventory.find(i => i.warehouse_id === whId && i.item_id === itemId);
    if (exist) {
        exist.quantity = quantity;
    } else {
        inventory.push({ id: genId(inventory), warehouse_id: whId, item_id: itemId, quantity });
    }
    saveInventory(inventory);
    closeModal();
    viewWarehouseDetailInTab(whId);
    showSuccess('Cập nhật tồn kho thành công!');
}

function editInventoryItemInTab(invId) {
    const inventory = getInventory();
    const inv = inventory.find(i => i.id === invId);
    if (!inv) return;

    const items = getItems();
    const itemOpts = items.map(i =>
        `<option value="${i.id}" ${i.id===inv.item_id?'selected':''}>${i.code} - ${i.name}</option>`).join('');

    showModal('Sửa tồn kho', `
        <div class="form-group"><label>Vật tư</label>
            <select id="f-inv-item">${itemOpts}</select>
        </div>
        <div class="form-group"><label>Số lượng</label><input id="f-inv-qty" type="number" step="0.01" value="${inv.quantity}"></div>
        <div class="modal-actions">
            <button class="btn" onclick="updateInventoryItemInTab(${invId})">Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

function updateInventoryItemInTab(invId) {
    const itemId = parseInt(document.getElementById('f-inv-item').value);
    const quantity = parseFloat(document.getElementById('f-inv-qty').value) || 0;
    if (!itemId) { showError('Vui lòng chọn vật tư'); return; }

    let inventory = getInventory();
    const idx = inventory.findIndex(i => i.id === invId);
    if (idx === -1) return;

    const whId = inventory[idx].warehouse_id;
    const duplicate = inventory.some((i, index) =>
        i.warehouse_id === whId && i.item_id === itemId && index !== idx
    );
    if (duplicate) { showError('Vật tư này đã tồn tại trong kho!'); return; }

    inventory[idx] = { ...inventory[idx], item_id: itemId, quantity };
    saveInventory(inventory);
    closeModal();
    viewWarehouseDetailInTab(whId);
    showSuccess('Cập nhật tồn kho thành công!');
}

function deleteInventoryItemInTab(invId) {
    if (!confirm('Xóa tồn kho này?')) return;
    let inventory = getInventory();
    const inv = inventory.find(i => i.id === invId);
    if (!inv) return;
    const whId = inv.warehouse_id;
    inventory = inventory.filter(i => i.id !== invId);
    saveInventory(inventory);
    viewWarehouseDetailInTab(whId);
    showSuccess('Xóa tồn kho thành công!');
}

// ================================================================
// CÁC HÀM CŨ (GIỮ NGUYÊN ĐỂ TƯƠNG THÍCH NGƯỢC)
// ================================================================

// Các hàm sau đây được giữ lại để tương thích với các file khác (nếu có gọi)
// Nhưng khuyến nghị sử dụng các phiên bản "InTab" để tránh mất tab bar.

function renderWarehouseList() {
    renderWarehouseListInTab();
}

function viewWarehouseDetail(whId) {
    viewWarehouseDetailInTab(whId);
}

function backToWarehouseList() {
    renderWarehouseListInTab();
}

function showAddWarehouse() {
    showAddWarehouseInTab();
}

function saveWarehouse() {
    saveWarehouseInTab();
}

function showEditWarehouse(whId) {
    showEditWarehouseInTab(whId);
}

function updateWarehouse(whId) {
    updateWarehouseInTab(whId);
}

function showAddInventoryItem(whId) {
    showAddInventoryItemInTab(whId);
}

function saveInventoryItem(whId) {
    saveInventoryItemInTab(whId);
}

function editInventoryItem(invId) {
    editInventoryItemInTab(invId);
}

function updateInventoryItem(invId) {
    updateInventoryItemInTab(invId);
}

function deleteInventoryItem(invId) {
    deleteInventoryItemInTab(invId);
}

// ================================================================
// EXPORT GLOBAL
// ================================================================
window.renderInventoryPage = renderInventoryPage;
window.renderWarehouseListInTab = renderWarehouseListInTab;
window.viewWarehouseDetailInTab = viewWarehouseDetailInTab;
window.backToWarehouseListInTab = backToWarehouseListInTab;
window.showAddWarehouseInTab = showAddWarehouseInTab;
window.saveWarehouseInTab = saveWarehouseInTab;
window.showEditWarehouseInTab = showEditWarehouseInTab;
window.updateWarehouseInTab = updateWarehouseInTab;
window.showAddInventoryItemInTab = showAddInventoryItemInTab;
window.saveInventoryItemInTab = saveInventoryItemInTab;
window.editInventoryItemInTab = editInventoryItemInTab;
window.updateInventoryItemInTab = updateInventoryItemInTab;
window.deleteInventoryItemInTab = deleteInventoryItemInTab;

// Các hàm cũ (tương thích)
window.renderWarehouseList = renderWarehouseList;
window.viewWarehouseDetail = viewWarehouseDetail;
window.backToWarehouseList = backToWarehouseList;
window.showAddWarehouse = showAddWarehouse;
window.saveWarehouse = saveWarehouse;
window.showEditWarehouse = showEditWarehouse;
window.updateWarehouse = updateWarehouse;
window.showAddInventoryItem = showAddInventoryItem;
window.saveInventoryItem = saveInventoryItem;
window.editInventoryItem = editInventoryItem;
window.updateInventoryItem = updateInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;

console.log('✅ Inventory module loaded successfully.');