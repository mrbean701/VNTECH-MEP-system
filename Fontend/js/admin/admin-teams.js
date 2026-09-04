// ================================================================
// ADMIN TEAMS - Quản lý Đội/Nhóm (Tab riêng)
// ================================================================

let _teamsCache = [];
let _teamMembersCache = {};

// ====== RENDER TAB TEAMS ======

async function renderTeamsTab() {
    try {
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
        `;

        if (teams.length === 0) {
            html += `
                <div style="padding:30px; text-align:center; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                    <i class="fas fa-users" style="font-size:40px; color:#ccc; display:block; margin-bottom:12px;"></i>
                    <div style="font-size:16px; color:#666;">Chưa có đội/nhóm nào</div>
                    <div style="font-size:13px; color:#999; margin-top:4px;">Bấm "Thêm đội/nhóm" để tạo mới.</div>
                </div>
            `;
        } else {
            html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap:16px;">`;

            for (const team of teams) {
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
        }

        const container = document.getElementById('admin-tab-content');
        if (container) container.innerHTML = html;
    } catch (error) {
        console.error('renderTeamsTab error:', error);
        const container = document.getElementById('admin-tab-content');
        if (container) {
            container.innerHTML = `<div style="padding:20px; text-align:center; color:#e74c3c;">
                <i class="fas fa-exclamation-triangle"></i> Lỗi tải danh sách đội/nhóm: ${error.message}
            </div>`;
        }
    }
}

// ====== CRUD TEAM ======

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

// ====== VIEW TEAM DETAIL ======

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

// ====== QUẢN LÝ THÀNH VIÊN TRONG TEAM ======

async function showAddTeamMemberModal(teamId) {
    const team = _teamsCache.find(t => t.id === teamId);
    if (!team) {
        showError('Không tìm thấy đội/nhóm!');
        return;
    }

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

// ====== EXPORT ======

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

console.log('✅ Admin Teams module loaded successfully.');