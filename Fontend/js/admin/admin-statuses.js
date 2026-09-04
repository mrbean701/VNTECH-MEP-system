// ================================================================
// ADMIN STATUSES - Quản lý trạng thái động (Giao diện Card)
// ================================================================

function renderStatusesTab() {
    const statuses = _adminStatuses || [];
    
    const entityTypes = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn', 'user', 'department', 'vendor', 'project', 'warehouse', 'workflow'];
    
    const grouped = {};
    entityTypes.forEach(type => {
        grouped[type] = statuses.filter(s => s.entityType === type);
    });

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">📊 Quản lý trạng thái</h3>
            <button class="btn" onclick="showCreateStatusModal()"><i class="fas fa-plus"></i> Thêm trạng thái</button>
        </div>
        <div style="font-size:13px; color:#888; margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
            <i class="fas fa-info-circle"></i> 
            <strong>Hướng dẫn:</strong> Mỗi loại đối tượng chỉ có <strong>1</strong> trạng thái mặc định (đánh dấu ⭐). 
            Sắp xếp các trạng thái theo thứ tự trong modal sửa.
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap:16px;">
    `;

    for (const entityType of entityTypes) {
        const list = grouped[entityType] || [];
        const defaultStatus = list.find(s => s.isDefault === true);
        const others = list.filter(s => s.isDefault !== true);
        others.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        html += `
            <div style="background:white; border-radius:12px; padding:16px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.04); display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f0f0f0; padding-bottom:8px;">
                    <div>
                        <h4 style="margin:0; color:#1a3c6e; text-transform:uppercase; font-size:16px;">
                            ${entityType.toUpperCase()}
                            <span style="font-size:13px; font-weight:400; color:#888; margin-left:8px;">(${list.length} trạng thái)</span>
                        </h4>
                    </div>
                    <button class="btn btn-sm btn-info" onclick="showCreateStatusModal('${entityType}')"><i class="fas fa-plus"></i> Thêm</button>
                </div>
                
                <div style="flex:1;">
                    ${defaultStatus ? `
                        <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:8px 12px; border-radius:6px; margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span style="font-weight:600; font-size:14px;">⭐ ${defaultStatus.name}</span>
                                    <span style="font-size:12px; color:#888; margin-left:8px;">(Mặc định)</span>
                                </div>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn btn-info btn-sm" onclick="editStatus(${defaultStatus.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                                </div>
                            </div>
                            <div style="font-size:12px; color:#94a3b8; margin-top:2px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                                <span class="badge" style="background-color:${defaultStatus.color || '#6b7280'}; color:white; border-radius:12px; padding:2px 10px; font-size:11px;">${defaultStatus.code}</span>
                                ${defaultStatus.description ? `<span>${defaultStatus.description}</span>` : ''}
                                ${defaultStatus.statusGroup ? `<span>| Nhóm: ${defaultStatus.statusGroup}</span>` : ''}
                            </div>
                        </div>
                    ` : `
                        <div style="background:#fef9e7; border-left:4px solid #f59e0b; padding:8px 12px; border-radius:6px; margin-bottom:8px; color:#b45309;">
                            <i class="fas fa-exclamation-triangle"></i> Chưa có trạng thái mặc định
                        </div>
                    `}
                    
                    ${others.length > 0 ? others.map(s => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px; margin-bottom:4px; background:#f8fafc; border-radius:6px; border-left:3px solid ${s.color || '#94a3b8'};">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:500; font-size:13px; display:flex; align-items:center; gap:6px;">
                                    ${s.name}
                                    <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:${s.color || '#6b7280'}; border:1px solid #ddd;"></span>
                                </div>
                                <div style="font-size:11px; color:#94a3b8; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                                    <span class="badge" style="background-color:${s.color || '#6b7280'}; color:white; border-radius:12px; padding:2px 10px; font-size:11px;">${s.code}</span>
                                    ${s.description ? `<span>${s.description}</span>` : ''}
                                    ${s.statusGroup ? `<span>| Nhóm: ${s.statusGroup}</span>` : ''}
                                    <span>| Thứ tự: ${s.sortOrder || 0}</span>
                                </div>
                            </div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-left:8px;">
                                <button class="btn btn-info btn-sm" onclick="editStatus(${s.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                                ${!s.isDefault ? `<button class="btn btn-danger btn-sm" onclick="deleteStatus(${s.id})" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div style="color:#999; text-align:center; padding:12px; font-size:13px;">Chưa có trạng thái nào</div>
                    `}
                </div>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

// ===== SHOW CREATE STATUS MODAL =====
function showCreateStatusModal(entityType = null) {
    const entityTypes = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn', 'user', 'department', 'vendor', 'project', 'warehouse', 'workflow'];
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
            <div style="font-size:12px; color:#888; margin-top:4px;">Mã code duy nhất trong cùng loại đối tượng.</div>
        </div>
        <div class="form-group">
            <label>Mô tả</label>
            <textarea id="f-status-desc" rows="2" class="form-control"></textarea>
        </div>
        <div class="form-group">
            <label>Màu sắc (hex)</label>
            <div style="display:flex; align-items:center; gap:12px;">
                <input id="f-status-color" placeholder="#22c55e" class="form-control" value="#6b7280" style="flex:1;">
                <div id="color-preview" style="width:36px; height:36px; border-radius:6px; background:#6b7280; border:1px solid #ddd;"></div>
            </div>
        </div>
        <div class="form-group">
            <label>Nhóm <span style="color:red;">*</span></label>
            <input id="f-status-group" placeholder="Ví dụ: order, warehouse, user..." class="form-control">
        </div>
        <div class="form-group">
            <label>Thứ tự sắp xếp</label>
            <input id="f-status-sort" type="number" value="0" class="form-control">
            <div style="font-size:12px; color:#888; margin-top:4px;">Số nhỏ hơn sẽ hiển thị trước.</div>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:20px; margin-top:8px; flex-wrap:wrap;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:500;">
                <input type="checkbox" id="f-status-default" style="width:18px; height:18px; accent-color:#1a3c6e;">
                <span>⭐ Là trạng thái mặc định</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:500;">
                <input type="checkbox" id="f-status-final" style="width:18px; height:18px; accent-color:#1a3c6e;">
                <span>🏁 Là trạng thái kết thúc</span>
            </label>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveStatus()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);

    // Sự kiện preview màu
    const colorInput = document.getElementById('f-status-color');
    const preview = document.getElementById('color-preview');
    if (colorInput && preview) {
        colorInput.addEventListener('input', function() {
            preview.style.background = this.value || '#6b7280';
        });
    }
}

async function saveStatus() {
    const entityType = document.getElementById('f-status-entity-type').value;
    const name = document.getElementById('f-status-name').value.trim();
    const code = document.getElementById('f-status-code').value.trim().toUpperCase();
    const description = document.getElementById('f-status-desc').value.trim();
    const color = document.getElementById('f-status-color').value.trim();
    const statusGroup = document.getElementById('f-status-group').value.trim();
    const sortOrder = parseInt(document.getElementById('f-status-sort').value) || 0;
    const isDefault = document.getElementById('f-status-default').checked;
    const isFinal = document.getElementById('f-status-final').checked;

    if (!name || !code) {
        showError('Vui lòng nhập tên và mã code');
        return;
    }
    if (!statusGroup) {
        showError('Vui lòng nhập nhóm trạng thái');
        return;
    }

    try {
        await api.createStatus({
            entityType,
            name,
            code,
            description,
            color: color || '#6b7280',
            statusGroup,
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

// ===== EDIT STATUS =====
async function editStatus(id) {
    try {
        const status = _adminStatuses.find(s => s.id === id);
        if (!status) {
            showError('Không tìm thấy trạng thái');
            return;
        }

        const entityTypes = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn', 'user', 'department', 'vendor', 'project', 'warehouse', 'workflow'];
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
                <div style="font-size:12px; color:#888; margin-top:4px;">Mã code duy nhất trong cùng loại đối tượng.</div>
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea id="f-status-desc" rows="2" class="form-control">${status.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Màu sắc (hex)</label>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input id="f-status-color" value="${status.color || '#6b7280'}" class="form-control" style="flex:1;">
                    <div id="color-preview" style="width:36px; height:36px; border-radius:6px; background:${status.color || '#6b7280'}; border:1px solid #ddd;"></div>
                </div>
            </div>
            <div class="form-group">
                <label>Nhóm <span style="color:red;">*</span></label>
                <input id="f-status-group" value="${status.statusGroup || ''}" class="form-control">
            </div>
            <div class="form-group">
                <label>Thứ tự sắp xếp</label>
                <input id="f-status-sort" type="number" value="${status.sortOrder || 0}" class="form-control">
                <div style="font-size:12px; color:#888; margin-top:4px;">Số nhỏ hơn sẽ hiển thị trước.</div>
            </div>
            <div class="form-group" style="display:flex; align-items:center; gap:20px; margin-top:8px; flex-wrap:wrap;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:500;">
                    <input type="checkbox" id="f-status-default" ${status.isDefault ? 'checked' : ''} style="width:18px; height:18px; accent-color:#1a3c6e;">
                    <span>⭐ Là trạng thái mặc định</span>
                </label>
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:500;">
                    <input type="checkbox" id="f-status-final" ${status.isFinal ? 'checked' : ''} style="width:18px; height:18px; accent-color:#1a3c6e;">
                    <span>🏁 Là trạng thái kết thúc</span>
                </label>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateStatus(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        // Sự kiện preview màu
        const colorInput = document.getElementById('f-status-color');
        const preview = document.getElementById('color-preview');
        if (colorInput && preview) {
            colorInput.addEventListener('input', function() {
                preview.style.background = this.value || '#6b7280';
            });
        }
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
    const statusGroup = document.getElementById('f-status-group').value.trim();
    const sortOrder = parseInt(document.getElementById('f-status-sort').value) || 0;
    const isDefault = document.getElementById('f-status-default').checked;
    const isFinal = document.getElementById('f-status-final').checked;

    if (!name || !code) {
        showError('Vui lòng nhập tên và mã code');
        return;
    }
    if (!statusGroup) {
        showError('Vui lòng nhập nhóm trạng thái');
        return;
    }

    try {
        await api.updateStatus(id, {
            entityType,
            name,
            code,
            description,
            color: color || '#6b7280',
            statusGroup,
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