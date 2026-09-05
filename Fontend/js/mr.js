// ================================================================
// MR (Material Request) - SỬ DỤNG API - HỖ TRỢ WORKFLOW ĐỘNG
// ================================================================

// ====== STATE ======
const mrState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    projectFilter: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};


// ====== DEBOUNCE FILTER ======
const debouncedMRFilter = debounce(() => {
    mrState.page = 1;
    renderMR();
}, 300);

// ====== BIẾN TOÀN CỤC CHO ITEM SELECTOR ======
let _mrSelectedItems = [];
let _mrMode = 'create';
let _mrEditId = null;



// ====== HÀM LẤY ACTION ======
function getMRActions(mr, statuses) {
    const user = getUser();
    let actions = '';


    actions += `<button class="btn btn-info btn-sm" onclick="viewMR(${mr.id})"><i class="fas fa-eye"></i></button>`;

    const canEdit = hasPermission('mr.edit') &&
                   (mr.status === 'DRAFT' || mr.status === 'PENDING') &&
                   (user?.role === 'ADMIN' || user?.id === mr.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editMR(${mr.id})"><i class="fas fa-edit"></i></button>`;
    }

    const canDelete = hasPermission('mr.delete') &&
                     (user?.role === 'ADMIN' || user?.id === mr.createdBy) &&
                     mr.status === 'DRAFT';
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deleteMR(${mr.id})"><i class="fas fa-trash"></i></button>`;
    }

    const canSubmit = hasPermission('mr.submit') && mr.status === 'DRAFT';
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitMR(${mr.id})">Xác nhận</button>`;
    }

    // ✅ Nút Approve/Reject: kiểm tra currentStep (lấy từ workflow_progress)
    if (mr.status === 'PENDING' && !mr.isCompleted) {
        
        let currentStep = mr.approvalStep || 1;
        if (mr._progress && mr._progress.currentStep) {
            currentStep = mr._progress.currentStep;
        }
        if (canApprove(currentStep, 'mr.approve', null)) {
            actions += ` <button class="btn btn-success btn-sm" onclick="approveMR(${mr.id})">Duyệt</button>`;
            actions += ` <button class="btn btn-danger btn-sm" onclick="rejectMR(${mr.id})">Từ chối</button>`;
        }
    }

    // ✅ Nút tạo PR (khi MR đã APPROVED và user có permission pr.create và approvalLevel = 0)
    const canCreatePR = hasPermission('pr.create') &&
                        mr.status === 'APPROVED' &&
                        !mr.isCompleted &&
                        getUserApprovalLevel() === 0;
    if (canCreatePR) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="createPRFromMR(${mr.id})">Tạo PR</button>`;
    }

    return actions || '-';
}

// ====== HÀM FILTER DỮ LIỆU ======
function filterMRData(mrs, projects) {
    const { filterText, statusFilter, projectFilter } = mrState;
    const keyword = filterText.toLowerCase().trim();

    return mrs.filter(mr => {
        let matchKeyword = true;
        if (keyword) {
            const codeMatch = (mr.code || '').toLowerCase().includes(keyword);
            const projectNameMatch = (mr.projectName || '').toLowerCase().includes(keyword);
            const projectCodeMatch = (mr.projectCode || '').toLowerCase().includes(keyword);

            let itemsMatch = false;
            try {
                if (mr.items) {
                    const items = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
                    itemsMatch = items.some(item => {
                        const itemName = item.displayName || getItemName(item.itemId) || '';
                        const itemCode = getItemCode(item.itemId) || '';
                        return itemName.toLowerCase().includes(keyword) ||
                               itemCode.toLowerCase().includes(keyword);
                    });
                }
            } catch (e) {}

            matchKeyword = codeMatch || projectNameMatch || projectCodeMatch || itemsMatch;
        }

        const matchStatus = statusFilter ? mr.status === statusFilter : true;
        let matchProject = true;
        if (projectFilter) {
            const selectedProject = projects.find(p => p.code === projectFilter || p.id === parseInt(projectFilter));
            if (selectedProject) {
                matchProject = mr.projectCode === selectedProject.code;
            } else {
                matchProject = false;
            }
        }

        return matchKeyword && matchStatus && matchProject;
    });
}

// ====== HÀM SORT DỮ LIỆU ======
function sortMRData(data) {
    const { sortBy, sortOrder } = mrState;
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
        } else if (sortBy === 'status') {
            const statusOrder = { 'DRAFT': 0, 'PENDING': 1, 'APPROVED': 2, 'REJECTED': 3, 'COMPLETED': 4 };
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

// ====== RENDER DANH SÁCH MR ======
async function renderMR(page = null) {
    try {
        const [mrs, projects, statuses] = await Promise.all([
            api.getMRs(),
            api.getProjects(),
            api.getStatuses('mr').catch(() => [])
        ]);
        
        window._projectsCache = projects;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['mr'] = statuses;
        saveData('projects', projects);

        if (page) mrState.page = page;

        let filtered = filterMRData(mrs, projects);
        filtered = sortMRData(filtered);

        const perPage = getPageSize('mr');
        mrState.perPage = perPage;
        const paging = paginate(filtered, mrState.page, perPage);

        const canCreate = hasPermission('mr.create');
        const btnCreate = document.getElementById('btn-create-mr');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="mr-filter" placeholder="Tìm theo mã, dự án, vật tư..." style="flex:2;" value="${mrState.filterText}">
                <select id="mr-status-filter" style="flex:1;">
                    <option value="">Tất cả trạng thái</option>
                    ${statuses.map(s => `<option value="${s.code}" ${mrState.statusFilter === s.code ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <select id="mr-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${mrState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="mr-sort" style="flex:1;">
                    <option value="createdAt_desc" ${mrState.sortBy === 'createdAt' && mrState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${mrState.sortBy === 'createdAt' && mrState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="code_asc" ${mrState.sortBy === 'code' && mrState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${mrState.sortBy === 'code' && mrState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${mrState.sortBy === 'projectName' && mrState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${mrState.sortBy === 'projectName' && mrState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="status" ${mrState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetMRFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã MR</th>
                            <th>Dự án</th>
                            <th>Vật tư (SL)</th>
                            <th>Ngày cần</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="6" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const m of paging.items) {
            let itemsStr = '';
            try {
                if (m.items) {
                    const items = typeof m.items === 'string' ? JSON.parse(m.items) : m.items;
                    itemsStr = items.map(it => {
                        const name = it.displayName || getItemName(it.itemId) || 'N/A';
                        return `${name} (${it.quantity})`;
                    }).join(', ');
                }
            } catch (e) { itemsStr = 'Lỗi parse'; }

            const statusBadge = getStatusBadgeWithInfo(m.status, statuses);
            const actions = getMRActions(m, statuses);
            const projectId = getProjectIdByCode(m.projectCode);
            const projectLink = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewProject(${projectId})">${m.projectName || m.projectCode || '--'}</span>` :
                (m.projectName || m.projectCode || '--');

            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewMR(${m.id})">${m.code || '--'}</td>
                <td>${projectLink}</td>
                <td>${itemsStr}</td>
                <td>${m.needDate || ''}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderMR', 'mr');
        document.getElementById('mr-container').innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('mr-filter');
        const statusSelect = document.getElementById('mr-status-filter');
        const projectSelect = document.getElementById('mr-project-filter');
        const sortSelect = document.getElementById('mr-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedMRFilter);
            filterInput.addEventListener('input', function(e) {
                mrState.filterText = this.value;
                debouncedMRFilter();
            });
        }

        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedMRFilter);
            statusSelect.addEventListener('change', function(e) {
                mrState.statusFilter = this.value;
                debouncedMRFilter();
            });
        }

        if (projectSelect) {
            projectSelect.removeEventListener('change', debouncedMRFilter);
            projectSelect.addEventListener('change', function(e) {
                mrState.projectFilter = this.value;
                debouncedMRFilter();
            });
        }

        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedMRFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                mrState.sortBy = sortBy;
                mrState.sortOrder = sortOrder || 'desc';
                debouncedMRFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách MR: ' + error.message);
        console.error('renderMR error:', error);
    }
}

// ====== RESET FILTER ======
function resetMRFilters() {
    mrState.filterText = '';
    mrState.statusFilter = '';
    mrState.projectFilter = '';
    mrState.sortBy = 'createdAt';
    mrState.sortOrder = 'desc';
    mrState.page = 1;
    renderMR();
}



// ====== CALLBACK TỪ MODAL CHỌN VẬT TƯ ======
function mrItemSelectorCallback(selectedItems) {
    _mrSelectedItems = selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity || 1,
        itemName: item.displayName || getItemName(item.itemId),
        itemCode: item.itemCode || getItemCode(item.itemId),
        unit: item.unit || getItemUnit(item.itemId)
    }));
    renderMRSelectedItems();
}

function renderMRSelectedItems() {
    const container = document.getElementById('mr-selected-items-container');
    if (!container) return;
    container.innerHTML = _renderMRSelectedItemsHTML();
    _attachMRQuantityEvents();
}

function _renderMRSelectedItemsHTML() {
    const items = _mrSelectedItems || [];
    if (items.length === 0) {
        return '<div style="color:#999; text-align:center; padding:8px;">Chưa chọn vật tư nào</div>';
    }
    let html = '';
    items.forEach((item, index) => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; margin-bottom:4px; background:#f0f4f8; border-radius:4px;">
                <span><strong>${item.itemCode}</strong> - ${item.itemName} (${item.unit})</span>
                <span>Số lượng: <input type="number" class="mr-item-qty" data-index="${index}" value="${item.quantity}" style="width:70px; padding:4px; border:1px solid #ccc; border-radius:4px;" min="0.01" step="0.01"></span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeMRItem(${index})"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
    return html;
}

function _attachMRQuantityEvents() {
    document.querySelectorAll('.mr-item-qty').forEach(input => {
        input.removeEventListener('change', _onMRQtyChange);
        input.addEventListener('change', _onMRQtyChange);
    });
}

function _onMRQtyChange(e) {
    const idx = parseInt(this.dataset.index);
    const val = parseFloat(this.value) || 1;
    if (val > 0 && _mrSelectedItems[idx]) {
        _mrSelectedItems[idx].quantity = val;
    } else {
        this.value = _mrSelectedItems[idx]?.quantity || 1;
    }
}

function removeMRItem(index) {
    if (_mrSelectedItems && _mrSelectedItems.length > index) {
        _mrSelectedItems.splice(index, 1);
        renderMRSelectedItems();
    }
}

function openItemSelectorForMR() {
    const selected = _mrSelectedItems || [];
    openItemSelectorHelper(selected, mrItemSelectorCallback, 'mr');
}

// ====== TẠO MR MỚI ======
function showCreateMRModal() {
    api.getProjects().then(projects => {
        const projectOpts = projects.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
        _mrSelectedItems = [];
        _mrMode = 'create';
        _mrEditId = null;

        showModal('Tạo Material Request', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-mr-project"><option value="">-- Chọn --</option>${projectOpts}</select>
            </div>
            <div class="form-group"><label>Ngày cần</label><input id="f-mr-needdate" type="date"></div>
            <div class="form-group"><label>Mục đích / Khu vực sử dụng</label><input id="f-mr-purpose"></div>
            <div class="form-group"><label>Người yêu cầu</label><input id="f-mr-requester" placeholder="Tên người yêu cầu"></div>
            <div class="form-group">
                <label>Danh sách vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForMR()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="mr-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderMRSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-mr-note" rows="2"></textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="saveMR()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachMRQuantityEvents();
        }, 100);
    }).catch(err => showError('Không thể tải dự án: ' + err.message));
}

// ====== LƯU MR ======
async function saveMR() {
    if (!hasPermission('mr.create')) {
        showWarning('Bạn không có quyền tạo MR!');
        return;
    }

    const projectCode = document.getElementById('f-mr-project').value;
    const needDate = document.getElementById('f-mr-needdate').value;
    const purpose = document.getElementById('f-mr-purpose').value.trim();
    const requester = document.getElementById('f-mr-requester').value.trim();
    const note = document.getElementById('f-mr-note').value.trim();

    const items = _mrSelectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        displayName: item.itemName
    }));

    if (!projectCode || items.length === 0) {
        showError('Vui lòng chọn dự án và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const user = getUser();

        const newMR = {
            projectCode,
            projectName: proj ? proj.name : '',
            items: JSON.stringify(items),
            needDate,
            purpose,
            requester: requester || user.name,
            note
        };

        await api.createMR(newMR);
        closeModal();
        _mrSelectedItems = [];
        await renderMR();
        showSuccess('Tạo MR thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo MR: ' + error.message);
    }
}

// ====== XEM CHI TIẾT MR ======
async function viewMR(id) {
    try {
        const [mrs, items, statuses, progress] = await Promise.all([
            api.getMRs(),
            api.getItems(),
            api.getStatuses('mr'),
            api.getWorkflowProgress('mr', id).catch(() => null) // ✅ Lấy tiến trình
        ]);

        const mr = mrs.find(m => m.id === id);
        if (!mr) {
            showError('Không tìm thấy MR!');
            return;
        }

        // Gắn progress vào mr để dùng trong actions
        mr._progress = progress;

        window._itemsCache = items;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['mr'] = statuses;

        let mrItems = [];
        try {
            if (mr.items) {
                mrItems = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
            }
        } catch (e) {
            console.warn('Lỗi parse items MR:', e);
            mrItems = [];
        }

        const itemsHtml = mrItems.map(it => {
            const item = items.find(i => i.id === it.itemId);
            const code = item ? item.code : 'N/A';
            const name = item ? (it.displayName || item.name) : (it.displayName || 'N/A');
            const unit = item ? item.unit : '';
            const model = item && item.model ? ` (${item.model})` : '';
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
            let stepsConfig = [{ id: 1, label: 'Chỉ huy trưởng' }];
            if (mr.workflowId) {
                try {
                    const wf = await api.getWorkflowById ? await api.getWorkflowById(mr.workflowId) : null;
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
            const currentStep = mr.approvalStep !== undefined && mr.approvalStep !== null ? mr.approvalStep : 1;
            progressHtml = renderApprovalProgress(mr.status, currentStep, stepsConfig, statuses);
        }

        // Lấy PR liên quan (nếu có)
        const prs = await api.getPRs();
        const existingPR = prs.find(pr => pr.mrId === mr.id);

        const projectId = getProjectIdByCode(mr.projectCode);
        const projectLink = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${mr.projectName || mr.projectCode || '--'}</span>` :
            (mr.projectName || mr.projectCode || '--');

        const itemsTable = `
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>Số lượng</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
            </div>
        `;

        let prInfoHtml = '';
        if (existingPR) {
            prInfoHtml = `
                <div style="grid-column:1/-1; background:#f0fdf4; padding:8px 12px; border-radius:6px; border:1px solid #bbf7d0;">
                    <i class="fas fa-file-invoice" style="color:#15803d;"></i>
                    <strong>Đã tạo PR:</strong>
                    <a href="#" onclick="event.preventDefault(); closeModal(); viewPR(${existingPR.id});" style="color:#1a3c6e; text-decoration:underline; font-weight:500;">
                        ${existingPR.code}
                    </a>
                    <span style="color:#888; font-size:13px; margin-left:8px;">(Trạng thái: ${existingPR.status})</span>
                </div>
            `;
        }

        const canMakePR = (mr.status === 'APPROVED' || mr.isApproved) &&
            !mr.isCompleted &&
            !existingPR &&
            hasPermission('pr.create') &&
            getUserApprovalLevel() === 0;
        const prBtnHtml = canMakePR
            ? ` <button class="btn btn-warning btn-sm" onclick="createPRFromMR(${mr.id}); closeModal();">Tạo PR</button>`
            : '';

        showModal('Chi tiết MR', `
            <div class="detail-grid">
                <div><span class="label">Mã MR:</span> <span class="value">${mr.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${mr.createdAt || ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectLink}</span></div>
                <div><span class="label">Người yêu cầu:</span> <span class="value">${mr.requester || mr.createdByName || '--'}</span></div>
                <div><span class="label">Ngày cần:</span> <span class="value">${mr.needDate || ''}</span></div>
                <div><span class="label">Mục đích/Khu vực:</span> <span class="value">${mr.purpose || ''}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadgeWithInfo(mr.status, statuses)}</span></div>
                ${prInfoHtml}
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${progressHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsTable}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${mr.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printMR(${mr.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                ${prBtnHtml}
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        console.error('viewMR error:', error);
        showError('Lỗi khi tải chi tiết MR: ' + error.message);
    }
}

// ====== SỬA MR ======
async function editMR(id) {
    if (!hasPermission('mr.edit')) {
        showWarning('Bạn không có quyền sửa MR!');
        return;
    }

    try {
        let mr = null;
        const mrs = await api.getMRs();
        mr = mrs.find(m => m.id === id);
        if (!mr) {
            showError('Không tìm thấy MR!');
            return;
        }
        if (mr.status !== 'DRAFT' && mr.status !== 'PENDING') {
            showWarning('Chỉ có thể sửa MR ở trạng thái DRAFT hoặc PENDING');
            return;
        }

        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.code}" ${p.code === mr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');

        let itemsData = [];
        try {
            if (mr.items) {
                const items = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
                itemsData = items.map(it => ({
                    itemId: it.itemId,
                    quantity: it.quantity || 1,
                    itemName: it.displayName || getItemName(it.itemId),
                    itemCode: getItemCode(it.itemId),
                    unit: getItemUnit(it.itemId)
                }));
            }
        } catch (e) {}
        _mrSelectedItems = itemsData;
        _mrMode = 'edit';
        _mrEditId = id;

        showModal('Sửa Material Request', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-mr-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Ngày cần</label><input id="f-mr-needdate" type="date" value="${mr.needDate || ''}"></div>
            <div class="form-group"><label>Mục đích</label><input id="f-mr-purpose" value="${mr.purpose || ''}"></div>
            <div class="form-group"><label>Người yêu cầu</label><input id="f-mr-requester" value="${mr.requester || ''}"></div>
            <div class="form-group">
                <label>Vật tư</label>
                <button type="button" class="btn btn-sm btn-info" onclick="openItemSelectorForMR()">
                    <i class="fas fa-plus"></i> Chọn vật tư
                </button>
                <div id="mr-selected-items-container" style="margin-top:8px; max-height:200px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${_renderMRSelectedItemsHTML()}
                </div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-mr-note" rows="2">${mr.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateMR(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        setTimeout(() => {
            _attachMRQuantityEvents();
        }, 100);
    } catch (error) {
        showError('Lỗi khi tải thông tin MR: ' + error.message);
    }
}

// ====== CẬP NHẬT MR ======
async function updateMR(id) {
    const projectCode = document.getElementById('f-mr-project').value;
    const needDate = document.getElementById('f-mr-needdate').value;
    const purpose = document.getElementById('f-mr-purpose').value.trim();
    const requester = document.getElementById('f-mr-requester').value.trim();
    const note = document.getElementById('f-mr-note').value.trim();

    const items = _mrSelectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        displayName: item.itemName
    }));

    if (!projectCode || items.length === 0) {
        showError('Vui lòng chọn dự án và ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);

        const updatedMR = {
            projectCode,
            projectName: proj ? proj.name : '',
            items: JSON.stringify(items),
            needDate,
            purpose,
            requester: requester,
            note
        };

        await api.updateMR(id, updatedMR);
        closeModal();
        _mrSelectedItems = [];
        await renderMR();
        showSuccess('Cập nhật MR thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật MR: ' + error.message);
    }
}

// ====== GỬI DUYỆT ======
async function submitMR(id) {
    if (!hasPermission('mr.submit')) {
        showWarning('Bạn không có quyền gửi duyệt MR!');
        return;
    }
    try {
        await api.submitMR(id);
        await renderMR();
        showSuccess('Đã gửi yêu cầu duyệt MR!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt: ' + error.message);
    }
}

// ====== DUYỆT MR ======
async function approveMR(id) {
    if (!hasPermission('mr.approve')) {
        showWarning('Bạn không có quyền duyệt MR!');
        return;
    }
    try {
        await api.approveMR(id);
        await renderMR();
        showSuccess('Duyệt MR thành công!');
    } catch (error) {
        showError('Lỗi khi duyệt MR: ' + error.message);
    }
}

// ====== TỪ CHỐI MR ======
async function rejectMR(id) {
    if (!hasPermission('mr.reject')) {
        showWarning('Bạn không có quyền từ chối MR!');
        return;
    }
    try {
        await api.rejectMR(id);
        await renderMR();
        showWarning('Đã từ chối MR!');
    } catch (error) {
        showError('Lỗi khi từ chối MR: ' + error.message);
    }
}

// ====== XÓA MR ======
async function deleteMR(id) {
    if (!hasPermission('mr.delete')) {
        showWarning('Bạn không có quyền xóa MR!');
        return;
    }
    if (!confirm('Xóa MR này?')) return;
    try {
        await api.deleteMR(id);
        await renderMR();
        showSuccess('Xóa MR thành công!');
    } catch (error) {
        showError('Lỗi khi xóa MR: ' + error.message);
    }
}

// ====== TẠO PR TỪ MR ======
function createPRFromMR(mrId) {
    if (!hasPermission('pr.create')) {
        showWarning('Bạn không có quyền tạo PR!');
        return;
    }
    if (typeof window.showCreatePRFromMRModal === 'function') {
        window.showCreatePRFromMRModal(mrId);
    } else {
        showError('Chức năng tạo PR từ MR chưa sẵn sàng. Vui lòng tải lại trang.');
    }
}

async function viewMRByCode(code) {
    try {
        const mrs = await api.getMRs();
        const mr = mrs.find(m => m.code === code);
        if (mr) {
            viewMR(mr.id);
        } else {
            showError('Không tìm thấy MR với mã: ' + code);
        }
    } catch (error) {
        showError('Lỗi tìm MR: ' + error.message);
    }
}
window.viewMRByCode = viewMRByCode;

// ====== IN PHIẾU MR ======
function printMR(id) {
    showInfo('Chức năng in đang được phát triển.');
}

// ====== EXPORT ======
window.renderMR = renderMR;
window.viewMR = viewMR;
window.editMR = editMR;
window.updateMR = updateMR;
window.deleteMR = deleteMR;
window.saveMR = saveMR;
window.submitMR = submitMR;
window.approveMR = approveMR;
window.rejectMR = rejectMR;
window.createPRFromMR = createPRFromMR;
window.printMR = printMR;
window.getMRActions = getMRActions;
window.showCreateMRModal = showCreateMRModal;
window.resetMRFilters = resetMRFilters;

// Item selector functions
window.mrItemSelectorCallback = mrItemSelectorCallback;
window.renderMRSelectedItems = renderMRSelectedItems;
window.removeMRItem = removeMRItem;
window.openItemSelectorForMR = openItemSelectorForMR;

console.log('✅ MR module updated with workflow progress.');