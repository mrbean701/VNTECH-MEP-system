// ================================================================
// PROJECTS - Quản lý dự án (sử dụng API) - ĐÃ SỬA LỖI NULL
// ================================================================

// Biến lưu trạng thái cho modal chi tiết dự án
let projectDetailState = {
    projectId: null,
    view: 'list',
    detailId: null
};

// ====== RENDER DANH SÁCH DỰ ÁN ======
async function renderProjects() {
    try {
        const projects = await api.getProjects();
        const filter = document.getElementById('project-filter')?.value?.toLowerCase() || '';
        const filtered = projects.filter(p =>
            (p.code || '').toLowerCase().includes(filter) ||
            (p.name || '').toLowerCase().includes(filter)
        );
        const user = getUser();
        const canEdit = ['ADMIN', 'PLANNING', 'PROJECT', 'CEO'].includes(user?.role || '');

        let html = `
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên dự án</th>
                            <th>Chủ đầu tư</th>
                            <th>PM/Chỉ huy</th>
                            <th>Trạng thái</th>
                            <th>Kho</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!filtered.length) {
            html += `<tr><td colspan="7" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        const warehouses = await api.getWarehouses();

        for (const p of filtered) {
            const statusBadge = p.status === 'ACTIVE'
                ? '<span class="badge badge-active">Đang hoạt động</span>'
                : '<span class="badge badge-inactive">Đã đóng</span>';

            const wh = warehouses.find(w => w.projectId === p.id);
            const whStatus = wh
                ? (wh.status === 'ACTIVE' ? '🟢 Đang hoạt động' : '🔴 Đã đóng')
                : 'Không có kho';
            const whName = wh ? wh.name : 'N/A';

            let actions = `
                <button class="btn btn-info btn-sm" onclick="viewProject(${p.id})">
                    <i class="fas fa-eye"></i>
                </button>
            `;
            if (canEdit) {
                actions += `
                    <button class="btn btn-warning btn-sm" onclick="editProject(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                `;
                if (user?.role === 'ADMIN') {
                    actions += `
                        <button class="btn btn-danger btn-sm" onclick="deleteProject(${p.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }

            html += `
                <tr>
                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewProject(${p.id})">${p.code || '--'}</td>
                    <td style="cursor:pointer; color:#1a3c6e;" onclick="viewProject(${p.id})">${p.name || '--'}</td>
                    <td>${p.client || ''}</td>
                    <td>${p.commander || ''}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${wh ? `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="showWarehouseInfoModal(${wh.id})">${whName}</span>` : whName}
                        <br><span style="font-size:12px; color:#888;">${whStatus}</span>
                    </td>
                    <td>${actions}</td>
                </tr>
            `;
        }

        html += `</tbody></table></div>`;
        document.getElementById('projects-container').innerHTML = html;
    } catch (error) {
        showError('Không thể tải danh sách dự án: ' + error.message);
        console.error('renderProjects error:', error);
    }
}

// ====== TẠO DỰ ÁN MỚI ======
async function saveProject() {
    const code = document.getElementById('f-project-code').value.trim().toUpperCase();
    const name = document.getElementById('f-project-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên dự án');
        return;
    }

    try {
        const newProject = {
            code,
            name,
            client: document.getElementById('f-project-client').value.trim(),
            commander: document.getElementById('f-project-commander').value.trim(),
            startDate: document.getElementById('f-project-start').value,
            endDate: document.getElementById('f-project-end').value,
            status: document.getElementById('f-project-status').value,
            note: document.getElementById('f-project-note').value.trim(),
        };

        await api.createProject(newProject);
        closeModal();
        await renderProjects();
        showSuccess('Thêm dự án thành công!');
    } catch (error) {
        showError('Lỗi khi thêm dự án: ' + error.message);
    }
}

// ====== CẬP NHẬT DỰ ÁN ======
async function updateProject(id) {
    const code = document.getElementById('f-project-code').value.trim().toUpperCase();
    const name = document.getElementById('f-project-name').value.trim();
    const newStatus = document.getElementById('f-project-status').value;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên dự án');
        return;
    }

    try {
        const currentProject = await api.getProjectById(id);
        if (currentProject.status === 'ACTIVE' && newStatus === 'INACTIVE') {
            if (!confirm(`Dự án "${name}" đang chuyển sang trạng thái NGỪNG HOẠT ĐỘNG.\n\nBạn có muốn đóng kho dự án này không?\n(Kho sẽ chuyển sang trạng thái NGỪNG HOẠT ĐỘNG)`)) {
                closeModal();
                await renderProjects();
                return;
            }
        }

        const updatedProject = {
            code,
            name,
            client: document.getElementById('f-project-client').value.trim(),
            commander: document.getElementById('f-project-commander').value.trim(),
            startDate: document.getElementById('f-project-start').value,
            endDate: document.getElementById('f-project-end').value,
            status: newStatus,
            note: document.getElementById('f-project-note').value.trim(),
        };

        await api.updateProject(id, updatedProject);
        closeModal();
        await renderProjects();
        showSuccess('Cập nhật dự án thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật dự án: ' + error.message);
    }
}

// ====== XÓA DỰ ÁN ======
async function deleteProject(id) {
    if (!confirm('Xóa dự án này? (kho và inventory liên quan sẽ bị xóa)')) return;

    try {
        await api.deleteProject(id);
        await renderProjects();
        showSuccess('Xóa dự án thành công!');
    } catch (error) {
        showError('Lỗi khi xóa dự án: ' + error.message);
    }
}

// ====== SỬA DỰ ÁN (hiển thị modal) ======
async function editProject(id) {
    try {
        const project = await api.getProjectById(id);
        if (!project) {
            showError('Không tìm thấy dự án!');
            return;
        }

        showModal('Sửa dự án', `
            <div class="form-group"><label>Mã dự án</label><input id="f-project-code" value="${project.code || ''}" required></div>
            <div class="form-group"><label>Tên dự án</label><input id="f-project-name" value="${project.name || ''}" required></div>
            <div class="form-group"><label>Chủ đầu tư</label><input id="f-project-client" value="${project.client || ''}"></div>
            <div class="form-group"><label>PM/Chỉ huy</label><input id="f-project-commander" value="${project.commander || ''}"></div>
            <div class="form-group"><label>Ngày bắt đầu</label><input id="f-project-start" type="date" value="${project.startDate || ''}"></div>
            <div class="form-group"><label>Ngày kết thúc KH</label><input id="f-project-end" type="date" value="${project.endDate || ''}"></div>
            <div class="form-group"><label>Trạng thái</label>
                <select id="f-project-status">
                    <option value="ACTIVE" ${project.status === 'ACTIVE' ? 'selected' : ''}>Đang hoạt động</option>
                    <option value="INACTIVE" ${project.status === 'INACTIVE' ? 'selected' : ''}>Đã đóng</option>
                </select>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-project-note" rows="2">${project.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateProject(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải dự án: ' + error.message);
    }
}

// ====== XEM CHI TIẾT DỰ ÁN (modal với tab) ======
async function viewProject(id) {
    try {
        const project = await api.getProjectById(id);
        if (!project) {
            showError('Không tìm thấy dự án!');
            return;
        }

        projectDetailState.projectId = id;
        projectDetailState.view = 'list';
        await renderProjectModal(project);
    } catch (error) {
        showError('Lỗi khi tải chi tiết dự án: ' + error.message);
    }
}

async function renderProjectModal(project) {
    try {
        const prList = await api.getPRs();
        const poList = await api.getPOs();
        const warehouses = await api.getWarehouses();

        const projectPRs = prList.filter(p => p.projectCode === project.code);
        const projectPOs = poList.filter(p => p.projectCode === project.code);
        const wh = warehouses.find(w => w.projectId === project.id);

        if (projectDetailState.view === 'pr-detail') {
            const pr = prList.find(p => p.id === projectDetailState.detailId);
            if (pr) {
                renderPRDetailInline(pr, project);
                return;
            } else {
                projectDetailState.view = 'list';
            }
        }

        if (projectDetailState.view === 'po-detail') {
            const po = poList.find(p => p.id === projectDetailState.detailId);
            if (po) {
                renderPODetailInline(po, project);
                return;
            } else {
                projectDetailState.view = 'list';
            }
        }

        // Bảng PR
        let prHtml = '';
        if (projectPRs.length === 0) {
            prHtml = '<p style="color:#999;">Chưa có PR nào cho dự án này.</p>';
        } else {
            prHtml = `
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Mã PR</th><th>Nhà cung cấp</th><th>Trạng thái</th><th>Bước duyệt</th><th>Hành động</th></tr></thead>
                        <tbody>
                            ${projectPRs.map(pr => `
                                <tr>
                                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewPR(${pr.id})">${pr.code || '--'}</td>
                                    <td>${pr.vendorName || pr.vendorCode || '--'}</td>
                                    <td>${getStatusBadge(pr.status)}</td>
                                    <td>${pr.approvalStep || 1}/3</td>
                                    <td>
                                        <button class="btn btn-info btn-sm" onclick="viewPRInline(${pr.id})">
                                            <i class="fas fa-eye"></i> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Bảng PO
        let poHtml = '';
        if (projectPOs.length === 0) {
            poHtml = '<p style="color:#999;">Chưa có PO nào cho dự án này.</p>';
        } else {
            poHtml = `
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Mã PO</th><th>Nhà cung cấp</th><th>Trạng thái</th><th>Bước duyệt</th><th>Hành động</th></tr></thead>
                        <tbody>
                            ${projectPOs.map(po => `
                                <tr>
                                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewPO(${po.id})">${po.code || '--'}</td>
                                    <td>${po.vendorName || po.vendorCode || '--'}</td>
                                    <td>${getStatusBadge(po.status)}</td>
                                    <td>${po.approvalStep || 1}/3</td>
                                    <td>
                                        <button class="btn btn-info btn-sm" onclick="viewPOInline(${po.id})">
                                            <i class="fas fa-eye"></i> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Thông tin kho
        let whHtml = '';
        if (!wh) {
            whHtml = '<p style="color:#999;">Dự án này chưa có kho.</p>';
        } else {
            const whStatusLabel = wh.status === 'ACTIVE'
                ? '<span class="badge badge-status-active">🟢 Đang hoạt động</span>'
                : '<span class="badge badge-status-inactive">🔴 Ngừng hoạt động</span>';
            const whTypeLabel = wh.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án';
            const canManageWh = ['ADMIN', 'PLANNING', 'PROJECT', 'CEO'].includes(getUser()?.role || '');

            whHtml = `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:16px; font-weight:600; color:#1a3c6e;">
                                <span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="showWarehouseInfoModal(${wh.id})">
                                    ${wh.code || '--'} - ${wh.name || '--'}
                                </span>
                            </div>
                            <div style="margin-top:4px;">
                                <span class="badge-wh ${wh.type === 'CENTRAL' ? 'badge-central' : 'badge-site'}">${whTypeLabel}</span>
                                ${whStatusLabel}
                            </div>
                            <div style="margin-top:4px; color:#666; font-size:14px;">
                                <i class="fas fa-map-marker-alt"></i> ${wh.address || 'Chưa có địa chỉ'}
                            </div>
                            <div style="color:#666; font-size:14px;">
                                <i class="fas fa-user"></i> ${wh.manager || 'Chưa có quản lý'}
                            </div>
                            ${wh.note ? `<div style="color:#666; font-size:14px;"><i class="fas fa-comment"></i> ${wh.note}</div>` : ''}
                        </div>
                        <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                            ${canManageWh ? `
                                <button class="btn btn-warning btn-sm" onclick="showChangeWhStatusModal(${project.id})">
                                    <i class="fas fa-sync-alt"></i> Đổi trạng thái kho
                                </button>
                            ` : ''}
                            <button class="btn btn-info btn-sm" onclick="showWarehouseInfoModal(${wh.id})">
                                <i class="fas fa-warehouse"></i> Chi tiết kho
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Modal chi tiết
        showModal('Chi tiết dự án', `
            <div style="margin-bottom:12px;">
                <div style="display:flex; gap:8px; border-bottom:1px solid #ddd; margin-bottom:12px; flex-wrap:wrap;">
                    <span class="tab-btn active" data-tab="info" style="padding:6px 16px; cursor:pointer; border-bottom:2px solid #1a3c6e; font-weight:600;">📋 Thông tin</span>
                    <span class="tab-btn" data-tab="pr" style="padding:6px 16px; cursor:pointer; font-weight:500;">📄 PR (${projectPRs.length})</span>
                    <span class="tab-btn" data-tab="po" style="padding:6px 16px; cursor:pointer; font-weight:500;">🛒 PO (${projectPOs.length})</span>
                    <span class="tab-btn" data-tab="warehouse" style="padding:6px 16px; cursor:pointer; font-weight:500;">🏚️ Kho</span>
                </div>

                <div id="tab-info">
                    <div class="detail-grid">
                        <div><span class="label">Mã dự án:</span> <span class="value">${project.code || '--'}</span></div>
                        <div><span class="label">Tên dự án:</span> <span class="value">${project.name || '--'}</span></div>
                        <div><span class="label">Chủ đầu tư:</span> <span class="value">${project.client || ''}</span></div>
                        <div><span class="label">PM/Chỉ huy:</span> <span class="value">${project.commander || ''}</span></div>
                        <div><span class="label">Ngày bắt đầu:</span> <span class="value">${project.startDate || ''}</span></div>
                        <div><span class="label">Ngày kết thúc KH:</span> <span class="value">${project.endDate || ''}</span></div>
                        <div><span class="label">Trạng thái:</span> <span class="value">${project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}</span></div>
                        <div><span class="label">Ghi chú:</span> <span class="value">${project.note || ''}</span></div>
                    </div>
                </div>

                <div id="tab-pr" style="display:none;">
                    <h4 style="margin:10px 0 6px; color:#1a3c6e;">📌 Danh sách PR</h4>
                    ${prHtml}
                </div>

                <div id="tab-po" style="display:none;">
                    <h4 style="margin:10px 0 6px; color:#1a3c6e;">🛒 Danh sách PO</h4>
                    ${poHtml}
                </div>

                <div id="tab-warehouse" style="display:none;">
                    <h4 style="margin:10px 0 6px; color:#1a3c6e;">🏚️ Kho dự án</h4>
                    ${whHtml}
                </div>
            </div>
            <div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>
        `);

        // Gán sự kiện chuyển tab
        document.querySelectorAll('#modal-content .tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#modal-content .tab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottom = 'none';
                    b.style.fontWeight = '500';
                });
                this.classList.add('active');
                this.style.borderBottom = '2px solid #1a3c6e';
                this.style.fontWeight = '600';

                const tab = this.dataset.tab;
                document.getElementById('tab-info').style.display = tab === 'info' ? 'block' : 'none';
                document.getElementById('tab-pr').style.display = tab === 'pr' ? 'block' : 'none';
                document.getElementById('tab-po').style.display = tab === 'po' ? 'block' : 'none';
                document.getElementById('tab-warehouse').style.display = tab === 'warehouse' ? 'block' : 'none';
            });
        });
    } catch (error) {
        showError('Lỗi khi tải chi tiết dự án: ' + error.message);
    }
}

// ====== ĐỔI TRẠNG THÁI KHO ======
async function showChangeWhStatusModal(projectId) {
    try {
        const warehouses = await api.getWarehouses();
        const wh = warehouses.find(w => w.projectId === projectId);
        if (!wh) {
            showError('Không tìm thấy kho của dự án này.');
            return;
        }

        const currentStatus = wh.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';

        showModal('Đổi trạng thái kho', `
            <div style="margin-bottom:12px;">
                <div style="margin-bottom:12px;">
                    <strong>Kho:</strong> ${wh.name || wh.code || '--'} (${wh.code || '--'})
                </div>
                <div style="margin-bottom:12px;">
                    <strong>Trạng thái hiện tại:</strong> ${currentStatus}
                </div>
                <div class="form-group">
                    <label>Chọn trạng thái mới:</label>
                    <select id="f-new-wh-status" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <option value="ACTIVE" ${wh.status === 'ACTIVE' ? 'selected' : ''}>Đang hoạt động</option>
                        <option value="INACTIVE" ${wh.status === 'INACTIVE' ? 'selected' : ''}>Ngừng hoạt động</option>
                    </select>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="confirmChangeWhStatus(${projectId})">Xác nhận</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải thông tin kho: ' + error.message);
    }
}

async function confirmChangeWhStatus(projectId) {
    const newStatus = document.getElementById('f-new-wh-status').value;
    const statusLabel = newStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động';

    try {
        const warehouses = await api.getWarehouses();
        const wh = warehouses.find(w => w.projectId === projectId);
        if (!wh) {
            showError('Không tìm thấy kho.');
            closeModal();
            return;
        }

        if (wh.status === newStatus) {
            showWarning(`Kho đã ở trạng thái ${statusLabel}.`);
            closeModal();
            return;
        }

        if (!confirm(`Xác nhận chuyển kho "${wh.name}" sang trạng thái ${statusLabel}?`)) {
            return;
        }

        wh.status = newStatus;
        await api.updateWarehouse(wh.id, wh);

        closeModal();
        const project = await api.getProjectById(projectId);
        if (project) {
            await renderProjectModal(project);
        } else {
            await renderProjects();
        }
        showSuccess(`Kho "${wh.name}" đã được chuyển sang trạng thái ${statusLabel}.`);
    } catch (error) {
        showError('Lỗi khi cập nhật trạng thái kho: ' + error.message);
    }
}

// ====== XEM PR/PO INLINE (trong modal chi tiết dự án) ======
async function viewPRInline(prId) {
    try {
        const pr = await api.getPRById(prId);
        if (!pr) {
            showError('Không tìm thấy PR!');
            return;
        }
        projectDetailState.view = 'pr-detail';
        projectDetailState.detailId = prId;

        const project = await api.getProjectById(projectDetailState.projectId);
        renderPRDetailInline(pr, project);
    } catch (error) {
        showError('Lỗi khi tải PR: ' + error.message);
    }
}

async function viewPOInline(poId) {
    try {
        const po = await api.getPOById(poId);
        if (!po) {
            showError('Không tìm thấy PO!');
            return;
        }
        projectDetailState.view = 'po-detail';
        projectDetailState.detailId = poId;

        const project = await api.getProjectById(projectDetailState.projectId);
        renderPODetailInline(po, project);
    } catch (error) {
        showError('Lỗi khi tải PO: ' + error.message);
    }
}

function renderPRDetailInline(pr, project) {
    const itemsStr = pr.items ? JSON.parse(pr.items).map(it =>
        `${getItemCode(it.itemId)} - ${getItemName(it.itemId)} (${it.quantity} ${getItemUnit(it.itemId)})`
    ).join('<br>') : '';

    const approvalHtml = renderApprovalProgress(pr.status, pr.approvalStep);

    showModal('Chi tiết PR', `
        <div style="margin-bottom:12px;">
            <button class="btn btn-outline btn-sm" onclick="backToProjectList()" style="margin-bottom:12px;">
                <i class="fas fa-arrow-left"></i> Quay lại danh sách
            </button>
            <div class="detail-grid">
                <div><span class="label">Mã PR:</span> <span class="value">${pr.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${pr.createdAt || ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${project ? project.name : pr.projectName || ''}</span></div>
                <div><span class="label">Nhà cung cấp:</span> <span class="value">${pr.vendorName || pr.vendorCode || '--'}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(pr.status)}</span></div>
                <div><span class="label">Bước duyệt:</span> <span class="value">${pr.approvalStep || 1}/3</span></div>
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${approvalHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br><span class="value">${itemsStr || '--'}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${pr.note || ''}</span></div>
            </div>
            ${pr.status === 'PENDING' ? `
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
                    <button class="btn btn-success btn-sm" onclick="approvePRFromProject(${pr.id})">Duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectPRFromProject(${pr.id})">Từ chối</button>
                </div>
            ` : ''}
        </div>
        <div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>
    `);
}

function renderPODetailInline(po, project) {
    const itemsStr = po.items ? JSON.parse(po.items).map(it =>
        `${getItemCode(it.itemId)} - ${getItemName(it.itemId)} (${it.quantity} ${getItemUnit(it.itemId)})`
    ).join('<br>') : '';

    const approvalHtml = renderApprovalProgress(po.status, po.approvalStep);

    showModal('Chi tiết PO', `
        <div style="margin-bottom:12px;">
            <button class="btn btn-outline btn-sm" onclick="backToProjectList()" style="margin-bottom:12px;">
                <i class="fas fa-arrow-left"></i> Quay lại danh sách
            </button>
            <div class="detail-grid">
                <div><span class="label">Mã PO:</span> <span class="value">${po.code || '--'}</span></div>
                <div><span class="label">Ngày tạo:</span> <span class="value">${po.createdAt || ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${project ? project.name : po.projectName || ''}</span></div>
                <div><span class="label">Nhà cung cấp:</span> <span class="value">${po.vendorName || po.vendorCode || '--'}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(po.status)}</span></div>
                <div><span class="label">Bước duyệt:</span> <span class="value">${po.approvalStep || 1}/3</span></div>
                <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${approvalHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br><span class="value">${itemsStr || '--'}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${po.note || ''}</span></div>
            </div>
            ${po.status === 'PENDING' ? `
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
                    <button class="btn btn-success btn-sm" onclick="approvePOFromProject(${po.id})">Duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectPOFromProject(${po.id})">Từ chối</button>
                </div>
            ` : ''}
        </div>
        <div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>
    `);
}

async function backToProjectList() {
    projectDetailState.view = 'list';
    try {
        const project = await api.getProjectById(projectDetailState.projectId);
        if (project) {
            await renderProjectModal(project);
        } else {
            closeModal();
        }
    } catch (error) {
        closeModal();
        showError('Lỗi khi tải lại dự án: ' + error.message);
    }
}

// ====== SỰ KIỆN CHO NÚT THÊM DỰ ÁN ======
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btn-create-project')?.addEventListener('click', function() {
        const user = getUser();
        if (!['ADMIN', 'PLANNING', 'PROJECT', 'CEO'].includes(user?.role || '')) {
            showWarning('Bạn không có quyền thêm dự án!');
            return;
        }

        showModal('Thêm dự án mới', `
            <div class="form-group"><label>Mã dự án</label><input id="f-project-code" placeholder="DAxxx" required></div>
            <div class="form-group"><label>Tên dự án</label><input id="f-project-name" required></div>
            <div class="form-group"><label>Chủ đầu tư</label><input id="f-project-client"></div>
            <div class="form-group"><label>PM/Chỉ huy</label><input id="f-project-commander"></div>
            <div class="form-group"><label>Ngày bắt đầu</label><input id="f-project-start" type="date"></div>
            <div class="form-group"><label>Ngày kết thúc KH</label><input id="f-project-end" type="date"></div>
            <div class="form-group"><label>Trạng thái</label>
                <select id="f-project-status"><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Đã đóng</option></select>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-project-note" rows="2"></textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="saveProject()"><i class="fas fa-save"></i> Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    });
});

// ====== EXPORT FUNCTIONS ======
window.renderProjects = renderProjects;
window.viewProject = viewProject;
window.editProject = editProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.saveProject = saveProject;
window.viewPRInline = viewPRInline;
window.viewPOInline = viewPOInline;
window.backToProjectList = backToProjectList;
window.showChangeWhStatusModal = showChangeWhStatusModal;
window.confirmChangeWhStatus = confirmChangeWhStatus;

console.log('✅ Projects module updated to use API (fixed null display).');