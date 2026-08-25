// ================================================================
// ITEMS - QUẢN LÝ DANH MỤC VẬT TƯ (DÙNG API)
// ================================================================

// ====== RENDER DANH SÁCH VẬT TƯ ======
async function renderItems() {
    try {
        const items = await api.getItems();
        // Cập nhật cache cho các helper
        if (typeof updateItemsCache === 'function') {
            updateItemsCache(items);
        } else {
            window._itemsCache = items;
        }

        const filter = document.getElementById('item-filter')?.value?.toLowerCase() || '';
        const filtered = items.filter(it => 
            it.code.toLowerCase().includes(filter) || 
            it.name.toLowerCase().includes(filter)
        );
        const user = getUser();
        const isAdmin = user && (user.role === 'ADMIN' || (typeof hasPermission === 'function' && hasPermission('items.edit')));

        let html = `
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th>Nhóm</th>
                            <th>Model</th>
                            <th>ĐVT</th>
                            <th>Giá chuẩn</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!filtered.length) {
            html += `<tr><td colspan="8" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const it of filtered) {
            const statusBadge = it.status === 'ACTIVE' 
                ? '<span class="badge badge-active"><i class="fas fa-check-circle"></i> Sử dụng</span>' 
                : '<span class="badge badge-inactive"><i class="fas fa-times-circle"></i> Ngừng</span>';
            
            let actions = `<button class="btn btn-info btn-sm" onclick="viewItem(${it.id})"><i class="fas fa-eye"></i></button>`;
            if (isAdmin) {
                actions += ` <button class="btn btn-warning btn-sm" onclick="editItem(${it.id})"><i class="fas fa-edit"></i></button>`;
                actions += ` <button class="btn btn-danger btn-sm" onclick="deleteItem(${it.id})"><i class="fas fa-trash"></i></button>`;
            }
            html += `<tr>
                <td><strong>${it.code}</strong></td>
                <td>${it.name}</td>
                <td>${it.itemGroup || '--'}</td>
                <td>${it.model || '--'}</td>
                <td>${it.unit || '--'}</td>
                <td>${(it.standardPrice || 0).toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('items-container').innerHTML = html;

        // Ẩn/Hiện nút thêm theo quyền
        const btnAdd = document.getElementById('btn-add-item');
        const btnExport = document.getElementById('btn-export-items');
        if (btnAdd) btnAdd.style.display = isAdmin ? 'inline-block' : 'none';
        if (btnExport) btnExport.style.display = isAdmin ? 'inline-block' : 'none';

    } catch (error) {
        showError('Không thể tải danh sách vật tư: ' + error.message);
        console.error('renderItems error:', error);
    }
}

// ====== XEM CHI TIẾT VẬT TƯ ======
async function viewItem(id) {
    try {
        // Lấy từ cache nếu có, nếu không thì gọi API
        let item = window._itemsCache ? window._itemsCache.find(i => i.id === id) : null;
        if (!item) {
            const items = await api.getItems();
            item = items.find(i => i.id === id);
            if (item) {
                if (typeof updateItemsCache === 'function') {
                    updateItemsCache(items);
                } else {
                    window._itemsCache = items;
                }
            }
        }
        if (!item) {
            showError('Không tìm thấy vật tư!');
            return;
        }

        // Lấy tồn kho của vật tư này
        const inventory = await api.getInventory();
        const warehouses = await api.getWarehouses();
        const invData = inventory.filter(i => i.itemId === id);
        let totalQty = 0;
        let whHtml = '';
        if (invData.length) {
            whHtml = `<div style="margin-top:8px;"><strong>Tồn kho theo kho:</strong>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:4px;">`;
            invData.forEach(inv => {
                const wh = warehouses.find(w => w.id === inv.warehouseId);
                const whName = wh ? wh.name : `Kho #${inv.warehouseId}`;
                whHtml += `<div style="padding:4px 8px; background:#f8fafc; border-radius:4px; font-size:13px;">${whName}: <strong>${inv.quantity}</strong></div>`;
                totalQty += inv.quantity || 0;
            });
            whHtml += `</div></div>`;
        }

        showModal('Chi tiết vật tư', `
            <div class="detail-grid">
                <div><span class="label">Mã:</span> <span class="value"><strong>${item.code}</strong></span></div>
                <div><span class="label">Tên:</span> <span class="value">${item.name}</span></div>
                <div><span class="label">Nhóm:</span> <span class="value">${item.itemGroup || '--'}</span></div>
                <div><span class="label">Quy cách/Model:</span> <span class="value">${item.model || '--'}</span></div>
                <div><span class="label">ĐVT:</span> <span class="value">${item.unit || '--'}</span></div>
                <div><span class="label">Đơn giá chuẩn:</span> <span class="value">${(item.standardPrice || 0).toLocaleString()} VND</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${item.status === 'ACTIVE' ? '🟢 Sử dụng' : '🔴 Ngừng'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${item.createdAt || '--'}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${item.note || '--'}</span></div>
                ${whHtml ? `<div style="grid-column:1/-1;"><span class="label">Tổng tồn kho:</span> <span class="value"><strong>${totalQty}</strong></span>${whHtml}</div>` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết vật tư: ' + error.message);
    }
}

// ====== HIỂN THỊ MODAL THÊM MỚI ======
function showAddItemModal() {
    const user = getUser();
    if (user.role !== 'ADMIN' && !(typeof hasPermission === 'function' && hasPermission('items.create'))) {
        showWarning('Bạn không có quyền thêm vật tư');
        return;
    }
    showModal('Thêm vật tư mới', `
        <div class="form-group"><label>Mã vật tư</label><input id="f-item-code" placeholder="VTxxx" required></div>
        <div class="form-group"><label>Tên vật tư</label><input id="f-item-name" required></div>
        <div class="form-group"><label>Nhóm vật tư</label><input id="f-item-group" placeholder="Ví dụ: Thép, Điện, VLXD..."></div>
        <div class="form-group"><label>Quy cách/Model</label><input id="f-item-model" placeholder="Ví dụ: DN21, CVV 2x1.5..."></div>
        <div class="form-group"><label>Đơn vị tính</label><input id="f-item-unit" placeholder="cây, mét, cái, kg, bao..."></div>
        <div class="form-group"><label>Đơn giá chuẩn</label><input id="f-item-price" type="number" step="1000" value="0"></div>
        <div class="form-group"><label>Trạng thái</label>
            <select id="f-item-status">
                <option value="ACTIVE">Sử dụng</option>
                <option value="INACTIVE">Ngừng</option>
            </select>
        </div>
        <div class="form-group"><label>Ghi chú</label><textarea id="f-item-note" rows="2"></textarea></div>
        <div class="modal-actions">
            <button class="btn" onclick="saveItem()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

// ====== LƯU VẬT TƯ MỚI ======
async function saveItem() {
    const code = document.getElementById('f-item-code').value.trim().toUpperCase();
    const name = document.getElementById('f-item-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên vật tư');
        return;
    }

    try {
        const newItem = {
            code,
            name,
            itemGroup: document.getElementById('f-item-group').value.trim(),
            model: document.getElementById('f-item-model').value.trim(),
            unit: document.getElementById('f-item-unit').value.trim(),
            standardPrice: parseFloat(document.getElementById('f-item-price').value) || 0,
            status: document.getElementById('f-item-status').value,
            note: document.getElementById('f-item-note').value.trim(),
        };

        await api.createItem(newItem);
        closeModal();
        await renderItems();
        showSuccess(`Thêm vật tư ${code} - ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm vật tư: ' + error.message);
    }
}

// ====== SỬA VẬT TƯ ======
async function editItem(id) {
    try {
        let item = window._itemsCache ? window._itemsCache.find(i => i.id === id) : null;
        if (!item) {
            const items = await api.getItems();
            item = items.find(i => i.id === id);
            if (item) {
                if (typeof updateItemsCache === 'function') {
                    updateItemsCache(items);
                } else {
                    window._itemsCache = items;
                }
            }
        }
        if (!item) {
            showError('Không tìm thấy vật tư!');
            return;
        }

        showModal('Sửa vật tư', `
            <div class="form-group"><label>Mã</label><input id="f-item-code" value="${item.code}" required></div>
            <div class="form-group"><label>Tên</label><input id="f-item-name" value="${item.name}" required></div>
            <div class="form-group"><label>Nhóm</label><input id="f-item-group" value="${item.itemGroup || ''}"></div>
            <div class="form-group"><label>Quy cách/Model</label><input id="f-item-model" value="${item.model || ''}"></div>
            <div class="form-group"><label>ĐVT</label><input id="f-item-unit" value="${item.unit || ''}"></div>
            <div class="form-group"><label>Đơn giá chuẩn</label><input id="f-item-price" type="number" step="1000" value="${item.standardPrice || 0}"></div>
            <div class="form-group"><label>Trạng thái</label>
                <select id="f-item-status">
                    <option value="ACTIVE" ${item.status === 'ACTIVE' ? 'selected' : ''}>Sử dụng</option>
                    <option value="INACTIVE" ${item.status === 'INACTIVE' ? 'selected' : ''}>Ngừng</option>
                </select>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-item-note" rows="2">${item.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateItem(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải thông tin vật tư: ' + error.message);
    }
}

// ====== CẬP NHẬT VẬT TƯ ======
async function updateItem(id) {
    const code = document.getElementById('f-item-code').value.trim().toUpperCase();
    const name = document.getElementById('f-item-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên');
        return;
    }

    try {
        const updatedItem = {
            code,
            name,
            itemGroup: document.getElementById('f-item-group').value.trim(),
            model: document.getElementById('f-item-model').value.trim(),
            unit: document.getElementById('f-item-unit').value.trim(),
            standardPrice: parseFloat(document.getElementById('f-item-price').value) || 0,
            status: document.getElementById('f-item-status').value,
            note: document.getElementById('f-item-note').value.trim(),
        };

        await api.updateItem(id, updatedItem);
        closeModal();
        await renderItems();
        showSuccess(`Cập nhật vật tư ${code} thành công!`);
    } catch (error) {
        showError('Lỗi khi cập nhật vật tư: ' + error.message);
    }
}

// ====== XÓA VẬT TƯ ======
async function deleteItem(id) {
    try {
        // Lấy thông tin để hiển thị
        let item = window._itemsCache ? window._itemsCache.find(i => i.id === id) : null;
        if (!item) {
            const items = await api.getItems();
            item = items.find(i => i.id === id);
        }
        if (!item) {
            showError('Không tìm thấy vật tư!');
            return;
        }

        if (!confirm(`Xóa vật tư "${item.code} - ${item.name}"? (Tồn kho liên quan sẽ bị xóa)`)) return;

        await api.deleteItem(id);
        await renderItems();
        showSuccess(`Xóa vật tư ${item.code} thành công!`);
    } catch (error) {
        if (error.message && error.message.includes('đang được sử dụng')) {
            showError('Vật tư này đang được sử dụng trong các đơn hàng, không thể xóa!');
        } else {
            showError('Lỗi khi xóa vật tư: ' + error.message);
        }
    }
}

// ====== SỰ KIỆN CHO NÚT THÊM ======
document.getElementById('btn-add-item')?.addEventListener('click', showAddItemModal);

// ====== EXPORT GLOBAL ======
window.renderItems = renderItems;
window.viewItem = viewItem;
window.editItem = editItem;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.saveItem = saveItem;
window.showAddItemModal = showAddItemModal;

console.log('✅ Items module updated to use API.');