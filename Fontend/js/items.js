// ================================================================
// ITEMS - Quản lý danh mục vật tư (hỗ trợ alias)
// ================================================================
let itemsPageState = { page: 1, perPage: 10 };
// ====== STATE ======
const itemsState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    groupFilter: '',
    sortBy: 'code',
    sortOrder: 'asc'
};

const debouncedItemsFilter = debounce(() => {
    itemsState.page = 1;
    renderItems();
}, 300);

// ====== RENDER DANH SÁCH VẬT TƯ ======
async function renderItems(page = null) {
    try {
        const allItems = await api.getItems();
        if (page) itemsState.page = page;

        // Filter
        const keyword = itemsState.filterText.toLowerCase().trim();
        let filtered = allItems.filter(item => {
            let matchKeyword = true;
            if (keyword) {
                const codeMatch = (item.code || '').toLowerCase().includes(keyword);
                const nameMatch = (item.name || '').toLowerCase().includes(keyword);
                const groupMatch = (item.itemGroup || '').toLowerCase().includes(keyword);
                const modelMatch = (item.model || '').toLowerCase().includes(keyword);
                // Tìm trong alias (các item cùng code)
                const aliasItems = allItems.filter(i => i.code === item.code && i.id !== item.id);
                const aliasMatch = aliasItems.some(a => (a.name || '').toLowerCase().includes(keyword));
                matchKeyword = codeMatch || nameMatch || groupMatch || modelMatch || aliasMatch;
            }
            const matchStatus = itemsState.statusFilter ? item.status === itemsState.statusFilter : true;
            const matchGroup = itemsState.groupFilter ? item.itemGroup === itemsState.groupFilter : true;
            return matchKeyword && matchStatus && matchGroup;
        });

        // Sort
        const order = itemsState.sortOrder === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            let valA = a[itemsState.sortBy] || '';
            let valB = b[itemsState.sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
        });

        const perPage = getPageSize('items');
        itemsState.perPage = perPage;
        const paging = paginate(filtered, itemsState.page, perPage);

        const canCreate = hasPermission('items.create');
        const canEdit = hasPermission('items.edit');
        const canDelete = hasPermission('items.delete');

        const btnAdd = document.getElementById('btn-add-item');
        if (btnAdd) btnAdd.style.display = canCreate ? 'inline-block' : 'none';

        // Nhóm theo code để hiển thị alias
        const grouped = {};
        paging.items.forEach(item => {
            if (!grouped[item.code]) grouped[item.code] = [];
            grouped[item.code].push(item);
        });

        // Lấy danh sách nhóm để lọc
        const groups = [...new Set(allItems.map(i => i.itemGroup).filter(Boolean))];

        let html = `
            <div class="filter-bar">
                <input type="text" id="item-filter" placeholder="Tìm theo mã, tên, nhóm, model, alias..." style="flex:2;" value="${itemsState.filterText}">
                <select id="item-status-filter" style="flex:1;">
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE" ${itemsState.statusFilter === 'ACTIVE' ? 'selected' : ''}>Sử dụng</option>
                    <option value="INACTIVE" ${itemsState.statusFilter === 'INACTIVE' ? 'selected' : ''}>Ngừng</option>
                </select>
                <select id="item-group-filter" style="flex:1;">
                    <option value="">Tất cả nhóm</option>
                    ${groups.map(g => `<option value="${g}" ${itemsState.groupFilter === g ? 'selected' : ''}>${g}</option>`).join('')}
                </select>
                <select id="item-sort" style="flex:1;">
                    <option value="code_asc" ${itemsState.sortBy === 'code' && itemsState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${itemsState.sortBy === 'code' && itemsState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="name_asc" ${itemsState.sortBy === 'name' && itemsState.sortOrder === 'asc' ? 'selected' : ''}>Tên (A→Z)</option>
                    <option value="name_desc" ${itemsState.sortBy === 'name' && itemsState.sortOrder === 'desc' ? 'selected' : ''}>Tên (Z→A)</option>
                    <option value="itemGroup_asc" ${itemsState.sortBy === 'itemGroup' && itemsState.sortOrder === 'asc' ? 'selected' : ''}>Nhóm (A→Z)</option>
                    <option value="itemGroup_desc" ${itemsState.sortBy === 'itemGroup' && itemsState.sortOrder === 'desc' ? 'selected' : ''}>Nhóm (Z→A)</option>
                    <option value="standardPrice_asc" ${itemsState.sortBy === 'standardPrice' && itemsState.sortOrder === 'asc' ? 'selected' : ''}>Giá (thấp→cao)</option>
                    <option value="standardPrice_desc" ${itemsState.sortBy === 'standardPrice' && itemsState.sortOrder === 'desc' ? 'selected' : ''}>Giá (cao→thấp)</option>
                    <option value="status" ${itemsState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetItemsFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên chính</th>
                            <th>Tên khác</th>
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

        if (!paging.items.length) {
            html += `<tr><td colspan="9" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const [code, list] of Object.entries(grouped)) {
            const main = list.find(i => i.isMain === true) || list[0];
            const aliases = list.filter(i => i.id !== main.id);
            const statusBadge = main.status === 'ACTIVE'
                ? '<span class="badge badge-active"><i class="fas fa-check-circle"></i> Sử dụng</span>'
                : '<span class="badge badge-inactive"><i class="fas fa-times-circle"></i> Ngừng</span>';

            let actions = `<button class="btn btn-info btn-sm" onclick="viewItem(${main.id})"><i class="fas fa-eye"></i></button>`;
            if (canEdit) {
                actions += ` <button class="btn btn-warning btn-sm" onclick="editItem(${main.id})"><i class="fas fa-edit"></i></button>`;
            }
            if (canDelete) {
                actions += ` <button class="btn btn-danger btn-sm" onclick="deleteItem(${main.id})"><i class="fas fa-trash"></i></button>`;
            }

            const aliasNames = aliases.map(a => a.name).join(', ');

            html += `<tr>
                <td><strong>${main.code || '--'}</strong></td>
                <td>${main.name || '--'}</td>
                <td>${aliasNames || '--'}</td>
                <td>${main.itemGroup || '--'}</td>
                <td>${main.model || '--'}</td>
                <td>${main.unit || '--'}</td>
                <td>${(main.standardPrice || 0).toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderItems', 'items');
        document.getElementById('items-container').innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('item-filter');
        const statusSelect = document.getElementById('item-status-filter');
        const groupSelect = document.getElementById('item-group-filter');
        const sortSelect = document.getElementById('item-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedItemsFilter);
            filterInput.addEventListener('input', function(e) {
                itemsState.filterText = this.value;
                debouncedItemsFilter();
            });
        }
        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedItemsFilter);
            statusSelect.addEventListener('change', function(e) {
                itemsState.statusFilter = this.value;
                debouncedItemsFilter();
            });
        }
        if (groupSelect) {
            groupSelect.removeEventListener('change', debouncedItemsFilter);
            groupSelect.addEventListener('change', function(e) {
                itemsState.groupFilter = this.value;
                debouncedItemsFilter();
            });
        }
        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedItemsFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                itemsState.sortBy = sortBy;
                itemsState.sortOrder = sortOrder || 'asc';
                debouncedItemsFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách vật tư: ' + error.message);
        console.error('renderItems error:', error);
    }
}

function resetItemsFilters() {
    itemsState.filterText = '';
    itemsState.statusFilter = '';
    itemsState.groupFilter = '';
    itemsState.sortBy = 'code';
    itemsState.sortOrder = 'asc';
    itemsState.page = 1;
    renderItems();
}

// ====== THÊM DÒNG TÊN KHÁC ======
function addItemAliasInput(value = '') {
    const container = document.getElementById('item-aliases-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.style.marginTop = '4px';
    row.innerHTML = `
        <input type="text" class="item-alias-input" placeholder="Nhập tên khác" value="${value}" style="flex:1;">
        <button type="button" class="btn btn-sm btn-danger" onclick="removeItemAliasInput(this)"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(row);
}

function removeItemAliasInput(btn) {
    const row = btn.parentElement;
    const container = row.parentElement;
    if (container.querySelectorAll('.item-row').length <= 1) {
        const input = row.querySelector('.item-alias-input');
        if (input) input.value = '';
        return;
    }
    row.remove();
}

function collectItemAliases() {
    const inputs = document.querySelectorAll('.item-alias-input');
    const aliases = [];
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) aliases.push(val);
    });
    return aliases;
}

// ====== HIỂN THỊ MODAL THÊM VẬT TƯ ======
function showAddItemModal() {
    showModal('Thêm vật tư mới', `
        <div class="form-group">
            <label>Mã vật tư *</label>
            <input id="f-item-code" placeholder="VTxxx" required>
        </div>
        <div class="form-group">
            <label>Tên chính *</label>
            <input id="f-item-name" required>
        </div>
        <div class="form-group">
            <label>Tên khác (alias)</label>
            <div id="item-aliases-container">
                <div class="item-row">
                    <input type="text" class="item-alias-input" placeholder="Nhập tên khác" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-success" onclick="addItemAliasInput()"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div style="font-size:12px; color:#888; margin-top:4px;">Thêm các tên khác cho cùng mã vật tư.</div>
        </div>
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
            <button class="btn" onclick="saveItemWithAliases()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

// ====== LƯU VẬT TƯ VỚI ALIAS ======
async function saveItemWithAliases() {
    if (!hasPermission('items.create')) {
        showWarning('Bạn không có quyền thêm vật tư!');
        return;
    }

    const code = document.getElementById('f-item-code').value.trim().toUpperCase();
    const name = document.getElementById('f-item-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên chính');
        return;
    }

    const aliases = collectItemAliases();

    try {
        const newItem = {
            code,
            name,
            isMain: true,
            itemGroup: document.getElementById('f-item-group').value.trim(),
            model: document.getElementById('f-item-model').value.trim(),
            unit: document.getElementById('f-item-unit').value.trim(),
            standardPrice: parseFloat(document.getElementById('f-item-price').value) || 0,
            status: document.getElementById('f-item-status').value,
            note: document.getElementById('f-item-note').value.trim(),
        };
        const created = await api.createItem(newItem);

        if (aliases.length > 0) {
            for (const aliasName of aliases) {
                await api.createItem({
                    code,
                    name: aliasName,
                    isMain: false,
                    itemGroup: newItem.itemGroup,
                    model: newItem.model,
                    unit: newItem.unit,
                    standardPrice: newItem.standardPrice,
                    status: newItem.status,
                    note: newItem.note,
                });
            }
        }

        closeModal();
        await renderItems();
        showSuccess(`Thêm vật tư ${code} - ${name} thành công! ${aliases.length > 0 ? 'Đã thêm ' + aliases.length + ' tên khác.' : ''}`);
    } catch (error) {
        showError('Lỗi khi thêm vật tư: ' + error.message);
    }
}

// ====== XEM CHI TIẾT VẬT TƯ ======
async function viewItem(id) {
    try {
        let allItems = window._itemsCache || [];
        if (!allItems.length) {
            allItems = await api.getItems();
            window._itemsCache = allItems;
        }
        const mainItem = allItems.find(i => i.id === id);
        if (!mainItem) {
            showError('Không tìm thấy vật tư!');
            return;
        }

        const aliasItems = allItems.filter(i => i.code === mainItem.code && i.id !== mainItem.id);
        const aliasNames = aliasItems.map(i => i.name);

        const inventory = await api.getInventory();
        const warehouses = await api.getWarehouses();
        const invData = inventory.filter(i => i.itemId === id || i.item_id === id);
        let totalQty = 0;
        let whHtml = '';
        if (invData.length) {
            whHtml = `<div style="margin-top:8px;"><strong>Tồn kho theo kho:</strong>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:4px;">`;
            invData.forEach(inv => {
                const wh = warehouses.find(w => w.id === (inv.warehouseId || inv.warehouse_id));
                const whName = wh ? wh.name : `Kho #${inv.warehouseId || inv.warehouse_id}`;
                whHtml += `<div style="padding:4px 8px; background:#f8fafc; border-radius:4px; font-size:13px;">${whName}: <strong>${inv.quantity || 0}</strong></div>`;
                totalQty += inv.quantity || 0;
            });
            whHtml += `</div></div>`;
        }

        showModal('Chi tiết vật tư', `
            <div class="detail-grid">
                <div><span class="label">Mã:</span> <span class="value"><strong>${mainItem.code || '--'}</strong></span></div>
                <div><span class="label">Tên chính:</span> <span class="value">${mainItem.name || '--'}</span></div>
                <div><span class="label">Tên khác:</span> <span class="value">${aliasNames.length ? aliasNames.join(', ') : '--'}</span></div>
                <div><span class="label">Nhóm:</span> <span class="value">${mainItem.itemGroup || '--'}</span></div>
                <div><span class="label">Quy cách/Model:</span> <span class="value">${mainItem.model || '--'}</span></div>
                <div><span class="label">ĐVT:</span> <span class="value">${mainItem.unit || '--'}</span></div>
                <div><span class="label">Đơn giá chuẩn:</span> <span class="value">${(mainItem.standardPrice || 0).toLocaleString()} VND</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${mainItem.status === 'ACTIVE' ? '🟢 Sử dụng' : '🔴 Ngừng'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${mainItem.createdAt || '--'}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${mainItem.note || '--'}</span></div>
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

// ====== SỬA VẬT TƯ ======
async function editItem(id) {
    if (!hasPermission('items.edit')) {
        showWarning('Bạn không có quyền sửa vật tư!');
        return;
    }

    try {
        const allItems = await api.getItems();
        const mainItem = allItems.find(i => i.id === id);
        if (!mainItem) {
            showError('Không tìm thấy vật tư!');
            return;
        }

        const aliasItems = allItems.filter(i => i.code === mainItem.code && i.id !== mainItem.id);
        const aliasNames = aliasItems.map(i => i.name);

        let aliasHtml = '';
        if (aliasNames.length === 0) {
            aliasHtml = `
                <div class="item-row">
                    <input type="text" class="item-alias-input" placeholder="Nhập tên khác" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-success" onclick="addItemAliasInput()"><i class="fas fa-plus"></i></button>
                </div>
            `;
        } else {
            aliasHtml = aliasNames.map(name => `
                <div class="item-row">
                    <input type="text" class="item-alias-input" placeholder="Nhập tên khác" value="${name}" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeItemAliasInput(this)"><i class="fas fa-times"></i></button>
                </div>
            `).join('');
            aliasHtml += `
                <div class="item-row">
                    <input type="text" class="item-alias-input" placeholder="Nhập tên khác" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-success" onclick="addItemAliasInput()"><i class="fas fa-plus"></i></button>
                </div>
            `;
        }

        showModal('Sửa vật tư', `
            <div class="form-group"><label>Mã vật tư</label><input id="f-item-code" value="${mainItem.code || ''}" required></div>
            <div class="form-group"><label>Tên chính</label><input id="f-item-name" value="${mainItem.name || ''}" required></div>
            <div class="form-group">
                <label>Tên khác (alias)</label>
                <div id="item-aliases-container">${aliasHtml}</div>
                <div style="font-size:12px; color:#888; margin-top:4px;">Thêm các tên khác cho cùng mã vật tư.</div>
            </div>
            <div class="form-group"><label>Nhóm vật tư</label><input id="f-item-group" value="${mainItem.itemGroup || ''}"></div>
            <div class="form-group"><label>Quy cách/Model</label><input id="f-item-model" value="${mainItem.model || ''}"></div>
            <div class="form-group"><label>ĐVT</label><input id="f-item-unit" value="${mainItem.unit || ''}"></div>
            <div class="form-group"><label>Đơn giá chuẩn</label><input id="f-item-price" type="number" step="1000" value="${mainItem.standardPrice || 0}"></div>
            <div class="form-group"><label>Trạng thái</label>
                <select id="f-item-status">
                    <option value="ACTIVE" ${mainItem.status === 'ACTIVE' ? 'selected' : ''}>Sử dụng</option>
                    <option value="INACTIVE" ${mainItem.status === 'INACTIVE' ? 'selected' : ''}>Ngừng</option>
                </select>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-item-note" rows="2">${mainItem.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateItemWithAliases(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải thông tin vật tư: ' + error.message);
    }
}

async function updateItemWithAliases(id) {
    const code = document.getElementById('f-item-code').value.trim().toUpperCase();
    const name = document.getElementById('f-item-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên chính');
        return;
    }

    const aliases = collectItemAliases();

    try {
        const updatedItem = {
            code,
            name,
            isMain: true,
            itemGroup: document.getElementById('f-item-group').value.trim(),
            model: document.getElementById('f-item-model').value.trim(),
            unit: document.getElementById('f-item-unit').value.trim(),
            standardPrice: parseFloat(document.getElementById('f-item-price').value) || 0,
            status: document.getElementById('f-item-status').value,
            note: document.getElementById('f-item-note').value.trim(),
        };
        await api.updateItem(id, updatedItem);

        const allItems = await api.getItems();
        const existingAliases = allItems.filter(i => i.code === code && i.id !== id);
        for (const alias of existingAliases) {
            await api.deleteItem(alias.id);
        }

        if (aliases.length > 0) {
            for (const aliasName of aliases) {
                await api.createItem({
                    code,
                    name: aliasName,
                    isMain: false,
                    itemGroup: updatedItem.itemGroup,
                    model: updatedItem.model,
                    unit: updatedItem.unit,
                    standardPrice: updatedItem.standardPrice,
                    status: updatedItem.status,
                    note: updatedItem.note,
                });
            }
        }

        closeModal();
        await renderItems();
        showSuccess(`Cập nhật vật tư ${code} thành công!`);
    } catch (error) {
        showError('Lỗi khi cập nhật vật tư: ' + error.message);
    }
}

// ====== XÓA VẬT TƯ ======
async function deleteItem(id) {
    if (!hasPermission('items.delete')) {
        showWarning('Bạn không có quyền xóa vật tư!');
        return;
    }

    try {
        const allItems = await api.getItems();
        const item = allItems.find(i => i.id === id);
        if (!item) {
            showError('Không tìm thấy vật tư!');
            return;
        }

        if (!confirm(`Xóa vật tư "${item.code} - ${item.name}"? (Tất cả tên khác cũng sẽ bị xóa)`)) return;

        // Xóa tất cả alias cùng code
        const aliasItems = allItems.filter(i => i.code === item.code);
        for (const alias of aliasItems) {
            await api.deleteItem(alias.id);
        }

        await renderItems();
        showSuccess(`Xóa vật tư ${item.code} thành công!`);
    } catch (error) {
        showError('Lỗi khi xóa vật tư: ' + error.message);
    }
}

// ====== EXPORT ======
window.renderItems = renderItems;
window.viewItem = viewItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.showAddItemModal = showAddItemModal;
window.saveItemWithAliases = saveItemWithAliases;
window.updateItemWithAliases = updateItemWithAliases;
window.addItemAliasInput = addItemAliasInput;
window.removeItemAliasInput = removeItemAliasInput;
window.resetItemsFilters = resetItemsFilters;

console.log('✅ Items module updated with alias support.');