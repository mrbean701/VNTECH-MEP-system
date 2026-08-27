// ================================================================
// ADMIN STATUSES - Quản lý trạng thái động
// ================================================================

function renderStatusesTab() {
    const statuses = _adminStatuses || [];
    const entityTypes = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn'];

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0;">📊 Quản lý trạng thái</h3>
            <button class="btn" onclick="showCreateStatusModal()"><i class="fas fa-plus"></i> Thêm trạng thái</button>
        </div>
        <div style="font-size:13px; color:#888; margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
            <i class="fas fa-info-circle"></i> 
            <strong>Hướng dẫn:</strong> Quản lý các trạng thái cho từng loại đối tượng. 
            Mỗi entity type chỉ có <strong>1</strong> trạng thái mặc định (is_default = true).
            <span style="display:block; margin-top:4px;">
                <span class="badge badge-approved">🟢 Mặc định</span>
                <span class="badge badge-draft">🔵 Không mặc định</span>
                <span class="badge badge-info">🏁 Kết thúc (is_final)</span>
            </span>
        </div>
    `;

    for (const entityType of entityTypes) {
        const list = statuses.filter(s => s.entityType === entityType);
        const defaultStatus = list.find(s => s.isDefault === true);

        html += `
            <div style="background:white; border-radius:8px; padding:16px; margin-bottom:16px; border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:#1a3c6e; text-transform:uppercase; font-size:16px;">
                        ${entityType.toUpperCase()}
                        <span style="font-size:13px; font-weight:400; color:#888; margin-left:8px;">${list.length} trạng thái</span>
                    </h4>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <button class="btn btn-sm btn-info" onclick="showCreateStatusModal('${entityType}')"><i class="fas fa-plus"></i> Thêm</button>
                        ${defaultStatus ? `<span class="badge badge-approved" style="font-size:13px;">✅ Mặc định: ${defaultStatus.name}</span>` : '<span class="badge badge-draft" style="font-size:13px;">⚠️ Chưa có trạng thái mặc định</span>'}
                    </div>
                </div>
                <div style="max-height:400px; overflow-y:auto;">
                    ${list.length === 0 ? '<div style="color:#999; padding:12px; text-align:center;">Chưa có trạng thái nào</div>' : ''}
                    ${list.map(s => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; margin-bottom:6px; background:${s.isDefault ? '#f0fdf4' : '#f8fafc'}; border-radius:6px; border-left:4px solid ${s.isDefault ? '#22c55e' : '#94a3b8'};">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:600; font-size:14px; display:flex; align-items:center; gap:8px;">
                                    ${s.name}
                                    <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:${s.color || '#6b7280'};"></span>
                                </div>
                                <div style="font-size:12px; color:#888; flex-wrap:wrap; display:flex; gap:6px; margin-top:2px;">
                                    <span class="badge badge-info">${s.code}</span>
                                    ${s.isDefault ? '<span class="badge badge-approved">🟢 Mặc định</span>' : ''}
                                    ${s.isFinal ? '<span class="badge badge-info">🏁 Kết thúc</span>' : ''}
                                    ${s.description ? `<span style="color:#94a3b8;">${s.description}</span>` : ''}
                                    <span style="color:#94a3b8;">| Thứ tự: ${s.sortOrder || 0}</span>
                                </div>
                            </div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-left:8px;">
                                <button class="btn btn-info btn-sm" onclick="editStatus(${s.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                                ${!s.isDefault ? `<button class="btn btn-danger btn-sm" onclick="deleteStatus(${s.id})" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

function showCreateStatusModal(entityType = null) {
    const entityTypes = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn'];
    const entityOpts = entityTypes.map(e => 
        `<option value="${e}" ${e === entityType ? 'selected' : ''}>${e.toUpperCase()}</option>`
    ).join('');

    showModal('Thêm trạng thái mới', `
        <div class="form-group">
            <label>Loại đối tượng <span style="color:red;">*</span></label>
            <select id="f-status-entity-type">${entityOpts}</select>
        </div>
        <div class="form-group">
            <label>Tên trạng thái <span style="color:red;">*</span></label>
            <input id="f-status-name" placeholder="Ví dụ: Chờ duyệt" class="form-control">
        </div>
        <div class="form-group">
            <label>Mã code <span style="color:red;">*</span></label>
            <input id="f-status-code" placeholder="Ví dụ: PENDING" class="form-control">
            <div style="font-size:12px; color:#888; margin-top:4px;">Mã code duy nhất, dùng để ánh xạ trong workflow.</div>
        </div>
        <div class="form-group">
            <label>Mô tả</label>
            <textarea id="f-status-desc" rows="2" class="form-control"></textarea>
        </div>
        <div class="form-group">
            <label>Màu sắc (hex)</label>
            <input id="f-status-color" placeholder="#22c55e" class="form-control" value="#6b7280">
        </div>
        <div class="form-group">
            <label>Thứ tự sắp xếp</label>
            <input id="f-status-sort" type="number" value="0" class="form-control">
        </div>
        <div class="form-group">
            <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="f-status-default"> Là trạng thái mặc định
            </label>
        </div>
        <div class="form-group">
            <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="f-status-final"> Là trạng thái kết thúc (không thể chuyển tiếp)
            </label>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveStatus()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveStatus() {
    const entityType = document.getElementById('f-status-entity-type').value;
    const name = document.getElementById('f-status-name').value.trim();
    const code = document.getElementById('f-status-code').value.trim().toUpperCase();
    const description = document.getElementById('f-status-desc').value.trim();
    const color = document.getElementById('f-status-color').value.trim();
    const sortOrder = parseInt(document.getElementById('f-status-sort').value) || 0;
    const isDefault = document.getElementById('f-status-default').checked;
    const isFinal = document.getElementById('f-status-final').checked;

    if (!name || !code) {
        showError('Vui lòng nhập tên và mã code');
        return;
    }

    try {
        await api.createStatus({
            entityType,
            name,
            code,
            description,
            color: color || '#6b7280',
            sortOrder,
            isDefault,
            isFinal
        });
        closeModal();
        showSuccess('Thêm trạng thái thành công!');
        await refreshAdminStatuses();
        renderAdminUI('statuses');
    } catch (error) {
        showError('Lỗi tạo trạng thái: ' + error.message);
    }
}

async function editStatus(id) {
    try {
        const status = _adminStatuses.find(s => s.id === id);
        if (!status) { showError('Không tìm thấy trạng thái'); return; }

        const entityTypes = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn'];
        const entityOpts = entityTypes.map(e => 
            `<option value="${e}" ${e === status.entityType ? 'selected' : ''}>${e.toUpperCase()}</option>`
        ).join('');

        showModal('Sửa trạng thái', `
            <div class="form-group">
                <label>Loại đối tượng <span style="color:red;">*</span></label>
                <select id="f-status-entity-type">${entityOpts}</select>
            </div>
            <div class="form-group">
                <label>Tên trạng thái <span style="color:red;">*</span></label>
                <input id="f-status-name" value="${status.name}" class="form-control">
            </div>
            <div class="form-group">
                <label>Mã code <span style="color:red;">*</span></label>
                <input id="f-status-code" value="${status.code}" class="form-control">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea id="f-status-desc" rows="2" class="form-control">${status.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Màu sắc (hex)</label>
                <input id="f-status-color" value="${status.color || '#6b7280'}" class="form-control">
            </div>
            <div class="form-group">
                <label>Thứ tự sắp xếp</label>
                <input id="f-status-sort" type="number" value="${status.sortOrder || 0}" class="form-control">
            </div>
            <div class="form-group">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="f-status-default" ${status.isDefault ? 'checked' : ''}> Là trạng thái mặc định
                </label>
            </div>
            <div class="form-group">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="f-status-final" ${status.isFinal ? 'checked' : ''}> Là trạng thái kết thúc
                </label>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateStatus(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi tải trạng thái: ' + error.message);
    }
}

async function updateStatus(id) {
    const entityType = document.getElementById('f-status-entity-type').value;
    const name = document.getElementById('f-status-name').value.trim();
    const code = document.getElementById('f-status-code').value.trim().toUpperCase();
    const description = document.getElementById('f-status-desc').value.trim();
    const color = document.getElementById('f-status-color').value.trim();
    const sortOrder = parseInt(document.getElementById('f-status-sort').value) || 0;
    const isDefault = document.getElementById('f-status-default').checked;
    const isFinal = document.getElementById('f-status-final').checked;

    if (!name || !code) {
        showError('Vui lòng nhập tên và mã code');
        return;
    }

    try {
        await api.updateStatus(id, {
            entityType,
            name,
            code,
            description,
            color: color || '#6b7280',
            sortOrder,
            isDefault,
            isFinal
        });
        closeModal();
        showSuccess('Cập nhật trạng thái thành công!');
        await refreshAdminStatuses();
        renderAdminUI('statuses');
    } catch (error) {
        showError('Lỗi cập nhật trạng thái: ' + error.message);
    }
}

async function deleteStatus(id) {
    if (!confirm('Xóa trạng thái này? (Không thể xóa trạng thái mặc định)')) return;
    try {
        await api.deleteStatus(id);
        showSuccess('Xóa trạng thái thành công!');
        await refreshAdminStatuses();
        renderAdminUI('statuses');
    } catch (error) {
        showError('Lỗi xóa trạng thái: ' + error.message);
    }
}

// Export
window.renderStatusesTab = renderStatusesTab;
window.showCreateStatusModal = showCreateStatusModal;
window.saveStatus = saveStatus;
window.editStatus = editStatus;
window.updateStatus = updateStatus;
window.deleteStatus = deleteStatus;