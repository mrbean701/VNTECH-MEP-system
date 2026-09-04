// ================================================================
// ADMIN POSITIONS - Quản lý chức vụ
// ================================================================
let _adminPositions = [];

async function refreshAdminPositions() {
    try {
        _adminPositions = await api.getPositions();
        saveData('positions', _adminPositions);
    } catch (e) {
        console.error('Failed to refresh positions:', e);
        _adminPositions = getData('positions') || [];
    }
}

function getPositionsData() {
    return _adminPositions.length > 0 ? _adminPositions : (getData('positions') || []);
}

async function renderPositionsTab() {
    await refreshAdminPositions();
    const positions = getPositionsData();
    const departments = getDepartmentsData();

    const canManage = getUser()?.role === 'ADMIN';

    let html = `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3 style="margin:0;">🏢 Quản lý chức vụ</h3>
            ${canManage ? `<button class="btn btn-success" onclick="showAddPosition()"><i class="fas fa-plus"></i> Thêm chức vụ</button>` : ''}
        </div>
        <div class="filter-bar" style="margin:12px 0;">
            <input type="text" id="position-filter" placeholder="Tìm chức vụ..." style="flex:1;">
            <button class="btn btn-sm" onclick="renderPositionsTab()"><i class="fas fa-search"></i></button>
        </div>
    `;

    // ✅ Kiểm tra nếu không có dữ liệu
    if (!positions || positions.length === 0) {
        html += `
            <div style="padding:30px; text-align:center; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                <i class="fas fa-id-badge" style="font-size:40px; color:#ccc; display:block; margin-bottom:12px;"></i>
                <div style="font-size:16px; color:#666;">Chưa có chức vụ nào</div>
                <div style="font-size:13px; color:#999; margin-top:4px;">Bấm "Thêm chức vụ" để tạo mới.</div>
            </div>
        `;
    } else {
        // Render bảng chức vụ bình thường
        const filter = document.getElementById('position-filter')?.value?.toLowerCase() || '';
        const filtered = positions.filter(p => (p.name || '').toLowerCase().includes(filter));

        html += `
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Tên chức vụ</th>
                            <th>Phòng ban</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (filtered.length === 0) {
            html += `<tr><td colspan="6" style="text-align:center; color:#999;">Không tìm thấy chức vụ phù hợp</td></tr>`;
        } else {
            filtered.forEach((p, idx) => {
                const dept = departments.find(d => d.id === p.departmentId);
                html += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td style="font-weight:500;">${p.name}</td>
                        <td>${dept ? dept.name : '--'}</td>
                        <td>${p.description || '--'}</td>
                        <td>${p.isActive === false ? '<span class="badge badge-draft">Ngừng</span>' : '<span class="badge badge-approved">Hoạt động</span>'}</td>
                        <td>
                            <button class="btn btn-info btn-sm" onclick="viewPosition(${p.id})"><i class="fas fa-eye"></i></button>
                            ${canManage ? `
                                <button class="btn btn-warning btn-sm" onclick="editPosition(${p.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm" onclick="deletePosition(${p.id})"><i class="fas fa-trash"></i></button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    // Gán sự kiện cho filter
    const container = document.getElementById('admin-tab-content');
    if (container) container.innerHTML = html;
    document.getElementById('position-filter')?.addEventListener('input', renderPositionsTab);
}

function positionModalHtml(pos) {
    const departments = getDepartmentsData();
    const deptOpts = departments.map(d =>
        `<option value="${d.id}" ${pos && pos.departmentId === d.id ? 'selected' : ''}>${d.code} - ${d.name}</option>`
    ).join('');
    return `
        <div class="form-group">
            <label>Tên chức vụ *</label>
            <input id="f-pos-name" value="${pos ? pos.name : ''}" placeholder="VD: Trưởng phòng, Chuyên viên...">
        </div>
        <div class="form-group">
            <label>Phòng ban</label>
            <select id="f-pos-dept"><option value="">-- Chọn --</option>${deptOpts}</select>
        </div>
        <div class="form-group">
            <label>Mô tả</label>
            <textarea id="f-pos-desc" rows="2">${pos ? (pos.description || '') : ''}</textarea>
        </div>
        <div class="form-group">
            <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="f-pos-active" ${!pos || pos.isActive !== false ? 'checked' : ''}> Hoạt động
            </label>
        </div>
    `;
}

async function showAddPosition() {
    const canManage = getUser()?.role === 'ADMIN';
    if (!canManage) { showWarning('Bạn không có quyền thêm chức vụ!'); return; }
    showModal('Thêm chức vụ', positionModalHtml(null) + `
        <div class="modal-actions">
            <button class="btn" onclick="savePosition(null)">Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function viewPosition(id) {
    const pos = getPositionsData().find(p => p.id === id);
    if (!pos) { showError('Không tìm thấy chức vụ!'); return; }
    const dept = getDepartmentsData().find(d => d.id === pos.departmentId);
    const users = getUsersData();
    const count = users.filter(u => (u.position || '') === pos.name).length;
    showModal('Chi tiết chức vụ', `
        <div class="detail-grid">
            <div><span class="label">Tên chức vụ:</span> <span class="value">${pos.name}</span></div>
            <div><span class="label">Phòng ban:</span> <span class="value">${dept ? dept.name : '--'}</span></div>
            <div><span class="label">Số người giữ:</span> <span class="value">${count}</span></div>
            <div><span class="label">Trạng thái:</span> <span class="value">${pos.isActive === false ? 'Ngừng' : 'Hoạt động'}</span></div>
            <div style="grid-column:1/-1;"><span class="label">Mô tả:</span> <span class="value">${pos.description || '--'}</span></div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

async function editPosition(id) {
    const canManage = getUser()?.role === 'ADMIN';
    if (!canManage) { showWarning('Bạn không có quyền sửa chức vụ!'); return; }
    const pos = getPositionsData().find(p => p.id === id);
    if (!pos) { showError('Không tìm thấy chức vụ!'); return; }
    showModal('Sửa chức vụ', positionModalHtml(pos) + `
        <div class="modal-actions">
            <button class="btn" onclick="updatePosition(${id})">Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function savePosition() {
    const canManage = getUser()?.role === 'ADMIN';
    if (!canManage) { showWarning('Bạn không có quyền thêm chức vụ!'); return; }
    const name = document.getElementById('f-pos-name').value.trim();
    if (!name) { showError('Vui lòng nhập tên chức vụ'); return; }
    const departmentId = parseInt(document.getElementById('f-pos-dept').value) || null;
    const description = document.getElementById('f-pos-desc').value.trim();
    const isActive = document.getElementById('f-pos-active').checked;
    try {
        await api.createPosition({ name, departmentId, description, isActive });
        closeModal();
        await renderPositionsTab();
        showSuccess('Thêm chức vụ thành công!');
    } catch (error) {
        showError('Lỗi khi thêm chức vụ: ' + error.message);
    }
}

async function updatePosition(id) {
    const canManage = getUser()?.role === 'ADMIN';
    if (!canManage) { showWarning('Bạn không có quyền sửa chức vụ!'); return; }
    const name = document.getElementById('f-pos-name').value.trim();
    if (!name) { showError('Vui lòng nhập tên chức vụ'); return; }
    const departmentId = parseInt(document.getElementById('f-pos-dept').value) || null;
    const description = document.getElementById('f-pos-desc').value.trim();
    const isActive = document.getElementById('f-pos-active').checked;
    try {
        await api.updatePosition(id, { name, departmentId, description, isActive });
        closeModal();
        await renderPositionsTab();
        showSuccess('Cập nhật chức vụ thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật chức vụ: ' + error.message);
    }
}

async function deletePosition(id) {
    const canManage = getUser()?.role === 'ADMIN';
    if (!canManage) { showWarning('Bạn không có quyền xóa chức vụ!'); return; }
    if (!confirm('Xóa chức vụ này?')) return;
    try {
        await api.deletePosition(id);
        await renderPositionsTab();
        showSuccess('Xóa chức vụ thành công!');
    } catch (error) {
        showError('Lỗi khi xóa chức vụ: ' + error.message);
    }
}

// Export
window.refreshAdminPositions = refreshAdminPositions;
window.renderPositionsTab = renderPositionsTab;
window.showAddPosition = showAddPosition;
window.viewPosition = viewPosition;
window.editPosition = editPosition;
window.savePosition = savePosition;
window.updatePosition = updatePosition;
window.deletePosition = deletePosition;
