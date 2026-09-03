// ================================================================
// ADMIN DEPARTMENTS - Quản lý phòng ban và Đội/Nhóm (Team)
// ================================================================

// ================================================================
// PHẦN 1: RENDER TAB CHÍNH
// ================================================================

function renderDepartmentsTab() {
    const departments = getDepartmentsData();
    const users = getUsersData();

    // Lọc chỉ hiển thị department gốc (parentId = null)
    const rootDepts = departments.filter(d => !d.parentId);

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <div class="filter-bar" style="flex:1; margin:0;">
                <input type="text" id="dept-filter" placeholder="Tìm theo mã hoặc tên..." style="flex:1;" />
                <button class="btn btn-sm" onclick="renderAdminUI('departments')"><i class="fas fa-search"></i></button>
            </div>
            <button class="btn" onclick="showAddDepartmentModal()"><i class="fas fa-plus"></i> Thêm phòng ban</button>
        </div>
        
        <!-- ✅ TẠO SUB-TAB CHO TEAM -->
        <div class="tab-bar" style="margin-bottom:16px;">
            <div class="tab active" onclick="switchDeptSubTab('list')" data-subtab="list">🏢 Phòng ban</div>
            <div class="tab" onclick="switchDeptSubTab('teams')" data-subtab="teams">👥 Đội/Nhóm</div>
        </div>
        
        <div id="dept-sub-content">
    `;

    // Mặc định hiển thị danh sách phòng ban
    html += renderDepartmentList(rootDepts, departments, users);
    html += `</div>`;

    return html;
}

// ================================================================
// PHẦN 2: RENDER DANH SÁCH PHÒNG BAN
// ================================================================

function renderDepartmentList(rootDepts, departments, users) {
    const filter = document.getElementById('dept-filter')?.value?.toLowerCase() || '';
    const filtered = rootDepts.filter(d =>
        (d.code || '').toLowerCase().includes(filter) || (d.name || '').toLowerCase().includes(filter)
    );

    let html = `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:16px;">`;

    if (!filtered.length) {
        html += `<div style="grid-column:1/-1; text-align:center; color:#999;">Chưa có phòng ban nào</div>`;
    }

    for (const d of filtered) {
        html += renderDepartmentCard(d, departments, users);
        // Render sub-departments
        const subDepts = departments.filter(sub => sub.parentId === d.id);
        for (const sub of subDepts) {
            if ((sub.code || '').toLowerCase().includes(filter) || (sub.name || '').toLowerCase().includes(filter)) {
                html += renderDepartmentCard(sub, departments, users, true);
            }
        }
    }

    html += `</div>`;
    return html;
}

function renderDepartmentCard(dept, departments, users, isSub = false) {
    const members = users.filter(u => u.departmentId === dept.id);
    const manager = users.find(u => u.id === dept.managerId);
    const managerName = manager ? manager.name : (dept.managerName || 'Chưa có');
    const permissionCount = getDepartmentPermissionCount(dept.id);

    const indent = isSub ? 'margin-left: 32px; border-left: 3px solid #3498db;' : '';

    return `
        <div style="background:white; border-radius:12px; padding:16px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.04); ${indent}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="margin:0; color:#1a3c6e;">${dept.name} ${isSub ? '<span class="badge badge-info">Sub</span>' : ''}</h4>
                    <div style="font-size:13px; color:#888; margin-top:4px;">
                        <span class="badge badge-info">${dept.code}</span>
                        <span>Trưởng phòng: <strong>${managerName}</strong></span>
                        ${isSub ? `<span> | Parent: ${getDepartmentName(dept.parentId)}</span>` : ''}
                    </div>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn btn-info btn-sm" onclick="viewDepartmentDetail(${dept.id})" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-warning btn-sm" onclick="editDepartment(${dept.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDepartment(${dept.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div style="margin-top:12px; border-top:1px solid #f0f0f0; padding-top:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:600; font-size:14px;">👥 Thành viên (${members.length})</span>
                    <div style="display:flex; gap:8px;">
                        <span style="font-size:13px; color:#888; cursor:pointer;" onclick="viewDepartmentDetail(${dept.id})">
                            🔑 Quyền: <strong style="color:#1a3c6e;">${permissionCount}</strong>
                        </span>
                        <button class="btn btn-sm btn-info" onclick="showAddUserToDepartment(${dept.id})"><i class="fas fa-plus"></i> Thêm</button>
                    </div>
                </div>
                ${members.length === 0 ? '<div style="color:#999; font-size:13px;">Chưa có thành viên</div>' : ''}
                ${members.slice(0, 5).map(m => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px; cursor:pointer;" onclick="viewUserFromDept(${m.id})">
                        <div>
                            <span style="font-weight:500;">${m.name}</span>
                            <span style="font-size:12px; color:#888;">(${m.position || '--'})</span>
                            <span class="badge badge-draft" style="font-size:10px;">${m.role}</span>
                        </div>
                        <div>
                            <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); editUserInDept(${m.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); removeUserFromDept(${m.id})"><i class="fas fa-user-minus"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${members.length > 5 ? `<div style="color:#888; font-size:12px; margin-top:4px;">... và ${members.length - 5} thành viên khác</div>` : ''}
            </div>
        </div>
    `;
}

// ================================================================
// PHẦN 3: QUẢN LÝ TEAM (ĐỘI/NHÓM) - SUB-TAB MỚI
// ================================================================

let _teamsCache = [];
let _teamMembersCache = {};

/**
 * Hàm chuyển đổi giữa các sub-tab
 */
function switchDeptSubTab(tab) {
    // Cập nhật active tab
    document.querySelectorAll('#dept-sub-content .tab-bar .tab').forEach(t => t.classList.remove('active'));
    const tabEl = document.querySelector(`#dept-sub-content .tab-bar .tab[data-subtab="${tab}"]`);
    if (tabEl) tabEl.classList.add('active');

    if (tab === 'list') {
        // Render lại danh sách phòng ban
        const departments = getDepartmentsData();
        const users = getUsersData();
        const rootDepts = departments.filter(d => !d.parentId);
        const container = document.getElementById('dept-sub-content');
        if (container) {
            container.innerHTML = renderDepartmentList(rootDepts, departments, users);
        }
    } else if (tab === 'teams') {
        renderTeamsTab();
    }
}

/**
 * Render tab quản lý Team
 */
async function renderTeamsTab() {
    const container = document.getElementById('dept-sub-content');
    if (!container) return;

    try {
        // Lấy danh sách team từ API
        const teams = await api.getTeams();
        _teamsCache = teams || [];
        const users = getUsersData();

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; gap:8px; align-items:center;">
                    <h3 style="margin:0;">👥 Quản lý Đội/Nhóm</h3>
                    <span style="font-size:13px; color:#888;">(${teams.length} đội/nhóm)</span>
                </div>
                <button class="btn" onclick="showAddTeamModal()"><i class="fas fa-plus"></i> Thêm đội/nhóm</button>
            </div>
            <div style="font-size:13px; color:#888; margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
                <i class="fas fa-info-circle"></i> 
                <strong>Đội/Nhóm:</strong> Là nhóm người dùng từ nhiều phòng ban khác nhau. 
                Mỗi user có thể tham gia nhiều team, nhưng chỉ thuộc 1 phòng ban.
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
        `;

        if (teams.length === 0) {
            html += `<div style="grid-column:1/-1; text-align:center; color:#999;">Chưa có đội/nhóm nào</div>`;
        }

        for (const team of teams) {
            // Lấy thành viên của team
            let members = [];
            try {
                const memberData = await api.getTeamMembers(team.id);
                members = memberData || [];
                _teamMembersCache[team.id] = members;
            } catch (e) {
                console.warn('Không lấy được thành viên của team:', e);
            }

            const activeMembers = members.filter(m => !m.leftAt);
            const inactiveMembers = members.filter(m => m.leftAt);

            html += `
                <div style="background:white; border-radius:12px; padding:16px; border:1px solid #e2e8f0; box-shadow:0 2px 4px rgba(0,0,0,0.04);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h4 style="margin:0; color:#1a3c6e;">${team.name}</h4>
                            <div style="font-size:13px; color:#888; margin-top:4px;">
                                <span class="badge badge-info">${activeMembers.length} thành viên</span>
                                ${inactiveMembers.length > 0 ? `<span class="badge badge-draft">${inactiveMembers.length} đã rời</span>` : ''}
                            </div>
                            ${team.description ? `<div style="font-size:13px; color:#666; margin-top:4px;">${team.description}</div>` : ''}
                        </div>
                        <div style="display:flex; gap:4px;">
                            <button class="btn btn-info btn-sm" onclick="viewTeamDetail(${team.id})" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-warning btn-sm" onclick="editTeam(${team.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="deleteTeam(${team.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div style="margin-top:12px; border-top:1px solid #f0f0f0; padding-top:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-weight:600; font-size:14px;">👤 Thành viên (${activeMembers.length})</span>
                            <button class="btn btn-sm btn-success" onclick="showAddTeamMemberModal(${team.id})"><i class="fas fa-plus"></i> Thêm</button>
                        </div>
                        ${activeMembers.length === 0 ? '<div style="color:#999; font-size:13px;">Chưa có thành viên</div>' : ''}
                        ${activeMembers.slice(0, 5).map(m => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px;">
                                <div>
                                    <span style="font-weight:500;">${m.userName || 'N/A'}</span>
                                    <span style="font-size:12px; color:#888;">${m.role || 'Thành viên'}</span>
                                    ${m.userPosition ? `<span style="font-size:12px; color:#888;">(${m.userPosition})</span>` : ''}
                                </div>
                                <button class="btn btn-danger btn-sm" onclick="removeTeamMember(${team.id}, ${m.userId})" title="Xóa khỏi team">
                                    <i class="fas fa-user-minus"></i>
                                </button>
                            </div>
                        `).join('')}
                        ${activeMembers.length > 5 ? `<div style="color:#888; font-size:12px; margin-top:4px;">... và ${activeMembers.length - 5} thành viên khác</div>` : ''}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    } catch (error) {
        console.error('renderTeamsTab error:', error);
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#e74c3c;">
            <i class="fas fa-exclamation-triangle"></i> Lỗi tải danh sách đội/nhóm: ${error.message}
        </div>`;
    }
}

// ================================================================
// PHẦN 4: CRUD TEAM
// ================================================================

/**
 * Hiển thị modal thêm team
 */
function showAddTeamModal() {
    showModal('Thêm đội/nhóm mới', `
        <div class="form-group">
            <label>Tên đội/nhóm <span style="color:red;">*</span></label>
            <input id="f-team-name" placeholder="Ví dụ: Đội thi công 1" required>
        </div>
        <div class="form-group">
            <label>Mô tả</label>
            <textarea id="f-team-desc" rows="2" placeholder="Mô tả về đội/nhóm..."></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveTeam()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

/**
 * Lưu team mới
 */
async function saveTeam() {
    const name = document.getElementById('f-team-name').value.trim();
    const description = document.getElementById('f-team-desc').value.trim();

    if (!name) {
        showError('Vui lòng nhập tên đội/nhóm');
        return;
    }

    try {
        await api.createTeam({ name, description });
        closeModal();
        await renderTeamsTab();
        showSuccess('Thêm đội/nhóm thành công!');
    } catch (error) {
        showError('Lỗi khi thêm đội/nhóm: ' + error.message);
    }
}

/**
 * Sửa team
 */
async function editTeam(id) {
    const team = _teamsCache.find(t => t.id === id);
    if (!team) {
        showError('Không tìm thấy đội/nhóm!');
        return;
    }

    showModal('Sửa đội/nhóm', `
        <div class="form-group">
            <label>Tên đội/nhóm <span style="color:red;">*</span></label>
            <input id="f-team-name" value="${team.name}" required>
        </div>
        <div class="form-group">
            <label>Mô tả</label>
            <textarea id="f-team-desc" rows="2">${team.description || ''}</textarea>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="updateTeam(${id})"><i class="fas fa-save"></i> Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

/**
 * Cập nhật team
 */
async function updateTeam(id) {
    const name = document.getElementById('f-team-name').value.trim();
    const description = document.getElementById('f-team-desc').value.trim();

    if (!name) {
        showError('Vui lòng nhập tên đội/nhóm');
        return;
    }

    try {
        await api.updateTeam(id, { name, description });
        closeModal();
        await renderTeamsTab();
        showSuccess('Cập nhật đội/nhóm thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật đội/nhóm: ' + error.message);
    }
}

/**
 * Xóa team
 */
async function deleteTeam(id) {
    const team = _teamsCache.find(t => t.id === id);
    if (!team) {
        showError('Không tìm thấy đội/nhóm!');
        return;
    }

    if (!confirm(`Xóa đội/nhóm "${team.name}"? (Tất cả thành viên sẽ bị xóa khỏi team)`)) return;

    try {
        await api.deleteTeam(id);
        await renderTeamsTab();
        showSuccess('Xóa đội/nhóm thành công!');
    } catch (error) {
        showError('Lỗi khi xóa đội/nhóm: ' + error.message);
    }
}

/**
 * Xem chi tiết team (modal)
 */
async function viewTeamDetail(id) {
    const team = _teamsCache.find(t => t.id === id);
    if (!team) {
        showError('Không tìm thấy đội/nhóm!');
        return;
    }

    let members = _teamMembersCache[id] || [];
    if (!members.length) {
        try {
            members = await api.getTeamMembers(id, true);
            _teamMembersCache[id] = members;
        } catch (e) {
            console.warn('Không lấy được thành viên:', e);
        }
    }

    const activeMembers = members.filter(m => !m.leftAt);
    const inactiveMembers = members.filter(m => m.leftAt);

    let membersHtml = '';
    if (activeMembers.length === 0) {
        membersHtml = '<p style="color:#999;">Chưa có thành viên nào</p>';
    } else {
        membersHtml = activeMembers.map(m => `
            <div style="display:flex; justify-content:space-between; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px;">
                <div>
                    <strong>${m.userName || 'N/A'}</strong>
                    <span style="color:#888; margin-left:8px;">${m.role || 'Thành viên'}</span>
                    ${m.userPosition ? `<span style="color:#888; margin-left:8px;">(${m.userPosition})</span>` : ''}
                    <span style="color:#999; font-size:12px; margin-left:8px;">Tham gia: ${formatDate(m.joinedAt)}</span>
                </div>
            </div>
        `).join('');
    }

    let inactiveHtml = '';
    if (inactiveMembers.length > 0) {
        inactiveHtml = `
            <details style="margin-top:8px;">
                <summary style="cursor:pointer; color:#888; font-size:13px;">📋 Đã rời (${inactiveMembers.length})</summary>
                ${inactiveMembers.map(m => `
                    <div style="display:flex; justify-content:space-between; padding:4px 8px; margin-bottom:2px; background:#f5f5f5; border-radius:4px; font-size:13px;">
                        <span>${m.userName || 'N/A'} (${m.role || 'Thành viên'})</span>
                        <span style="color:#999;">Rời: ${formatDate(m.leftAt)}</span>
                    </div>
                `).join('')}
            </details>
        `;
    }

    showModal(`Chi tiết đội/nhóm: ${team.name}`, `
        <div class="detail-grid">
            <div><span class="label">Tên:</span> <span class="value">${team.name}</span></div>
            <div><span class="label">Mô tả:</span> <span class="value">${team.description || '--'}</span></div>
            <div><span class="label">Thành viên:</span> <span class="value">${activeMembers.length} (đang hoạt động) / ${members.length} (tổng)</span></div>
        </div>
        <div style="margin-top:12px;">
            <h4>👥 Danh sách thành viên</h4>
            ${membersHtml}
            ${inactiveHtml}
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

// ================================================================
// PHẦN 5: QUẢN LÝ THÀNH VIÊN TRONG TEAM
// ================================================================

/**
 * Hiển thị modal thêm thành viên vào team
 */
async function showAddTeamMemberModal(teamId) {
    const team = _teamsCache.find(t => t.id === teamId);
    if (!team) {
        showError('Không tìm thấy đội/nhóm!');
        return;
    }

    // Lấy danh sách user chưa tham gia team này (hoặc đã rời)
    const users = getUsersData();
    const existingMembers = _teamMembersCache[teamId] || [];
    const existingUserIds = existingMembers.map(m => m.userId);

    const availableUsers = users.filter(u => !existingUserIds.includes(u.id));

    if (availableUsers.length === 0) {
        showWarning('Tất cả user đã có trong team này.');
        return;
    }

    const userOpts = availableUsers.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

    showModal(`Thêm thành viên vào ${team.name}`, `
        <div class="form-group">
            <label>Chọn người dùng <span style="color:red;">*</span></label>
            <select id="f-team-member-user">${userOpts}</select>
        </div>
        <div class="form-group">
            <label>Vai trò trong team</label>
            <input id="f-team-member-role" placeholder="VD: Trưởng nhóm, Thành viên..." value="Thành viên">
        </div>
        <div class="form-group">
            <label>Ngày tham gia</label>
            <input id="f-team-member-joined" type="date" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveTeamMember(${teamId})"><i class="fas fa-save"></i> Thêm</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

/**
 * Lưu thành viên vào team
 */
async function saveTeamMember(teamId) {
    const userId = parseInt(document.getElementById('f-team-member-user').value);
    const role = document.getElementById('f-team-member-role').value.trim() || 'Thành viên';
    const joinedAt = document.getElementById('f-team-member-joined').value;

    if (!userId) {
        showError('Vui lòng chọn người dùng');
        return;
    }

    try {
        await api.addTeamMember(teamId, userId, role, joinedAt);
        closeModal();
        await renderTeamsTab();
        showSuccess('Thêm thành viên thành công!');
    } catch (error) {
        showError('Lỗi khi thêm thành viên: ' + error.message);
    }
}

/**
 * Xóa thành viên khỏi team (set left_at)
 */
async function removeTeamMember(teamId, userId) {
    if (!confirm('Xóa thành viên này khỏi team?')) return;

    try {
        await api.removeTeamMember(teamId, userId);
        await renderTeamsTab();
        showSuccess('Đã xóa thành viên khỏi team');
    } catch (error) {
        showError('Lỗi khi xóa thành viên: ' + error.message);
    }
}

// ================================================================
// PHẦN 6: HÀM TIỆN ÍCH (DEPARTMENT)
// ================================================================

function getDepartmentPermissionCount(deptId) {
    const perms = getAdminPermissions();
    if (Array.isArray(perms)) {
        return perms.filter(p => p.departmentId === deptId && p.enabled).length;
    }
    let count = 0;
    Object.keys(perms).forEach(role => {
        const roleData = perms[role];
        if (typeof roleData === 'object') {
            Object.keys(roleData).forEach(key => {
                if (!isNaN(key) && parseInt(key) === deptId) {
                    const deptPerms = roleData[key];
                    if (typeof deptPerms === 'object') {
                        count += Object.keys(deptPerms).filter(pk => deptPerms[pk]).length;
                    }
                }
            });
        }
    });
    return count;
}

function getDepartmentName(id) {
    const dept = getDepartmentsData().find(d => d.id === id);
    return dept ? dept.name : 'N/A';
}

// ===== VIEW DEPARTMENT DETAIL (Modal) =====
async function viewDepartmentDetail(id) {
    const departments = getDepartmentsData();
    const dept = departments.find(d => d.id === id);
    if (!dept) { showError('Không tìm thấy phòng ban!'); return; }

    const users = getUsersData();
    const members = users.filter(u => u.departmentId === id);
    const subDepts = departments.filter(d => d.parentId === id);
    const manager = users.find(u => u.id === dept.managerId);
    const permissionCount = getDepartmentPermissionCount(id);

    const membersHtml = members.length === 0 ? '<p style="color:#999;">Chưa có thành viên</p>' :
        members.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; margin-bottom:4px; background:#f8fafc; border-radius:6px; cursor:pointer;" onclick="viewUserFromDept(${m.id})">
                <span style="font-weight:500;">${m.name}</span>
                <span style="font-size:12px; color:#888;">${m.position || '--'}</span>
                <span class="badge badge-draft" style="font-size:10px;">${m.role}</span>
                <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); editUserInDept(${m.id})"><i class="fas fa-edit"></i></button>
            </div>
        `).join('');

    const subHtml = subDepts.length === 0 ? '<p style="color:#999;">Chưa có sub-department</p>' :
        subDepts.map(s => `<div style="padding:4px 8px; background:#f0f4f8; border-radius:4px; margin-bottom:4px;">${s.code} - ${s.name}</div>`).join('');

    showModal('Chi tiết phòng ban', `
        <div class="detail-grid">
            <div><span class="label">Mã:</span> <span class="value">${dept.code}</span></div>
            <div><span class="label">Tên:</span> <span class="value">${dept.name}</span></div>
            <div><span class="label">Trưởng phòng:</span> <span class="value">${manager ? manager.name : (dept.managerName || 'Chưa có')}</span></div>
            <div><span class="label">Parent:</span> <span class="value">${dept.parentId ? getDepartmentName(dept.parentId) : '--'}</span></div>
            <div><span class="label" style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); switchAdminTab('department-permissions')">🔑 Số quyền:</span> <span class="value">${permissionCount}</span></div>
            <div><span class="label">Số thành viên:</span> <span class="value">${members.length}</span></div>
        </div>
        <div style="margin-top:12px;">
            <h4>👥 Thành viên</h4>
            <div style="max-height:200px; overflow-y:auto;">${membersHtml}</div>
        </div>
        <div style="margin-top:12px;">
            <h4>📂 Sub-department</h4>
            <div>${subHtml}</div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

// ================================================================
// PHẦN 7: CÁC HÀM HỖ TRỢ USER TRONG DEPARTMENT
// ================================================================

function viewUserFromDept(userId) {
    if (typeof viewUser === 'function') {
        viewUser(userId);
    } else {
        showError('Hàm viewUser chưa được định nghĩa!');
    }
}

function editUserInDept(userId) {
    if (typeof editUser === 'function') {
        editUser(userId);
    } else {
        showError('Hàm editUser chưa được định nghĩa!');
    }
}

// ===== SHOW ADD SUB-DEPARTMENT =====
function showAddSubDepartment(parentId) {
    const parent = getDepartmentsData().find(d => d.id === parentId);
    if (!parent) { showError('Không tìm thấy phòng ban cha!'); return; }

    showModal(`Thêm Sub-department cho ${parent.name}`, `
        <div class="form-group">
            <label>Mã phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-code" placeholder="Ví dụ: TEAM1" required>
        </div>
        <div class="form-group">
            <label>Tên phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-name" placeholder="Ví dụ: Đội thi công 1" required>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager">
                <option value="">-- Chọn --</option>
                ${getUsersData().map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('')}
            </select>
        </div>
        <input type="hidden" id="f-dept-parent" value="${parentId}">
        <div class="modal-actions">
            <button class="btn" onclick="saveSubDepartment()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveSubDepartment() {
    const code = document.getElementById('f-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('f-dept-name').value.trim();
    const managerId = parseInt(document.getElementById('f-dept-manager').value) || null;
    const parentId = parseInt(document.getElementById('f-dept-parent').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const newDept = { code, name, managerId, parentId };
        await api.createDepartment(newDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Thêm sub-department ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm sub-department: ' + error.message);
    }
}

// ===== SHOW ADD DEPARTMENT (root) =====
function showAddDepartmentModal() {
    const users = getUsersData();
    const userOpts = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
    const parentOpts = getDepartmentsData().map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');

    showModal('Thêm phòng ban mới', `
        <div class="form-group">
            <label>Mã phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-code" placeholder="Ví dụ: HR, FINANCE..." required>
        </div>
        <div class="form-group">
            <label>Tên phòng ban <span style="color:red;">*</span></label>
            <input id="f-dept-name" placeholder="Ví dụ: Phòng Nhân sự" required>
        </div>
        <div class="form-group">
            <label>Phòng ban cha (để trống nếu là root)</label>
            <select id="f-dept-parent">
                <option value="">-- Chọn --</option>
                ${parentOpts}
            </select>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager">
                <option value="">-- Chọn --</option>
                ${userOpts}
            </select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveDepartment()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveDepartment() {
    const code = document.getElementById('f-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('f-dept-name').value.trim();
    const managerId = parseInt(document.getElementById('f-dept-manager').value) || null;
    const parentId = parseInt(document.getElementById('f-dept-parent').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const newDept = { code, name, managerId, parentId };
        await api.createDepartment(newDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Thêm phòng ban ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm phòng ban: ' + error.message);
    }
}

// ===== EDIT DEPARTMENT =====
async function editDepartment(id) {
    const departments = getDepartmentsData();
    const dept = departments.find(d => d.id === id);
    if (!dept) { showError('Không tìm thấy phòng ban!'); return; }

    const users = getUsersData();
    const userOpts = users.map(u =>
        `<option value="${u.id}" ${u.id === dept.managerId ? 'selected' : ''}>${u.name} (${u.email})</option>`
    ).join('');
    const parentOpts = departments
        .filter(d => d.id !== id)
        .map(d => `<option value="${d.id}" ${d.id === dept.parentId ? 'selected' : ''}>${d.code} - ${d.name}</option>`).join('');

    showModal('Sửa phòng ban', `
        <div class="form-group">
            <label>Mã phòng ban</label>
            <input id="f-dept-code" value="${dept.code}" required>
        </div>
        <div class="form-group">
            <label>Tên phòng ban</label>
            <input id="f-dept-name" value="${dept.name}" required>
        </div>
        <div class="form-group">
            <label>Phòng ban cha</label>
            <select id="f-dept-parent"><option value="">-- Không có --</option>${parentOpts}</select>
        </div>
        <div class="form-group">
            <label>Trưởng phòng (quản lý)</label>
            <select id="f-dept-manager"><option value="">-- Chọn --</option>${userOpts}</select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="updateDepartment(${id})"><i class="fas fa-save"></i> Cập nhật</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function updateDepartment(id) {
    const code = document.getElementById('f-dept-code').value.trim().toUpperCase();
    const name = document.getElementById('f-dept-name').value.trim();
    const managerId = parseInt(document.getElementById('f-dept-manager').value) || null;
    const parentId = parseInt(document.getElementById('f-dept-parent').value) || null;

    if (!code || !name) {
        showError('Vui lòng nhập mã và tên phòng ban');
        return;
    }

    try {
        const updatedDept = { code, name, managerId, parentId };
        await api.updateDepartment(id, updatedDept);
        closeModal();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess('Cập nhật phòng ban thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật phòng ban: ' + error.message);
    }
}

async function deleteDepartment(id) {
    if (!confirm('Xóa phòng ban này? Các user thuộc phòng ban sẽ bị xóa phòng ban.')) return;

    try {
        await api.deleteDepartment(id);
        await refreshAdminDepartments();
        await refreshAdminUsers();
        renderAdminUI('departments');
        showSuccess('Xóa phòng ban thành công!');
    } catch (error) {
        showError('Lỗi khi xóa phòng ban: ' + error.message);
    }
}

// ===== ADD/REMOVE USER FROM DEPARTMENT =====
function showAddUserToDepartment(deptId) {
    const users = getUsersData();
    const dept = getDepartmentsData().find(d => d.id === deptId);
    if (!dept) { showError('Không tìm thấy phòng ban'); return; }

    const availableUsers = users.filter(u => !u.departmentId);
    if (!availableUsers.length) {
        showWarning('Không có user nào chưa có phòng ban. Vui lòng tạo user mới.');
        return;
    }

    const userOpts = availableUsers.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

    showModal(`Thêm thành viên vào ${dept.name}`, `
        <div class="form-group">
            <label>Chọn người dùng</label>
            <select id="f-add-user-dept">${userOpts}</select>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="confirmAddUserToDept(${deptId})">Thêm</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function confirmAddUserToDept(deptId) {
    const userId = parseInt(document.getElementById('f-add-user-dept').value);
    if (!userId) { showError('Vui lòng chọn user'); return; }

    try {
        const users = await api.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) { showError('Không tìm thấy user'); return; }

        user.departmentId = deptId;
        await api.updateUser(userId, user);
        closeModal();
        await refreshAdminUsers();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Đã thêm ${user.name} vào phòng ban`);
    } catch (error) {
        showError('Lỗi khi thêm user vào phòng ban: ' + error.message);
    }
}

async function removeUserFromDept(userId) {
    if (!confirm('Xóa user khỏi phòng ban này?')) return;

    try {
        const users = await api.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) { showError('Không tìm thấy user'); return; }

        user.departmentId = null;
        await api.updateUser(userId, user);
        await refreshAdminUsers();
        await refreshAdminDepartments();
        renderAdminUI('departments');
        showSuccess(`Đã xóa ${user.name} khỏi phòng ban`);
    } catch (error) {
        showError('Lỗi khi xóa user khỏi phòng ban: ' + error.message);
    }
}

// ================================================================
// EXPORT
// ================================================================

window.renderDepartmentsTab = renderDepartmentsTab;
window.viewDepartmentDetail = viewDepartmentDetail;
window.viewUserFromDept = viewUserFromDept;
window.showAddDepartmentModal = showAddDepartmentModal;
window.saveDepartment = saveDepartment;
window.editDepartment = editDepartment;
window.updateDepartment = updateDepartment;
window.deleteDepartment = deleteDepartment;
window.showAddUserToDepartment = showAddUserToDepartment;
window.confirmAddUserToDept = confirmAddUserToDept;
window.editUserInDept = editUserInDept;
window.removeUserFromDept = removeUserFromDept;
window.showAddSubDepartment = showAddSubDepartment;
window.saveSubDepartment = saveSubDepartment;
window.getDepartmentPermissionCount = getDepartmentPermissionCount;

// Team exports
window.switchDeptSubTab = switchDeptSubTab;
window.renderTeamsTab = renderTeamsTab;
window.showAddTeamModal = showAddTeamModal;
window.saveTeam = saveTeam;
window.editTeam = editTeam;
window.updateTeam = updateTeam;
window.deleteTeam = deleteTeam;
window.viewTeamDetail = viewTeamDetail;
window.showAddTeamMemberModal = showAddTeamMemberModal;
window.saveTeamMember = saveTeamMember;
window.removeTeamMember = removeTeamMember;

console.log('✅ Admin Departments module updated with Teams support.');