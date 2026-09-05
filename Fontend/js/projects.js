// ================================================================
// PROJECTS - Quản lý dự án (sử dụng API) - ĐÃ TÍCH HỢP PHÂN QUYỀN
// ================================================================

// ====== STATE CHO FILTER/SORT ======

let projectDetailState = {
    projectId: null,
    view: 'list',
    detailId: null
};

let projectsPageState = {
    page: 1,
    perPage: 10
};

// ====== STATE ======
const projectsState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    sortBy: 'code',
    sortOrder: 'asc'
};

const debouncedProjectsFilter = debounce(() => {
    projectsState.page = 1;
    renderProjects();
}, 300);

// ================================================================
// RENDER DANH SÁCH DỰ ÁN
// ================================================================

async function renderProjects(page = null) {
    try {
        const projects = await api.getProjects();
        window._projectsCache = projects;
        saveData('projects', projects);

        if (page) projectsState.page = page;

        // Filter
        const keyword = projectsState.filterText.toLowerCase().trim();
        let filtered = projects.filter(p => {
            let matchKeyword = true;
            if (keyword) {
                const codeMatch = (p.code || '').toLowerCase().includes(keyword);
                const nameMatch = (p.name || '').toLowerCase().includes(keyword);
                const clientMatch = (p.client || '').toLowerCase().includes(keyword);
                const commanderMatch = (p.commander || '').toLowerCase().includes(keyword);
                matchKeyword = codeMatch || nameMatch || clientMatch || commanderMatch;
            }
            const matchStatus = projectsState.statusFilter ? p.status === projectsState.statusFilter : true;
            return matchKeyword && matchStatus;
        });

        // Sort
        const order = projectsState.sortOrder === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            let valA = a[projectsState.sortBy] || '';
            let valB = b[projectsState.sortBy] || '';
            if (projectsState.sortBy === 'startDate' || projectsState.sortBy === 'endDate') {
                valA = new Date(valA || 0);
                valB = new Date(valB || 0);
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
        });

        const perPage = getPageSize('projects');
        projectsState.perPage = perPage;
        const paging = paginate(filtered, projectsState.page, perPage);

        const user = getUser();
        const canCreate = hasPermission('projects.create');
        const canEdit = hasPermission('projects.edit');
        const canDelete = hasPermission('projects.delete');

        // ✅ KIỂM TRA QUYỀN TẠO DỰ ÁN
        const btnCreate = document.getElementById('btn-create-project');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        const warehouses = await api.getWarehouses();

        let html = `
            <div class="filter-bar">
                <input type="text" id="project-filter" placeholder="Tìm theo mã, tên, chủ đầu tư, chỉ huy..." style="flex:2;" value="${projectsState.filterText}">
                <select id="project-status-filter" style="flex:1;">
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE" ${projectsState.statusFilter === 'ACTIVE' ? 'selected' : ''}>Đang hoạt động</option>
                    <option value="INACTIVE" ${projectsState.statusFilter === 'INACTIVE' ? 'selected' : ''}>Đã đóng</option>
                    <option value="SUSPENDED" ${projectsState.statusFilter === 'SUSPENDED' ? 'selected' : ''}>Tạm dừng</option>
                </select>
                <select id="project-sort" style="flex:1;">
                    <option value="code_asc" ${projectsState.sortBy === 'code' && projectsState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${projectsState.sortBy === 'code' && projectsState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="name_asc" ${projectsState.sortBy === 'name' && projectsState.sortOrder === 'asc' ? 'selected' : ''}>Tên (A→Z)</option>
                    <option value="name_desc" ${projectsState.sortBy === 'name' && projectsState.sortOrder === 'desc' ? 'selected' : ''}>Tên (Z→A)</option>
                    <option value="client_asc" ${projectsState.sortBy === 'client' && projectsState.sortOrder === 'asc' ? 'selected' : ''}>Chủ đầu tư (A→Z)</option>
                    <option value="client_desc" ${projectsState.sortBy === 'client' && projectsState.sortOrder === 'desc' ? 'selected' : ''}>Chủ đầu tư (Z→A)</option>
                    <option value="startDate_asc" ${projectsState.sortBy === 'startDate' && projectsState.sortOrder === 'asc' ? 'selected' : ''}>Ngày bắt đầu (cũ→mới)</option>
                    <option value="startDate_desc" ${projectsState.sortBy === 'startDate' && projectsState.sortOrder === 'desc' ? 'selected' : ''}>Ngày bắt đầu (mới→cũ)</option>
                    <option value="status" ${projectsState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetProjectsFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
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

        if (!paging.items.length) {
            html += `<tr><td colspan="7" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const p of paging.items) {
            const statusBadge = p.status === 'ACTIVE'
                ? '<span class="badge badge-active">Đang hoạt động</span>'
                : p.status === 'SUSPENDED'
                    ? '<span class="badge badge-pending">Tạm dừng</span>'
                    : '<span class="badge badge-inactive">Đã đóng</span>';

            const wh = warehouses.find(w => w.projectId === p.id);
            const whStatus = wh
                ? (wh.status === 'ACTIVE' ? '🟢 Đang hoạt động' : '🔴 Đã đóng')
                : 'Không có kho';
            const whName = wh ? wh.name : 'N/A';

            let actions = `<button class="btn btn-info btn-sm" onclick="viewProject(${p.id})"><i class="fas fa-eye"></i></button>`;
            if (canEdit) {
                actions += ` <button class="btn btn-warning btn-sm" onclick="editProject(${p.id})"><i class="fas fa-edit"></i></button>`;
            }
            if (canDelete && user?.role === 'ADMIN') {
                actions += ` <button class="btn btn-danger btn-sm" onclick="deleteProject(${p.id})"><i class="fas fa-trash"></i></button>`;
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
        html += buildPaginationHTML(paging, 'renderProjects', 'projects');
        document.getElementById('projects-container').innerHTML = html;

        // Gắn sự kiện
        const filterInput = document.getElementById('project-filter');
        const statusSelect = document.getElementById('project-status-filter');
        const sortSelect = document.getElementById('project-sort');

        if (filterInput) {
            filterInput.removeEventListener('input', debouncedProjectsFilter);
            filterInput.addEventListener('input', function(e) {
                projectsState.filterText = this.value;
                debouncedProjectsFilter();
            });
        }
        if (statusSelect) {
            statusSelect.removeEventListener('change', debouncedProjectsFilter);
            statusSelect.addEventListener('change', function(e) {
                projectsState.statusFilter = this.value;
                debouncedProjectsFilter();
            });
        }
        if (sortSelect) {
            sortSelect.removeEventListener('change', debouncedProjectsFilter);
            sortSelect.addEventListener('change', function(e) {
                const [sortBy, sortOrder] = this.value.split('_');
                projectsState.sortBy = sortBy;
                projectsState.sortOrder = sortOrder || 'asc';
                debouncedProjectsFilter();
            });
        }

    } catch (error) {
        showError('Không thể tải danh sách dự án: ' + error.message);
        console.error('renderProjects error:', error);
    }
}

function resetProjectsFilters() {
    projectsState.filterText = '';
    projectsState.statusFilter = '';
    projectsState.sortBy = 'code';
    projectsState.sortOrder = 'asc';
    projectsState.page = 1;
    renderProjects();
}
// ================================================================
// CRUD DỰ ÁN (giữ nguyên từ cũ)
// ================================================================

function showCreateProjectModal() {
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
}

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

async function editProject(id) {
    if (!hasPermission('projects.edit')) {
        showWarning('Bạn không có quyền sửa dự án!');
        return;
    }

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
            // Gọi hàm xử lý ngừng hoạt động
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
            window._pendingProjectUpdate = { projectId: id, updatedProject };
            await handleProjectInactivation(id, updatedProject);
        } else {
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
            await doUpdateProject(id, updatedProject);
            closeModal();
        }
    } catch (error) {
        showError('Lỗi khi cập nhật dự án: ' + error.message);
    }
}

async function deleteProject(id) {
    if (!hasPermission('projects.delete')) {
        showWarning('Bạn không có quyền xóa dự án!');
        return;
    }
    if (!confirm('Xóa dự án này? (kho và inventory liên quan sẽ bị xóa)')) return;

    try {
        await api.deleteProject(id);
        await renderProjects();
        showSuccess('Xóa dự án thành công!');
    } catch (error) {
        showError('Lỗi khi xóa dự án: ' + error.message);
    }
}

// ================================================================
// XEM CHI TIẾT DỰ ÁN (MODAL VỚI TAB)
// ================================================================

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

// ================================================================
// RENDER MODAL CHI TIẾT DỰ ÁN (CÓ TAB THÀNH VIÊN)
// ================================================================

async function renderProjectModal(project) {
    try {
        const prList = await api.getPRs();
        const poList = await api.getPOs();
        const warehouses = await api.getWarehouses();

        const projectPRs = prList.filter(p => p.projectCode === project.code);
        const projectPOs = poList.filter(p => p.projectCode === project.code);
        const wh = warehouses.find(w => w.projectId === project.id);

        let membersData = [];
        try {
            membersData = await api.getProjectMembers(project.id, false);
        } catch (e) {
            console.warn('Không lấy được thành viên dự án:', e);
        }

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

        // ===== BẢNG PR =====
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

        // ===== BẢNG PO =====
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

        // ===== THÔNG TIN KHO =====
        let whHtml = '';
        const canManageWh = hasPermission('inventory.edit');

        if (!wh) {
            whHtml = `
                <div style="background:#fef9e7; border:1px solid #fecba1; padding:16px; border-radius:8px; text-align:center;">
                    <div style="font-size:16px; color:#b45309; margin-bottom:8px;">
                        <i class="fas fa-warehouse" style="font-size:24px;"></i>
                    </div>
                    <div style="font-weight:500; margin-bottom:8px;">Dự án này chưa có kho</div>
                    ${canManageWh ? `
                        <button class="btn" onclick="showCreateWarehouseFromProject(${project.id})">
                            <i class="fas fa-plus"></i> Tạo kho cho dự án
                        </button>
                    ` : `
                        <span style="color:#888; font-size:14px;">Bạn không có quyền tạo kho</span>
                    `}
                </div>
            `;
        } else {
            const whStatusLabel = wh.status === 'ACTIVE'
                ? '<span class="badge badge-status-active">🟢 Đang hoạt động</span>'
                : '<span class="badge badge-status-inactive">🔴 Ngừng hoạt động</span>';
            const whTypeLabel = wh.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án';

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

        // ===== TAB THÀNH VIÊN =====
        const membersHtml = renderProjectMembersTab(project, membersData);

        // ===== MODAL CHI TIẾT =====
        showModal('Chi tiết dự án', `
            <div style="margin-bottom:12px;">
                <div style="display:flex; gap:8px; border-bottom:1px solid #ddd; margin-bottom:12px; flex-wrap:wrap;">
                    <span class="tab-btn active" data-tab="info" style="padding:6px 16px; cursor:pointer; border-bottom:2px solid #1a3c6e; font-weight:600;">📋 Thông tin</span>
                    <span class="tab-btn" data-tab="pr" style="padding:6px 16px; cursor:pointer; font-weight:500;">📄 PR (${projectPRs.length})</span>
                    <span class="tab-btn" data-tab="po" style="padding:6px 16px; cursor:pointer; font-weight:500;">🛒 PO (${projectPOs.length})</span>
                    <span class="tab-btn" data-tab="warehouse" style="padding:6px 16px; cursor:pointer; font-weight:500;">🏚️ Kho</span>
                    <span class="tab-btn" data-tab="members" style="padding:6px 16px; cursor:pointer; font-weight:500;">👥 Thành viên (${membersData.length})</span>
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

                <div id="tab-members" style="display:none;">
                    ${membersHtml}
                </div>
            </div>
            <div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>
        `);

        // ===== GÁN SỰ KIỆN CHUYỂN TAB =====
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
                document.getElementById('tab-members').style.display = tab === 'members' ? 'block' : 'none';
                
                if (tab === 'members') {
                    refreshProjectMembers(project.id);
                }
            });
        });

    } catch (error) {
        showError('Lỗi khi tải chi tiết dự án: ' + error.message);
    }
}

// ================================================================
// RENDER TAB THÀNH VIÊN
// ================================================================

function renderProjectMembersTab(project, membersData) {
    const canManage = hasPermission('projects.edit') || hasPermission('admin.view');
    
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <h4 style="margin:0; color:#1a3c6e;">👥 Danh sách thành viên</h4>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <label style="display:flex; align-items:center; gap:4px; font-size:13px; cursor:pointer;">
                    <input type="checkbox" id="f-show-left-members" onchange="refreshProjectMembers(${project.id})">
                    <span>Hiển thị user đã rời</span>
                </label>
                ${canManage ? `<button class="btn btn-sm btn-success" onclick="showAddProjectMemberModal(${project.id})"><i class="fas fa-plus"></i> Thêm thành viên</button>` : ''}
            </div>
        </div>
        <div id="project-members-list">
            ${buildProjectMembersTable(membersData, canManage, project.id)}
        </div>
    `;
    return html;
}

// ================================================================
// BUILD BẢNG THÀNH VIÊN
// ================================================================

function buildProjectMembersTable(members, canManage, projectId) {
    if (!members || members.length === 0) {
        return '<p style="color:#999; text-align:center; padding:20px 0;">Chưa có thành viên nào trong dự án này.</p>';
    }

    let html = `
        <div class="table-responsive">
            <table style="font-size:13px;">
                <thead>
                    <tr>
                        <th>Họ tên</th>
                        <th>Phòng ban</th>
                        <th>Chức vụ</th>
                        <th>Vai trò trong dự án</th>
                        <th>Tham gia</th>
                        <th>Rời</th>
                        <th>Trạng thái</th>
                        ${canManage ? '<th>Hành động</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;

    members.forEach(m => {
        const isActive = !m.leftAt;
        const statusBadge = isActive 
            ? '<span class="badge badge-active">🟢 Đang tham gia</span>'
            : '<span class="badge badge-inactive">🔴 Đã rời</span>';

        html += `
            <tr>
                <td style="font-weight:500; cursor:pointer; color:#1a3c6e;" onclick="viewUser(${m.userId}, ${projectId})">${m.userName || 'N/A'}</td>
                <td>${m.departmentName || '--'}</td>
                <td>${m.userPosition || '--'}</td>
                <td><span class="badge badge-info">${m.role || 'Thành viên'}</span></td>
                <td>${formatDate(m.joinedAt)}</td>
                <td>${m.leftAt ? formatDate(m.leftAt) : '--'}</td>
                <td>${statusBadge}</td>
                ${canManage ? `
                    <td>
                        ${isActive ? `
                            <button class="btn btn-sm btn-warning" onclick="showEditMemberRoleModal(${m.id}, '${m.role || ''}')" title="Sửa vai trò">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="confirmLeaveProject(${m.id}, ${projectId})" title="Rời dự án">
                                <i class="fas fa-sign-out-alt"></i> Rời
                            </button>
                        ` : `
                            <span style="color:#999; font-size:12px;">Đã rời</span>
                            <button class="btn btn-sm btn-danger" onclick="confirmDeleteProjectMember(${m.id}, ${projectId})" title="Xóa vĩnh viễn">
                                <i class="fas fa-trash"></i>
                            </button>
                        `}
                    </td>
                ` : ''}
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    return html;
}

// ================================================================
// REFRESH DANH SÁCH THÀNH VIÊN
// ================================================================

async function refreshProjectMembers(projectId) {
    const showLeft = document.getElementById('f-show-left-members')?.checked || false;
    try {
        const members = await api.getProjectMembers(projectId, showLeft);
        const container = document.getElementById('project-members-list');
        if (container) {
            const canManage = hasPermission('projects.edit') || hasPermission('admin.view');
            container.innerHTML = buildProjectMembersTable(members, canManage, projectId);
        }
    } catch (error) {
        console.error('Refresh members error:', error);
    }
}

// ================================================================
// THÊM THÀNH VIÊN VÀO DỰ ÁN
// ================================================================

async function showAddProjectMemberModal(projectId) {
    if (!hasPermission('projects.edit') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền thêm thành viên!');
        return;
    }

    try {
        const allUsers = await api.getUsers();
        const existingMembers = await api.getProjectMembers(projectId, true);
        const existingUserIds = existingMembers.map(m => m.userId);
        const availableUsers = allUsers.filter(u => !existingUserIds.includes(u.id));

        if (availableUsers.length === 0) {
            showWarning('Tất cả user đã tham gia dự án này.');
            return;
        }

        let userCheckboxes = availableUsers.map(u => `
            <div style="display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid #f0f0f0;">
                <input type="checkbox" class="f-add-member-user" value="${u.id}" style="width:16px; height:16px;">
                <span><strong>${u.name}</strong> (${u.email}) - ${u.position || '--'}</span>
            </div>
        `).join('');

        showModal('Thêm thành viên vào dự án', `
            <div class="form-group">
                <label>Chọn người dùng <span style="color:red;">*</span></label>
                <div style="max-height:250px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px;">
                    ${userCheckboxes}
                </div>
                <div style="margin-top:4px; font-size:12px; color:#888;">
                    <i class="fas fa-info-circle"></i> Chọn nhiều user để thêm cùng lúc.
                </div>
            </div>
            <div class="form-group">
                <label>Vai trò mặc định</label>
                <input id="f-add-member-role" placeholder="VD: Project Manager, Engineer..." value="Thành viên">
            </div>
            <div class="form-group">
                <label>Ngày tham gia</label>
                <input id="f-add-member-joined" type="date" value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="saveProjectMembers(${projectId})"><i class="fas fa-save"></i> Thêm</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi tải danh sách user: ' + error.message);
    }
}

async function saveProjectMembers(projectId) {
    const checkboxes = document.querySelectorAll('.f-add-member-user:checked');
    if (checkboxes.length === 0) {
        showError('Vui lòng chọn ít nhất một người dùng');
        return;
    }

    const role = document.getElementById('f-add-member-role').value.trim() || 'Thành viên';
    const joinedAt = document.getElementById('f-add-member-joined').value;

    if (!joinedAt) {
        showError('Vui lòng chọn ngày tham gia');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const cb of checkboxes) {
        const userId = parseInt(cb.value);
        try {
            await api.addProjectMember({
                projectId,
                userId,
                role,
                joinedAt: joinedAt
            });
            successCount++;
        } catch (error) {
            errorCount++;
            console.error('Lỗi khi thêm user ' + userId + ':', error);
        }
    }

    closeModal();
    if (projectDetailState.projectId) {
        await refreshProjectMembers(projectDetailState.projectId);
    }
    if (successCount > 0) {
        showSuccess(`Đã thêm ${successCount} thành viên thành công! ${errorCount > 0 ? 'Có ' + errorCount + ' lỗi.' : ''}`);
    } else {
        showError('Không thể thêm thành viên nào. Vui lòng thử lại.');
    }
}

// ================================================================
// SỬA VAI TRÒ THÀNH VIÊN
// ================================================================

function showEditMemberRoleModal(memberId, currentRole, currentJoinedAt) {
    if (!hasPermission('projects.edit') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền sửa thông tin thành viên!');
        return;
    }

    showModal('Sửa thông tin thành viên', `
        <div class="form-group">
            <label>Vai trò trong dự án</label>
            <input id="f-edit-role" value="${currentRole || 'Thành viên'}" placeholder="Vai trò trong dự án">
        </div>
        <div class="form-group">
            <label>Ngày tham gia</label>
            <input id="f-edit-joined" type="date" value="${currentJoinedAt || new Date().toISOString().slice(0,10)}">
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="updateMemberInfo(${memberId})"><i class="fas fa-save"></i> Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function updateMemberInfo(memberId) {
    const role = document.getElementById('f-edit-role').value.trim() || 'Thành viên';
    const joinedAt = document.getElementById('f-edit-joined').value;

    if (!joinedAt) {
        showError('Vui lòng chọn ngày tham gia');
        return;
    }

    try {
        await api.updateProjectMember(memberId, {
            role: role,
            joinedAt: joinedAt
        });
        closeModal();
        if (projectDetailState.projectId) {
            await refreshProjectMembers(projectDetailState.projectId);
        }
        showSuccess('Cập nhật thông tin thành viên thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật: ' + error.message);
    }
}

// ================================================================
// USER RỜI DỰ ÁN
// ================================================================

function confirmLeaveProject(memberId, projectId) {
    if (!hasPermission('projects.edit') && !hasPermission('admin.view')) {
        showWarning('Bạn không có quyền thực hiện hành động này!');
        return;
    }

    if (!confirm('Xác nhận user rời dự án này?')) return;

    showModal('Xác nhận rời dự án', `
        <div class="form-group">
            <label>Ngày rời (mặc định: hôm nay)</label>
            <input id="f-leave-date" type="date" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="confirmLeaveProjectAction(${memberId}, ${projectId})"><i class="fas fa-check"></i> Xác nhận</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function confirmLeaveProjectAction(memberId, projectId) {
    const leftAt = document.getElementById('f-leave-date').value;
    try {
        await api.leaveProject(memberId, leftAt);
        closeModal();
        await refreshProjectMembers(projectId);
        showSuccess('User đã rời dự án!');
    } catch (error) {
        showError('Lỗi khi rời dự án: ' + error.message);
    }
}

// ================================================================
// XÓA VĨNH VIỄN THÀNH VIÊN (ADMIN ONLY)
// ================================================================

async function confirmDeleteProjectMember(memberId, projectId) {
    if (!hasPermission('admin.view')) {
        showWarning('Chỉ ADMIN mới có quyền xóa vĩnh viễn!');
        return;
    }

    if (!confirm('Xóa vĩnh viễn bản ghi thành viên này?')) return;

    try {
        await api.deleteProjectMember(memberId);
        await refreshProjectMembers(projectId);
        showSuccess('Đã xóa bản ghi thành viên!');
    } catch (error) {
        showError('Lỗi khi xóa: ' + error.message);
    }
}

// ================================================================
// CÁC HÀM HỖ TRỢ KHÁC
// ================================================================

async function showChangeWhStatusModal(projectId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền thay đổi trạng thái kho!');
        return;
    }

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

// ================================================================
// XEM PR/PO INLINE
// ================================================================

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
            ${pr.status === 'PENDING' && hasPermission('pr.approve') ? `
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
            ${po.status === 'PENDING' && hasPermission('po.approve') ? `
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

function showCreateWarehouseFromProject(projectId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền tạo kho');
        return;
    }

    api.getProjectById(projectId).then(project => {
        if (!project) {
            showError('Không tìm thấy dự án!');
            return;
        }

        api.getProjects().then(projects => {
            const projectOpts = projects.map(p => 
                `<option value="${p.id}" ${p.id === projectId ? 'selected' : ''}>${p.code} - ${p.name}</option>`
            ).join('');

            showModal('Tạo kho cho dự án', `
                <div style="margin-bottom:12px; background:#f0fdf4; padding:12px; border-radius:6px; border:1px solid #bbf7d0;">
                    <strong>🏗️ Dự án:</strong> ${project.code} - ${project.name}
                </div>
                <div class="form-group">
                    <label>Mã kho</label>
                    <input id="f-wh-code" value="WH-${project.code}" placeholder="KHO_xxx" required>
                </div>
                <div class="form-group">
                    <label>Tên kho</label>
                    <input id="f-wh-name" value="Kho ${project.name}" required>
                </div>
                <div class="form-group">
                    <label>Loại kho</label>
                    <select id="f-wh-type" onchange="toggleProjectField()">
                        <option value="CENTRAL">Kho tổng</option>
                        <option value="SITE" selected>Kho dự án</option>
                    </select>
                </div>
                <div class="form-group" id="wh-project-group" style="display:block;">
                    <label>Dự án</label>
                    <select id="f-wh-project">
                        ${projectOpts}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quản lý</label>
                    <input id="f-wh-manager" placeholder="Tên thủ kho">
                </div>
                <div class="form-group">
                    <label>Địa chỉ</label>
                    <input id="f-wh-address" placeholder="Địa chỉ kho">
                </div>
                <div class="form-group">
                    <label>Trạng thái</label>
                    <select id="f-wh-status">
                        <option value="ACTIVE" selected>Đang hoạt động</option>
                        <option value="INACTIVE">Ngừng</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Ghi chú</label>
                    <textarea id="f-wh-note" rows="2"></textarea>
                </div>
                <div class="modal-actions">
                    <button class="btn" onclick="saveWarehouseFromProject(${projectId})"><i class="fas fa-save"></i> Tạo kho</button>
                    <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
                </div>
            `);

            toggleProjectField();
        });
    }).catch(err => showError('Lỗi tải dự án: ' + err.message));
}

async function saveWarehouseFromProject(projectId) {
    const code = document.getElementById('f-wh-code').value.trim();
    const name = document.getElementById('f-wh-name').value.trim();
    const type = document.getElementById('f-wh-type').value;
    const projectIdSelected = parseInt(document.getElementById('f-wh-project').value) || null;
    const manager = document.getElementById('f-wh-manager').value.trim();
    const address = document.getElementById('f-wh-address').value.trim();
    const status = document.getElementById('f-wh-status').value;
    const note = document.getElementById('f-wh-note').value.trim();

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên kho');
        return;
    }
    if (type === 'SITE' && !projectIdSelected) {
        showError('Vui lòng chọn dự án');
        return;
    }

    try {
        const newWh = { 
            code, 
            name, 
            type, 
            projectId: type === 'SITE' ? projectIdSelected : null, 
            manager, 
            address, 
            status, 
            note 
        };
        await api.createWarehouse(newWh);
        closeModal();
        showSuccess('Tạo kho thành công!');
        const project = await api.getProjectById(projectId);
        if (project) {
            await renderProjectModal(project);
        }
    } catch (error) {
        showError('Lỗi khi tạo kho: ' + error.message);
    }
}

async function handleProjectInactivation(projectId, updatedProject) {
    try {
        const allWarehouses = await api.getWarehouses();
        const projectWarehouses = allWarehouses.filter(w => w.projectId === projectId);
        
        if (projectWarehouses.length === 0) {
            return await doUpdateProject(projectId, updatedProject);
        }

        const allInventory = await api.getInventory();
        
        const warehouseInventory = projectWarehouses.map(wh => {
            const invs = allInventory.filter(i => i.warehouseId === wh.id);
            const totalQty = invs.reduce((sum, i) => sum + (i.quantity || 0), 0);
            return {
                ...wh,
                totalQty,
                itemCount: invs.length,
                inventory: invs
            };
        });

        const hasInventory = warehouseInventory.some(wh => wh.totalQty > 0);

        let whListHtml = warehouseInventory.map(wh => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-bottom:1px solid #f0f0f0; cursor:pointer;" onclick="showWarehouseInventoryDetail(${wh.id}, '${wh.name}')">
                <div>
                    <strong>${wh.code}</strong> - ${wh.name}
                    <span class="badge ${wh.status === 'ACTIVE' ? 'badge-status-active' : 'badge-status-inactive'}">${wh.status}</span>
                </div>
                <div>
                    <span style="font-weight:600;">${wh.totalQty.toLocaleString()}</span> đvt
                    <span style="font-size:12px; color:#888;">(${wh.itemCount} loại)</span>
                </div>
            </div>
        `).join('');

        let modalContent = `
            <div style="margin-bottom:12px;">
                <strong>Dự án:</strong> ${updatedProject.name} (${updatedProject.code})
            </div>
            <div style="margin-bottom:12px; color:#e67e22;">
                <i class="fas fa-exclamation-triangle"></i> 
                Bạn đang chuyển dự án sang trạng thái <strong>NGỪNG HOẠT ĐỘNG</strong>.
                Các kho của dự án sẽ được xử lý như sau:
            </div>
            <div style="max-height:300px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:6px; padding:8px; margin-bottom:12px;">
                <div style="font-weight:600; padding:4px 10px; background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                    <span style="flex:1;">Kho</span>
                    <span style="float:right;">Tồn kho</span>
                </div>
                ${whListHtml}
            </div>
        `;

        if (hasInventory) {
            modalContent += `
                <div style="background:#fef9e7; border:1px solid #fecba1; padding:12px; border-radius:8px; margin-bottom:12px;">
                    <i class="fas fa-info-circle" style="color:#b45309;"></i>
                    <strong>Phát hiện tồn kho trong các kho của dự án!</strong>
                    <div style="margin-top:6px; font-size:14px;">
                        Bạn có muốn chuyển toàn bộ vật tư về kho tổng trước khi ngừng hoạt động không?
                    </div>
                    <div style="margin-top:8px;">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="radio" name="transferOption" value="yes" checked> 
                            <span>Chuyển vật tư về kho tổng <span style="color:#888; font-size:12px;">(tự động tạo STO)</span></span>
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-top:4px;">
                            <input type="radio" name="transferOption" value="no"> 
                            <span>Không chuyển, vẫn đổi trạng thái kho</span>
                        </label>
                    </div>
                </div>
            `;
        } else {
            modalContent += `
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; margin-bottom:12px;">
                    <i class="fas fa-check-circle" style="color:#15803d;"></i>
                    <span>Tất cả kho đều trống, có thể ngừng hoạt động ngay.</span>
                </div>
            `;
        }

        modalContent += `
            <div class="modal-actions">
                <button class="btn" onclick="confirmProjectInactivation(${projectId})">
                    <i class="fas fa-check"></i> Xác nhận ngừng hoạt động
                </button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `;

        window._pendingProjectInactivation = {
            projectId,
            updatedProject,
            warehouses: projectWarehouses,
            inventoryData: warehouseInventory
        };

        showModal('Xác nhận ngừng hoạt động dự án', modalContent);

    } catch (error) {
        showError('Lỗi khi xử lý ngừng hoạt động dự án: ' + error.message);
    }
}

function showWarehouseInventoryDetail(warehouseId, warehouseName) {
    const data = window._pendingProjectInactivation?.inventoryData?.find(w => w.id === warehouseId);
    if (!data) {
        showInfo('Không có dữ liệu tồn kho');
        return;
    }
    const items = data.inventory || [];
    if (items.length === 0) {
        showInfo(`Kho ${warehouseName} trống`);
        return;
    }
    let itemsHtml = items.map(inv => {
        const item = window._itemsCache?.find(i => i.id === inv.itemId);
        return `
            <tr>
                <td>${item ? item.code : 'N/A'}</td>
                <td>${item ? item.name : 'N/A'}</td>
                <td>${item ? item.unit : ''}</td>
                <td style="text-align:right;">${inv.quantity || 0}</td>
            </tr>
        `;
    }).join('');
    showModal(`Chi tiết tồn kho - ${warehouseName}`, `
        <div class="table-responsive">
            <table>
                <thead><tr><th>Mã</th><th>Tên</th><th>ĐVT</th><th>Số lượng</th></tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

async function confirmProjectInactivation(projectId) {
    const data = window._pendingProjectInactivation;
    if (!data) {
        showError('Dữ liệu không hợp lệ');
        return;
    }

    const transferOption = document.querySelector('input[name="transferOption"]:checked')?.value || 'no';
    const shouldTransfer = transferOption === 'yes';

    try {
        if (shouldTransfer) {
            const allWarehouses = await api.getWarehouses();
            const centralWarehouses = allWarehouses.filter(w => w.type === 'CENTRAL' && w.status === 'ACTIVE');
            if (centralWarehouses.length === 0) {
                showWarning('Không có kho tổng nào đang hoạt động. Hãy tạo kho tổng trước khi chuyển.');
                return;
            }
            const targetWarehouse = centralWarehouses[0];
            
            closeModal();
            showSuccess(`Vui lòng tạo STO từ các kho của dự án đến kho tổng ${targetWarehouse.code} để chuyển vật tư.`);
            navigateTo('inventory');
            setTimeout(() => {
                switchWarehouseTab('wh-sto');
            }, 300);
            
            await doUpdateProject(projectId, data.updatedProject);
            return;
        }

        const warehouses = data.warehouses;
        for (const wh of warehouses) {
            wh.status = 'INACTIVE';
            await api.updateWarehouse(wh.id, wh);
        }
        await doUpdateProject(projectId, data.updatedProject);
        closeModal();
        showSuccess(`Đã ngừng hoạt động dự án và các kho liên quan.`);
        
        if (currentWhTab === 'wh-list') {
            switchWarehouseTab('wh-list');
        }
    } catch (error) {
        showError('Lỗi khi ngừng hoạt động dự án: ' + error.message);
    }
}

async function doUpdateProject(id, projectData) {
    try {
        await api.updateProject(id, projectData);
        await renderProjects();
        if (projectDetailState.projectId === id) {
            const project = await api.getProjectById(id);
            if (project) {
                await renderProjectModal(project);
            }
        }
        showSuccess(`Cập nhật dự án thành công!`);
    } catch (error) {
        showError('Lỗi khi cập nhật dự án: ' + error.message);
    }
}

// ================================================================
// CÁC HÀM HỖ TRỢ DUYỆT TỪ PROJECT
// ================================================================

window.approvePRFromProject = function(id) {
    if (typeof approvePR === 'function') {
        approvePR(id);
        setTimeout(() => backToProjectList(), 500);
    } else {
        showError('Hàm approvePR chưa được định nghĩa!');
    }
};
window.rejectPRFromProject = function(id) {
    if (typeof rejectPR === 'function') {
        rejectPR(id);
        setTimeout(() => backToProjectList(), 500);
    } else {
        showError('Hàm rejectPR chưa được định nghĩa!');
    }
};
window.approvePOFromProject = function(id) {
    if (typeof approvePO === 'function') {
        approvePO(id);
        setTimeout(() => backToProjectList(), 500);
    } else {
        showError('Hàm approvePO chưa được định nghĩa!');
    }
};
window.rejectPOFromProject = function(id) {
    if (typeof rejectPO === 'function') {
        rejectPO(id);
        setTimeout(() => backToProjectList(), 500);
    } else {
        showError('Hàm rejectPO chưa được định nghĩa!');
    }
};

// ================================================================
// EXPORT
// ================================================================

window.renderProjects = renderProjects;
window.viewProject = viewProject;
window.editProject = editProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.saveProject = saveProject;
window.showCreateProjectModal = showCreateProjectModal;
window.viewPRInline = viewPRInline;
window.viewPOInline = viewPOInline;
window.backToProjectList = backToProjectList;
window.showChangeWhStatusModal = showChangeWhStatusModal;
window.confirmChangeWhStatus = confirmChangeWhStatus;

// Project Members exports
window.refreshProjectMembers = refreshProjectMembers;
window.showAddProjectMemberModal = showAddProjectMemberModal;
window.confirmLeaveProject = confirmLeaveProject;
window.confirmLeaveProjectAction = confirmLeaveProjectAction;
window.confirmDeleteProjectMember = confirmDeleteProjectMember;
window.handleProjectInactivation = handleProjectInactivation;
window.confirmProjectInactivation = confirmProjectInactivation;
window.showWarehouseInventoryDetail = showWarehouseInventoryDetail;
window.doUpdateProject = doUpdateProject;
window.resetProjectsFilters = resetProjectsFilters;

console.log('✅ Projects module updated with Project Members tab and permission check for create button.');