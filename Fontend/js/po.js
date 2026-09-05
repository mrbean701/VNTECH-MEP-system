// ================================================================
// PO (Purchase Order) - SỬ DỤNG API - HỖ TRỢ WORKFLOW ĐỘNG
// ================================================================

// ====== STATE ======
const poState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    projectFilter: '',
    vendorFilter: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};

// ====== DEBOUNCE FILTER ======
const debouncedPOFilter = debounce(() => {
    poState.page = 1;
    renderPO();
}, 300);

// ====== BIẾN TOÀN CỤC CHO ITEM SELECTOR ======
let _poSelectedItems = [];
let _poMode = 'create';
let _poEditId = null;

// ====== HÀM LẤY ACTION (CÓ KIỂM TRA canApprove + currentStep) ======
function getPOActions(po, statuses) {
    const user = getUser();
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewPO(${po.id})"><i class="fas fa-eye"></i></button>`;

    const canEdit = hasPermission('po.edit') && 
                   (po.status === 'DRAFT' || po.status === 'PENDING') && 
                   (user?.role === 'ADMIN' || user?.id === po.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editPO(${po.id})"><i class="fas fa-edit"></i></button>`;
    }

    const canDelete = hasPermission('po.delete') && 
                     (user?.role === 'ADMIN' || user?.id === po.createdBy) && 
                     po.status === 'DRAFT';
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deletePO(${po.id})"><i class="fas fa-trash"></i></button>`;
    }

    const canSubmit = hasPermission('po.submit') && 
                     po.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === po.createdBy);
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitPO(${po.id})">Xác nhận</button>`;
    }

    // ✅ Nút Approve/Reject: kiểm tra currentStep (lấy từ workflow_progress)
    const pendingStatuses = ['PENDING', 'PENDING_PLANNING', 'PENDING_PROJECT', 'PENDING_CEO', 
                             'PLANNING_APPROVED', 'PROJECT_APPROVED'];
    if (pendingStatuses.includes(po.status) && !po.isCompleted) {
        let currentStep = po.approvalStep || 1;
        if (po._progress && po._progress.currentStep) {
            currentStep = po._progress.currentStep;
        }
        if (canApprove(currentStep, 'po.approve', null)) {
            actions += ` <button class="btn btn-success btn-sm" onclick="approvePO(${po.id})">Duyệt</button>`;
            actions += ` <button class="btn btn-danger btn-sm" onclick="rejectPO(${po.id})">Từ chối</button>`;
        }
    }

    // ✅ Nút tạo GRN (khi PO đã APPROVED và user có permission grn.create và approvalLevel = 0)
    const canCreateGRN = hasPermission('grn.create') &&
                         (po.status === 'APPROVED' || po.isApproved) &&
                         !po.isCompleted &&
                         getUserApprovalLevel() === 0;
    if (canCreateGRN) {
        actions += ` <button class="btn btn-info btn-sm" onclick="showAddGRNFromPO(${po.id})">Tạo GRN</button>`;
    }

    return actions || '-';
}

// ====== HÀM FILTER DỮ LIỆU PO ======
function filterPOData(pos, projects, vendors) {
    const { filterText, statusFilter, projectFilter, vendorFilter } = poState;
    const keyword = filterText.toLowerCase().trim();

    return pos.filter(po => {
        let matchKeyword = true;
        if (keyword) {
            const codeMatch = (po.code || '').toLowerCase().includes(keyword);
            const projectNameMatch = (po.projectName || '').toLowerCase().includes(keyword);
            const projectCodeMatch = (po.projectCode || '').toLowerCase().includes(keyword);
            const vendorNameMatch = (po.vendorName || '').toLowerCase().includes(keyword);
            const vendorCodeMatch = (po.vendorCode || '').toLowerCase().includes(keyword);

            let itemsMatch = false;
            try {
                if (po.items) {
                    const items = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
                    itemsMatch = items.some(item => {
                        const itemName = item.displayName || getItemName(item.itemId) || '';
                        const itemCode = getItemCode(item.itemId) || '';
                        return itemName.toLowerCase().includes(keyword) ||
                               itemCode.toLowerCase().includes(keyword);
                    });
                }
            } catch (e) {}

            matchKeyword = codeMatch || projectNameMatch || projectCodeMatch ||
                           vendorNameMatch || vendorCodeMatch || itemsMatch;
        }

        const matchStatus = statusFilter ? po.status === statusFilter : true;

        let matchProject = true;
        if (projectFilter) {
            const selectedProject = projects.find(p => p.code === projectFilter || p.id === parseInt(projectFilter));
            matchProject = selectedProject ? po.projectCode === selectedProject.code : false;
        }

        let matchVendor = true;
        if (vendorFilter) {
            const selectedVendor = vendors.find(v => v.code === vendorFilter || v.name === vendorFilter);
            matchVendor = po.vendorCode === vendorFilter || po.vendorName === vendorFilter;
            if (!matchVendor && selectedVendor) {
                matchVendor = po.vendorCode === selectedVendor.code || po.vendorName === selectedVendor.name;
            }
        }

        return matchKeyword && matchStatus && matchProject && matchVendor;
    });
}

// ====== HÀM SORT DỮ LIỆU PO ======
function sortPOData(data) {
    const { sortBy, sortOrder } = poState;
    const order = sortOrder === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';

        if (sortBy === 'projectName') {
            valA = a.projectName || a.projectCode || '';
            valB = b.projectName || b.projectCode || '';
        } else if (sortBy === 'vendorName') {
            valA = a.vendorName || a.vendorCode || '';
            valB = b.vendorName || b.vendorCode || '';
        } else if (sortBy === 'createdAt') {
            valA = new Date(a.createdAt || 0);
            valB = new Date(b.createdAt || 0);
        } else if (sortBy === 'status') {
            const statusOrder = { 'DRAFT': 0, 'PENDING': 1, 'PENDING_CEO': 2, 'APPROVED': 3, 'REJECTED': 4, 'COMPLETED': 5 };
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

// ====== RENDER DANH SÁCH PO ======
async function renderPO(page = null) {
    try {
        const [pos, projects, vendors, statuses] = await Promise.all([
            api.getPOs(),
            api.getProjects(),
            api.getVendors(),
            api.getStatuses('po').catch(() => [])
        ]);
        
        window._projectsCache = projects;
        window._vendorsCache = vendors;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['po'] = statuses;
        
        saveData('projects', projects);
        saveData('vendors', vendors);

        if (page) poState.page = page;

        let filtered = filterPOData(pos, projects, vendors);
        filtered = sortPOData(filtered);

        const perPage = getPageSize('po');
        poState.perPage = perPage;
        const paging = paginate(filtered, poState.page, perPage);

        const canCreate = hasPermission('po.create');
        const btnCreate = document.getElementById('btn-create-po');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="po-filter" placeholder="Tìm theo mã, dự án, NCC, vật tư..." style="flex:2;" value="${poState.filterText}">
                <select id="po-status-filter" style="flex:1;">
                    <option value="">Tất cả trạng thái</option>
                    ${statuses.map(s => `<option value="${s.code}" ${poState.statusFilter === s.code ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <select id="po-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${poState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="po-vendor-filter" style="flex:1;">
                    <option value="">Tất cả NCC</option>
                    ${vendors.map(v => `<option value="${v.code}" ${poState.vendorFilter === v.code ? 'selected' : ''}>${v.code} - ${v.name}</option>`).join('')}
                </select>
                <select id="po-sort" style="flex:1;">
                    <option value="createdAt_desc" ${poState.sortBy === 'createdAt' && poState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${poState.sortBy === 'createdAt' && poState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="code_asc" ${poState.sortBy === 'code' && poState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${poState.sortBy === 'code' && poState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${poState.sortBy === 'projectName' && poState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${poState.sortBy === 'projectName' && poState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="vendorName_asc" ${poState.sortBy === 'vendorName' && poState.sortOrder === 'asc' ? 'selected' : ''}>NCC (A→Z)</option>
                    <option value="vendorName_desc" ${poState.sortBy === 'vendorName' && poState.sortOrder === 'desc' ? 'selected' : ''}>NCC (Z→A)</option>
                    <option value="status" ${poState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetPOFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã PO</th>
                            <th>Dự án</th>
                            <th>Nhà cung cấp</th>
                            <th>Vật tư (SL)</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="6" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const p of paging.items) {
            let itemsStr = '';
            try {
                if (p.items) {
                    const items = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
                    itemsStr = items.map(it => {
                        const name = it.displayName || getItemName(it.itemId) || 'N/A';
                        return `${name} (${it.quantity})`;
                    }).join(', ');
                }
            } catch (e) { itemsStr = 'Lỗi parse'; }

            const statusBadge = getStatusBadgeWithInfo(p.status, statuses);
            const actions = getPOActions(p, statuses);
            const projectId = getProjectIdByCode(p.projectCode);
            const projectLink = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewProject(${projectId})">${p.projectName || p.projectCode || '--'}</span>` :
                (p.projectName || p.projectCode || '--');
            const vendorName = p.vendorName || p.vendorCode || '--';

            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewPO(${p.id})">${p.code || '--'}</td>
                <td>${projectLink}</td>
                <td>${vendorName}</td>
                <td>${itemsStr}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderPO', 'po');
        document.getElementById('po-container').innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('po-filter');
        const statusSelect = document.getElementById('po-status-filter');
        const projectSelect = document.getElementById('po-project-filter');
        const vendorSelect = document.getElementById('po-vendor-filter');
        const sortSelect = document.getElementById('po-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedPOFilter);
            filterInput.addEventListener('input', function(e) {
                poState.filterText = this.value;
                debouncedPOFilter();
            });
        }

        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedPOFilter);
            statusSelect.addEventListener('change', function(e) {
                poState.statusFilter = this.value;
                debouncedPOFilter();
            });
        }

        if (projectSelect) {
            projectSelect.removeEventListener('change', debouncedPOFilter);
            projectSelect.addEventListener('change', function(e) {
                poState.projectFilter = this.value;
                debouncedPOFilter();
            });
        }

        if (vendorSelect) {
            vendorSelect.removeEventListener('change', debouncedPOFilter);
            vendorSelect.addEventListener('change', function(e) {
                poState.vendorFilter = this.value;
                debouncedPOFilter();
            });
        }

        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedPOFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                poState.sortBy = sortBy;
                poState.sortOrder = sortOrder || 'desc';
                debouncedPOFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách PO: ' + error.message);
        console.error('renderPO error:', error);
    }
}

// ====== VIEW PO (CHI TIẾT) ======
async function viewPO(id) {
    try {
        const [po, allPOs, items, statuses, progress] = await Promise.all([
            api.getPOById ? api.getPOById(id) : null,
            api.getPOs(),
            api.getItems(),
            api.getStatuses('po'),
            api.getWorkflowProgress('po', id).catch(() => null) // ✅ Lấy tiến trình
        ]);

        let poData = po;
        if (!poData) {
            poData = allPOs.find(p => p.id === id);
        }
        if (!poData) {
            showError('Không tìm thấy PO!');
            return;
        }

        // Gắn progress vào poData để dùng trong actions
        poData._progress = progress;

        window._itemsCache = items;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['po'] = statuses;

        let itemsList = [];
        try {
            if (poData.items) {
                itemsList = typeof poData.items === 'string' ? JSON.parse(poData.items) : poData.items;
            }
        } catch (e) { itemsList = []; }

        const itemsHtml = itemsList.map(it => {
            const item = items.find(i => i.id === it.itemId);
            const code = item ? item.code : 'N/A';
            const name = item ? (it.displayName || item.name) : (it.displayName || 'N/A');
            const unit = item ? item.unit : '';
            const model = item ? (item.model ? ` (${item.model})` : '') : '';
            return `
                <tr>
                    <td><strong>${code}</strong></td>
                    <td>${name}${model}</td>
                    <td>${unit || '--'}</td>
                    <td>${it.quantity}</td>
                </tr>
            `;
        }).join('');

        // ✅ Tạo progress bar từ workflow_progress
        let progressHtml = '';
        if (progress && progress.totalSteps > 0) {
            progressHtml = renderWorkflowProgressBar(progress);
        } else {
            // Fallback: dùng cách cũ
            let stepsConfig = [
                { id: 1, label: 'Phòng Kế hoạch' },
                { id: 2, label: 'Phòng Dự án' },
                { id: 3, label: 'Tổng Giám đốc' }
            ];
            if (poData.workflowId) {
                try {
                    const wf = await api.getWorkflowById ? await api.getWorkflowById(poData.workflowId) : null;
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
            const currentStep = poData.approvalStep !== undefined && poData.approvalStep !== null ? poData.approvalStep : 1;
            progressHtml = renderApprovalProgress(poData.status, currentStep, stepsConfig, statuses);
        }

        const projectId = getProjectIdByCode(poData.projectCode);
        const projectLink = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${poData.projectName || poData.projectCode || '--'}</span>` :
            (poData.projectName || poData.projectCode || '--');

        const prLink = poData.prId ?
            `<a href="#" onclick="event.preventDefault(); closeModal(); viewPR(${poData.prId});" style="color:#1a3c6e; text-decoration:underline;">PR-${String(poData.prId).padStart(3, '0')}</a>` :
            '--';

        const itemsTable = `
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>Số lượng</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </div>
        `;

        const totalAmount = itemsList.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);
        const statusBadge = getStatusBadgeWithInfo(poData.status, statuses);

        // ✅ Nút tạo GRN ở chi tiết
        const canMakeGRN = (poData.status === 'APPROVED' || poData.isApproved) &&
            !poData.isCompleted &&
            hasPermission('grn.create') &&
            getUserApprovalLevel() === 0;
        const grnBtnHtml = canMakeGRN
            ? ` <button class="btn btn-info btn-sm" onclick="showAddGRNFromPO(${poData.id}); closeModal();">Tạo GRN</button>`
            : '';

        showModal('Chi tiết PO', `
            <div class="detail-grid">
                <div><span class="label">Mã PO:</span> <span class="value">${poData.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${poData.createdAt || ''}</span></div>
                <div><span class="label">PR liên quan:</span> <span class="value">${prLink}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectLink}</span></div>
                <div><span class="label">Nhà cung cấp:</span> <span class="value">${poData.vendorName || poData.vendorCode || '--'}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${statusBadge}</span></div>
                ${totalAmount > 0 ? `<div><span class="label">Tổng tiền:</span> <span class="value">${totalAmount.toLocaleString()} VND</span></div>` : ''}
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${progressHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsTable}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${poData.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printPO(${poData.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                ${grnBtnHtml}
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết PO: ' + error.message);
    }
}

// ====== RESET FILTER ======
function resetPOFilters() {
    poState.filterText = '';
    poState.statusFilter = '';
    poState.projectFilter = '';
    poState.vendorFilter = '';
    poState.sortBy = 'createdAt';
    poState.sortOrder = 'desc';
    poState.page = 1;
    renderPO();
}

// ====== CALLBACK TỪ MODAL CHỌN VẬT TƯ ======
function poItemSelectorCallback(selectedItems) {
    _poSelectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        itemName: item.displayName || item.itemName || getItemName(item.itemId),
        itemCode: item.itemCode || getItemCode(item.itemId),
        unit: item.unit || getItemUnit(item.itemId),
        model: item.model || getItemModel(item.itemId)
    }));
    renderPOSelectedItems();
}

function renderPOSelectedItems() {
    const container = document.getElementById('po-selected-items-container');
    if (!container) return;
    container.innerHTML = _renderPOSelectedItemsHTML();
    _attachPOQuantityEvents();
}

function _renderPOSelectedItemsHTML() {
    const items = _poSelectedItems || [];
    if (items.length === 0) {
        return '<div style="color:#999; text-align:center; padding:8px;">Chưa chọn vật tư nào</div>';
    }
    let html = '';
    items.forEach((item, index) => {
        const modelDisplay = item.model ? ` (${item.model})` : '';
        const unitDisplay = item.unit ? ` [${item.unit}]` : '';
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:4px; border:1px solid #e2e8f0;">
                <span style="flex:1; font-size:14px;">
                    <strong>${item.itemCode}</strong> - ${item.itemName}${modelDisplay}${unitDisplay}
                </span>
                <span style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:13px; color:#555;">SL:</span>
                    <input type="number" class="po-item-qty" data-index="${index}" value="${item.quantity}" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0.01" step="0.01">
                </span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removePOItem(${index})" style="margin-left:8px;"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
    return html;
}

function _attachPOQuantityEvents() {
    document.querySelectorAll('.po-item-qty').forEach(input => {
        input.removeEventListener('change', _onPOQtyChange);
        input.addEventListener('change', _onPOQtyChange);
    });
}

function _onPOQtyChange(e) {
    const idx = parseInt(this.dataset.index);
    const val = parseFloat(this.value) || 1;
    if (val > 0 && _poSelectedItems[idx]) {
        _poSelectedItems[idx].quantity = val;
    } else {
        this.value = _poSelectedItems[idx]?.quantity || 1;
    }
}

function removePOItem(index) {
    if (_poSelectedItems && _poSelectedItems.length > index) {
        _poSelectedItems.splice(index, 1);
        renderPOSelectedItems();
    }
}

function openItemSelectorForPO() {
    const selected = _poSelectedItems || [];
    openItemSelectorHelper(selected, poItemSelectorCallback, 'po');
}

// ====== TẠO PO MỚI ======
async function showCreatePOModal(pr = null) {
    try {
        const [projects, vendors, items] = await Promise.all([
            api.getProjects(),
            api.getVendors(),
            api.getItems()
        ]);

        const projectOpts = projects.map(p => 
            `<option value="${p.code}" ${pr && p.code === pr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`
        ).join('');
        const vendorOpts = vendors.map(v => 
            `<option value="${v.code}" ${pr && v.code === pr.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`
        ).join('');

        let initialItems = [];
        if (pr && pr.items) {
            try {
                const items = typeof pr.items === 'string' ? JSON.parse(pr.items) : pr.items;
                initialItems = items.map(it => {
                    const item = items.find(i => i.id === it.itemId);
                    return {
                        itemId: it.itemId,
                        quantity: it.quantity || 1,
                        itemName: it.displayName || (item ? item.name : getItemName(it.itemId)),
                        itemCode: item ? item.code : getItemCode(it.itemId),
                        unit: item ? item.unit : getItemUnit(it.itemId),
                        model: item ? item.model : ''
                    };
                });
            } catch (e) {}
        }
        _poSelectedItems = initialItems;
        _poMode = 'create';
        _poEditId = null;

        let prInfoHtml = '';
        if (pr) {
            prInfoHtml = `
                <div style="background:#f0fdf4; padding:12px; border-radius:6px; border:1px solid #bbf7d0; margin-bottom:12px;">
                    <strong><i class="fas fa-file-invoice"></i> PR nguồn:</strong> ${pr.code}
                    <span style="margin-left:16px;"><strong>Dự án:</strong> ${pr.projectName || pr.projectCode}</span>
                </div>
            `;
        }

        showModal('Tạo Purchase Order (PO)', `
            ${prInfoHtml}
            <div class="form-group"><label>Dự án</label>
                <select id="f-po-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Nhà cung cấp</label>
                <select id="f-po-vendor">${vendorOpts}</select>
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForPO()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="po-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderPOSelectedItemsHTML()}
                </div>
                ${pr ? '<div style="font-size:13px; color:#888; margin-top:4px;"><i class="fas fa-info-circle"></i> Vật tư được lấy từ PR. Bạn có thể điều chỉnh số lượng.</div>' : ''}
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-po-note" rows="2">${pr ? pr.note || '' : ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="savePOManual()"><i class="fas fa-save"></i> Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachPOQuantityEvents();
        }, 100);
    } catch (error) {
        showError('Lỗi tải dữ liệu: ' + error.message);
    }
}

// ====== TẠO PO TỪ PR ======
async function showCreatePOFromPRModal(prId) {
    if (!hasPermission('po.create')) {
        showWarning('Bạn không có quyền tạo PO!');
        return;
    }

    try {
        const prs = await api.getPRs();
        const pr = prs.find(p => p.id === prId);
        if (!pr) {
            showError('Không tìm thấy PR!');
            return;
        }
        await showCreatePOModal(pr);
    } catch (error) {
        showError('Lỗi tải dữ liệu: ' + error.message);
    }
}

// ====== TẠO GRN TỪ PO ======
function showAddGRNFromPO(poId) {
    if (!hasPermission('grn.create')) {
        showWarning('Bạn không có quyền tạo GRN!');
        return;
    }
    window.navigateTo('warehouse');
    setTimeout(() => {
        if (typeof showAddGRN === 'function') {
            showAddGRN(poId);
        } else {
            showError('Chức năng tạo GRN chưa sẵn sàng');
        }
    }, 300);
}

// ====== LƯU PO ======
async function savePOManual() {
    if (!hasPermission('po.create')) {
        showWarning('Bạn không có quyền tạo PO!');
        return;
    }

    const projectCode = document.getElementById('f-po-project').value;
    const vendorCode = document.getElementById('f-po-vendor').value;
    const note = document.getElementById('f-po-note').value.trim();

    const items = _poSelectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        displayName: item.itemName
    }));

    if (!projectCode || !vendorCode || items.length === 0) {
        showError('Vui lòng chọn dự án, nhà cung cấp và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const vendors = await api.getVendors();
        const vendor = vendors.find(v => v.code === vendorCode);

        const newPO = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note
        };

        await api.createPO(newPO);
        closeModal();
        _poSelectedItems = [];
        await renderPO();
        showSuccess('Tạo PO thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo PO: ' + error.message);
    }
}

// ====== SỬA PO ======
async function editPO(id) {
    if (!hasPermission('po.edit')) {
        showWarning('Bạn không có quyền sửa PO!');
        return;
    }

    try {
        const allPOs = await api.getPOs();
        const po = allPOs.find(p => p.id === id);
        if (!po) {
            showError('Không tìm thấy PO!');
            return;
        }
        if (po.status !== 'DRAFT' && po.status !== 'PENDING' && !po.status.includes('PENDING_')) {
            showWarning('Chỉ có thể sửa PO ở trạng thái DRAFT hoặc đang chờ duyệt');
            return;
        }

        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.code}" ${p.code === po.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`
        ).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v =>
            `<option value="${v.code}" ${v.code === po.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`
        ).join('');

        let itemsData = [];
        try {
            if (po.items) {
                const items = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
                itemsData = items.map(it => ({
                    itemId: it.itemId,
                    quantity: it.quantity || 1,
                    itemName: it.displayName || getItemName(it.itemId),
                    itemCode: getItemCode(it.itemId),
                    unit: getItemUnit(it.itemId),
                    model: getItemModel(it.itemId)
                }));
            }
        } catch (e) {}
        _poSelectedItems = itemsData;
        _poMode = 'edit';
        _poEditId = id;

        showModal('Sửa Purchase Order', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-po-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Nhà cung cấp</label>
                <select id="f-po-vendor">${vendorOpts}</select>
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForPO()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="po-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderPOSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-po-note" rows="2">${po.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updatePO(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachPOQuantityEvents();
        }, 100);
    } catch (error) {
        showError('Lỗi khi tải thông tin PO: ' + error.message);
    }
}

async function updatePO(id) {
    const projectCode = document.getElementById('f-po-project').value;
    const vendorCode = document.getElementById('f-po-vendor').value;
    const note = document.getElementById('f-po-note').value.trim();

    const items = _poSelectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        displayName: item.itemName
    }));

    if (!projectCode || !vendorCode || items.length === 0) {
        showError('Vui lòng chọn dự án, NCC và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const vendors = await api.getVendors();
        const vendor = vendors.find(v => v.code === vendorCode);

        const updatedPO = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note
        };

        await api.updatePO(id, updatedPO);
        closeModal();
        _poSelectedItems = [];
        await renderPO();
        showSuccess('Cập nhật PO thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật PO: ' + error.message);
    }
}

// ====== SUBMIT ======
async function submitPO(id) {
    if (!hasPermission('po.submit')) {
        showWarning('Bạn không có quyền gửi duyệt PO!');
        return;
    }
    try {
        await api.submitPO(id);
        await renderPO();
        showSuccess('Đã gửi yêu cầu duyệt PO!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt: ' + error.message);
    }
}

// ====== APPROVE ======
async function approvePO(id) {
    if (!hasPermission('po.approve')) {
        showWarning('Bạn không có quyền duyệt PO!');
        return;
    }
    try {
        await api.approvePO(id);
        await renderPO();
        showSuccess('Duyệt PO thành công!');
    } catch (error) {
        showError('Lỗi khi duyệt PO: ' + error.message);
    }
}

// ====== REJECT ======
async function rejectPO(id) {
    if (!hasPermission('po.reject')) {
        showWarning('Bạn không có quyền từ chối PO!');
        return;
    }
    try {
        await api.rejectPO(id);
        await renderPO();
        showWarning('Đã từ chối PO!');
    } catch (error) {
        showError('Lỗi khi từ chối PO: ' + error.message);
    }
}

// ====== DELETE ======
async function deletePO(id) {
    if (!hasPermission('po.delete')) {
        showWarning('Bạn không có quyền xóa PO!');
        return;
    }
    if (!confirm('Xóa PO này?')) return;
    try {
        await api.deletePO(id);
        await renderPO();
        showSuccess('Xóa PO thành công!');
    } catch (error) {
        showError('Lỗi khi xóa PO: ' + error.message);
    }
}

// ====== IN PHIẾU PO ======
function printPO(id) {
    showInfo('Chức năng in đang được phát triển.');
}

// ====== EXPORT ======
window.renderPO = renderPO;
window.viewPO = viewPO;
window.editPO = editPO;
window.updatePO = updatePO;
window.deletePO = deletePO;
window.submitPO = submitPO;
window.approvePO = approvePO;
window.rejectPO = rejectPO;
window.printPO = printPO;
window.getPOActions = getPOActions;
window.savePOManual = savePOManual;
window.showCreatePOFromPRModal = showCreatePOFromPRModal;
window.showCreatePOModal = showCreatePOModal;
window.showAddGRNFromPO = showAddGRNFromPO;
window.resetPOFilters = resetPOFilters;

// Item selector functions
window.poItemSelectorCallback = poItemSelectorCallback;
window.renderPOSelectedItems = renderPOSelectedItems;
window.removePOItem = removePOItem;
window.openItemSelectorForPO = openItemSelectorForPO;

console.log('✅ PO module updated with workflow progress.');