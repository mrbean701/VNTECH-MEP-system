// ================================================================
// MR (Material Request) - SỬ DỤNG API - HỖ TRỢ WORKFLOW ĐỘNG
// ================================================================
let mrPageState = { page: 1, perPage: 10 };


// ====== HÀM LẤY ACTION ======
function getMRActions(mr) {
    const user = getUser();
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewMR(${mr.id})"><i class="fas fa-eye"></i></button>`;

    // Quyền sửa: DRAFT hoặc PENDING chưa có lịch sử duyệt
    const canEdit = hasPermission('mr.edit') && 
                   (mr.status === 'DRAFT' || mr.status === 'PENDING') && 
                   (user?.role === 'ADMIN' || user?.id === mr.createdBy);
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editMR(${mr.id})"><i class="fas fa-edit"></i></button>`;
    }

    // Quyền xóa: chỉ DRAFT
    const canDelete = hasPermission('mr.delete') && 
                     (user?.role === 'ADMIN' || user?.id === mr.createdBy) && 
                     mr.status === 'DRAFT';
    if (canDelete) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deleteMR(${mr.id})"><i class="fas fa-trash"></i></button>`;
    }

    // ✅ Gửi duyệt: chỉ cần có quyền submit và status DRAFT (không cần là người tạo)
    const canSubmit = hasPermission('mr.submit') && mr.status === 'DRAFT';
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitMR(${mr.id})">Gửi duyệt</button>`;
    }

    // Duyệt: PENDING và có quyền approve (backend sẽ kiểm tra workflow)
    if (hasPermission('mr.approve') && mr.status === 'PENDING') {
        actions += ` <button class="btn btn-success btn-sm" onclick="approveMR(${mr.id})">Duyệt</button>`;
        actions += ` <button class="btn btn-danger btn-sm" onclick="rejectMR(${mr.id})">Từ chối</button>`;
    }

    // Tạo PR từ MR: chỉ APPROVED
    const canCreatePR = hasPermission('pr.create') && mr.status === 'APPROVED';
    if (canCreatePR) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="createPRFromMR(${mr.id})">Tạo PR</button>`;
    }

    return actions || '-';
}

// ====== RENDER DANH SÁCH MR ======
async function renderMR(page = null) {
    try {
        const mrs = await api.getMRs();
        const filter = document.getElementById('mr-filter')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('mr-status-filter')?.value || '';

        const filtered = mrs.filter(m => {
            const matchCode = (m.code || '').toLowerCase().includes(filter);
            const matchProject = (m.projectName || m.projectCode || '').toLowerCase().includes(filter);
            const matchStatus = statusFilter ? m.status === statusFilter : true;
            return (matchCode || matchProject) && matchStatus;
        });

        if (page) mrPageState.page = page;
        const perPage = getPageSize('mr');
        mrPageState.perPage = perPage;
        const paging = paginate(filtered, mrPageState.page, perPage);

        const canCreate = hasPermission('mr.create');
        const btnCreate = document.getElementById('btn-create-mr');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="mr-filter" placeholder="Tìm theo mã hoặc dự án..." style="flex:1;" />
                <select id="mr-status-filter">
                    <option value="">Tất cả</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
                <button class="btn btn-sm" onclick="renderMR()"><i class="fas fa-search"></i></button>
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
                    itemsStr = items.map(it => `${getItemCode(it.itemId)} (${it.quantity})`).join(', ');
                }
            } catch (e) { itemsStr = 'Lỗi parse'; }

            const statusBadge = getStatusBadge(m.status);
            const actions = getMRActions(m);
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

        const filterInput = document.getElementById('mr-filter');
        const statusSelect = document.getElementById('mr-status-filter');
        if (filterInput) {
            filterInput.removeEventListener('input', renderMR);
            filterInput.addEventListener('input', () => { mrPageState.page = 1; renderMR(); });
        }
        if (statusSelect) {
            statusSelect.removeEventListener('change', renderMR);
            statusSelect.addEventListener('change', () => { mrPageState.page = 1; renderMR(); });
        }

    } catch (error) {
        showError('Không thể tải danh sách MR: ' + error.message);
        console.error('renderMR error:', error);
    }
}

// ====== TẠO MR MỚI (MODAL) ======
function showCreateMRModal() {
    api.getProjects().then(projects => {
        const projectOpts = projects.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
        showModal('Tạo Material Request', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-mr-project"><option value="">-- Chọn --</option>${projectOpts}</select>
            </div>
            <div class="form-group"><label>Ngày cần</label><input id="f-mr-needdate" type="date"></div>
            <div class="form-group"><label>Mục đích / Khu vực sử dụng</label><input id="f-mr-purpose"></div>
            <div class="form-group"><label>Người yêu cầu</label><input id="f-mr-requester" placeholder="Tên người yêu cầu"></div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="mr-items-container">${buildItemRowsForForm([{itemId:'', quantity:''}], 'mr')}</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-mr-note" rows="2"></textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="saveMR()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
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
    const container = document.getElementById('mr-items-container');
    const items = collectItemsFromForm(container);

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
            note: document.getElementById('f-mr-note').value.trim(),
        };

        await api.createMR(newMR);
        closeModal();
        await renderMR();
        showSuccess('Tạo MR thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo MR: ' + error.message);
    }
}

// ====== XEM CHI TIẾT MR ======
async function viewMR(id) {
    try {
        let mr = null;
        const mrs = await api.getMRs();
        mr = mrs.find(m => m.id === id);
        if (!mr) {
            showError('Không tìm thấy MR!');
            return;
        }

        let items = [];
        try {
            if (mr.items) {
                items = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
            }
        } catch (e) { items = []; }

        const itemsHtml = buildItemsTable(items);
        
        // Lấy workflow steps từ workflowId của MR
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
                // Fallback: lấy steps từ module
                try {
                    const workflowSteps = await api.getStepsWithStatus('mr');
                    if (workflowSteps && workflowSteps.length > 0) {
                        stepsConfig = workflowSteps.map(s => ({
                            id: s.step,
                            label: s.label || `Bước ${s.step}`
                        }));
                    }
                } catch (e2) {}
            }
        } else {
            // Fallback: lấy steps từ module
            try {
                const workflowSteps = await api.getStepsWithStatus('mr');
                if (workflowSteps && workflowSteps.length > 0) {
                    stepsConfig = workflowSteps.map(s => ({
                        id: s.step,
                        label: s.label || `Bước ${s.step}`
                    }));
                }
            } catch (e) {}
        }

        const approvalHtml = renderApprovalProgress(mr.status, mr.approvalStep || 1, stepsConfig);

        const projectId = getProjectIdByCode(mr.projectCode);
        const projectLink = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${mr.projectName || mr.projectCode || '--'}</span>` :
            (mr.projectName || mr.projectCode || '--');

        showModal('Chi tiết MR', `
            <div class="detail-grid">
                <div><span class="label">Mã MR:</span> <span class="value">${mr.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${mr.createdAt || ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectLink}</span></div>
                <div><span class="label">Người yêu cầu:</span> <span class="value">${mr.requester || mr.createdByName || '--'}</span></div>
                <div><span class="label">Ngày cần:</span> <span class="value">${mr.needDate || ''}</span></div>
                <div><span class="label">Mục đích/Khu vực:</span> <span class="value">${mr.purpose || ''}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(mr.status)}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${approvalHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${mr.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printMR(${mr.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
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

        let itemsData = [{ itemId: '', quantity: '' }];
        try {
            if (mr.items) {
                itemsData = typeof mr.items === 'string' ? JSON.parse(mr.items) : mr.items;
                if (!itemsData.length) itemsData = [{ itemId: '', quantity: '' }];
            }
        } catch (e) { itemsData = [{ itemId: '', quantity: '' }]; }

        showModal('Sửa Material Request', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-mr-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Ngày cần</label><input id="f-mr-needdate" type="date" value="${mr.needDate || ''}"></div>
            <div class="form-group"><label>Mục đích</label><input id="f-mr-purpose" value="${mr.purpose || ''}"></div>
            <div class="form-group"><label>Người yêu cầu</label><input id="f-mr-requester" value="${mr.requester || ''}"></div>
            <div class="form-group"><label>Vật tư</label>
                <div id="mr-items-container">${buildItemRowsForForm(itemsData, 'mr')}</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-mr-note" rows="2">${mr.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateMR(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
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
    const container = document.getElementById('mr-items-container');
    const items = collectItemsFromForm(container);

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
            note: document.getElementById('f-mr-note').value.trim(),
        };

        await api.updateMR(id, updatedMR);
        closeModal();
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
    window.navigateTo('pr');
    setTimeout(() => {
        if (typeof showCreatePRFromMRModal === 'function') {
            showCreatePRFromMRModal(mrId);
        } else {
            showError('Chức năng tạo PR từ MR chưa sẵn sàng');
        }
    }, 300);
}

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

console.log('✅ MR module updated with dynamic workflow support.');