// ================================================================
// MATERIAL RETURN - Hoàn trả vật tư (SỬ DỤNG API)
// ================================================================

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
    await renderMaterialReturns();
}

// ====== RENDER DANH SÁCH ======
async function renderMaterialReturns() {
    const container = document.getElementById('material-return-container');
    if (!container) {
        console.error('❌ Không tìm thấy container');
        return;
    }

    try {
        const returns = await api.getMaterialReturns();
        const filter = document.getElementById('return-filter')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('return-status-filter')?.value || '';

        const filtered = returns.filter(item => {
            const matchCode = item.code.toLowerCase().includes(filter);
            const matchProject = (item.projectName || '').toLowerCase().includes(filter);
            const matchStatus = statusFilter ? item.status === statusFilter : true;
            return (matchCode || matchProject) && matchStatus;
        });

        let html = `
            <div class="page-header">
                <h2>🔄 Hoàn trả vật tư (Material Return)</h2>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn" id="btn-create-return"><i class="fas fa-plus"></i> Tạo phiếu</button>
                    <button class="btn btn-success" onclick="exportMaterialReturns()"><i class="fas fa-file-excel"></i> Xuất Excel</button>
                </div>
            </div>
            <div class="filter-bar">
                <input type="text" id="return-filter" placeholder="Tìm theo mã hoặc dự án..." style="flex:1;" />
                <select id="return-status-filter">
                    <option value="">Tất cả</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
                <button class="btn btn-sm" onclick="renderMaterialReturns()"><i class="fas fa-search"></i></button>
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

        if (!filtered.length) {
            html += `<tr><td colspan="8" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const item of filtered) {
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

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('btn-create-return')?.addEventListener('click', function() {
            showCreateMaterialReturnModal();
        });

        document.getElementById('return-filter')?.addEventListener('input', renderMaterialReturns);
        document.getElementById('return-status-filter')?.addEventListener('change', renderMaterialReturns);

    } catch (error) {
        showError('Không thể tải danh sách hoàn trả: ' + error.message);
        console.error('renderMaterialReturns error:', error);
    }
}

// ====== HÀM LẤY ACTION ======
function getReturnActions(item) {
    const user = getUser();
    const isAdmin = user?.role === 'ADMIN';
    const isCommander = user?.role === 'SITE_COMMANDER';
    const isPurchasing = user?.role === 'PURCHASING' || isAdmin;
    const isCreator = user?.id === item.createdBy;
    let actions = '';

    actions += `<button class="btn btn-info btn-sm" onclick="viewMaterialReturn(${item.id})"><i class="fas fa-eye"></i></button>`;

    if (item.status === 'DRAFT' && (isAdmin || isCreator)) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editMaterialReturn(${item.id})"><i class="fas fa-edit"></i></button>`;
    }

    if (item.status === 'DRAFT' && (isAdmin || isCreator)) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitMaterialReturn(${item.id})">Gửi duyệt</button>`;
    }

    if (item.status === 'PENDING' && (isPurchasing || isAdmin)) {
        actions += ` <button class="btn btn-success btn-sm" onclick="approveMaterialReturn(${item.id})">Nhận vật tư</button>`;
        actions += ` <button class="btn btn-danger btn-sm" onclick="rejectMaterialReturn(${item.id})">Từ chối</button>`;
    }

    if (item.status === 'APPROVED' && (isCommander || isAdmin)) {
        actions += ` <button class="btn btn-success btn-sm" onclick="confirmMaterialReturn(${item.id})">Xác nhận hoàn tất</button>`;
    }

    if ((isAdmin || (isCreator && item.status === 'DRAFT'))) {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deleteMaterialReturn(${item.id})"><i class="fas fa-trash"></i></button>`;
    }

    return actions || '-';
}

// ====== TẠO PHIẾU (MODAL) ======
function showCreateMaterialReturnModal() {
    Promise.all([api.getProjects(), api.getWarehouses(), api.getItems()]).then(([projects, warehouses, items]) => {
        const projectOpts = projects.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
        const whOpts = warehouses.map(w => `<option value="${w.id}">${w.code} - ${w.name}</option>`).join('');
        const itemOpts = items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('');

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
                <div id="return-items-container">
                    ${buildReturnItemRows([{itemId: '', requestedQty: '', condition: '', note: ''}])}
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
    }).catch(err => showError('Không thể tải dữ liệu: ' + err.message));
}

// ====== BUILD DÒNG VẬT TƯ ======
function buildReturnItemRows(itemsData) {
    const allItems = window._itemsCache || [];
    if (!itemsData || itemsData.length === 0) {
        itemsData = [{ itemId: '', requestedQty: '', condition: '', note: '' }];
    }
    let html = '';
    itemsData.forEach((item, index) => {
        const selected = item.itemId || '';
        html += `<div class="item-row" data-index="${index}">
            <select class="return-item-select" data-name="items[${index}].itemId">
                <option value="">-- Chọn --</option>
                ${allItems.map(it => `<option value="${it.id}" ${it.id == selected ? 'selected' : ''}>${it.code} - ${it.name}</option>`).join('')}
            </select>
            <input type="number" class="return-item-qty" data-name="items[${index}].requestedQty" value="${item.requestedQty || ''}" placeholder="SL đề nghị" style="width:100px;">
            <input type="text" class="return-item-condition" data-name="items[${index}].condition" value="${item.condition || ''}" placeholder="Tình trạng" style="width:120px;">
            <input type="text" class="return-item-note" data-name="items[${index}].note" value="${item.note || ''}" placeholder="Ghi chú" style="width:150px;">
            <button type="button" class="remove-item" onclick="removeReturnItemRow(this)"><i class="fas fa-minus"></i></button>
        </div>`;
    });
    html += `<button type="button" class="btn-add-item" onclick="addReturnItemRow(this)"><i class="fas fa-plus"></i> Thêm vật tư</button>`;
    return html;
}

function addReturnItemRow(btn) {
    const container = btn.parentElement;
    const index = container.querySelectorAll('.item-row').length;
    const allItems = window._itemsCache || [];
    let opts = allItems.map(it => `<option value="${it.id}">${it.code} - ${it.name}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.index = index;
    row.innerHTML = `
        <select class="return-item-select"><option value="">-- Chọn --</option>${opts}</select>
        <input type="number" class="return-item-qty" placeholder="SL đề nghị" style="width:100px;">
        <input type="text" class="return-item-condition" placeholder="Tình trạng" style="width:120px;">
        <input type="text" class="return-item-note" placeholder="Ghi chú" style="width:150px;">
        <button type="button" class="remove-item" onclick="removeReturnItemRow(this)"><i class="fas fa-minus"></i></button>
    `;
    container.insertBefore(row, btn);
}

function removeReturnItemRow(btn) {
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

function collectReturnItemsFromForm(container) {
    const rows = container.querySelectorAll('.item-row');
    const items = [];
    rows.forEach(row => {
        const sel = row.querySelector('.return-item-select');
        const qty = row.querySelector('.return-item-qty');
        const condition = row.querySelector('.return-item-condition');
        const note = row.querySelector('.return-item-note');
        const itemId = parseInt(sel.value);
        const requestedQty = parseFloat(qty.value);
        if (itemId && !isNaN(requestedQty) && requestedQty > 0) {
            items.push({
                itemId,
                requestedQty,
                actualQty: requestedQty,
                condition: condition.value || '',
                note: note.value || ''
            });
        }
    });
    return items;
}

// ====== LƯU PHIẾU ======
async function saveMaterialReturn() {
    const projectCode = document.getElementById('f-return-project').value;
    const returnDate = document.getElementById('f-return-date').value;
    const warehouseId = parseInt(document.getElementById('f-return-warehouse').value);
    const returnFrom = document.getElementById('f-return-from').value.trim();
    const returner = document.getElementById('f-return-returner').value.trim();
    const note = document.getElementById('f-return-note').value.trim();
    const container = document.getElementById('return-items-container');
    const items = collectReturnItemsFromForm(container);

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
        await renderMaterialReturns();
        showSuccess('Tạo phiếu hoàn trả thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo phiếu: ' + error.message);
    }
}

// ====== XEM CHI TIẾT ======
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
                <td>${getItemName(it.itemId)}</td>
                <td>${getItemUnit(it.itemId)}</td>
                <td>${it.requestedQty}</td>
                <td>${it.actualQty !== undefined ? it.actualQty : it.requestedQty}</td>
                <td>${it.condition || ''}</td>
                <td>${it.note || ''}</td>
            </tr>
        `).join('');

        const progressHtml = renderReturnProgress(item.status);
        const projectId = getProjectIdByCode(item.projectCode);
        const projectDisplay = projectId ?
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId})">${item.projectName || item.projectCode}</span>` :
            (item.projectName || item.projectCode || '');

        const whName = getWarehouseName(item.warehouseId);

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
                <div style="grid-column:1/-1;"><span class="label">Chi tiết vật tư:</span>
                    <div class="table-responsive">
                        <table>
                            <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>SL đề nghị</th><th>SL thực trả</th><th>Tình trạng</th><th>Ghi chú</th></tr></thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                    </div>
                </div>
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

        const itemsData = item.items ? JSON.parse(item.items) : [{ itemId: '', requestedQty: '', condition: '', note: '' }];

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
                <div id="return-items-container">
                    ${buildReturnItemRows(itemsData)}
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
    const container = document.getElementById('return-items-container');
    const items = collectReturnItemsFromForm(container);

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
            items: JSON.stringify(items.map(it => ({ ...it, actualQty: it.requestedQty }))),
            returner: returner,
            note
        };

        await api.updateMaterialReturn(id, updatedReturn);
        closeModal();
        await renderMaterialReturns();
        showSuccess('Cập nhật phiếu hoàn trả thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật phiếu: ' + error.message);
    }
}

// ====== GỬI DUYỆT ======
async function submitMaterialReturn(id) {
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
        // Lưu ý: cần lấy requestedQty từ dữ liệu gốc, backend sẽ kiểm tra.
        newItems.push({ itemId, actualQty, condition, note });
    });

    if (hasError) return;

    try {
        // Cập nhật item và chuyển sang APPROVED
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
    // Giữ nguyên từ file cũ (không liên quan API)
    const returns = getMaterialReturns(); // vẫn dùng localStorage tạm
    if (!returns.length) {
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
        'Số lượng vật tư': item.items ? item.items.reduce((sum, it) => sum + it.actualQty, 0) : 0,
        'Ghi chú': item.note || ''
    }));
    exportToExcel(data, 'Danh_sach_hoan_tra', Object.keys(data[0]));
}

// ====== IN PHIẾU ======
function printMaterialReturn(id) {
    showInfo('Chức năng in đang được phát triển.');
}

// ====== THÊM MENU ======
function addMaterialReturnMenu() {
    // Đã có trong HTML
}

// ====== KHỞI TẠO DỮ LIỆU MẪU ======
function initMaterialReturnData() {
    // Không cần vì đã có dữ liệu từ database
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

console.log('✅ Material Return module updated to use API.');