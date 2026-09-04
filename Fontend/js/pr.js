// ================================================================
// PR (Purchase Request) - SỬ DỤNG API - HỖ TRỢ WORKFLOW ĐỘNG
// ================================================================

// ====== STATE ======
const prState = {
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
const debouncedPRFilter = debounce(() => {
    prState.page = 1;
    renderPR();
}, 300);

// ====== HÀM LẤY ACTION ======
function getPRActions(pr) {
    const user = getUser();
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewPR(${pr.id})"><i class="fas fa-eye"></i></button>`;

    const editStatuses = ['DRAFT', 'PENDING', 'PENDING_PLANNING', 'PENDING_PROJECT', 'PENDING_CEO', 
                          'PLANNING_APPROVED', 'PROJECT_APPROVED'];
    const canEdit = hasPermission('pr.edit') && 
                   editStatuses.includes(pr.status) && 
                   (user?.role === 'ADMIN' || user?.id === pr.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editPR(${pr.id})"><i class="fas fa-edit"></i></button>`;
    }

    const canDelete = hasPermission('pr.delete') && 
                     (user?.role === 'ADMIN' || user?.id === pr.createdBy) && 
                     pr.status === 'DRAFT';
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deletePR(${pr.id})"><i class="fas fa-trash"></i></button>`;
    }

    const canSubmit = hasPermission('pr.submit') && 
                     pr.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === pr.createdBy);
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitPR(${pr.id})">Xác nhận</button>`;
    }

    const pendingStatuses = ['PENDING', 'PENDING_PLANNING', 'PENDING_PROJECT', 'PENDING_CEO', 
                             'PLANNING_APPROVED', 'PROJECT_APPROVED'];
    const canApprove = hasPermission('pr.approve') && pendingStatuses.includes(pr.status);
    if (canApprove) {
        actions += ` <button class="btn btn-success btn-sm" onclick="approvePR(${pr.id})">Duyệt</button>`;
        actions += ` <button class="btn btn-danger btn-sm" onclick="rejectPR(${pr.id})">Từ chối</button>`;
    }

    const canCreatePO = hasPermission('po.create') && pr.status === 'APPROVED';
    if (canCreatePO) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="createPOFromPR(${pr.id})">Tạo PO</button>`;
    }

    return actions || '-';
}

// ====== HÀM FILTER DỮ LIỆU ======
function filterPRData(prs, projects, vendors) {
    const { filterText, statusFilter, projectFilter, vendorFilter } = prState;
    const keyword = filterText.toLowerCase().trim();

    return prs.filter(pr => {
        let matchKeyword = true;
        if (keyword) {
            const codeMatch = (pr.code || '').toLowerCase().includes(keyword);
            const projectNameMatch = (pr.projectName || '').toLowerCase().includes(keyword);
            const projectCodeMatch = (pr.projectCode || '').toLowerCase().includes(keyword);
            const vendorNameMatch = (pr.vendorName || '').toLowerCase().includes(keyword);
            const vendorCodeMatch = (pr.vendorCode || '').toLowerCase().includes(keyword);

            let itemsMatch = false;
            try {
                if (pr.items) {
                    const items = typeof pr.items === 'string' ? JSON.parse(pr.items) : pr.items;
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

        const matchStatus = statusFilter ? pr.status === statusFilter : true;

        let matchProject = true;
        if (projectFilter) {
            const selectedProject = projects.find(p => p.code === projectFilter || p.id === parseInt(projectFilter));
            if (selectedProject) {
                matchProject = pr.projectCode === selectedProject.code;
            } else {
                matchProject = false;
            }
        }

        let matchVendor = true;
        if (vendorFilter) {
            const selectedVendor = vendors.find(v => v.code === vendorFilter || v.id === parseInt(vendorFilter));
            if (selectedVendor) {
                matchVendor = pr.vendorCode === selectedVendor.code;
            } else {
                matchVendor = false;
            }
        }

        return matchKeyword && matchStatus && matchProject && matchVendor;
    });
}

// ====== HÀM SORT DỮ LIỆU ======
function sortPRData(data) {
    const { sortBy, sortOrder } = prState;
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
            const statusOrder = { 'DRAFT': 0, 'PENDING': 1, 'PENDING_PLANNING': 2, 'PLANNING_APPROVED': 3, 'PENDING_PROJECT': 4, 'PROJECT_APPROVED': 5, 'PENDING_CEO': 6, 'APPROVED': 7, 'REJECTED': 8 };
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

// ====== RENDER DANH SÁCH PR ======
async function renderPR(page = null) {
    try {
        const [prs, projects, vendors] = await Promise.all([
            api.getPRs(),
            api.getProjects(),
            api.getVendors()
        ]);
        window._projectsCache = projects;
        window._vendorsCache = vendors;
        saveData('projects', projects);
        saveData('vendors', vendors);

        if (page) prState.page = page;

        let filtered = filterPRData(prs, projects, vendors);
        filtered = sortPRData(filtered);

        const perPage = getPageSize('pr');
        prState.perPage = perPage;
        const paging = paginate(filtered, prState.page, perPage);

        const canCreate = hasPermission('pr.create');
        const btnCreate = document.getElementById('btn-create-pr');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="pr-filter" placeholder="Tìm theo mã, dự án, NCC, vật tư..." style="flex:2;" value="${prState.filterText}">
                <select id="pr-status-filter" style="flex:1;">
                    <option value="">Tất cả trạng thái</option>
                    <option value="DRAFT" ${prState.statusFilter === 'DRAFT' ? 'selected' : ''}>DRAFT</option>
                    <option value="PENDING" ${prState.statusFilter === 'PENDING' ? 'selected' : ''}>PENDING</option>
                    <option value="PENDING_PLANNING" ${prState.statusFilter === 'PENDING_PLANNING' ? 'selected' : ''}>PENDING_PLANNING</option>
                    <option value="PLANNING_APPROVED" ${prState.statusFilter === 'PLANNING_APPROVED' ? 'selected' : ''}>PLANNING_APPROVED</option>
                    <option value="PENDING_PROJECT" ${prState.statusFilter === 'PENDING_PROJECT' ? 'selected' : ''}>PENDING_PROJECT</option>
                    <option value="PROJECT_APPROVED" ${prState.statusFilter === 'PROJECT_APPROVED' ? 'selected' : ''}>PROJECT_APPROVED</option>
                    <option value="PENDING_CEO" ${prState.statusFilter === 'PENDING_CEO' ? 'selected' : ''}>PENDING_CEO</option>
                    <option value="APPROVED" ${prState.statusFilter === 'APPROVED' ? 'selected' : ''}>APPROVED</option>
                    <option value="REJECTED" ${prState.statusFilter === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
                </select>
                <select id="pr-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${prState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="pr-vendor-filter" style="flex:1;">
                    <option value="">Tất cả NCC</option>
                    ${vendors.map(v => `<option value="${v.code}" ${prState.vendorFilter === v.code ? 'selected' : ''}>${v.code} - ${v.name}</option>`).join('')}
                </select>
                <select id="pr-sort" style="flex:1;">
                    <option value="createdAt_desc" ${prState.sortBy === 'createdAt' && prState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${prState.sortBy === 'createdAt' && prState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="code_asc" ${prState.sortBy === 'code' && prState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${prState.sortBy === 'code' && prState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${prState.sortBy === 'projectName' && prState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${prState.sortBy === 'projectName' && prState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="vendorName_asc" ${prState.sortBy === 'vendorName' && prState.sortOrder === 'asc' ? 'selected' : ''}>NCC (A→Z)</option>
                    <option value="vendorName_desc" ${prState.sortBy === 'vendorName' && prState.sortOrder === 'desc' ? 'selected' : ''}>NCC (Z→A)</option>
                    <option value="status" ${prState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetPRFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã PR</th>
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

            const statusBadge = getStatusBadge(p.status);
            const actions = getPRActions(p);
            const projectId = getProjectIdByCode(p.projectCode);
            const projectLink = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewProject(${projectId})">${p.projectName || p.projectCode || '--'}</span>` :
                (p.projectName || p.projectCode || '--');
            const vendorName = p.vendorName || p.vendorCode || '--';

            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewPR(${p.id})">${p.code || '--'}</td>
                <td>${projectLink}</td>
                <td>${vendorName}</td>
                <td>${itemsStr}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderPR', 'pr');
        document.getElementById('pr-container').innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('pr-filter');
        const statusSelect = document.getElementById('pr-status-filter');
        const projectSelect = document.getElementById('pr-project-filter');
        const vendorSelect = document.getElementById('pr-vendor-filter');
        const sortSelect = document.getElementById('pr-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedPRFilter);
            filterInput.addEventListener('input', function(e) {
                prState.filterText = this.value;
                debouncedPRFilter();
            });
        }

        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedPRFilter);
            statusSelect.addEventListener('change', function(e) {
                prState.statusFilter = this.value;
                debouncedPRFilter();
            });
        }

        if (projectSelect) {
            projectSelect.removeEventListener('change', debouncedPRFilter);
            projectSelect.addEventListener('change', function(e) {
                prState.projectFilter = this.value;
                debouncedPRFilter();
            });
        }

        if (vendorSelect) {
            vendorSelect.removeEventListener('change', debouncedPRFilter);
            vendorSelect.addEventListener('change', function(e) {
                prState.vendorFilter = this.value;
                debouncedPRFilter();
            });
        }

        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedPRFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                prState.sortBy = sortBy;
                prState.sortOrder = sortOrder || 'desc';
                debouncedPRFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách PR: ' + error.message);
        console.error('renderPR error:', error);
    }
}

// ====== RESET FILTER ======
function resetPRFilters() {
    prState.filterText = '';
    prState.statusFilter = '';
    prState.projectFilter = '';
    prState.vendorFilter = '';
    prState.sortBy = 'createdAt';
    prState.sortOrder = 'desc';
    prState.page = 1;
    renderPR();
}

// ====== BIẾN TOÀN CỤC CHO ITEM SELECTOR ======
let _prSelectedItems = [];
let _prMode = 'create';
let _prEditId = null;

// ====== CALLBACK TỪ MODAL CHỌN VẬT TƯ ======
function prItemSelectorCallback(selectedItems) {
    _prSelectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        itemName: item.displayName || item.itemName || getItemName(item.itemId),
        itemCode: item.itemCode || getItemCode(item.itemId),
        unit: item.unit || getItemUnit(item.itemId)
    }));
    renderPRSelectedItems();
}

function renderPRSelectedItems() {
    const container = document.getElementById('pr-selected-items-container');
    if (!container) return;
    container.innerHTML = _renderPRSelectedItemsHTML();
    _attachPRQuantityEvents();
}

function _renderPRSelectedItemsHTML() {
    const items = _prSelectedItems || [];
    if (items.length === 0) {
        return '<div style="color:#999; text-align:center; padding:8px;">Chưa chọn vật tư nào</div>';
    }
    let html = '';
    items.forEach((item, index) => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; margin-bottom:4px; background:#f0f4f8; border-radius:4px;">
                <span><strong>${item.itemCode}</strong> - ${item.itemName} (${item.unit})</span>
                <span>Số lượng: <input type="number" class="pr-item-qty" data-index="${index}" value="${item.quantity}" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0.01" step="0.01"></span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removePRItem(${index})"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
    return html;
}

function _attachPRQuantityEvents() {
    document.querySelectorAll('.pr-item-qty').forEach(input => {
        input.removeEventListener('change', _onPRQtyChange);
        input.addEventListener('change', _onPRQtyChange);
    });
}

function _onPRQtyChange(e) {
    const idx = parseInt(this.dataset.index);
    const val = parseFloat(this.value) || 1;
    if (val > 0 && _prSelectedItems[idx]) {
        _prSelectedItems[idx].quantity = val;
    } else {
        this.value = _prSelectedItems[idx]?.quantity || 1;
    }
}

function removePRItem(index) {
    if (_prSelectedItems && _prSelectedItems.length > index) {
        _prSelectedItems.splice(index, 1);
        renderPRSelectedItems();
    }
}

function openItemSelectorForPR() {
    const selected = _prSelectedItems || [];
    openItemSelectorHelper(selected, prItemSelectorCallback, 'pr');
}

// ====== TẠO PR MỚI ======
async function showCreatePRModal(mr = null) {
    try {
        const projects = await api.getProjects();
        const projectOpts = projects.map(p => 
            `<option value="${p.code}" ${mr && p.code === mr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`
        ).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v => 
            `<option value="${v.code}" ${mr && v.code === mr.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`
        ).join('');

        let initialItems = [];
        if (mr && mr.items) {
            try {
                const items = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
                initialItems = items.map(it => ({
                    itemId: it.itemId,
                    quantity: it.quantity || 1,
                    itemName: it.displayName || getItemName(it.itemId),
                    itemCode: getItemCode(it.itemId),
                    unit: getItemUnit(it.itemId)
                }));
            } catch (e) {}
        }
        _prSelectedItems = initialItems;
        _prMode = 'create';
        _prEditId = null;

        showModal('Tạo Purchase Request (PR)', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-pr-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Nhà cung cấp</label>
                <select id="f-pr-vendor"><option value="">-- Chọn --</option>${vendorOpts}</select>
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForPR()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="pr-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderPRSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-pr-note" rows="2">${mr ? mr.note || '' : ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="savePRManual()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachPRQuantityEvents();
        }, 100);
    } catch (error) {
        showError('Lỗi tải dữ liệu: ' + error.message);
    }
}

// ====== LƯU PR ======
async function savePRManual() {
    if (!hasPermission('pr.create')) {
        showWarning('Bạn không có quyền tạo PR!');
        return;
    }

    const projectCode = document.getElementById('f-pr-project').value;
    const vendorCode = document.getElementById('f-pr-vendor').value;
    const note = document.getElementById('f-pr-note').value.trim();

    const items = _prSelectedItems.map(item => ({
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

        const newPR = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note
        };

        await api.createPR(newPR);
        closeModal();
        _prSelectedItems = [];
        await renderPR();
        showSuccess('Tạo PR thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo PR: ' + error.message);
    }
}

// ====== XEM CHI TIẾT PR ======
async function viewPR(id) {
    try {
        let pr = null;
        const allPRs = await api.getPRs();
        pr = allPRs.find(p => p.id === id);
        if (!pr) {
            showError('Không tìm thấy PR!');
            return;
        }

        let items = [];
        try {
            if (pr.items) {
                items = typeof pr.items === 'string' ? JSON.parse(pr.items) : pr.items;
            }
        } catch (e) { items = []; }

        const itemsHtml = items.map(it => `
            <tr>
                <td>${getItemCode(it.itemId)}</td>
                <td>${it.displayName || getItemName(it.itemId)}</td>
                <td>${getItemUnit(it.itemId)}</td>
                <td>${it.quantity}</td>
            </tr>
        `).join('');

        let stepsConfig = [
            { id: 1, label: 'Phòng Kế hoạch' },
            { id: 2, label: 'Phòng Dự án' },
            { id: 3, label: 'Tổng Giám đốc' }
        ];
        if (pr.workflowId) {
            try {
                const wf = await api.getWorkflowById ? await api.getWorkflowById(pr.workflowId) : null;
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

        const approvalHtml = renderApprovalProgress(pr.status, pr.approvalStep || 1, stepsConfig);
        const projectId = getProjectIdByCode(pr.projectCode);
        const projectLink = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${pr.projectName || pr.projectCode || '--'}</span>` :
            (pr.projectName || pr.projectCode || '--');
        const totalAmount = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);

        const itemsTable = `
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>Số lượng</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </div>
        `;

        showModal('Chi tiết PR', `
            <div class="detail-grid">
                <div><span class="label">Mã PR:</span> <span class="value">${pr.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${pr.createdAt || ''}</span></div>
                <div><span class="label">MR liên quan:</span> <span class="value">${pr.mrId ? 'MR-'+String(pr.mrId).padStart(3,'0') : ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectLink}</span></div>
                <div><span class="label">Nhà cung cấp:</span> <span class="value">${pr.vendorName || pr.vendorCode || '--'}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(pr.status)}</span></div>
                ${totalAmount > 0 ? `<div><span class="label">Tổng tiền:</span> <span class="value">${totalAmount.toLocaleString()} VND</span></div>` : ''}
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${approvalHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsTable}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${pr.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printPR(${pr.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết PR: ' + error.message);
    }
}

// ====== SỬA PR ======
async function editPR(id) {
    if (!hasPermission('pr.edit')) {
        showWarning('Bạn không có quyền sửa PR!');
        return;
    }

    try {
        const allPRs = await api.getPRs();
        const pr = allPRs.find(p => p.id === id);
        if (!pr) {
            showError('Không tìm thấy PR!');
            return;
        }
        if (pr.status !== 'DRAFT' && pr.status !== 'PENDING' && !pr.status.includes('PENDING_')) {
            showWarning('Chỉ có thể sửa PR ở trạng thái DRAFT hoặc đang chờ duyệt');
            return;
        }

        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.code}" ${p.code === pr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`
        ).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v =>
            `<option value="${v.code}" ${v.code === pr.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`
        ).join('');

        let itemsData = [];
        try {
            if (pr.items) {
                const items = typeof pr.items === 'string' ? JSON.parse(pr.items) : pr.items;
                itemsData = items.map(it => ({
                    itemId: it.itemId,
                    quantity: it.quantity || 1,
                    itemName: it.displayName || getItemName(it.itemId),
                    itemCode: getItemCode(it.itemId),
                    unit: getItemUnit(it.itemId)
                }));
            }
        } catch (e) {}
        _prSelectedItems = itemsData;
        _prMode = 'edit';
        _prEditId = id;

        showModal('Sửa Purchase Request', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-pr-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Nhà cung cấp</label>
                <select id="f-pr-vendor">${vendorOpts}</select>
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForPR()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="pr-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderPRSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-pr-note" rows="2">${pr.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updatePR(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachPRQuantityEvents();
        }, 100);
    } catch (error) {
        showError('Lỗi khi tải thông tin PR: ' + error.message);
    }
}

// ====== CẬP NHẬT PR ======
async function updatePR(id) {
    const projectCode = document.getElementById('f-pr-project').value;
    const vendorCode = document.getElementById('f-pr-vendor').value;
    const note = document.getElementById('f-pr-note').value.trim();

    const items = _prSelectedItems.map(item => ({
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

        const updatedPR = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note
        };

        await api.updatePR(id, updatedPR);
        closeModal();
        _prSelectedItems = [];
        await renderPR();
        showSuccess('Cập nhật PR thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật PR: ' + error.message);
    }
}

// ====== GỬI DUYỆT ======
async function submitPR(id) {
    if (!hasPermission('pr.submit')) {
        showWarning('Bạn không có quyền gửi duyệt PR!');
        return;
    }
    try {
        await api.submitPR(id);
        await renderPR();
        showSuccess('Đã gửi yêu cầu duyệt PR!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt: ' + error.message);
    }
}

// ====== DUYỆT PR ======
async function approvePR(id) {
    if (!hasPermission('pr.approve')) {
        showWarning('Bạn không có quyền duyệt PR!');
        return;
    }
    try {
        await api.approvePR(id);
        await renderPR();
        showSuccess('Duyệt PR thành công!');
    } catch (error) {
        showError('Lỗi khi duyệt PR: ' + error.message);
    }
}

// ====== TỪ CHỐI PR ======
async function rejectPR(id) {
    if (!hasPermission('pr.reject')) {
        showWarning('Bạn không có quyền từ chối PR!');
        return;
    }
    try {
        await api.rejectPR(id);
        await renderPR();
        showWarning('Đã từ chối PR!');
    } catch (error) {
        showError('Lỗi khi từ chối PR: ' + error.message);
    }
}

// ====== XÓA PR ======
async function deletePR(id) {
    if (!hasPermission('pr.delete')) {
        showWarning('Bạn không có quyền xóa PR!');
        return;
    }
    if (!confirm('Xóa PR này?')) return;
    try {
        await api.deletePR(id);
        await renderPR();
        showSuccess('Xóa PR thành công!');
    } catch (error) {
        showError('Lỗi khi xóa PR: ' + error.message);
    }
}

// ====== TẠO PO TỪ PR ======
function createPOFromPR(prId) {
    if (!hasPermission('po.create')) {
        showWarning('Bạn không có quyền tạo PO!');
        return;
    }
    window.navigateTo('po');
    setTimeout(() => {
        if (typeof showCreatePOFromPRModal === 'function') {
            showCreatePOFromPRModal(prId);
        } else {
            showError('Chức năng tạo PO từ PR chưa sẵn sàng');
        }
    }, 300);
}

// ====== TẠO PR TỪ MR ======
function showCreatePRFromMRModal(mrId) {
    if (!hasPermission('pr.create')) {
        showWarning('Bạn không có quyền tạo PR!');
        return;
    }
    api.getMRs().then(mrs => {
        const mr = mrs.find(m => m.id === mrId);
        if (mr) {
            showCreatePRModal(mr);
        } else {
            showError('Không tìm thấy MR');
        }
    }).catch(err => showError('Lỗi tải MR: ' + err.message));
}

// ====== IN PHIẾU PR ======
function printPR(id) {
    showInfo('Chức năng in đang được phát triển.');
}

// ====== EXPORT ======
window.renderPR = renderPR;
window.viewPR = viewPR;
window.editPR = editPR;
window.updatePR = updatePR;
window.deletePR = deletePR;
window.submitPR = submitPR;
window.approvePR = approvePR;
window.rejectPR = rejectPR;
window.createPOFromPR = createPOFromPR;
window.printPR = printPR;
window.getPRActions = getPRActions;
window.savePRManual = savePRManual;
window.showCreatePRFromMRModal = showCreatePRFromMRModal;
window.showCreatePRModal = showCreatePRModal;
window.resetPRFilters = resetPRFilters;

// Item selector functions
window.prItemSelectorCallback = prItemSelectorCallback;
window.renderPRSelectedItems = renderPRSelectedItems;
window.removePRItem = removePRItem;
window.openItemSelectorForPR = openItemSelectorForPR;

console.log('✅ PR module updated with multi-field search, sort, and advanced filters.');