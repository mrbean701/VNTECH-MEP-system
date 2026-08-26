// ================================================================
// PO (Purchase Order) - SỬ DỤNG API - ĐÃ SỬA LỖI NULL
// ================================================================

// ====== HÀM LẤY ACTION ======
function getPOActions(po) {
    const user = getUser();
    let actions = '';
    const canEdit = (user.role === 'ADMIN') || (user.id === po.createdBy && (po.status === 'PENDING' || po.status === 'DRAFT'));
    actions += `<button class="btn btn-info btn-sm" onclick="viewPO(${po.id})"><i class="fas fa-eye"></i></button>`;
    if (canEdit) {
        actions += ` <button class="btn btn-warning btn-sm" onclick="editPO(${po.id})"><i class="fas fa-edit"></i></button>`;
    }
    if (user.role === 'ADMIN') {
        actions += ` <button class="btn btn-danger btn-sm" onclick="deletePO(${po.id})"><i class="fas fa-trash"></i></button>`;
    }
    
    if (po.status === 'DRAFT' && (user.role === 'ADMIN' || user.id === po.createdBy)) {
        actions += ` <button class="btn btn-success btn-sm" onclick="submitPO(${po.id})">Gửi duyệt</button>`;
    }
    
    if (po.status === 'PENDING') {
        const step = po.approvalStep || 1;
        let roleCanApprove = '';
        if (step === 1) roleCanApprove = 'PLANNING';
        else if (step === 2) roleCanApprove = 'PROJECT';
        else if (step === 3) roleCanApprove = 'CEO';
        if (user.role === roleCanApprove) {
            actions += ` <button class="btn btn-success btn-sm" onclick="approvePO(${po.id})">Duyệt</button> <button class="btn btn-danger btn-sm" onclick="rejectPO(${po.id})">Từ chối</button>`;
        }
    }
    return actions || '-';
}

// ====== RENDER DANH SÁCH PO ======
async function renderPO() {
    try {
        const pos = await api.getPOs();
        const filter = document.getElementById('po-filter')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('po-status-filter')?.value || '';
        
        const filtered = pos.filter(p => {
            const matchCode = (p.code || '').toLowerCase().includes(filter);
            const matchProject = (p.projectName || p.projectCode || '').toLowerCase().includes(filter);
            const matchStatus = statusFilter ? p.status === statusFilter : true;
            return (matchCode || matchProject) && matchStatus;
        });
        
        let html = `
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
                    <tbody>`;
        if (!filtered.length) html += `<tr><td colspan="6" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        
        for (const p of filtered) {
            let itemsStr = '';
            try {
                if (p.items) {
                    const items = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
                    itemsStr = items.map(it => `${getItemCode(it.itemId)} (${it.quantity})`).join(', ');
                }
            } catch (e) { itemsStr = 'Lỗi parse'; }
            
            const statusBadge = getStatusBadge(p.status);
            const actions = getPOActions(p);
            const projectId = getProjectIdByCode(p.projectCode);
            html += `<tr>
                <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewPO(${p.id})">${p.code || '--'}</td>
                <td style="cursor:pointer; color:#1a3c6e;" onclick="${projectId ? `viewProject(${projectId})` : 'alert("Không tìm thấy dự án")'}">${p.projectName || p.projectCode || '--'}</td>
                <td>${p.vendorName || p.vendorCode || '--'}</td>
                <td>${itemsStr}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
        document.getElementById('po-container').innerHTML = html;
    } catch (error) {
        showError('Không thể tải danh sách PO: ' + error.message);
        console.error('renderPO error:', error);
    }
}

// ====== XEM CHI TIẾT PO ======
async function viewPO(id) {
    try {
        let po = null;
        const allPOs = await api.getPOs();
        po = allPOs.find(p => p.id === id);
        if (!po) {
            showError('Không tìm thấy PO!');
            return;
        }
        
        let items = [];
        try {
            if (po.items) {
                items = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
            }
        } catch (e) { items = []; }
        
        const itemsHtml = buildItemsTable(items);
        const approvalHtml = renderApprovalProgress(po.status, po.approvalStep);
        const projectId = getProjectIdByCode(po.projectCode);
        const projectLink = projectId ? 
            `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${po.projectName || po.projectCode || '--'}</span>` :
            (po.projectName || po.projectCode || '--');
        const totalAmount = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 0)), 0);
        
        showModal('Chi tiết PO', `
            <div class="detail-grid">
                <div><span class="label">Mã PO:</span> <span class="value">${po.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${po.createdAt || ''}</span></div>
                <div><span class="label">PR liên quan:</span> <span class="value">${po.prId ? 'PR-'+String(po.prId).padStart(3,'0') : ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${projectLink}</span></div>
                <div><span class="label">Nhà cung cấp:</span> <span class="value">${po.vendorName || po.vendorCode || '--'}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(po.status)}</span></div>
                ${totalAmount > 0 ? `<div><span class="label">Tổng tiền:</span> <span class="value">${totalAmount.toLocaleString()} VND</span></div>` : ''}
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${approvalHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${po.note || ''}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printPO(${po.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết PO: ' + error.message);
    }
}

// ====== TẠO PO MỚI ======
document.getElementById('btn-create-po')?.addEventListener('click', function() {
    showCreatePOModal();
});

async function showCreatePOModal(pr = null) {
    try {
        const projects = await api.getProjects();
        const projectOpts = projects.map(p => `<option value="${p.code}" ${pr && p.code === pr.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v => `<option value="${v.code}" ${pr && v.code === pr.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`).join('');
        let itemsData = [{ itemId: '', quantity: '' }];
        if (pr) {
            try {
                if (pr.items) {
                    itemsData = typeof pr.items === 'string' ? JSON.parse(pr.items) : pr.items;
                    if (!itemsData.length) itemsData = [{ itemId: '', quantity: '' }];
                }
            } catch (e) { itemsData = [{ itemId: '', quantity: '' }]; }
        }
        
        showModal('Tạo Purchase Order (PO)', `
            <div class="form-group"><label>Dự án</label>
                <select id="f-po-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Nhà cung cấp</label>
                <select id="f-po-vendor">${vendorOpts}</select>
            </div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="po-items-container">${buildItemRowsForForm(itemsData, 'po')}</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-po-note" rows="2">${pr ? pr.note || '' : ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="savePOManual()">Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi tải dữ liệu: ' + error.message);
    }
}

// ====== LƯU PO ======
async function savePOManual() {
    const projectCode = document.getElementById('f-po-project').value;
    const vendorCode = document.getElementById('f-po-vendor').value;
    if (!projectCode || !vendorCode) {
        showError('Vui lòng chọn dự án và nhà cung cấp');
        return;
    }
    const container = document.getElementById('po-items-container');
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
        
        const newPO = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note: document.getElementById('f-po-note').value.trim(),
        };
        
        await api.createPO(newPO);
        closeModal();
        await renderPO();
        showSuccess('Tạo PO thành công! (Trạng thái DRAFT)');
    } catch (error) {
        showError('Lỗi khi tạo PO: ' + error.message);
    }
}

// ====== SỬA PO ======
async function editPO(id) {
    try {
        const allPOs = await api.getPOs();
        const po = allPOs.find(p => p.id === id);
        if (!po) {
            showError('Không tìm thấy PO!');
            return;
        }
        if (po.status !== 'DRAFT' && po.status !== 'PENDING') {
            showWarning('Chỉ có thể sửa PO ở trạng thái DRAFT hoặc PENDING');
            return;
        }
        
        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.code}" ${p.code === po.projectCode ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');
        const vendors = await api.getVendors();
        const vendorOpts = vendors.map(v =>
            `<option value="${v.code}" ${v.code === po.vendorCode ? 'selected' : ''}>${v.code} - ${v.name}</option>`).join('');
        
        let itemsData = [{ itemId: '', quantity: '' }];
        try {
            if (po.items) {
                itemsData = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
                if (!itemsData.length) itemsData = [{ itemId: '', quantity: '' }];
            }
        } catch (e) { itemsData = [{ itemId: '', quantity: '' }]; }
        
        showModal('Sửa Purchase Order', `
            <div class="form-group"><label>Dự án</label><select id="f-po-project">${projectOpts}</select></div>
            <div class="form-group"><label>Nhà cung cấp</label><select id="f-po-vendor">${vendorOpts}</select></div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="po-items-container">${buildItemRowsForForm(itemsData, 'po')}</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-po-note" rows="2">${po.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updatePO(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải thông tin PO: ' + error.message);
    }
}

// ====== CẬP NHẬT PO ======
async function updatePO(id) {
    const projectCode = document.getElementById('f-po-project').value;
    const vendorCode = document.getElementById('f-po-vendor').value;
    if (!projectCode || !vendorCode) {
        showError('Vui lòng chọn dự án và NCC');
        return;
    }
    const container = document.getElementById('po-items-container');
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
        
        const updatedPO = {
            projectCode,
            projectName: proj ? proj.name : '',
            vendorCode,
            vendorName: vendor ? vendor.name : '',
            items: JSON.stringify(items),
            note: document.getElementById('f-po-note').value.trim(),
        };
        
        await api.updatePO(id, updatedPO);
        closeModal();
        await renderPO();
        showSuccess('Cập nhật PO thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật PO: ' + error.message);
    }
}

// ====== GỬI DUYỆT ======
async function submitPO(id) {
    try {
        await api.submitPO(id);
        await renderPO();
        showSuccess('Đã gửi yêu cầu duyệt PO!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt: ' + error.message);
    }
}

// ====== DUYỆT PO ======
async function approvePO(id) {
    try {
        await api.approvePO(id);
        await renderPO();
        showSuccess('Duyệt PO thành công!');
    } catch (error) {
        showError('Lỗi khi duyệt PO: ' + error.message);
    }
}

// ====== TỪ CHỐI PO ======
async function rejectPO(id) {
    try {
        await api.rejectPO(id);
        await renderPO();
        showWarning('Đã từ chối PO!');
    } catch (error) {
        showError('Lỗi khi từ chối PO: ' + error.message);
    }
}

// ====== XÓA PO ======
async function deletePO(id) {
    if (!confirm('Xóa PO này?')) return;
    try {
        await api.deletePO(id);
        await renderPO();
        showSuccess('Xóa PO thành công!');
    } catch (error) {
        showError('Lỗi khi xóa PO: ' + error.message);
    }
}

function showCreatePOFromPRModal(prId) {
    api.getPRs().then(prs => {
        const pr = prs.find(p => p.id === prId);
        if (pr) {
            showCreatePOModal(pr);
        } else {
            showError('Không tìm thấy PR');
        }
    }).catch(err => showError('Lỗi tải PR: ' + err.message));
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
window.createPOFromPR = createPOFromPR;
window.printPO = printPO;
window.getPOActions = getPOActions;
window.savePOManual = savePOManual;
window.showCreatePOFromPRModal = showCreatePOFromPRModal;

console.log('✅ PO module updated to use API (fixed null display).');