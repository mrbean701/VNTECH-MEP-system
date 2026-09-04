// ================================================================
// MATERIAL RETURN - Hoàn trả vật tư - ĐÃ TÍCH HỢP PHÂN QUYỀN
// ================================================================

// ====== STATE ======
const materialReturnState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    projectFilter: '',
    warehouseFilter: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};

// ====== DEBOUNCE FILTER ======
const debouncedReturnFilter = debounce(() => {
    materialReturnState.page = 1;
    renderMaterialReturns();
}, 300);

// ====== HÀM TẠO MÃ TỰ ĐỘNG ======
function generateReturnCode() {
    return 'MRET-' + String(Date.now()).slice(-6);
}

// ====== RENDER TRANG ======
async function renderMaterialReturnPage() {
    console.log('🔄 renderMaterialReturnPage được gọi');

    let page = document.getElementById('page-material-return');
    if (!page) {
        const content = document.querySelector('.content');
        if (!content) {
            console.error('❌ Không tìm thấy .content');
            return;
        }
        page = document.createElement('div');
        page.className = 'page';
        page.id = 'page-material-return';
        const container = document.createElement('div');
        container.id = 'material-return-container';
        page.appendChild(container);
        content.appendChild(page);
        console.log('✅ Đã tạo page-material-return');
    } else {
        if (!document.getElementById('material-return-container')) {
            const container = document.createElement('div');
            container.id = 'material-return-container';
            page.appendChild(container);
        }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');

    if (!hasPermission('materialreturn.view')) {
        document.getElementById('material-return-container').innerHTML = `
            <div style="padding:20px; text-align:center; color:#e74c3c;">
                <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                Bạn không có quyền xem danh sách hoàn trả
            </div>
        `;
        return;
    }

    await renderMaterialReturns();
}

// ====== HÀM FILTER DỮ LIỆU ======
function filterReturnData(returns, projects, warehouses) {
    const { filterText, statusFilter, projectFilter, warehouseFilter } = materialReturnState;
    const keyword = filterText.toLowerCase().trim();

    return returns.filter(item => {
        let matchKeyword = true;
        if (keyword) {
            const codeMatch = (item.code || '').toLowerCase().includes(keyword);
            const projectNameMatch = (item.projectName || '').toLowerCase().includes(keyword);
            const projectCodeMatch = (item.projectCode || '').toLowerCase().includes(keyword);
            const returnFromMatch = (item.returnFrom || '').toLowerCase().includes(keyword);
            const returnerMatch = (item.returner || '').toLowerCase().includes(keyword);

            let itemsMatch = false;
            try {
                if (item.items) {
                    const items = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                    itemsMatch = items.some(it => {
                        const itemName = it.displayName || getItemName(it.itemId) || '';
                        const itemCode = getItemCode(it.itemId) || '';
                        return itemName.toLowerCase().includes(keyword) ||
                               itemCode.toLowerCase().includes(keyword);
                    });
                }
            } catch (e) {}

            matchKeyword = codeMatch || projectNameMatch || projectCodeMatch || 
                           returnFromMatch || returnerMatch || itemsMatch;
        }

        const matchStatus = statusFilter ? item.status === statusFilter : true;

        let matchProject = true;
        if (projectFilter) {
            const selectedProject = projects.find(p => p.code === projectFilter || p.id === parseInt(projectFilter));
            if (selectedProject) {
                matchProject = item.projectCode === selectedProject.code;
            } else {
                matchProject = false;
            }
        }

        let matchWarehouse = true;
        if (warehouseFilter) {
            const selectedWarehouse = warehouses.find(w => w.id === parseInt(warehouseFilter) || w.code === warehouseFilter);
            if (selectedWarehouse) {
                matchWarehouse = item.warehouseId === selectedWarehouse.id;
            } else {
                matchWarehouse = false;
            }
        }

        return matchKeyword && matchStatus && matchProject && matchWarehouse;
    });
}

// ====== HÀM SORT DỮ LIỆU ======
function sortReturnData(data) {
    const { sortBy, sortOrder } = materialReturnState;
    const order = sortOrder === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';

        if (sortBy === 'projectName') {
            valA = a.projectName || a.projectCode || '';
            valB = b.projectName || b.projectCode || '';
        } else if (sortBy === 'createdAt') {
            valA = new Date(a.createdAt || 0);
            valB = new Date(b.createdAt || 0);
        } else if (sortBy === 'returnDate') {
            valA = new Date(a.returnDate || 0);
            valB = new Date(b.returnDate || 0);
        } else if (sortBy === 'status') {
            const statusOrder = { 'DRAFT': 0, 'PENDING': 1, 'APPROVED': 2, 'CONFIRMED': 3, 'REJECTED': 4 };
            valA = statusOrder[a.status] || 0;
            valB = statusOrder[b.status] || 0;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
    });
}

// ====== RENDER DANH SÁCH ======
async function renderMaterialReturns(page = null) {
    const container = document.getElementById('material-return-container');
    if (!container) {
        console.error('❌ Không tìm thấy container');
        return;
    }

    try {
        const [returns, projects, warehouses] = await Promise.all([
            api.getMaterialReturns(),
            api.getProjects(),
            api.getWarehouses()
        ]);
        window._projectsCache = projects;
        window._warehousesCache = warehouses;
        saveData('projects', projects);
        saveData('warehouses', warehouses);

        if (page) materialReturnState.page = page;

        let filtered = filterReturnData(returns, projects, warehouses);
        filtered = sortReturnData(filtered);

        const perPage = getPageSize('return');
        materialReturnState.perPage = perPage;
        const paging = paginate(filtered, materialReturnState.page, perPage);

        const canCreate = hasPermission('materialreturn.create');
        const btnCreate = document.getElementById('btn-create-return');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="return-filter" placeholder="Tìm theo mã, dự án, vật tư..." style="flex:2;" value="${materialReturnState.filterText}">
                <select id="return-status-filter" style="flex:1;">
                    <option value="">Tất cả</option>
                    <option value="DRAFT" ${materialReturnState.statusFilter === 'DRAFT' ? 'selected' : ''}>DRAFT</option>
                    <option value="PENDING" ${materialReturnState.statusFilter === 'PENDING' ? 'selected' : ''}>PENDING</option>
                    <option value="APPROVED" ${materialReturnState.statusFilter === 'APPROVED' ? 'selected' : ''}>APPROVED</option>
                    <option value="CONFIRMED" ${materialReturnState.statusFilter === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED</option>
                    <option value="REJECTED" ${materialReturnState.statusFilter === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
                </select>
                <select id="return-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${materialReturnState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="return-warehouse-filter" style="flex:1;">
                    <option value="">Tất cả kho</option>
                    ${warehouses.map(w => `<option value="${w.id}" ${materialReturnState.warehouseFilter == w.id ? 'selected' : ''}>${w.code} - ${w.name}</option>`).join('')}
                </select>
                <select id="return-sort" style="flex:1;">
                    <option value="createdAt_desc" ${materialReturnState.sortBy === 'createdAt' && materialReturnState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${materialReturnState.sortBy === 'createdAt' && materialReturnState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="returnDate_desc" ${materialReturnState.sortBy === 'returnDate' && materialReturnState.sortOrder === 'desc' ? 'selected' : ''}>Ngày trả (mới nhất)</option>
                    <option value="returnDate_asc" ${materialReturnState.sortBy === 'returnDate' && materialReturnState.sortOrder === 'asc' ? 'selected' : ''}>Ngày trả (cũ nhất)</option>
                    <option value="code_asc" ${materialReturnState.sortBy === 'code' && materialReturnState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${materialReturnState.sortBy === 'code' && materialReturnState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${materialReturnState.sortBy === 'projectName' && materialReturnState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${materialReturnState.sortBy === 'projectName' && materialReturnState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="status" ${materialReturnState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetReturnFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Dự án</th>
                            <th>Ngày trả</th>
                            <th>Kho nhận</th>
                            <th>Trả từ</th>
                            <th>Người trả</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="8" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const item of paging.items) {
            const statusBadge = getStatusBadge(item.status);
            const projectId = getProjectIdByCode(item.projectCode);
            const projectDisplay = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId})">${item.projectName || item.projectCode}</span>` :
                (item.projectName || item.projectCode || '');

            const whName = getWarehouseCode(item.warehouseId);
            const actions = getReturnActions(item);

            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewMaterialReturn(${item.id})">${item.code}</td>
                <td>${projectDisplay}</td>
                <td>${item.returnDate || ''}</td>
                <td>${whName}</td>
                <td>${item.returnFrom || ''}</td>
                <td>${item.returner || ''}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderMaterialReturns', 'return');
        container.innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('return-filter');
        const statusSelect = document.getElementById('return-status-filter');
        const projectSelect = document.getElementById('return-project-filter');
        const warehouseSelect = document.getElementById('return-warehouse-filter');
        const sortSelect = document.getElementById('return-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedReturnFilter);
            filterInput.addEventListener('input', function(e) {
                materialReturnState.filterText = this.value;
                debouncedReturnFilter();
            });
        }

        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedReturnFilter);
            statusSelect.addEventListener('change', function(e) {
                materialReturnState.statusFilter = this.value;
                debouncedReturnFilter();
            });
        }

        if (projectSelect) {
            projectSelect.removeEventListener('change', debouncedReturnFilter);
            projectSelect.addEventListener('change', function(e) {
                materialReturnState.projectFilter = this.value;
                debouncedReturnFilter();
            });
        }

        if (warehouseSelect) {
            warehouseSelect.removeEventListener('change', debouncedReturnFilter);
            warehouseSelect.addEventListener('change', function(e) {
                materialReturnState.warehouseFilter = this.value;
                debouncedReturnFilter();
            });
        }

        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedReturnFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                materialReturnState.sortBy = sortBy;
                materialReturnState.sortOrder = sortOrder || 'desc';
                debouncedReturnFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách hoàn trả: ' + error.message);
        console.error('renderMaterialReturns error:', error);
    }
}

// ====== RESET FILTER ======
function resetReturnFilters() {
    materialReturnState.filterText = '';
    materialReturnState.statusFilter = '';
    materialReturnState.projectFilter = '';
    materialReturnState.warehouseFilter = '';
    materialReturnState.sortBy = 'createdAt';
    materialReturnState.sortOrder = 'desc';
    materialReturnState.page = 1;
    renderMaterialReturns();
}

// ====== HÀM LẤY ACTION ======
function getReturnActions(item) {
    const user = getUser();
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewMaterialReturn(${item.id})"><i class="fas fa-eye"></i></button>`;

    const canEdit = hasPermission('materialreturn.edit') && 
                   (item.status === 'DRAFT' || item.status === 'PENDING') && 
                   (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editMaterialReturn(${item.id})"><i class="fas fa-edit"></i></button>`;
    }

    const canDelete = hasPermission('materialreturn.delete') && 
                     item.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deleteMaterialReturn(${item.id})"><i class="fas fa-trash"></i></button>`;
    }

    // ✅ SỬA: Gửi duyệt → Xác nhận
    const canSubmit = hasPermission('materialreturn.submit') && 
                     item.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitMaterialReturn(${item.id})">Xác nhận</button>`;
    }

    const canApprove = hasPermission('materialreturn.approve') && item.status === 'PENDING';
    if (canApprove) {
        actions += ` <button class="btn btn-success btn-sm" onclick="approveMaterialReturn(${item.id})">Nhận vật tư</button>`;
        actions += ` <button class="btn btn-danger btn-sm" onclick="rejectMaterialReturn(${item.id})">Từ chối</button>`;
    }

    const canConfirm = hasPermission('materialreturn.confirm') && item.status === 'APPROVED';
    if (canConfirm) {
        actions += ` <button class="btn btn-success btn-sm" onclick="confirmMaterialReturn(${item.id})">Xác nhận hoàn tất</button>`;
    }

    return actions || '-';
}

// ====== BIẾN TOÀN CỤC CHO ITEM SELECTOR ======
let _returnSelectedItems = [];
let _returnMode = 'create';
let _returnEditId = null;

// ====== CALLBACK TỪ MODAL CHỌN VẬT TƯ ======
function returnItemSelectorCallback(selectedItems) {
    _returnSelectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        itemName: item.displayName || item.itemName || getItemName(item.itemId),
        itemCode: item.itemCode || getItemCode(item.itemId),
        unit: item.unit || getItemUnit(item.itemId)
    }));
    renderReturnSelectedItems();
}

function renderReturnSelectedItems() {
    const container = document.getElementById('return-selected-items-container');
    if (!container) return;
    container.innerHTML = _renderReturnSelectedItemsHTML();
    _attachReturnQuantityEvents();
}

function _renderReturnSelectedItemsHTML() {
    const items = _returnSelectedItems || [];
    if (items.length === 0) {
        return '<div style="color:#999; text-align:center; padding:8px;">Chưa chọn vật tư nào</div>';
    }
    let html = '';
    items.forEach((item, index) => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; margin-bottom:4px; background:#f0f4f8; border-radius:4px;">
                <span><strong>${item.itemCode}</strong> - ${item.itemName} (${item.unit})</span>
                <span>Số lượng: <input type="number" class="return-item-qty" data-index="${index}" value="${item.quantity}" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0.01" step="0.01"></span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeReturnItem(${index})"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
    return html;
}

function _attachReturnQuantityEvents() {
    document.querySelectorAll('.return-item-qty').forEach(input => {
        input.removeEventListener('change', _onReturnQtyChange);
        input.addEventListener('change', _onReturnQtyChange);
    });
}

function _onReturnQtyChange(e) {
    const idx = parseInt(this.dataset.index);
    const val = parseFloat(this.value) || 1;
    if (val > 0 && _returnSelectedItems[idx]) {
        _returnSelectedItems[idx].quantity = val;
    } else {
        this.value = _returnSelectedItems[idx]?.quantity || 1;
    }
}

function removeReturnItem(index) {
    if (_returnSelectedItems && _returnSelectedItems.length > index) {
        _returnSelectedItems.splice(index, 1);
        renderReturnSelectedItems();
    }
}

function openItemSelectorForReturn() {
    const selected = _returnSelectedItems || [];
    openItemSelectorHelper(selected, returnItemSelectorCallback, 'materialreturn');
}

// ====== TẠO PHIẾU (MODAL) ======
function showCreateMaterialReturnModal() {
    Promise.all([api.getProjects(), api.getWarehouses(), api.getItems()]).then(([projects, warehouses, items]) => {
        window._itemsCache = items;

        const projectOpts = projects.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
        const whOpts = warehouses.map(w => `<option value="${w.id}">${w.code} - ${w.name}</option>`).join('');
        _returnSelectedItems = [];
        _returnMode = 'create';
        _returnEditId = null;

        showModal('Tạo phiếu hoàn trả vật tư', `
            <div class="form-group">
                <label>Dự án</label>
                <select id="f-return-project"><option value="">-- Chọn --</option>${projectOpts}</select>
            </div>
            <div class="form-group">
                <label>Ngày trả</label>
                <input id="f-return-date" type="date">
            </div>
            <div class="form-group">
                <label>Kho nhận (trả về)</label>
                <select id="f-return-warehouse">${whOpts}</select>
            </div>
            <div class="form-group">
                <label>Trả từ (đội thi công / khu vực)</label>
                <input id="f-return-from" placeholder="Ví dụ: Đội thi công 1, Khu vực A...">
            </div>
            <div class="form-group">
                <label>Người trả</label>
                <input id="f-return-returner" placeholder="Tên người trả">
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForReturn()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="return-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderReturnSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group">
                <label>Ghi chú</label>
                <textarea id="f-return-note" rows="2"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="saveMaterialReturn()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachReturnQuantityEvents();
        }, 100);
    }).catch(err => showError('Không thể tải dữ liệu: ' + err.message));
}

// ====== LƯU PHIẾU ======
async function saveMaterialReturn() {
    if (!hasPermission('materialreturn.create')) {
        showWarning('Bạn không có quyền tạo phiếu hoàn trả!');
        return;
    }

    const projectCode = document.getElementById('f-return-project').value;
    const returnDate = document.getElementById('f-return-date').value;
    const warehouseId = parseInt(document.getElementById('f-return-warehouse').value);
    const returnFrom = document.getElementById('f-return-from').value.trim();
    const returner = document.getElementById('f-return-returner').value.trim();
    const note = document.getElementById('f-return-note').value.trim();

    const items = _returnSelectedItems.map(item => ({
        itemId: item.itemId,
        requestedQty: item.quantity,
        actualQty: item.quantity,
        displayName: item.itemName,
        condition: item.condition || '',
        note: item.note || ''
    }));

    if (!projectCode || !returnDate || !warehouseId || items.length === 0) {
        showError('Vui lòng chọn dự án, ngày trả, kho và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const user = getUser();

        const newReturn = {
            projectCode,
            projectName: proj ? proj.name : '',
            returnDate,
            warehouseId,
            returnFrom: returnFrom || 'Công trường',
            items: JSON.stringify(items),
            returner: returner || user?.name,
            note
        };

        await api.createMaterialReturn(newReturn);
        closeModal();
        _returnSelectedItems = [];
        await renderMaterialReturns();
        showSuccess('Tạo phiếu hoàn trả thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo phiếu: ' + error.message);
    }
}

// ====== XEM CHI TIẾT PHIẾU ======
async function viewMaterialReturn(id) {
    try {
        let item = await api.getMaterialReturnById ? await api.getMaterialReturnById(id) : null;
        if (!item) {
            const returns = await api.getMaterialReturns();
            item = returns.find(i => i.id === id);
            if (!item) {
                showError('Không tìm thấy phiếu!');
                return;
            }
        }

        const items = item.items ? JSON.parse(item.items) : [];
        const itemsHtml = items.map(it => `
            <tr>
                <td>${getItemCode(it.itemId)}</td>
                <td>${it.displayName || getItemName(it.itemId)}</td>
                <td>${getItemUnit(it.itemId)}</td>
                <td>${it.requestedQty}</td>
                <td>${it.actualQty !== undefined ? it.actualQty : it.requestedQty}</td>
                <td>${it.condition || ''}</td>
                <td>${it.note || ''}</td>
            </tr>
        `).join('');

        let stepsConfig = [
            { id: 1, label: 'Tạo phiếu' },
            { id: 2, label: 'Thủ kho nhận' },
            { id: 3, label: 'Xác nhận hoàn tất' }
        ];
        if (item.workflowId) {
            try {
                const wf = await api.getWorkflowById ? await api.getWorkflowById(item.workflowId) : null;
                if (wf && wf.steps) {
                    const steps = JSON.parse(wf.steps);
                    stepsConfig = steps.map(s => ({
                        id: s.step || s.id,
                        label: s.label || `Bước ${s.step || s.id}`
                    }));
                }
            } catch (e) {
                console.warn('Không lấy được workflow steps:', e);
            }
        }
        const progressHtml = renderApprovalProgress(item.status, item.approvalStep || 1, stepsConfig);
        const projectId = getProjectIdByCode(item.projectCode);
        const projectDisplay = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId})">${item.projectName || item.projectCode}</span>` :
            (item.projectName || item.projectCode || '');
        const whName = getWarehouseName(item.warehouseId);

        const itemsTable = `
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>SL đề nghị</th><th>SL thực trả</th><th>Tình trạng</th><th>Ghi chú</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </div>
        `;

        showModal('Chi tiết phiếu hoàn trả', `
            <div class="detail-grid">
                <div><span class="label">Mã phiếu:</span> <span class="value">${item.code}</span></div>
                <div><span class="label">Ngày trả:</span> <span class="value">${item.returnDate || ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectDisplay}</span></div>
                <div><span class="label">Kho nhận:</span> <span class="value">${whName}</span></div>
                <div><span class="label">Trả từ:</span> <span class="value">${item.returnFrom || ''}</span></div>
                <div><span class="label">Người trả:</span> <span class="value">${item.returner || ''}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(item.status)}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${item.createdAt || ''}</span></div>
                ${item.completionDate ? `<div><span class="label">Ngày hoàn tất:</span> <span class="value">${item.completionDate}</span></div>` : ''}
                <div style="grid-column:1/-1;"><span class="label">Tiến độ thực hiện:</span><br>${progressHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Chi tiết vật tư:</span><br>${itemsTable}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${item.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printMaterialReturn(${item.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết phiếu: ' + error.message);
    }
}

// ====== SỬA PHIẾU (DRAFT) ======
async function editMaterialReturn(id) {
    if (!hasPermission('materialreturn.edit')) {
        showWarning('Bạn không có quyền sửa phiếu hoàn trả!');
        return;
    }

    try {
        const returns = await api.getMaterialReturns();
        const item = returns.find(i => i.id === id);
        if (!item) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (item.status !== 'DRAFT') {
            showWarning('Chỉ có thể sửa phiếu ở trạng thái DRAFT.');
            return;
        }

        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.code}" ${p.code === item.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`
        ).join('');
        const warehouses = await api.getWarehouses();
        const whOpts = warehouses.map(w =>
            `<option value="${w.id}" ${w.id === item.warehouseId ? 'selected' : ''}>${w.code} - ${w.name}</option>`
        ).join('');

        let itemsData = [];
        try {
            if (item.items) {
                const items = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                itemsData = items.map(it => ({
                    itemId: it.itemId,
                    requestedQty: it.requestedQty || 0,
                    actualQty: it.actualQty || 0,
                    itemName: it.displayName || getItemName(it.itemId),
                    itemCode: getItemCode(it.itemId),
                    unit: getItemUnit(it.itemId),
                    condition: it.condition || '',
                    note: it.note || ''
                }));
            }
        } catch (e) {}
        _returnSelectedItems = itemsData;
        _returnMode = 'edit';
        _returnEditId = id;

        showModal('Sửa phiếu hoàn trả', `
            <div class="form-group">
                <label>Dự án</label>
                <select id="f-return-project">${projectOpts}</select>
            </div>
            <div class="form-group">
                <label>Ngày trả</label>
                <input id="f-return-date" type="date" value="${item.returnDate || ''}">
            </div>
            <div class="form-group">
                <label>Kho nhận (trả về)</label>
                <select id="f-return-warehouse">${whOpts}</select>
            </div>
            <div class="form-group">
                <label>Trả từ (đội thi công / khu vực)</label>
                <input id="f-return-from" value="${item.returnFrom || ''}">
            </div>
            <div class="form-group">
                <label>Người trả</label>
                <input id="f-return-returner" value="${item.returner || ''}">
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForReturn()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="return-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderReturnSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group">
                <label>Ghi chú</label>
                <textarea id="f-return-note" rows="2">${item.note || ''}</textarea>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateMaterialReturn(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachReturnQuantityEvents();
        }, 100);
    } catch (error) {
        showError('Lỗi khi tải phiếu: ' + error.message);
    }
}

async function updateMaterialReturn(id) {
    const projectCode = document.getElementById('f-return-project').value;
    const returnDate = document.getElementById('f-return-date').value;
    const warehouseId = parseInt(document.getElementById('f-return-warehouse').value);
    const returnFrom = document.getElementById('f-return-from').value.trim();
    const returner = document.getElementById('f-return-returner').value.trim();
    const note = document.getElementById('f-return-note').value.trim();

    const items = _returnSelectedItems.map(item => ({
        itemId: item.itemId,
        requestedQty: item.requestedQty || item.quantity || 0,
        actualQty: item.actualQty || item.quantity || 0,
        displayName: item.itemName || getItemName(item.itemId),
        condition: item.condition || '',
        note: item.note || ''
    }));

    if (!projectCode || !returnDate || !warehouseId || items.length === 0) {
        showError('Vui lòng chọn đầy đủ thông tin và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);

        const updatedReturn = {
            projectCode,
            projectName: proj ? proj.name : '',
            returnDate,
            warehouseId,
            returnFrom: returnFrom || 'Công trường',
            items: JSON.stringify(items),
            returner: returner,
            note
        };

        await api.updateMaterialReturn(id, updatedReturn);
        closeModal();
        _returnSelectedItems = [];
        await renderMaterialReturns();
        showSuccess('Cập nhật phiếu hoàn trả thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật phiếu: ' + error.message);
    }
}

// ====== GỬI DUYỆT ======
async function submitMaterialReturn(id) {
    if (!hasPermission('materialreturn.submit')) {
        showWarning('Bạn không có quyền gửi duyệt phiếu hoàn trả!');
        return;
    }
    try {
        await api.submitMaterialReturn(id);
        await renderMaterialReturns();
        showSuccess('Đã gửi yêu cầu duyệt!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt: ' + error.message);
    }
}

// ====== THỦ KHO NHẬN (APPROVED) ======
async function approveMaterialReturn(id) {
    if (!hasPermission('materialreturn.approve')) {
        showWarning('Bạn không có quyền xác nhận nhập kho hoàn trả!');
        return;
    }

    try {
        const returns = await api.getMaterialReturns();
        const item = returns.find(i => i.id === id);
        if (!item) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (item.status !== 'PENDING') {
            showWarning('Phiếu không ở trạng thái chờ duyệt!');
            return;
        }

        const items = item.items ? JSON.parse(item.items) : [];
        let itemsHtml = items.map((it, idx) => {
            const itemName = getItemName(it.itemId);
            const unit = getItemUnit(it.itemId);
            return `
                <div class="item-row" data-index="${idx}" data-item-id="${it.itemId}">
                    <span style="min-width:150px; font-weight:500;">${itemName} (${unit})</span>
                    <span style="min-width:80px;">Đề nghị: ${it.requestedQty}</span>
                    <input type="number" class="return-actual-qty" value="${it.actualQty !== undefined ? it.actualQty : it.requestedQty}" placeholder="SL thực trả" style="width:100px;" step="0.01">
                    <input type="text" class="return-actual-condition" value="${it.condition || ''}" placeholder="Tình trạng" style="width:120px;">
                    <input type="text" class="return-actual-note" value="${it.note || ''}" placeholder="Ghi chú" style="width:150px;">
                </div>
            `;
        }).join('');

        showModal('Thủ kho nhận vật tư', `
            <div style="margin-bottom:12px;">
                <strong>Phiếu:</strong> ${item.code} - ${item.projectName}
            </div>
            <div style="margin-bottom:12px; color:#2980b9;">
                <i class="fas fa-info-circle"></i> Thủ kho kiểm tra và xác nhận số lượng thực tế, tình trạng vật tư nhập kho.
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <div id="return-edit-items-container">
                    ${itemsHtml}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateMaterialReturnApproval(${id})">Xác nhận nhập kho</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải phiếu: ' + error.message);
    }
}

async function updateMaterialReturnApproval(id) {
    const rows = document.querySelectorAll('#return-edit-items-container .item-row');
    let hasError = false;
    const newItems = [];

    rows.forEach(row => {
        const itemId = parseInt(row.dataset.itemId);
        const actualQty = parseFloat(row.querySelector('.return-actual-qty').value) || 0;
        const condition = row.querySelector('.return-actual-condition').value.trim();
        const note = row.querySelector('.return-actual-note').value.trim();
        if (actualQty < 0) {
            showError(`Số lượng thực trả của ${getItemName(itemId)} không được âm.`);
            hasError = true;
            return;
        }
        newItems.push({ itemId, actualQty, condition, note });
    });

    if (hasError) return;

    try {
        await api.approveMaterialReturn(id, JSON.stringify(newItems));
        closeModal();
        await renderMaterialReturns();
        showSuccess('Đã nhận vật tư và cập nhật tồn kho! Vui lòng đợi Chỉ huy trưởng xác nhận hoàn tất.');
    } catch (error) {
        showError('Lỗi khi xác nhận nhập kho: ' + error.message);
    }
}

// ====== CHỈ HUY TRƯỞNG XÁC NHẬN HOÀN TẤT ======
async function confirmMaterialReturn(id) {
    if (!hasPermission('materialreturn.confirm')) {
        showWarning('Bạn không có quyền xác nhận hoàn tất phiếu hoàn trả!');
        return;
    }
    if (!confirm('Xác nhận hoàn tất phiếu hoàn trả?')) return;
    try {
        await api.confirmMaterialReturn(id);
        await renderMaterialReturns();
        showSuccess('Xác nhận hoàn tất phiếu hoàn trả!');
    } catch (error) {
        showError('Lỗi khi xác nhận: ' + error.message);
    }
}

// ====== TỪ CHỐI ======
async function rejectMaterialReturn(id) {
    if (!hasPermission('materialreturn.reject')) {
        showWarning('Bạn không có quyền từ chối phiếu hoàn trả!');
        return;
    }
    if (!confirm('Từ chối phiếu hoàn trả này?')) return;
    try {
        await api.rejectMaterialReturn(id);
        await renderMaterialReturns();
        showWarning('Đã từ chối phiếu hoàn trả!');
    } catch (error) {
        showError('Lỗi khi từ chối: ' + error.message);
    }
}

// ====== XÓA PHIẾU ======
async function deleteMaterialReturn(id) {
    if (!hasPermission('materialreturn.delete')) {
        showWarning('Bạn không có quyền xóa phiếu hoàn trả!');
        return;
    }
    if (!confirm('Xóa phiếu hoàn trả này?')) return;
    try {
        await api.deleteMaterialReturn(id);
        await renderMaterialReturns();
        showSuccess('Xóa phiếu thành công!');
    } catch (error) {
        showError('Lỗi khi xóa phiếu: ' + error.message);
    }
}

// ====== RENDER PROGRESS ======
function renderReturnProgress(status) {
    const steps = [
        { id: 1, label: 'Tạo phiếu' },
        { id: 2, label: 'Thủ kho nhận' },
        { id: 3, label: 'Xác nhận hoàn tất' }
    ];

    let currentStep = 1;
    if (status === 'PENDING') currentStep = 2;
    else if (status === 'APPROVED') currentStep = 2;
    else if (status === 'CONFIRMED') currentStep = 3;

    return renderApprovalProgress(status, currentStep, steps);
}

// ====== EXPORT EXCEL ======
function exportMaterialReturns() {
    api.getMaterialReturns().then(returns => {
        if (!returns || !returns.length) {
            showWarning('Không có dữ liệu để xuất!');
            return;
        }
        const data = returns.map(item => ({
            'Mã phiếu': item.code,
            'Dự án': item.projectName || item.projectCode || '',
            'Ngày trả': item.returnDate || '',
            'Kho nhận': getWarehouseName(item.warehouseId),
            'Trả từ': item.returnFrom || '',
            'Người trả': item.returner || '',
            'Trạng thái': item.status,
            'Số lượng vật tư': item.items ? JSON.parse(item.items).reduce((sum, it) => sum + it.actualQty, 0) : 0,
            'Ghi chú': item.note || ''
        }));
        exportToExcel(data, 'Danh_sach_hoan_tra', Object.keys(data[0]));
    }).catch(err => {
        showError('Lỗi lấy dữ liệu xuất: ' + err.message);
    });
}

// ====== IN PHIẾU ======
function printMaterialReturn(id) {
    showInfo('Chức năng in đang được phát triển.');
}

// ====== EXPORT RA WINDOW ======
window.renderMaterialReturnPage = renderMaterialReturnPage;
window.renderMaterialReturns = renderMaterialReturns;
window.exportMaterialReturns = exportMaterialReturns;
window.viewMaterialReturn = viewMaterialReturn;
window.editMaterialReturn = editMaterialReturn;
window.submitMaterialReturn = submitMaterialReturn;
window.approveMaterialReturn = approveMaterialReturn;
window.confirmMaterialReturn = confirmMaterialReturn;
window.rejectMaterialReturn = rejectMaterialReturn;
window.deleteMaterialReturn = deleteMaterialReturn;
window.printMaterialReturn = printMaterialReturn;
window.resetReturnFilters = resetReturnFilters;

// Item selector functions
window.returnItemSelectorCallback = returnItemSelectorCallback;
window.renderReturnSelectedItems = renderReturnSelectedItems;
window.removeReturnItem = removeReturnItem;
window.openItemSelectorForReturn = openItemSelectorForReturn;

console.log('✅ Material Return module updated with multi-field search, sort, and advanced filters.');