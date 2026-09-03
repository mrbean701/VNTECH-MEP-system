// ================================================================
// ITEM SELECTOR MODAL - Chọn vật tư cho MR, PR, PO
// Hỗ trợ modal cha (giữ lại nội dung khi đóng)
// ================================================================

let _itemSelectorState = {
    selectedItems: [],
    callback: null,
    filter: '',
    page: 1,
    perPage: 10,
    totalItems: 0,
    totalPages: 1,
    items: [],
    loading: false,
    mode: 'mr',
    _showingSelected: false,
    _parentContent: ''        // Lưu nội dung modal cha (MR/PR/PO)
};

// ====== HÀM MỞ MODAL ======

async function openItemSelector(options) {
    const { selectedItems = [], callback, mode = 'mr' } = options || {};

    // Lưu nội dung modal cha (nếu có)
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        _itemSelectorState._parentContent = modalContent.innerHTML;
    }

    _itemSelectorState.selectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        itemName: item.itemName || '',
        itemCode: item.itemCode || '',
        unit: item.unit || '',
        standardPrice: item.standardPrice || 0
    }));
    _itemSelectorState.callback = callback || null;
    _itemSelectorState.mode = mode;
    _itemSelectorState.filter = '';
    _itemSelectorState.page = 1;
    _itemSelectorState._showingSelected = false;

    await _loadItems();
    _renderModal();

    document.getElementById('modal').classList.add('active');
}

// ====== ĐÓNG MODAL VÀ KHÔI PHỤC MODAL CHA ======

function closeItemSelector() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (content && _itemSelectorState._parentContent) {
        content.innerHTML = _itemSelectorState._parentContent;
        _itemSelectorState._parentContent = '';
        // Không gọi callback, không cập nhật dữ liệu
        // Render lại danh sách cũ (nếu có)
        _renderParentItems();
    }
    // Không đóng modal, giữ modal mở
}

// ====== ĐÓNG MODAL (SAU KHI LƯU) – VẪN KHÔI PHỤC MODAL CHA ======

function closeItemSelectorAfterSave() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (content && _itemSelectorState._parentContent) {
        content.innerHTML = _itemSelectorState._parentContent;
        _itemSelectorState._parentContent = '';
        // Gọi callback để cập nhật dữ liệu vào form
        if (typeof _itemSelectorState.callback === 'function') {
            const selected = _itemSelectorState.selectedItems.map(s => ({
                itemId: s.itemId,
                quantity: s.quantity,
                itemName: s.itemName,
                itemCode: s.itemCode,
                unit: s.unit,
                standardPrice: s.standardPrice
            }));
            _itemSelectorState.callback(selected);
        }
        // Render lại danh sách đã cập nhật
        _renderParentItems();
    }
    // Không đóng modal, giữ modal mở
}

function _renderParentItems() {
    if (_itemSelectorState.mode === 'mr' && typeof renderMRSelectedItems === 'function') {
        renderMRSelectedItems();
    } else if (_itemSelectorState.mode === 'pr' && typeof renderPRSelectedItems === 'function') {
        renderPRSelectedItems();
    } else if (_itemSelectorState.mode === 'po' && typeof renderPOSelectedItems === 'function') {
        renderPOSelectedItems();
    }
}

// ====== TẢI DỮ LIỆU VẬT TƯ ======

async function _loadItems() {
    _itemSelectorState.loading = true;
    try {
        const allItems = await api.getItems();
        const filter = _itemSelectorState.filter.toLowerCase().trim();
        let filtered = allItems;
        if (filter) {
            filtered = allItems.filter(item =>
                (item.code || '').toLowerCase().includes(filter) ||
                (item.name || '').toLowerCase().includes(filter) ||
                (item.itemGroup || '').toLowerCase().includes(filter)
            );
        }
        const grouped = {};
        filtered.forEach(item => {
            if (!grouped[item.code]) grouped[item.code] = [];
            grouped[item.code].push(item);
        });
        const sortedItems = [];
        Object.keys(grouped).forEach(code => {
            const list = grouped[code];
            const main = list.find(i => i.isMain === true) || list[0];
            const aliases = list.filter(i => i !== main);
            aliases.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            sortedItems.push(main);
            aliases.forEach(a => sortedItems.push(a));
        });
        sortedItems.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        _itemSelectorState.items = sortedItems;
        _itemSelectorState.totalItems = sortedItems.length;
        const perPage = _itemSelectorState.perPage;
        _itemSelectorState.totalPages = Math.max(1, Math.ceil(_itemSelectorState.totalItems / perPage));
        if (_itemSelectorState.page > _itemSelectorState.totalPages) {
            _itemSelectorState.page = _itemSelectorState.totalPages;
        }
    } catch (error) {
        showError('Không thể tải danh sách vật tư: ' + error.message);
        _itemSelectorState.items = [];
        _itemSelectorState.totalItems = 0;
        _itemSelectorState.totalPages = 1;
    }
    _itemSelectorState.loading = false;
}

// ====== RENDER MODAL CHỌN VẬT TƯ ======

function _renderModal() {
    const state = _itemSelectorState;
    const items = state.items;
    const selectedMap = {};
    state.selectedItems.forEach(s => {
        selectedMap[s.itemId] = s;
    });

    const perPage = state.perPage;
    const page = state.page;
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, items.length);
    const pageItems = items.slice(start, end);

    let itemsHtml = '';
    if (pageItems.length === 0) {
        itemsHtml = `<tr><td colspan="6" style="text-align:center; color:#999;">Không tìm thấy vật tư</td></tr>`;
    } else {
        pageItems.forEach(item => {
            const selected = selectedMap[item.id];
            const checked = selected ? 'checked' : '';
            const qty = selected ? selected.quantity : 1;
            const isMain = item.isMain === true;
            const nameDisplay = isMain ? `<strong>${item.name}</strong> <span class="badge badge-info" style="font-size:10px;">Tên chính</span>` : 
                `${item.name} <span style="font-size:11px; color:#888;">(tên phụ)</span>`;
            const aliasCount = _itemSelectorState.items.filter(i => i.code === item.code).length - 1;
            const aliasInfo = aliasCount > 0 ? `<span style="font-size:11px; color:#888;">+${aliasCount} tên khác</span>` : '';
            itemsHtml += `
                <tr>
                    <td style="text-align:center;">
                        <input type="checkbox" class="item-selector-checkbox" data-item-id="${item.id}" ${checked}>
                    </td>
                    <td><strong>${item.code}</strong> ${aliasInfo}</td>
                    <td>${nameDisplay}</td>
                    <td>${item.itemGroup || '--'}</td>
                    <td>${item.unit || '--'}</td>
                    <td style="text-align:right;">${(item.standardPrice || 0).toLocaleString()}</td>
                    <td>
                        <input type="number" class="item-selector-qty" data-item-id="${item.id}" value="${qty}" min="0.01" step="0.01" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;">
                    </td>
                </tr>
            `;
        });
    }

    let paginationHtml = '';
    if (state.totalPages > 1) {
        paginationHtml = `
            <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:12px;">
                <button class="btn btn-sm" onclick="itemSelectorPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span>Trang ${state.page}/${state.totalPages}</span>
                <button class="btn btn-sm" onclick="itemSelectorPage(${state.page + 1})" ${state.page >= state.totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    const selectedCount = state.selectedItems.length;

    const content = document.getElementById('modal-content');
    content.innerHTML = `
        <h3><i class="fas fa-cubes"></i> Chọn vật tư</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; flex:1;">
                <input type="text" id="item-selector-filter" placeholder="Tìm theo mã, tên, nhóm..." style="flex:1; min-width:200px; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button class="btn btn-sm" onclick="itemSelectorSearch()"><i class="fas fa-search"></i> Tìm</button>
                <button class="btn btn-sm btn-success" onclick="itemSelectorSelectAll()"><i class="fas fa-check-double"></i> Chọn tất cả</button>
                <button class="btn btn-sm btn-warning" onclick="itemSelectorDeselectAll()"><i class="fas fa-times"></i> Bỏ chọn</button>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <span style="font-weight:600; background:#f0f4f8; padding:4px 12px; border-radius:4px;">
                    Đã chọn: <span id="selected-count">${selectedCount}</span>
                </span>
                <button class="btn btn-sm btn-info" onclick="showSelectedItemsModal()">
                    <i class="fas fa-list"></i> Xem danh sách (${selectedCount})
                </button>
            </div>
        </div>
        <div style="max-height:450px; overflow:auto;">
            <div class="table-responsive" style="max-height:400px;">
                <table>
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th>Nhóm</th>
                            <th>ĐVT</th>
                            <th>Giá</th>
                            <th>SL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            ${paginationHtml}
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="confirmItemSelection()"><i class="fas fa-check"></i> Xác nhận</button>
            <button class="btn btn-secondary" onclick="cancelItemSelection()">
                <i class="fas fa-arrow-left"></i> Quay lại
            </button>
        </div>
    `;

    // Gắn sự kiện tìm kiếm với debounce
    const searchInput = document.getElementById('item-selector-filter');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            _itemSelectorState.filter = searchInput.value;
            _itemSelectorState.page = 1;
            _loadItems().then(() => _renderModal());
        }, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }

    // Gắn sự kiện cho checkbox
    document.querySelectorAll('.item-selector-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const itemId = parseInt(this.dataset.itemId);
            const qtyInput = document.querySelector(`.item-selector-qty[data-item-id="${itemId}"]`);
            const qty = parseFloat(qtyInput?.value) || 1;
            if (this.checked) {
                const item = _itemSelectorState.items.find(i => i.id === itemId);
                if (item) {
                    _itemSelectorState.selectedItems.push({
                        itemId: item.id,
                        quantity: qty,
                        itemName: item.name,
                        itemCode: item.code,
                        unit: item.unit,
                        standardPrice: item.standardPrice
                    });
                }
            } else {
                const idx = _itemSelectorState.selectedItems.findIndex(s => s.itemId === itemId);
                if (idx !== -1) _itemSelectorState.selectedItems.splice(idx, 1);
            }
            _updateSelectedCount();
        });
    });

    // Gắn sự kiện cho số lượng
    document.querySelectorAll('.item-selector-qty').forEach(input => {
        input.addEventListener('change', function() {
            const itemId = parseInt(this.dataset.itemId);
            const qty = parseFloat(this.value) || 1;
            if (qty <= 0) {
                this.value = 1;
                return;
            }
            const selected = _itemSelectorState.selectedItems.find(s => s.itemId === itemId);
            if (selected) selected.quantity = qty;
        });
    });
}

// ====== CẬP NHẬT SỐ LƯỢNG ĐÃ CHỌN ======

function _updateSelectedCount() {
    const countEl = document.getElementById('selected-count');
    if (countEl) {
        countEl.textContent = _itemSelectorState.selectedItems.length;
    }
    const viewBtn = document.querySelector('.btn-info');
    if (viewBtn) {
        viewBtn.innerHTML = `<i class="fas fa-list"></i> Xem danh sách (${_itemSelectorState.selectedItems.length})`;
    }
}

// ====== HIỂN THỊ MODAL DANH SÁCH ĐÃ CHỌN ======

function showSelectedItemsModal() {
    const items = _itemSelectorState.selectedItems;
    if (items.length === 0) {
        showInfo('Chưa chọn vật tư nào.');
        return;
    }

    _itemSelectorState._showingSelected = true;

    let html = `
        <h3><i class="fas fa-list"></i> Danh sách vật tư đã chọn</h3>
        <div style="font-size:13px; color:#888; margin-bottom:12px;">
            <i class="fas fa-info-circle"></i> Bạn có thể sửa tên và số lượng của từng vật tư.
        </div>
        <div style="max-height:400px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
            <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#f8fafc; position:sticky; top:0;">
                    <tr>
                        <th style="padding:8px; text-align:left;">Mã</th>
                        <th style="padding:8px; text-align:left;">Tên</th>
                        <th style="padding:8px; text-align:left;">ĐVT</th>
                        <th style="padding:8px; text-align:center;">Số lượng</th>
                    </tr>
                </thead>
                <tbody>
    `;

    items.forEach((item, index) => {
        const allAliases = _itemSelectorState.items.filter(i => i.code === item.itemCode);
        const aliasOptions = allAliases.map(alias => 
            `<option value="${alias.id}" ${alias.id === item.itemId ? 'selected' : ''}>${alias.name}</option>`
        ).join('');

        html += `
            <tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:8px;"><strong>${item.itemCode}</strong></td>
                <td style="padding:8px;">
                    <select class="selected-item-alias" data-index="${index}" style="padding:4px; border:1px solid #ccc; border-radius:4px; width:100%;">
                        ${aliasOptions}
                    </select>
                </td>
                <td style="padding:8px;">${item.unit || '--'}</td>
                <td style="padding:8px; text-align:center;">
                    <input type="number" class="selected-item-qty" data-index="${index}" value="${item.quantity}" min="0.01" step="0.01" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px; text-align:center;">
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600;">Tổng cộng: ${items.length} vật tư</span>
            <button class="btn btn-sm btn-danger" onclick="clearAllSelected(); _renderModal();">
                <i class="fas fa-trash"></i> Xóa tất cả
            </button>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveSelectedItems()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-secondary" onclick="closeSelectedModal()">
                <i class="fas fa-arrow-left"></i> Quay lại
            </button>
        </div>
    `;

    const content = document.getElementById('modal-content');
    content.innerHTML = html;
}

// ====== LƯU THAY ĐỔI TỪ MODAL DANH SÁCH ======

function saveSelectedItems() {
    const rows = document.querySelectorAll('#modal-content tbody tr');
    const newItems = [];
    rows.forEach(row => {
        const aliasSelect = row.querySelector('.selected-item-alias');
        const qtyInput = row.querySelector('.selected-item-qty');
        if (aliasSelect && qtyInput) {
            const itemId = parseInt(aliasSelect.value);
            const quantity = parseFloat(qtyInput.value) || 1;
            const original = _itemSelectorState.selectedItems.find(s => s.itemId === itemId);
            const item = _itemSelectorState.items.find(i => i.id === itemId);
            if (item) {
                newItems.push({
                    itemId: itemId,
                    quantity: quantity,
                    itemName: item.name,
                    itemCode: item.code,
                    unit: item.unit || '',
                    standardPrice: item.standardPrice || 0
                });
            } else if (original) {
                newItems.push({
                    ...original,
                    quantity: quantity
                });
            }
        }
    });
    _itemSelectorState.selectedItems = newItems;
    _updateSelectedCount();
    _itemSelectorState._showingSelected = false;
    _renderModal();
    showSuccess('Đã cập nhật danh sách vật tư.');
}

// ====== ĐÓNG MODAL DANH SÁCH (KHÔNG LƯU) ======

function closeSelectedModal() {
    _itemSelectorState._showingSelected = false;
    _renderModal();
}

// ====== XÁC NHẬN CHỌN VẬT TƯ ======

function confirmItemSelection() {
    const count = _itemSelectorState.selectedItems.length;
    if (count === 0) {
        showWarning('Bạn chưa chọn vật tư nào!');
        return;
    }

    if (confirm(`Xác nhận chọn ${count} vật tư này?`)) {
        // Lưu và đóng, khôi phục modal cha (giữ modal mở)
        closeItemSelectorAfterSave();
        showSuccess(`Đã chọn ${count} vật tư.`);
    }
    // Nếu không confirm thì ở lại
}

// ====== HỦY TIẾN TRÌNH (QUAY LẠI) ======

function cancelItemSelection() {
    if (confirm('Bạn có chắc muốn hủy tiến trình chọn vật tư? Các thay đổi sẽ không được lưu.')) {
        // Đóng và khôi phục modal cha mà không gọi callback
        closeItemSelector();
    }
    // Nếu không confirm thì ở lại
}

// ====== CÁC HÀM GLOBAL ======

window.removeSelectedItem = function(itemId) {
    const idx = _itemSelectorState.selectedItems.findIndex(s => s.itemId === itemId);
    if (idx !== -1) _itemSelectorState.selectedItems.splice(idx, 1);
    const cb = document.querySelector(`.item-selector-checkbox[data-item-id="${itemId}"]`);
    if (cb) cb.checked = false;
    _updateSelectedCount();
};

window.itemSelectorSelectAll = function() {
    const checkboxes = document.querySelectorAll('.item-selector-checkbox');
    checkboxes.forEach(cb => {
        const itemId = parseInt(cb.dataset.itemId);
        if (!cb.checked) {
            cb.checked = true;
            const item = _itemSelectorState.items.find(i => i.id === itemId);
            if (item) {
                const qtyInput = document.querySelector(`.item-selector-qty[data-item-id="${itemId}"]`);
                const qty = parseFloat(qtyInput?.value) || 1;
                if (!_itemSelectorState.selectedItems.some(s => s.itemId === itemId)) {
                    _itemSelectorState.selectedItems.push({
                        itemId: item.id,
                        quantity: qty,
                        itemName: item.name,
                        itemCode: item.code,
                        unit: item.unit,
                        standardPrice: item.standardPrice
                    });
                }
            }
        }
    });
    _updateSelectedCount();
};

window.itemSelectorDeselectAll = function() {
    const checkboxes = document.querySelectorAll('.item-selector-checkbox');
    checkboxes.forEach(cb => {
        const itemId = parseInt(cb.dataset.itemId);
        if (cb.checked) {
            cb.checked = false;
            const idx = _itemSelectorState.selectedItems.findIndex(s => s.itemId === itemId);
            if (idx !== -1) _itemSelectorState.selectedItems.splice(idx, 1);
        }
    });
    _updateSelectedCount();
};

window.clearAllSelected = function() {
    _itemSelectorState.selectedItems = [];
    document.querySelectorAll('.item-selector-checkbox').forEach(cb => cb.checked = false);
    _updateSelectedCount();
};

window.itemSelectorSearch = function() {
    const input = document.getElementById('item-selector-filter');
    if (input) {
        _itemSelectorState.filter = input.value;
        _itemSelectorState.page = 1;
        _loadItems().then(() => _renderModal());
    }
};

window.itemSelectorPage = function(page) {
    const total = _itemSelectorState.totalPages;
    if (page < 1 || page > total) return;
    _itemSelectorState.page = page;
    _renderModal();
};

// Export
window.openItemSelector = openItemSelector;
window.closeItemSelector = closeItemSelector;
window.closeItemSelectorAfterSave = closeItemSelectorAfterSave;
window.itemSelectorPage = itemSelectorPage;
window.itemSelectorSearch = itemSelectorSearch;
window.itemSelectorSelectAll = itemSelectorSelectAll;
window.itemSelectorDeselectAll = itemSelectorDeselectAll;
window.clearAllSelected = clearAllSelected;
window.removeSelectedItem = removeSelectedItem;
window.confirmItemSelection = confirmItemSelection;
window.cancelItemSelection = cancelItemSelection;
window.showSelectedItemsModal = showSelectedItemsModal;
window.saveSelectedItems = saveSelectedItems;
window.closeSelectedModal = closeSelectedModal;

console.log('✅ Item selector modal updated – retains parent modal content.');