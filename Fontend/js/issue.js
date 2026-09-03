// ================================================================
// MATERIAL ISSUE - Cấp phát vật tư - ĐÃ TÍCH HỢP PHÂN QUYỀN
// ================================================================
let issuePageState = { page: 1, perPage: 10 };

// ====== HÀM TẠO MÃ TỰ ĐỘNG ======
function generateIssueCode() {
    return 'ISS-' + String(Date.now()).slice(-6);
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

    // Kiểm tra quyền xem
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

// ====== RENDER DANH SÁCH ======
async function renderIssues(page = null) {
    const container = document.getElementById('issue-container');
    if (!container) {
        console.error('❌ Không tìm thấy issue-container');
        return;
    }

    try {
        const issues = await api.getIssues();
        const filter = document.getElementById('issue-filter')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('issue-status-filter')?.value || '';

        const filtered = issues.filter(item => {
            const matchCode = (item.code || '').toLowerCase().includes(filter);
            const matchProject = (item.projectName || '').toLowerCase().includes(filter);
            const matchStatus = statusFilter ? item.status === statusFilter : true;
            return (matchCode || matchProject) && matchStatus;
        });

        if (page) issuePageState.page = page;
        const perPage = getPageSize('issue');
        issuePageState.perPage = perPage;
        const paging = paginate(filtered, issuePageState.page, perPage);

        // Kiểm tra quyền
        const canCreate = hasPermission('issue.create');

        // Ẩn/hiện nút Tạo phiếu
        const btnCreate = document.getElementById('btn-create-issue');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        // Tạo HTML (không có header)
        let html = `
            <div class="filter-bar">
                <input type="text" id="issue-filter" placeholder="Tìm theo mã hoặc dự án..." style="flex:1;" />
                <select id="issue-status-filter">
                    <option value="">Tất cả</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
                <button class="btn btn-sm" onclick="renderIssues()"><i class="fas fa-search"></i></button>
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
            const statusBadge = getStatusBadge(item.status);
            const projectId = getProjectIdByCode(item.projectCode);
            const projectDisplay = projectId ?
                `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId})">${item.projectName || item.projectCode}</span>` :
                (item.projectName || item.projectCode || '');

            const actions = getIssueActions(item);

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

                html += `
                    </tbody>
                </table>
            </div>
        `;
        html += buildPaginationHTML(paging, 'renderIssues', 'issue');

        container.innerHTML = html;

        // Gắn sự kiện cho filter
        const filterInput = document.getElementById('issue-filter');
        const statusSelect = document.getElementById('issue-status-filter');
        if (filterInput) {
            filterInput.removeEventListener('input', renderIssues);
            filterInput.addEventListener('input', () => { issuePageState.page = 1; renderIssues(); });
        }
        if (statusSelect) {
            statusSelect.removeEventListener('change', renderIssues);
            statusSelect.addEventListener('change', () => { issuePageState.page = 1; renderIssues(); });
        }

    } catch (error) {
        showError('Không thể tải danh sách cấp phát: ' + error.message);
        console.error('renderIssues error:', error);
    }
}

// ====== HÀM LẤY ACTION ======
function getIssueActions(item) {
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

    // ✅ SỬA: Gửi duyệt → Xác nhận
    const canSubmit = hasPermission('issue.submit') && 
                     item.status === 'DRAFT' && 
                     (user?.role === 'ADMIN' || user?.id === item.createdBy);
    if (canSubmit) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitIssue(${item.id})">Xác nhận</button>`;
    }

    const canApprove = hasPermission('issue.approve') && item.status === 'PENDING';
    if (canApprove) {
        actions += ` <button class="btn btn-success btn-sm" onclick="approveIssue(${item.id})">Duyệt</button>`;
        actions += ` <button class="btn btn-danger btn-sm" onclick="rejectIssue(${item.id})">Từ chối</button>`;
    }

    const canComplete = hasPermission('issue.complete') && item.status === 'APPROVED';
    if (canComplete) {
        actions += ` <button class="btn btn-success btn-sm" onclick="showCompleteIssueModal(${item.id})">Cấp phát</button>`;
    }

    const canConfirm = hasPermission('issue.confirm') && item.status === 'COMPLETED';
    if (canConfirm) {
        actions += ` <button class="btn btn-success btn-sm" onclick="confirmIssue(${item.id})">Xác nhận</button>`;
    }

    return actions || '-';
}

// ====== TẠO PHIẾU (MODAL) ======
function showCreateIssueModal() {
    Promise.all([api.getProjects(), api.getItems()]).then(([projects, items]) => {
        // Cache items cho dropdown
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
                <div id="issue-items-container">
                    ${buildIssueItemRows([{itemId: '', requestedQty: '', condition: ''}])}
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

// ====== BUILD DÒNG VẬT TƯ ======
function buildIssueItemRows(itemsData) {
    const allItems = window._itemsCache || [];
    if (!itemsData || itemsData.length === 0) {
        itemsData = [{ itemId: '', requestedQty: '', condition: '' }];
    }
    let html = '';
    itemsData.forEach((item, index) => {
        const selected = item.itemId || '';
        html += `<div class="item-row" data-index="${index}">
            <select class="issue-item-select" data-name="items[${index}].itemId">
                <option value="">-- Chọn --</option>
                ${allItems.map(it => `<option value="${it.id}" ${it.id == selected ? 'selected' : ''}>${it.code} - ${it.name}</option>`).join('')}
            </select>
            <input type="number" class="issue-item-qty" data-name="items[${index}].requestedQty" value="${item.requestedQty || ''}" placeholder="SL yêu cầu" style="width:120px;">
            <input type="text" class="issue-item-condition" data-name="items[${index}].condition" value="${item.condition || ''}" placeholder="Tình trạng" style="width:120px;">
            <button type="button" class="remove-item" onclick="removeIssueItemRow(this)"><i class="fas fa-minus"></i></button>
        </div>`;
    });
    html += `<button type="button" class="btn-add-item" onclick="addIssueItemRow(this)"><i class="fas fa-plus"></i> Thêm vật tư</button>`;
    return html;
}

function addIssueItemRow(btn) {
    const container = btn.parentElement;
    const index = container.querySelectorAll('.item-row').length;
    const allItems = window._itemsCache || [];
    let opts = allItems.map(it => `<option value="${it.id}">${it.code} - ${it.name}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.index = index;
    row.innerHTML = `
        <select class="issue-item-select"><option value="">-- Chọn --</option>${opts}</select>
        <input type="number" class="issue-item-qty" placeholder="SL yêu cầu" style="width:120px;">
        <input type="text" class="issue-item-condition" placeholder="Tình trạng" style="width:120px;">
        <button type="button" class="remove-item" onclick="removeIssueItemRow(this)"><i class="fas fa-minus"></i></button>
    `;
    container.insertBefore(row, btn);
}

function removeIssueItemRow(btn) {
    const row = btn.parentElement;
    const container = row.parentElement;
    if (container.querySelectorAll('.item-row').length <= 1) {
        showWarning('Cần ít nhất một dòng');
        return;
    }
    row.remove();
    container.querySelectorAll('.item-row').forEach((r, i) => {
        r.dataset.index = i;
    });
}

function collectIssueItemsFromForm(container) {
    const rows = container.querySelectorAll('.item-row');
    const items = [];
    rows.forEach(row => {
        const sel = row.querySelector('.issue-item-select');
        const qty = row.querySelector('.issue-item-qty');
        const condition = row.querySelector('.issue-item-condition');
        const itemId = parseInt(sel.value);
        const requestedQty = parseFloat(qty.value);
        if (itemId && !isNaN(requestedQty) && requestedQty > 0) {
            items.push({ itemId, requestedQty, actualQty: requestedQty, condition: condition.value || '' });
        }
    });
    return items;
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
    const container = document.getElementById('issue-items-container');
    const items = collectIssueItemsFromForm(container);

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
        await renderIssues();
        showSuccess('Tạo phiếu cấp phát thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo phiếu: ' + error.message);
    }
}

// ====== XEM CHI TIẾT PHIẾU ======
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

        const items = item.items ? JSON.parse(item.items) : [];
        const itemsHtml = items.map(it => `
            <tr>
                <td>${getItemCode(it.itemId)}</td>
                <td>${getItemName(it.itemId)}</td>
                <td>${getItemUnit(it.itemId)}</td>
                <td>${it.requestedQty}</td>
                <td>${it.actualQty !== undefined ? it.actualQty : it.requestedQty}</td>
                <td>${it.condition || ''}</td>
            </tr>
        `).join('');

        // Lấy workflow steps từ workflowId của Issue
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
        const progressHtml = renderApprovalProgress(item.status, item.approvalStep || 1, stepsConfig);
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
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(item.status)}</span></div>
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

// ====== SỬA PHIẾU (DRAFT) ======
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

        const itemsData = item.items ? JSON.parse(item.items) : [{ itemId: '', requestedQty: '', condition: '' }];

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
                <div id="issue-items-container">
                    ${buildIssueItemRows(itemsData)}
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
    const container = document.getElementById('issue-items-container');
    const items = collectIssueItemsFromForm(container);

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
        await renderIssues();
        showSuccess('Cập nhật phiếu thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật phiếu: ' + error.message);
    }
}

// ====== GỬI DUYỆT ======
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

// ====== DUYỆT ======
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

// ====== TỪ CHỐI ======
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

// ====== RENDER PROGRESS ======
function renderIssueProgress(status) {
    const steps = [
        { id: 1, label: 'Tạo phiếu' },
        { id: 2, label: 'Duyệt' },
        { id: 3, label: 'Cấp phát' },
        { id: 4, label: 'Xác nhận' }
    ];

    let currentStep = 1;
    if (status === 'PENDING') currentStep = 2;
    else if (status === 'APPROVED') currentStep = 2;
    else if (status === 'COMPLETED') currentStep = 3;
    else if (status === 'CONFIRMED') currentStep = 4;
    else if (status === 'REJECTED') currentStep = 0;

    return renderApprovalProgress(status, currentStep, steps);
}

// ====== EXPORT EXCEL ======
function exportIssues() {
    // Sử dụng API để lấy dữ liệu
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

// ====== EXPORT RA WINDOW ======
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

console.log('✅ Issue module updated with full permission checks.');