// ================================================================
// MATERIAL ISSUE - Cấp phát vật tư - ĐÃ TÍCH HỢP APPROVAL LEVEL
// ================================================================

// ====== STATE ======
const issueState = {
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
const debouncedIssueFilter = debounce(() => {
    issueState.page = 1;
    renderIssues();
}, 300);

// ====== BIẾN TOÀN CỤC CHO ITEM SELECTOR ======
let _issueSelectedItems = [];

// ====== HÀM TẠO MÃ TỰ ĐỘNG ======
function generateIssueCode() {
    return 'ISS-' + String(Date.now()).slice(-6);
}

// ====== HÀM LẤY ACTION (CÓ KIỂM TRA canApprove) ======
function getIssueActions(item, statuses) {
    const user = getUser();
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewIssue(${item.id})"><i class="fas fa-eye"></i></button>`;

    const canEdit = hasPermission('issue.edit') && 
                   (item.status === 'DRAFT' || item.status === 'PENDING') && 
                   (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editIssue(${item.id})"><i class="fas fa-edit"></i></button>`;
    }

    const canDelete = hasPermission('issue.delete') && 
                     item.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deleteIssue(${item.id})"><i class="fas fa-trash"></i></button>`;
    }

    const canSubmit = hasPermission('issue.submit') && 
                     item.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitIssue(${item.id})">Xác nhận</button>`;
    }

    // ✅ SỬ DỤNG canApprove (đã sửa với level === step)
    if (item.status === 'PENDING') {
        const currentStep = item.approvalStep || 1;
        if (canApprove(currentStep, 'issue.approve', null)) {
            actions += ` <button class="btn btn-success btn-sm" onclick="approveIssue(${item.id})">Duyệt</button>`;
            actions += ` <button class="btn btn-danger btn-sm" onclick="rejectIssue(${item.id})">Từ chối</button>`;
        }
    }

    if (item.status === 'APPROVED') {
        const currentStep = item.approvalStep || 2;
        if (canApprove(currentStep, 'issue.complete', null)) {
            actions += ` <button class="btn btn-success btn-sm" onclick="showCompleteIssueModal(${item.id})">Cấp phát</button>`;
        }
    }

    if (item.status === 'COMPLETED') {
        const currentStep = item.approvalStep || 3;
        if (canApprove(currentStep, 'issue.confirm', null)) {
            actions += ` <button class="btn btn-success btn-sm" onclick="confirmIssue(${item.id})">Xác nhận</button>`;
        }
    }

    return actions || '-';
}

// ====== RENDER TRANG ======
async function renderIssuePage() {
    console.log('🔄 renderIssuePage được gọi');

    let page = document.getElementById('page-issue');
    if (!page) {
        const content = document.querySelector('.content');
        if (!content) {
            console.error('❌ Không tìm thấy .content');
            return;
        }
        page = document.createElement('div');
        page.className = 'page';
        page.id = 'page-issue';
        const container = document.createElement('div');
        container.id = 'issue-container';
        page.appendChild(container);
        content.appendChild(page);
        console.log('✅ Đã tạo page-issue');
    } else {
        if (!document.getElementById('issue-container')) {
            const container = document.createElement('div');
            container.id = 'issue-container';
            page.appendChild(container);
        }
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');

    if (!hasPermission('issue.view')) {
        document.getElementById('issue-container').innerHTML = `
            <div style="padding:20px; text-align:center; color:#e74c3c;">
                <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                Bạn không có quyền xem danh sách cấp phát
            </div>
        `;
        return;
    }

    await renderIssues();
}

// ====== HÀM FILTER DỮ LIỆU ======
function filterIssueData(issues, projects, warehouses) {
    const { filterText, statusFilter, projectFilter, warehouseFilter } = issueState;
    const keyword = filterText.toLowerCase().trim();

    return issues.filter(issue => {
        let matchKeyword = true;
        if (keyword) {
            const codeMatch = (issue.code || '').toLowerCase().includes(keyword);
            const projectNameMatch = (issue.projectName || '').toLowerCase().includes(keyword);
            const projectCodeMatch = (issue.projectCode || '').toLowerCase().includes(keyword);
            const areaMatch = (issue.area || '').toLowerCase().includes(keyword);
            const teamMatch = (issue.team || '').toLowerCase().includes(keyword);
            const requesterMatch = (issue.requester || '').toLowerCase().includes(keyword);

            let itemsMatch = false;
            try {
                if (issue.items) {
                    const items = typeof issue.items === 'string' ? JSON.parse(issue.items) : issue.items;
                    itemsMatch = items.some(item => {
                        const itemName = item.displayName || getItemName(item.itemId) || '';
                        const itemCode = getItemCode(item.itemId) || '';
                        return itemName.toLowerCase().includes(keyword) ||
                               itemCode.toLowerCase().includes(keyword);
                    });
                }
            } catch (e) {}

            matchKeyword = codeMatch || projectNameMatch || projectCodeMatch || 
                           areaMatch || teamMatch || requesterMatch || itemsMatch;
        }

        const matchStatus = statusFilter ? issue.status === statusFilter : true;

        let matchProject = true;
        if (projectFilter) {
            const selectedProject = projects.find(p => p.code === projectFilter || p.id === parseInt(projectFilter));
            if (selectedProject) {
                matchProject = issue.projectCode === selectedProject.code;
            } else {
                matchProject = false;
            }
        }

        let matchWarehouse = true;
        if (warehouseFilter) {
            const selectedWarehouse = warehouses.find(w => w.id === parseInt(warehouseFilter) || w.code === warehouseFilter);
            if (selectedWarehouse) {
                matchWarehouse = issue.warehouseId === selectedWarehouse.id;
            } else {
                matchWarehouse = false;
            }
        }

        return matchKeyword && matchStatus && matchProject && matchWarehouse;
    });
}

// ====== HÀM SORT DỮ LIỆU ======
function sortIssueData(data) {
    const { sortBy, sortOrder } = issueState;
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
        } else if (sortBy === 'date') {
            valA = new Date(a.date || 0);
            valB = new Date(b.date || 0);
        } else if (sortBy === 'status') {
            const statusOrder = { 'DRAFT': 0, 'PENDING': 1, 'APPROVED': 2, 'COMPLETED': 3, 'CONFIRMED': 4, 'REJECTED': 5 };
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
async function renderIssues(page = null) {
    const container = document.getElementById('issue-container');
    if (!container) {
        console.error('❌ Không tìm thấy issue-container');
        return;
    }

    try {
        const [issues, projects, warehouses, statuses] = await Promise.all([
            api.getIssues(),
            api.getProjects(),
            api.getWarehouses(),
            api.getStatuses('issue')
        ]);
        
        window._projectsCache = projects;
        window._warehousesCache = warehouses;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['issue'] = statuses;
        
        saveData('projects', projects);
        saveData('warehouses', warehouses);

        if (page) issueState.page = page;

        let filtered = filterIssueData(issues, projects, warehouses);
        filtered = sortIssueData(filtered);

        const perPage = getPageSize('issue');
        issueState.perPage = perPage;
        const paging = paginate(filtered, issueState.page, perPage);

        // ✅ KIỂM TRA QUYỀN TẠO
        const canCreate = hasPermission('issue.create');
        const btnCreate = document.getElementById('btn-create-issue');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="issue-filter" placeholder="Tìm theo mã, dự án, vật tư, khu vực..." style="flex:2;" value="${issueState.filterText}">
                <select id="issue-status-filter" style="flex:1;">
                    <option value="">Tất cả</option>
                    ${statuses.map(s => `<option value="${s.code}" ${issueState.statusFilter === s.code ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <select id="issue-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${issueState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="issue-warehouse-filter" style="flex:1;">
                    <option value="">Tất cả kho</option>
                    ${warehouses.map(w => `<option value="${w.id}" ${issueState.warehouseFilter == w.id ? 'selected' : ''}>${w.code} - ${w.name}</option>`).join('')}
                </select>
                <select id="issue-sort" style="flex:1;">
                    <option value="createdAt_desc" ${issueState.sortBy === 'createdAt' && issueState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${issueState.sortBy === 'createdAt' && issueState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="date_desc" ${issueState.sortBy === 'date' && issueState.sortOrder === 'desc' ? 'selected' : ''}>Ngày cấp (mới nhất)</option>
                    <option value="date_asc" ${issueState.sortBy === 'date' && issueState.sortOrder === 'asc' ? 'selected' : ''}>Ngày cấp (cũ nhất)</option>
                    <option value="code_asc" ${issueState.sortBy === 'code' && issueState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${issueState.sortBy === 'code' && issueState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${issueState.sortBy === 'projectName' && issueState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${issueState.sortBy === 'projectName' && issueState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="status" ${issueState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetIssueFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Dự án</th>
                            <th>Ngày cấp</th>
                            <th>Khu vực</th>
                            <th>Người yêu cầu</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="7" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const item of paging.items) {
            const statusBadge = getStatusBadgeWithInfo(item.status, statuses);
            const projectId = getProjectIdByCode(item.projectCode);
            const projectDisplay = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId})">${item.projectName || item.projectCode}</span>` :
                (item.projectName || item.projectCode || '');

            const actions = getIssueActions(item, statuses);

            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewIssue(${item.id})">${item.code}</td>
                <td>${projectDisplay}</td>
                <td>${item.date || ''}</td>
                <td>${item.area || ''}</td>
                <td>${item.requester || ''}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderIssues', 'issue');
        container.innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('issue-filter');
        const statusSelect = document.getElementById('issue-status-filter');
        const projectSelect = document.getElementById('issue-project-filter');
        const warehouseSelect = document.getElementById('issue-warehouse-filter');
        const sortSelect = document.getElementById('issue-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedIssueFilter);
            filterInput.addEventListener('input', function(e) {
                issueState.filterText = this.value;
                debouncedIssueFilter();
            });
        }

        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedIssueFilter);
            statusSelect.addEventListener('change', function(e) {
                issueState.statusFilter = this.value;
                debouncedIssueFilter();
            });
        }

        if (projectSelect) {
            projectSelect.removeEventListener('change', debouncedIssueFilter);
            projectSelect.addEventListener('change', function(e) {
                issueState.projectFilter = this.value;
                debouncedIssueFilter();
            });
        }

        if (warehouseSelect) {
            warehouseSelect.removeEventListener('change', debouncedIssueFilter);
            warehouseSelect.addEventListener('change', function(e) {
                issueState.warehouseFilter = this.value;
                debouncedIssueFilter();
            });
        }

        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedIssueFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                issueState.sortBy = sortBy;
                issueState.sortOrder = sortOrder || 'desc';
                debouncedIssueFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách cấp phát: ' + error.message);
        console.error('renderIssues error:', error);
    }
}

// ====== RESET FILTER ======
function resetIssueFilters() {
    issueState.filterText = '';
    issueState.statusFilter = '';
    issueState.projectFilter = '';
    issueState.warehouseFilter = '';
    issueState.sortBy = 'createdAt';
    issueState.sortOrder = 'desc';
    issueState.page = 1;
    renderIssues();
}

// ====== TẠO PHIẾU (MODAL) ======
function showCreateIssueModal() {
    Promise.all([api.getProjects(), api.getItems()]).then(([projects, items]) => {
        window._itemsCache = items;

        const projectOpts = projects.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
        const itemOpts = items.map(i => `<option value="${i.id}">${i.code} - ${i.name} (${i.unit || 'đvt'})</option>`).join('');

        showModal('Tạo phiếu cấp phát vật tư', `
            <div class="form-group">
                <label>Dự án</label>
                <select id="f-issue-project"><option value="">-- Chọn --</option>${projectOpts}</select>
            </div>
            <div class="form-group">
                <label>Ngày cấp</label>
                <input id="f-issue-date" type="date">
            </div>
            <div class="form-group">
                <label>Khu vực / Hạng mục</label>
                <input id="f-issue-area" placeholder="Nhập khu vực hoặc hạng mục thi công">
            </div>
            <div class="form-group">
                <label>Đội thi công nhận</label>
                <input id="f-issue-team" placeholder="Tên đội thi công">
            </div>
            <div class="form-group">
                <label>Người yêu cầu</label>
                <input id="f-issue-requester" placeholder="Tên người yêu cầu">
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForIssue()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="issue-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderIssueSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group">
                <label>Ghi chú</label>
                <textarea id="f-issue-note" rows="2"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="saveIssue()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    }).catch(err => showError('Không thể tải dữ liệu: ' + err.message));
}

// ====== ITEM SELECTOR CHO ISSUE ======
function issueItemSelectorCallback(selectedItems) {
    _issueSelectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        itemName: item.displayName || item.itemName || getItemName(item.itemId),
        itemCode: item.itemCode || getItemCode(item.itemId),
        unit: item.unit || getItemUnit(item.itemId),
        model: item.model || getItemModel(item.itemId)
    }));
    renderIssueSelectedItems();
}

function renderIssueSelectedItems() {
    const container = document.getElementById('issue-selected-items-container');
    if (!container) return;
    container.innerHTML = _renderIssueSelectedItemsHTML();
    _attachIssueQuantityEvents();
}

function _renderIssueSelectedItemsHTML() {
    const items = _issueSelectedItems || [];
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
                    <input type="number" class="issue-item-qty" data-index="${index}" value="${item.quantity}" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0.01" step="0.01">
                </span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeIssueItem(${index})" style="margin-left:8px;"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
    return html;
}

function _attachIssueQuantityEvents() {
    document.querySelectorAll('.issue-item-qty').forEach(input => {
        input.removeEventListener('change', _onIssueQtyChange);
        input.addEventListener('change', _onIssueQtyChange);
    });
}

function _onIssueQtyChange(e) {
    const idx = parseInt(this.dataset.index);
    const val = parseFloat(this.value) || 1;
    if (val > 0 && _issueSelectedItems[idx]) {
        _issueSelectedItems[idx].quantity = val;
    } else {
        this.value = _issueSelectedItems[idx]?.quantity || 1;
    }
}

function removeIssueItem(index) {
    if (_issueSelectedItems && _issueSelectedItems.length > index) {
        _issueSelectedItems.splice(index, 1);
        renderIssueSelectedItems();
    }
}

function openItemSelectorForIssue() {
    const selected = _issueSelectedItems || [];
    openItemSelectorHelper(selected, issueItemSelectorCallback, 'issue');
}

// ====== LƯU PHIẾU ======
async function saveIssue() {
    if (!hasPermission('issue.create')) {
        showWarning('Bạn không có quyền tạo phiếu cấp phát!');
        return;
    }

    const projectCode = document.getElementById('f-issue-project').value;
    const date = document.getElementById('f-issue-date').value;
    const area = document.getElementById('f-issue-area').value.trim();
    const team = document.getElementById('f-issue-team').value.trim();
    const requester = document.getElementById('f-issue-requester').value.trim();
    const note = document.getElementById('f-issue-note').value.trim();
    const items = _issueSelectedItems.map(item => ({
        itemId: item.itemId,
        requestedQty: item.quantity,
        displayName: item.itemName
    }));

    if (!projectCode || !date || items.length === 0) {
        showError('Vui lòng chọn dự án, ngày cấp và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const user = getUser();

        const newIssue = {
            projectCode,
            projectName: proj ? proj.name : '',
            date,
            area,
            team,
            requester: requester || user?.name,
            items: JSON.stringify(items),
            note
        };

        await api.createIssue(newIssue);
        closeModal();
        _issueSelectedItems = [];
        await renderIssues();
        showSuccess('Tạo phiếu cấp phát thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo phiếu: ' + error.message);
    }
}

// ====== VIEW CHI TIẾT ======
async function viewIssue(id) {
    try {
        let item = await api.getIssueById ? await api.getIssueById(id) : null;
        if (!item) {
            const issues = await api.getIssues();
            item = issues.find(i => i.id === id);
            if (!item) {
                showError('Không tìm thấy phiếu!');
                return;
            }
        }
        
        const statuses = await api.getStatuses('issue');
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['issue'] = statuses;

        const items = item.items ? JSON.parse(item.items) : [];
        const itemsHtml = items.map(it => {
            const itemName = it.displayName || getItemName(it.itemId);
            const unit = getItemUnit(it.itemId);
            return `
                <tr>
                    <td>${getItemCode(it.itemId)}</td>
                    <td>${itemName}</td>
                    <td>${unit}</td>
                    <td>${it.requestedQty}</td>
                    <td>${it.actualQty !== undefined ? it.actualQty : it.requestedQty}</td>
                    <td>${it.condition || ''}</td>
                </tr>
            `;
        }).join('');

        let stepsConfig = [
            { id: 1, label: 'Tạo phiếu' },
            { id: 2, label: 'Duyệt' },
            { id: 3, label: 'Cấp phát' },
            { id: 4, label: 'Xác nhận' }
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
        const currentStep = item.approvalStep || 1;
        const progressHtml = renderApprovalProgress(item.status, currentStep, stepsConfig, statuses);
        const statusBadge = getStatusBadgeWithInfo(item.status, statuses);
        const projectId = getProjectIdByCode(item.projectCode);
        const projectDisplay = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId})">${item.projectName || item.projectCode}</span>` :
            (item.projectName || item.projectCode || '');
        const warehouseDisplay = item.warehouseId ? getWarehouseName(item.warehouseId) : 'Chưa chọn';

        showModal('Chi tiết phiếu cấp phát', `
            <div class="detail-grid">
                <div><span class="label">Mã phiếu:</span> <span class="value">${item.code}</span></div>
                <div><span class="label">Ngày cấp:</span> <span class="value">${item.date || ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectDisplay}</span></div>
                <div><span class="label">Khu vực/Hạng mục:</span> <span class="value">${item.area || ''}</span></div>
                <div><span class="label">Đội thi công nhận:</span> <span class="value">${item.team || ''}</span></div>
                <div><span class="label">Người yêu cầu:</span> <span class="value">${item.requester || ''}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${statusBadge}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${item.createdAt || ''}</span></div>
                ${item.completionDate ? `<div><span class="label">Ngày hoàn tất:</span> <span class="value">${item.completionDate}</span></div>` : ''}
                <div><span class="label">Kho xuất:</span> <span class="value">${warehouseDisplay}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Tiến độ thực hiện:</span><br>${progressHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Chi tiết vật tư:</span>
                    <div class="table-responsive">
                        <table>
                            <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>SL yêu cầu</th><th>SL thực cấp</th><th>Tình trạng</th></tr></thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                    </div>
                </div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${item.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printIssue(${item.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết phiếu: ' + error.message);
    }
}

// ====== SỬA PHIẾU ======
async function editIssue(id) {
    if (!hasPermission('issue.edit')) {
        showWarning('Bạn không có quyền sửa phiếu cấp phát!');
        return;
    }

    try {
        const issues = await api.getIssues();
        const item = issues.find(i => i.id === id);
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

        const itemsData = item.items ? JSON.parse(item.items) : [];

        showModal('Sửa phiếu cấp phát', `
            <div class="form-group">
                <label>Dự án</label>
                <select id="f-issue-project">${projectOpts}</select>
            </div>
            <div class="form-group">
                <label>Ngày cấp</label>
                <input id="f-issue-date" type="date" value="${item.date || ''}">
            </div>
            <div class="form-group">
                <label>Khu vực / Hạng mục</label>
                <input id="f-issue-area" value="${item.area || ''}">
            </div>
            <div class="form-group">
                <label>Đội thi công nhận</label>
                <input id="f-issue-team" value="${item.team || ''}">
            </div>
            <div class="form-group">
                <label>Người yêu cầu</label>
                <input id="f-issue-requester" value="${item.requester || ''}">
            </div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForIssue()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="issue-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderIssueSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group">
                <label>Ghi chú</label>
                <textarea id="f-issue-note" rows="2">${item.note || ''}</textarea>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateIssue(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải phiếu: ' + error.message);
    }
}

async function updateIssue(id) {
    const projectCode = document.getElementById('f-issue-project').value;
    const date = document.getElementById('f-issue-date').value;
    const area = document.getElementById('f-issue-area').value.trim();
    const team = document.getElementById('f-issue-team').value.trim();
    const requester = document.getElementById('f-issue-requester').value.trim();
    const note = document.getElementById('f-issue-note').value.trim();
    const items = _issueSelectedItems.map(item => ({
        itemId: item.itemId,
        requestedQty: item.quantity,
        displayName: item.itemName
    }));

    if (!projectCode || !date || items.length === 0) {
        showError('Vui lòng chọn dự án, ngày cấp và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);

        const updatedIssue = {
            projectCode,
            projectName: proj ? proj.name : '',
            date,
            area,
            team,
            requester: requester,
            items: JSON.stringify(items.map(it => ({ ...it, actualQty: it.requestedQty }))),
            note
        };

        await api.updateIssue(id, updatedIssue);
        closeModal();
        _issueSelectedItems = [];
        await renderIssues();
        showSuccess('Cập nhật phiếu thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật phiếu: ' + error.message);
    }
}

// ====== SUBMIT ======
async function submitIssue(id) {
    if (!hasPermission('issue.submit')) {
        showWarning('Bạn không có quyền gửi duyệt phiếu cấp phát!');
        return;
    }
    try {
        await api.submitIssue(id);
        await renderIssues();
        showSuccess('Đã gửi yêu cầu duyệt!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt: ' + error.message);
    }
}

// ====== APPROVE ======
async function approveIssue(id) {
    if (!hasPermission('issue.approve')) {
        showWarning('Bạn không có quyền duyệt phiếu cấp phát!');
        return;
    }
    try {
        await api.approveIssue(id);
        await renderIssues();
        showSuccess('Duyệt phiếu thành công! Thủ kho có thể tiến hành cấp phát.');
    } catch (error) {
        showError('Lỗi khi duyệt: ' + error.message);
    }
}

// ====== REJECT ======
async function rejectIssue(id) {
    if (!hasPermission('issue.reject')) {
        showWarning('Bạn không có quyền từ chối phiếu cấp phát!');
        return;
    }
    try {
        await api.rejectIssue(id);
        await renderIssues();
        showWarning('Đã từ chối phiếu!');
    } catch (error) {
        showError('Lỗi khi từ chối: ' + error.message);
    }
}

// ====== LẤY DANH SÁCH KHO CÓ ĐỦ TỒN KHO ======
async function getAvailableWarehousesForIssue(items, projectCode) {
    try {
        const warehouses = await api.getWarehouses();
        const inventory = await api.getInventory();
        const result = [];

        const projectId = getProjectIdByCode(projectCode);
        let candidateWarehouses = warehouses.filter(w => {
            if (projectId && w.projectId === projectId) return true;
            if (w.type === 'CENTRAL') return true;
            return false;
        });

        if (!candidateWarehouses.some(w => w.projectId === projectId)) {
            candidateWarehouses = warehouses.filter(w => w.type === 'CENTRAL');
        }

        for (const wh of candidateWarehouses) {
            let enough = true;
            let totalQty = 0;
            for (const it of items) {
                const inv = inventory.find(i => i.warehouseId === wh.id && i.itemId === it.itemId);
                const available = inv ? inv.quantity : 0;
                const required = it.actualQty !== undefined ? it.actualQty : it.requestedQty;
                if (available < required) enough = false;
                totalQty += available;
            }
            if (enough) {
                result.push({ ...wh, totalQty });
            }
        }

        result.sort((a, b) => b.totalQty - a.totalQty);
        return result;
    } catch (error) {
        showError('Lỗi khi kiểm tra kho: ' + error.message);
        return [];
    }
}

// ====== HIỂN THỊ MODAL CHỌN KHO ======
async function showCompleteIssueModal(id) {
    if (!hasPermission('issue.complete')) {
        showWarning('Bạn không có quyền thực hiện cấp phát!');
        return;
    }

    try {
        const issues = await api.getIssues();
        const item = issues.find(i => i.id === id);
        if (!item) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (item.status !== 'APPROVED') {
            showWarning('Phiếu chưa được duyệt hoặc đã hoàn thành!');
            return;
        }

        const items = item.items ? JSON.parse(item.items) : [];
        const availableWarehouses = await getAvailableWarehousesForIssue(items, item.projectCode);
        const allWarehouses = await api.getWarehouses();

        let whOptions = '';
        if (availableWarehouses.length === 0) {
            whOptions = allWarehouses.map(w =>
                `<option value="${w.id}">${w.code} - ${w.name}</option>`
            ).join('');
        } else {
            whOptions = availableWarehouses.map(w =>
                `<option value="${w.id}">${w.code} - ${w.name} (tồn: ${w.totalQty} đvt)</option>`
            ).join('');
        }

        const selectedWh = item.warehouseId || (availableWarehouses.length > 0 ? availableWarehouses[0].id : '');

        let itemsHtml = items.map((it, idx) => {
            const itemName = getItemName(it.itemId);
            const unit = getItemUnit(it.itemId);
            const currentActual = it.actualQty !== undefined ? it.actualQty : it.requestedQty;
            return `
                <div class="item-row" data-index="${idx}" data-item-id="${it.itemId}">
                    <span style="min-width:150px; font-weight:500;">${itemName} (${unit})</span>
                    <span style="min-width:80px;">Yêu cầu: ${it.requestedQty}</span>
                    <input type="number" class="issue-actual-qty" value="${currentActual}" placeholder="SL thực cấp" style="width:100px;" step="0.01">
                    <input type="text" class="issue-actual-condition" value="${it.condition || ''}" placeholder="Tình trạng" style="width:150px;">
                </div>
            `;
        }).join('');

        let warningMsg = '';
        if (availableWarehouses.length === 0) {
            warningMsg = `
                <div style="background:#fef2f2; border:1px solid #fecaca; padding:10px 14px; border-radius:8px; color:#b91c1c; margin-bottom:12px;">
                    <i class="fas fa-exclamation-triangle"></i> Không có kho nào đủ số lượng vật tư để cấp phát! Vui lòng nhập kho bổ sung hoặc giảm số lượng thực cấp.
                </div>
            `;
        }

        showModal('Cấp phát vật tư', `
            <div style="margin-bottom:12px;">
                <strong>Phiếu:</strong> ${item.code} - ${item.projectName}
            </div>
            ${warningMsg}
            <div class="form-group">
                <label>Chọn kho xuất</label>
                <select id="f-issue-warehouse" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    ${whOptions}
                </select>
                <div style="font-size:13px; color:#888; margin-top:4px;">
                    <i class="fas fa-info-circle"></i> Chỉ hiển thị các kho có đủ số lượng vật tư theo yêu cầu.
                </div>
            </div>
            <div class="form-group">
                <label>Điều chỉnh số lượng thực cấp và tình trạng vật tư</label>
                <div id="issue-edit-items-container">
                    ${itemsHtml}
                </div>
                <div style="font-size:13px; color:#888; margin-top:4px;">
                    <i class="fas fa-info-circle"></i> Số lượng thực cấp không được vượt quá số lượng yêu cầu.
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="completeIssueWithWarehouse(${id})">Xác nhận cấp phát</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        if (selectedWh) {
            document.getElementById('f-issue-warehouse').value = selectedWh;
        }
    } catch (error) {
        showError('Lỗi khi tải thông tin cấp phát: ' + error.message);
    }
}

// ====== HOÀN THÀNH CẤP PHÁT VỚI KHO ĐƯỢC CHỌN ======
async function completeIssueWithWarehouse(id) {
    const warehouseId = parseInt(document.getElementById('f-issue-warehouse').value);
    if (!warehouseId) {
        showError('Vui lòng chọn kho xuất!');
        return;
    }

    const rows = document.querySelectorAll('#issue-edit-items-container .item-row');
    let hasError = false;
    const updatedItems = [];

    rows.forEach(row => {
        const itemId = parseInt(row.dataset.itemId);
        const actualQty = parseFloat(row.querySelector('.issue-actual-qty').value) || 0;
        const condition = row.querySelector('.issue-actual-condition').value.trim();
        if (actualQty < 0) {
            showError(`Số lượng thực cấp của ${getItemName(itemId)} không được âm.`);
            hasError = true;
            return;
        }
        updatedItems.push({
            itemId,
            actualQty,
            condition
        });
    });

    if (hasError) return;

    try {
        await api.completeIssue(id, warehouseId, JSON.stringify(updatedItems));
        closeModal();
        await renderIssues();
        showSuccess(`Cấp phát thành công! Vật tư đã được trừ khỏi kho.`);
    } catch (error) {
        showError('Lỗi khi cấp phát: ' + error.message);
    }
}

// ====== GIỮ LẠI HÀM CŨ ĐỂ TƯƠNG THÍCH ======
function completeIssue(id) {
    showCompleteIssueModal(id);
}

// ====== XÁC NHẬN CUỐI ======
async function confirmIssue(id) {
    if (!hasPermission('issue.confirm')) {
        showWarning('Bạn không có quyền xác nhận phiếu cấp phát!');
        return;
    }
    try {
        await api.confirmIssue(id);
        await renderIssues();
        showSuccess('Xác nhận hoàn tất phiếu cấp phát!');
    } catch (error) {
        showError('Lỗi khi xác nhận: ' + error.message);
    }
}

// ====== XÓA PHIẾU ======
async function deleteIssue(id) {
    if (!hasPermission('issue.delete')) {
        showWarning('Bạn không có quyền xóa phiếu cấp phát!');
        return;
    }
    if (!confirm('Xóa phiếu cấp phát này?')) return;
    try {
        await api.deleteIssue(id);
        await renderIssues();
        showSuccess('Xóa phiếu thành công!');
    } catch (error) {
        showError('Lỗi khi xóa phiếu: ' + error.message);
    }
}

// ====== EXPORT EXCEL ======
function exportIssues() {
    api.getIssues().then(issues => {
        if (!issues || !issues.length) {
            showWarning('Không có dữ liệu để xuất!');
            return;
        }
        const data = issues.map(item => ({
            'Mã phiếu': item.code,
            'Dự án': item.projectName || item.projectCode || '',
            'Ngày cấp': item.date || '',
            'Khu vực/Hạng mục': item.area || '',
            'Đội thi công': item.team || '',
            'Người yêu cầu': item.requester || '',
            'Trạng thái': item.status,
            'Số lượng vật tư': item.items ? JSON.parse(item.items).reduce((sum, it) => sum + (it.actualQty || it.requestedQty), 0) : 0,
            'Kho xuất': item.warehouseId ? getWarehouseName(item.warehouseId) : '',
            'Ghi chú': item.note || ''
        }));
        exportToExcel(data, 'Danh_sach_cap_phat', Object.keys(data[0]));
    }).catch(err => {
        showError('Lỗi lấy dữ liệu xuất: ' + err.message);
    });
}

// ====== IN PHIẾU ======
function printIssue(id) {
    showInfo('Chức năng in đang được phát triển.');
}

// ====== EXPORT ======
window.renderIssuePage = renderIssuePage;
window.renderIssues = renderIssues;
window.exportIssues = exportIssues;
window.viewIssue = viewIssue;
window.editIssue = editIssue;
window.submitIssue = submitIssue;
window.approveIssue = approveIssue;
window.rejectIssue = rejectIssue;
window.completeIssue = completeIssue;
window.confirmIssue = confirmIssue;
window.deleteIssue = deleteIssue;
window.showCompleteIssueModal = showCompleteIssueModal;
window.completeIssueWithWarehouse = completeIssueWithWarehouse;
window.printIssue = printIssue;
window.resetIssueFilters = resetIssueFilters;

// Item selector functions
window.issueItemSelectorCallback = issueItemSelectorCallback;
window.renderIssueSelectedItems = renderIssueSelectedItems;
window.removeIssueItem = removeIssueItem;
window.openItemSelectorForIssue = openItemSelectorForIssue;

console.log('✅ Issue module updated with approval level and canApprove.');