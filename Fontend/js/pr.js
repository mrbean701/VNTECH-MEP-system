// ================================================================
// PR (Purchase Request) - SỬ DỤNG API - ĐÃ TÍCH HỢP PHÂN QUYỀN
// ================================================================
let prPageState = { page: 1, perPage: 10 };

// ====== HÀM LẤY ACTION ======
function getPRActions(pr) {
    const user = getUser();
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewPR(${pr.id})"><i class="fas fa-eye"></i></button>`;

    // Quyền sửa: DRAFT hoặc PENDING chưa có lịch sử duyệt
    const editStatuses = ['DRAFT', 'PENDING', 'PENDING_PLANNING', 'PENDING_PROJECT', 'PENDING_CEO', 
                          'PLANNING_APPROVED', 'PROJECT_APPROVED'];
    const canEdit = hasPermission('pr.edit') && 
                   editStatuses.includes(pr.status) && 
                   (user?.role === 'ADMIN' || user?.id === pr.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editPR(${pr.id})"><i class="fas fa-edit"></i></button>`;
    }

    // Quyền xóa: chỉ DRAFT
    const canDelete = hasPermission('pr.delete') && 
                     (user?.role === 'ADMIN' || user?.id === pr.createdBy) && 
                     pr.status === 'DRAFT';
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deletePR(${pr.id})"><i class="fas fa-trash"></i></button>`;
    }

    // Gửi duyệt: chỉ DRAFT và người tạo hoặc ADMIN
    const canSubmit = hasPermission('pr.submit') && 
                     pr.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === pr.createdBy);
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitPR(${pr.id})">Gửi duyệt</button>`;
    }

    // Duyệt / Từ chối: tất cả trạng thái chờ duyệt
    const pendingStatuses = ['PENDING', 'PENDING_PLANNING', 'PENDING_PROJECT', 'PENDING_CEO', 
                             'PLANNING_APPROVED', 'PROJECT_APPROVED'];
    const canApprove = hasPermission('pr.approve') && pendingStatuses.includes(pr.status);
    if (canApprove) {
        actions += ` <button class="btn btn-success btn-sm" onclick="approvePR(${pr.id})">Duyệt</button>`;
        actions += ` <button class="btn btn-danger btn-sm" onclick="rejectPR(${pr.id})">Từ chối</button>`;
    }

    // Tạo PO từ PR: chỉ APPROVED
    const canCreatePO = hasPermission('po.create') && pr.status === 'APPROVED';
    if (canCreatePO) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="createPOFromPR(${pr.id})">Tạo PO</button>`;
    }

    return actions || '-';
}


// ====== RENDER DANH SÁCH PR ======
async function renderPR(page = null) {
    try {
        const prs = await api.getPRs();
        const filter = document.getElementById('pr-filter')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('pr-status-filter')?.value || '';

        const filtered = prs.filter(p => {
            const matchCode = (p.code || '').toLowerCase().includes(filter);
            const matchProject = (p.projectName || p.projectCode || '').toLowerCase().includes(filter);
            const matchStatus = statusFilter ? p.status === statusFilter : true;
            return (matchCode || matchProject) && matchStatus;
        });

        if (page) prPageState.page = page;
        const perPage = getPageSize('pr');
        prPageState.perPage = perPage;
        const paging = paginate(filtered, prPageState.page, perPage);

        const canCreate = hasPermission('pr.create');
        const btnCreate = document.getElementById('btn-create-pr');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="pr-filter" placeholder="Tìm theo mã hoặc dự án..." style="flex:1;" />
                <select id="pr-status-filter">
                    <option value="">Tất cả</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="PENDING_PLANNING">PENDING_PLANNING</option>
                    <option value="PENDING_PROJECT">PENDING_PROJECT</option>
                    <option value="PENDING_CEO">PENDING_CEO</option>
                    <option value="PLANNING_APPROVED">PLANNING_APPROVED</option>
                    <option value="PROJECT_APPROVED">PROJECT_APPROVED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
                <button class="btn btn-sm" onclick="renderPR()"><i class="fas fa-search"></i></button>
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
                    itemsStr = items.map(it => `${getItemCode(it.itemId)} (${it.quantity})`).join(', ');
                }
            } catch (e) { itemsStr = 'Lỗi parse'; }

            const statusBadge = getStatusBadge(p.status);
            const actions = getPRActions(p);
            const projectId = getProjectIdByCode(p.projectCode);
            const projectLink = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewProject(${projectId})">${p.projectName || p.projectCode || '--'}</span>` :
                (p.projectName || p.projectCode || '--');

            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewPR(${p.id})">${p.code || '--'}</td>
                <td>${projectLink}</td>
                <td>${p.vendorName || p.vendorCode || '--'}</td>
                <td>${itemsStr}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderPR', 'pr');
        document.getElementById('pr-container').innerHTML = html;

        const filterInput = document.getElementById('pr-filter');
        const statusSelect = document.getElementById('pr-status-filter');
        if (filterInput) {
            filterInput.removeEventListener('input', renderPR);
            filterInput.addEventListener('input', () => { prPageState.page = 1; renderPR(); });
        }
        if (statusSelect) {
            statusSelect.removeEventListener('change', renderPR);
            statusSelect.addEventListener('change', () => { prPageState.page = 1; renderPR(); });
        }

    } catch (error) {
        showError('Không thể tải danh sách PR: ' + error.message);
        console.error('renderPR error:', error);
    }
}

// ====== CÁC HÀM KHÁC (giữ nguyên) ======
// ... (viewPR, editPR, updatePR, submitPR, approvePR, rejectPR, deletePR, createPOFromPR, printPR, ...)

// ====== TẠO PR MỚI ======
async function showCreatePRModal(mr = null) {
    try {
        const projects = await api.getProjects();
        const projectOpts = projects.map(p => `<option value="${p.code}" ${mr && p.code === mr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v => `<option value="${v.code}" ${mr && v.code === mr.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`).join('');
        let itemsData = [{ itemId: '', quantity: '' }];
        if (mr) {
            try {
                if (mr.items) {
                    itemsData = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
                    if (!itemsData.length) itemsData = [{ itemId: '', quantity: '' }];
                }
            } catch (e) { itemsData = [{ itemId: '', quantity: '' }]; }
        }

        showModal('Tạo Purchase Request (PR)', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-pr-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Nhà cung cấp</label>
                <select id="f-pr-vendor"><option value="">-- Chọn --</option>${vendorOpts}</select>
            </div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="pr-items-container">${buildItemRowsForForm(itemsData, 'pr')}</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-pr-note" rows="2">${mr ? mr.note || '' : ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="savePRManual()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
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
    if (!projectCode || !vendorCode) {
        showError('Vui lòng chọn dự án và nhà cung cấp');
        return;
    }
    const container = document.getElementById('pr-items-container');
    const items = collectItemsFromForm(container);
    if (items.length === 0) {
        showError('Cần ít nhất một vật tư');
        return;
    }

    try {
        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const vendors = await api.getVendors();
        const vendor = vendors.find(v => v.code === vendorCode);
        const user = getUser();

        const newPR = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note: document.getElementById('f-pr-note').value.trim(),
        };

        await api.createPR(newPR);
        closeModal();
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

        const itemsHtml = buildItemsTable(items);
        
        // Lấy workflow steps từ workflowId của PR
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
                try {
                    const workflowSteps = await api.getStepsWithStatus('pr');
                    if (workflowSteps && workflowSteps.length > 0) {
                        stepsConfig = workflowSteps.map(s => ({
                            id: s.step,
                            label: s.label || `Bước ${s.step}`
                        }));
                    }
                } catch (e2) {}
            }
        } else {
            try {
                const workflowSteps = await api.getStepsWithStatus('pr');
                if (workflowSteps && workflowSteps.length > 0) {
                    stepsConfig = workflowSteps.map(s => ({
                        id: s.step,
                        label: s.label || `Bước ${s.step}`
                    }));
                }
            } catch (e) {}
        }

        const approvalHtml = renderApprovalProgress(pr.status, pr.approvalStep || 1, stepsConfig);
        const projectId = getProjectIdByCode(pr.projectCode);
        const projectLink = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${pr.projectName || pr.projectCode || '--'}</span>` :
            (pr.projectName || pr.projectCode || '--');
        const totalAmount = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);

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
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsHtml}</div>
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
        if (pr.status !== 'DRAFT' && pr.status !== 'PENDING' && pr.status !== 'PENDING_PLANNING' && pr.status !== 'PENDING_PROJECT' && pr.status !== 'PENDING_CEO') {
            showWarning('Chỉ có thể sửa PR ở trạng thái DRAFT hoặc đang chờ duyệt');
            return;
        }

        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.code}" ${p.code === pr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v =>
            `<option value="${v.code}" ${v.code === pr.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`).join('');

        let itemsData = [{ itemId: '', quantity: '' }];
        try {
            if (pr.items) {
                itemsData = typeof pr.items === 'string' ? JSON.parse(pr.items) : pr.items;
                if (!itemsData.length) itemsData = [{ itemId: '', quantity: '' }];
            }
        } catch (e) { itemsData = [{ itemId: '', quantity: '' }]; }

        showModal('Sửa Purchase Request', `
            <div class="form-group"><label>Dự án</label><select id="f-pr-project">${projectOpts}</select></div>
            <div class="form-group"><label>Nhà cung cấp</label><select id="f-pr-vendor">${vendorOpts}</select></div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="pr-items-container">${buildItemRowsForForm(itemsData, 'pr')}</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-pr-note" rows="2">${pr.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updatePR(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải thông tin PR: ' + error.message);
    }
}

// ====== CẬP NHẬT PR ======
async function updatePR(id) {
    const projectCode = document.getElementById('f-pr-project').value;
    const vendorCode = document.getElementById('f-pr-vendor').value;
    if (!projectCode || !vendorCode) {
        showError('Vui lòng chọn dự án và NCC');
        return;
    }
    const container = document.getElementById('pr-items-container');
    const items = collectItemsFromForm(container);
    if (items.length === 0) {
        showError('Cần ít nhất một vật tư');
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
            note: document.getElementById('f-pr-note').value.trim(),
        };

        await api.updatePR(id, updatedPR);
        closeModal();
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

console.log('✅ PR module updated with permission checks (header removed).');