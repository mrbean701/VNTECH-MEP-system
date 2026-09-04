// ================================================================
// ITEM SELECTOR MODAL - Chọn vật tư cho MR, PR, PO
// Hỗ trợ nhóm theo mã vật tư, hiển thị alias dạng badge + dropdown
// Đóng dropdown bằng click ra ngoài: giữ nguyên alias đã chọn
// Bấm nút "Đóng": reset về tên chính
// ================================================================

let _itemSelectorState = {
    selectedItems: [],       // [{itemId, quantity, displayName, itemCode, unit}]
    callback: null,
    filter: '',
    page: 1,
    perPage: 10,
    totalItems: 0,
    totalPages: 1,
    groupedItems: [],        // [{code, mainItem, aliasItems, allItems}]
    loading: false,
    mode: 'mr',
    _showingSelected: false,
    _parentContent: '',
    _expandedAlias: null,    // Lưu code đang mở dropdown alias
    _parentState: {}         // Lưu giá trị các input của modal cha
};

// ====== LƯU TRẠNG THÁI INPUT CỦA MODAL CHA ======
function _saveParentState(mode) {
    const state = {};
    if (mode === 'mr') {
        state.project = document.getElementById('f-mr-project')?.value || '';
        state.needDate = document.getElementById('f-mr-needdate')?.value || '';
        state.purpose = document.getElementById('f-mr-purpose')?.value || '';
        state.requester = document.getElementById('f-mr-requester')?.value || '';
        state.note = document.getElementById('f-mr-note')?.value || '';
    } else if (mode === 'pr') {
        state.project = document.getElementById('f-pr-project')?.value || '';
        state.vendor = document.getElementById('f-pr-vendor')?.value || '';
        state.note = document.getElementById('f-pr-note')?.value || '';
    } else if (mode === 'po') {
        state.project = document.getElementById('f-po-project')?.value || '';
        state.vendor = document.getElementById('f-po-vendor')?.value || '';
        state.note = document.getElementById('f-po-note')?.value || '';
    } else if (mode === 'issue') {
        state.project = document.getElementById('f-issue-project')?.value || '';
        state.date = document.getElementById('f-issue-date')?.value || '';
        state.area = document.getElementById('f-issue-area')?.value || '';
        state.team = document.getElementById('f-issue-team')?.value || '';
        state.requester = document.getElementById('f-issue-requester')?.value || '';
        state.note = document.getElementById('f-issue-note')?.value || '';
    } else if (mode === 'materialreturn') {
        state.project = document.getElementById('f-return-project')?.value || '';
        state.date = document.getElementById('f-return-date')?.value || '';
        state.warehouse = document.getElementById('f-return-warehouse')?.value || '';
        state.returnFrom = document.getElementById('f-return-from')?.value || '';
        state.returner = document.getElementById('f-return-returner')?.value || '';
        state.note = document.getElementById('f-return-note')?.value || '';
    }
    _itemSelectorState._parentState = state;
}

// ====== KHÔI PHỤC TRẠNG THÁI INPUT CỦA MODAL CHA ======
function _restoreParentState(mode) {
    const state = _itemSelectorState._parentState;
    if (!state || Object.keys(state).length === 0) return;
    if (mode === 'mr') {
        const project = document.getElementById('f-mr-project');
        const needDate = document.getElementById('f-mr-needdate');
        const purpose = document.getElementById('f-mr-purpose');
        const requester = document.getElementById('f-mr-requester');
        const note = document.getElementById('f-mr-note');
        if (project) project.value = state.project || '';
        if (needDate) needDate.value = state.needDate || '';
        if (purpose) purpose.value = state.purpose || '';
        if (requester) requester.value = state.requester || '';
        if (note) note.value = state.note || '';
    } else if (mode === 'pr') {
        // ...
    } else if (mode === 'po') {
        // ...
    } else if (mode === 'issue') {
        // ...
    } else if (mode === 'materialreturn') {
        // ...
    }
}

// ====== HÀM MỞ MODAL ======
async function openItemSelector(options) {
    const { selectedItems = [], callback, mode = 'mr' } = options || {};
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        _itemSelectorState._parentContent = modalContent.innerHTML;
        _saveParentState(mode);
    }
    _itemSelectorState.selectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        displayName: item.displayName || item.itemName || '',
        itemCode: item.itemCode || '',
        unit: item.unit || '',
        standardPrice: item.standardPrice || 0
    }));
    _itemSelectorState.callback = callback || null;
    _itemSelectorState.mode = mode;
    _itemSelectorState.filter = '';
    _itemSelectorState.page = 1;
    _itemSelectorState._showingSelected = false;
    _itemSelectorState._expandedAlias = null;
    await _loadItems();
    _renderModal();
    document.getElementById('modal').classList.add('active');
}

// ====== ĐÓNG MODAL ======
function closeItemSelector() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (content && _itemSelectorState._parentContent) {
        content.innerHTML = _itemSelectorState._parentContent;
        _itemSelectorState._parentContent = '';
        _restoreParentState(_itemSelectorState.mode);
    }
    modal.classList.remove('active');
}

// ====== ÁP DỤNG LỰA CHỌN (KHÔNG ĐÓNG MODAL CHA) ======
function applyItemSelection() {
    // Khôi phục nội dung cha
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (content && _itemSelectorState._parentContent) {
        content.innerHTML = _itemSelectorState._parentContent;
        _itemSelectorState._parentContent = '';
        _restoreParentState(_itemSelectorState.mode);
        modal.classList.add('active');
    }
    // Gọi callback
    if (typeof _itemSelectorState.callback === 'function') {
        const selected = _itemSelectorState.selectedItems.map(s => ({
            itemId: s.itemId,
            quantity: s.quantity,
            displayName: s.displayName,
            itemCode: s.itemCode,
            unit: s.unit,
            standardPrice: s.standardPrice
        }));
        _itemSelectorState.callback(selected);
    }
    _renderParentItems();
}

// ====== ĐÓNG MODAL SAU KHI LƯU (ĐÓNG CẢ MODAL CHA) ======
function closeItemSelectorAfterSave() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (content && _itemSelectorState._parentContent) {
        content.innerHTML = _itemSelectorState._parentContent;
        _itemSelectorState._parentContent = '';
        _restoreParentState(_itemSelectorState.mode);
        if (typeof _itemSelectorState.callback === 'function') {
            const selected = _itemSelectorState.selectedItems.map(s => ({
                itemId: s.itemId,
                quantity: s.quantity,
                displayName: s.displayName,
                itemCode: s.itemCode,
                unit: s.unit,
                standardPrice: s.standardPrice
            }));
            _itemSelectorState.callback(selected);
        }
        _renderParentItems();
    }
    modal.classList.remove('active');
}

// ====== RENDER LẠI DANH SÁCH VẬT TƯ CỦA MODAL CHA ======
function _renderParentItems() {
    if (_itemSelectorState.mode === 'mr' && typeof renderMRSelectedItems === 'function') {
        renderMRSelectedItems();
    } else if (_itemSelectorState.mode === 'pr' && typeof renderPRSelectedItems === 'function') {
        renderPRSelectedItems();
    } else if (_itemSelectorState.mode === 'po' && typeof renderPOSelectedItems === 'function') {
        renderPOSelectedItems();
    } else if (_itemSelectorState.mode === 'issue' && typeof renderIssueSelectedItems === 'function') {
        renderIssueSelectedItems();
    } else if (_itemSelectorState.mode === 'materialreturn' && typeof renderReturnSelectedItems === 'function') {
        renderReturnSelectedItems();
    }
}

// ====== TẢI DỮ LIỆU VẬT TƯ (NHÓM THEO CODE) ======
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

        const groups = {};
        filtered.forEach(item => {
            if (!groups[item.code]) {
                groups[item.code] = [];
            }
            groups[item.code].push(item);
        });

        const groupedItems = [];
        Object.keys(groups).forEach(code => {
            const items = groups[code];
            const mainItem = items.find(i => i.isMain === true) || items[0];
            const aliasItems = items.filter(i => i.id !== mainItem.id);
            aliasItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            groupedItems.push({
                code: code,
                mainItem: mainItem,
                aliasItems: aliasItems,
                allItems: items
            });
        });

        groupedItems.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

        _itemSelectorState.groupedItems = groupedItems;
        _itemSelectorState.totalItems = groupedItems.length;
        const perPage = _itemSelectorState.perPage;
        _itemSelectorState.totalPages = Math.max(1, Math.ceil(_itemSelectorState.totalItems / perPage));
        if (_itemSelectorState.page > _itemSelectorState.totalPages) {
            _itemSelectorState.page = _itemSelectorState.totalPages;
        }
    } catch (error) {
        showError('Không thể tải danh sách vật tư: ' + error.message);
        _itemSelectorState.groupedItems = [];
        _itemSelectorState.totalItems = 0;
        _itemSelectorState.totalPages = 1;
    }
    _itemSelectorState.loading = false;
}

// ====== TOGGLE DROPDOWN ALIAS (CHỈ MỞ/ĐÓNG, KHÔNG RESET) ======
function toggleAliasDropdown(code) {
    if (_itemSelectorState._expandedAlias === code) {
        _itemSelectorState._expandedAlias = null;
    } else {
        _itemSelectorState._expandedAlias = code;
    }
    _renderModal();
}

// ====== RESET VỀ TÊN CHÍNH VÀ ĐÓNG DROPDOWN ======
function resetAndCloseAliasDropdown(code) {
    const group = _itemSelectorState.groupedItems.find(g => g.code === code);
    if (group) {
        const selectedIdx = _itemSelectorState.selectedItems.findIndex(s => s.itemCode === code);
        if (selectedIdx !== -1) {
            _itemSelectorState.selectedItems[selectedIdx] = {
                itemId: group.mainItem.id,
                quantity: _itemSelectorState.selectedItems[selectedIdx].quantity || 1,
                displayName: group.mainItem.name,
                itemCode: group.mainItem.code,
                unit: group.mainItem.unit,
                standardPrice: group.mainItem.standardPrice
            };
            _updateSelectedCount();
        }
    }
    _itemSelectorState._expandedAlias = null;
    _renderModal();
}

// ====== CHỌN ALIAS (GIỮ NGUYÊN DROPDOWN MỞ) ======
function selectAlias(code, aliasId, aliasName) {
    const group = _itemSelectorState.groupedItems.find(g => g.code === code);
    if (!group) return;

    const aliasItem = group.allItems.find(i => i.id === aliasId);
    if (!aliasItem) return;

    const existingIdx = _itemSelectorState.selectedItems.findIndex(s => s.itemCode === code);
    if (existingIdx !== -1) {
        _itemSelectorState.selectedItems[existingIdx] = {
            itemId: aliasItem.id,
            quantity: _itemSelectorState.selectedItems[existingIdx].quantity || 1,
            displayName: aliasItem.name,
            itemCode: aliasItem.code,
            unit: aliasItem.unit,
            standardPrice: aliasItem.standardPrice
        };
    } else {
        _itemSelectorState.selectedItems.push({
            itemId: aliasItem.id,
            quantity: 1,
            displayName: aliasItem.name,
            itemCode: aliasItem.code,
            unit: aliasItem.unit,
            standardPrice: aliasItem.standardPrice
        });
    }

    // Không đóng dropdown để user có thể tiếp tục chọn
    _updateSelectedCount();
    _renderModal();
    showSuccess(`Đã chọn ${aliasItem.name}`);
}

// ====== RENDER MODAL CHỌN VẬT TƯ ======
function _renderModal() {
    const state = _itemSelectorState;
    const groupedItems = state.groupedItems;
    const selectedMap = {};
    state.selectedItems.forEach(s => {
        selectedMap[s.itemCode] = s;
    });

    const perPage = state.perPage;
    const page = state.page;
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, groupedItems.length);
    const pageItems = groupedItems.slice(start, end);

    let itemsHtml = '';
    if (pageItems.length === 0) {
        itemsHtml = `<tr><td colspan="6" style="text-align:center; color:#999;">Không tìm thấy vật tư</td></tr>`;
    } else {
        pageItems.forEach(group => {
            const { code, mainItem, aliasItems } = group;
            const selected = selectedMap[code];
            const checked = selected ? 'checked' : '';
            const qty = selected ? selected.quantity : 1;
            const displayName = selected ? selected.displayName : mainItem.name;
            const aliasCount = aliasItems.length;

            let aliasDropdownHtml = '';
            if (state._expandedAlias === code && aliasCount > 0) {
                aliasDropdownHtml = `
                    <div style="position:absolute; background:white; border:1px solid #ccc; border-radius:4px; padding:4px; z-index:100; min-width:150px; box-shadow:0 2px 8px rgba(0,0,0,0.15); margin-top:4px;">
                        ${aliasItems.map(alias => `
                            <div style="padding:4px 8px; cursor:pointer; border-bottom:1px solid #f0f0f0; ${alias.id === selected?.itemId ? 'background:#e8f4fd;' : ''}"
                                 onclick="event.stopPropagation(); selectAlias('${code}', ${alias.id}, '${alias.name.replace(/'/g, "\\'")}')">
                                ${alias.name} ${alias.id === selected?.itemId ? '✅' : ''}
                            </div>
                        `).join('')}
                        <div style="padding:4px 8px; cursor:pointer; background:#f0f0f0; border-radius:0 0 4px 4px; color:#e74c3c;"
                             onclick="event.stopPropagation(); resetAndCloseAliasDropdown('${code}')">
                            <i class="fas fa-times"></i> Đóng (quay về tên chính)
                        </div>
                    </div>
                `;
            }

            const aliasBadge = aliasCount > 0 ? `
                <span style="cursor:pointer; color:#1a3c6e; font-size:12px; margin-left:8px; background:#f0f4f8; padding:2px 8px; border-radius:12px; border:1px solid #e2e8f0;"
                      onclick="event.stopPropagation(); toggleAliasDropdown('${code}')">
                    +${aliasCount} tên khác
                    ${state._expandedAlias === code ? '▲' : '▼'}
                </span>
            ` : '';

            itemsHtml += `
                <tr style="position:relative;">
                    <td style="text-align:center;">
                        <input type="checkbox" class="item-selector-checkbox" data-item-code="${code}" ${checked}>
                    </td>
                    <td><strong>${code}</strong></td>
                    <td>
                        ${displayName}
                        ${aliasBadge}
                        ${aliasDropdownHtml}
                    </td>
                    <td>${mainItem.itemGroup || '--'}</td>
                    <td>${mainItem.unit || '--'}</td>
                    <td style="text-align:right;">${(mainItem.standardPrice || 0).toLocaleString()}</td>
                    <td>
                        <input type="number" class="item-selector-qty" data-item-code="${code}" value="${qty}" min="0.01" step="0.01" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;">
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
                <input type="text" id="item-selector-filter" placeholder="Tìm theo mã, tên, nhóm..." style="flex:1; min-width:200px; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${state.filter}">
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

    const searchInput = document.getElementById('item-selector-filter');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            _itemSelectorState.filter = searchInput.value;
            _itemSelectorState.page = 1;
            _loadItems().then(() => _renderModal());
        }, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }

    document.querySelectorAll('.item-selector-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const code = this.dataset.itemCode;
            const group = _itemSelectorState.groupedItems.find(g => g.code === code);
            if (!group) return;

            const qtyInput = document.querySelector(`.item-selector-qty[data-item-code="${code}"]`);
            const qty = parseFloat(qtyInput?.value) || 1;

            if (this.checked) {
                const existing = _itemSelectorState.selectedItems.find(s => s.itemCode === code);
                if (existing) {
                    existing.quantity = qty;
                } else {
                    _itemSelectorState.selectedItems.push({
                        itemId: group.mainItem.id,
                        quantity: qty,
                        displayName: group.mainItem.name,
                        itemCode: group.mainItem.code,
                        unit: group.mainItem.unit,
                        standardPrice: group.mainItem.standardPrice
                    });
                }
            } else {
                const idx = _itemSelectorState.selectedItems.findIndex(s => s.itemCode === code);
                if (idx !== -1) _itemSelectorState.selectedItems.splice(idx, 1);
            }
            _updateSelectedCount();
        });
    });

    document.querySelectorAll('.item-selector-qty').forEach(input => {
        input.addEventListener('change', function() {
            const code = this.dataset.itemCode;
            const qty = parseFloat(this.value) || 1;
            if (qty <= 0) {
                this.value = 1;
                return;
            }
            const selected = _itemSelectorState.selectedItems.find(s => s.itemCode === code);
            if (selected) {
                selected.quantity = qty;
            }
        });
    });

    // Click ra ngoài để đóng dropdown (KHÔNG reset)
    document.addEventListener('click', function(e) {
        if (_itemSelectorState._expandedAlias) {
            const code = _itemSelectorState._expandedAlias;
            if (!e.target.closest('.alias-dropdown-container')) {
                toggleAliasDropdown(code);
            }
        }
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
        const group = _itemSelectorState.groupedItems.find(g => g.code === item.itemCode);
        const aliasOptions = group ? group.allItems.map(alias =>
            `<option value="${alias.id}" ${alias.id === item.itemId ? 'selected' : ''}>${alias.name}</option>`
        ).join('') : '';

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
            let found = null;
            for (const group of _itemSelectorState.groupedItems) {
                const item = group.allItems.find(i => i.id === itemId);
                if (item) {
                    found = item;
                    break;
                }
            }
            if (found) {
                newItems.push({
                    itemId: found.id,
                    quantity: quantity,
                    displayName: found.name,  // Lấy tên từ found
                    itemCode: found.code,
                    unit: found.unit,
                    standardPrice: found.standardPrice
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

// ====== XÁC NHẬN CHỌN VẬT TƯ (ÁP DỤNG VÀ ĐÓNG MODAL CON, GIỮ MODAL CHA) ======
function confirmItemSelection() {
    const count = _itemSelectorState.selectedItems.length;
    if (count === 0) {
        showWarning('Bạn chưa chọn vật tư nào!');
        return;
    }
    applyItemSelection();
    showSuccess(`Đã chọn ${count} vật tư.`);
}

// ====== HỦY TIẾN TRÌNH (QUAY LẠI) ======
function cancelItemSelection() {
    if (confirm('Bạn có chắc muốn hủy tiến trình chọn vật tư?')) {
        closeItemSelector();
    }
}

// ====== CÁC HÀM GLOBAL ======

window.itemSelectorSelectAll = function() {
    const checkboxes = document.querySelectorAll('.item-selector-checkbox');
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            cb.checked = true;
            const code = cb.dataset.itemCode;
            const group = _itemSelectorState.groupedItems.find(g => g.code === code);
            if (group) {
                const qtyInput = document.querySelector(`.item-selector-qty[data-item-code="${code}"]`);
                const qty = parseFloat(qtyInput?.value) || 1;
                const existing = _itemSelectorState.selectedItems.find(s => s.itemCode === code);
                if (!existing) {
                    _itemSelectorState.selectedItems.push({
                        itemId: group.mainItem.id,
                        quantity: qty,
                        displayName: group.mainItem.name,
                        itemCode: group.mainItem.code,
                        unit: group.mainItem.unit,
                        standardPrice: group.mainItem.standardPrice
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
        if (cb.checked) {
            cb.checked = false;
            const code = cb.dataset.itemCode;
            const idx = _itemSelectorState.selectedItems.findIndex(s => s.itemCode === code);
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

// ====== EXPORT ======
window.openItemSelector = openItemSelector;
window.closeItemSelector = closeItemSelector;
window.closeItemSelectorAfterSave = closeItemSelectorAfterSave;
window.applyItemSelection = applyItemSelection;
window.confirmItemSelection = confirmItemSelection;
window.cancelItemSelection = cancelItemSelection;
window.showSelectedItemsModal = showSelectedItemsModal;
window.saveSelectedItems = saveSelectedItems;
window.closeSelectedModal = closeSelectedModal;
window.selectAlias = selectAlias;
window.toggleAliasDropdown = toggleAliasDropdown;
window.resetAndCloseAliasDropdown = resetAndCloseAliasDropdown;

console.log('✅ Item selector modal updated – now preserves parent input values and correctly renders selected items after confirmation.');