// ================================================================
// ADMIN DEPARTMENT PERMISSIONS - Phân quyền module-action theo phòng ban
// Layout: Quyền theo dòng, Phòng ban theo cột, nhóm theo module
// ================================================================

function renderDepartmentPermissionsTab() {
    const departments = getDepartmentsData();
    const moduleActions = getModuleActions();
    const modules = Object.keys(moduleActions);

    if (!departments || departments.length === 0) {
        return `
            <div style="padding:20px; text-align:center; color:#999; background:#f8fafc; border-radius:8px;">
                <i class="fas fa-info-circle"></i> Vui lòng tạo phòng ban trước.
            </div>
        `;
    }

    // Xây dựng header: các phòng ban
    let headerHtml = '';
    departments.forEach(dept => {
        headerHtml += `
            <th style="text-align:center; min-width:100px; padding:6px 8px; background:#f8fafc; border-right:1px solid #e2e8f0; position:sticky; top:0; z-index:2;">
                <div style="font-weight:600; font-size:13px;">${dept.code}</div>
                <div style="font-size:11px; color:#888;">${dept.name}</div>
            </th>
        `;
    });

    // Tạo bảng
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">🏢 Phân quyền phòng ban (module-action)</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-sm" onclick="setAllDeptPermissions(true)"><i class="fas fa-check-double"></i> Chọn tất cả</button>
                <button class="btn btn-sm btn-danger" onclick="setAllDeptPermissions(false)"><i class="fas fa-times"></i> Bỏ chọn</button>
                <button class="btn btn-sm btn-success" onclick="saveDepartmentPermissions()"><i class="fas fa-save"></i> Lưu</button>
            </div>
        </div>
        <div style="font-size:13px; color:#888; margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px;">
            <i class="fas fa-info-circle"></i> 
            Cấp quyền cho từng phòng ban theo module và action.
        </div>
        <div class="table-responsive" style="max-height:600px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px;">
            <table style="min-width:800px; font-size:13px; border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="position:sticky; left:0; background:#f8fafc; z-index:3; min-width:180px; border-right:2px solid #d1d5db; padding:6px 12px;">
                            Quyền / Module
                        </th>
                        ${headerHtml}
                    </tr>
                </thead>
                <tbody>
    `;

    // Duyệt từng module
    modules.forEach(module => {
        const moduleLabel = getModuleLabel(module);
        const actions = moduleActions[module];

        // Hàng tiêu đề module (gộp)
        html += `
            <tr style="background:#e5e7eb; font-weight:600; cursor:pointer;" onclick="toggleModuleForAllDepts('${module}')" title="Click để toggle tất cả quyền của module này cho tất cả phòng ban">
                <td style="position:sticky; left:0; background:#e5e7eb; z-index:2; border-right:2px solid #d1d5db; padding:6px 12px; font-size:14px; color:#1a3c6e;">
                    📁 ${moduleLabel}
                    <span style="font-size:11px; font-weight:400; color:#888; margin-left:8px;">(click toggle)</span>
                </td>
                ${departments.map(dept => {
                    const deptPerms = getDepartmentPermissionMap(dept.id);
                    const count = actions.filter(action => deptPerms[`${module}.${action}`] === true).length;
                    return `<td style="text-align:center; font-size:12px; color:#888; padding:4px;">${count}/${actions.length}</td>`;
                }).join('')}
            </tr>
        `;

        // Hàng chi tiết cho từng action
        actions.forEach(action => {
            const key = `${module}.${action}`;
            const actionLabel = getActionLabel(action);

            html += `
                <tr>
                    <td style="position:sticky; left:0; background:white; z-index:2; border-right:2px solid #d1d5db; padding:4px 12px; padding-left:28px; font-size:12px;">
                        ${actionLabel}
                    </td>
                    ${departments.map(dept => {
                        const deptPerms = getDepartmentPermissionMap(dept.id);
                        const checked = deptPerms[key] === true;
                        return `
                            <td style="text-align:center; padding:4px;">
                                <input type="checkbox" class="dept-perm-checkbox" data-dept="${dept.id}" data-perm="${key}" ${checked ? 'checked' : ''} style="width:15px; height:15px; cursor:pointer; accent-color:#1a3c6e;">
                            </td>
                        `;
                    }).join('')}
                </tr>
            `;
        });

        // Dòng trống phân cách giữa các module
        html += `
            <tr style="height:8px; background:transparent;">
                <td colspan="${departments.length + 1}" style="border-bottom:2px solid #e5e7eb;"></td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px; font-size:13px; color:#888; display:flex; gap:20px; flex-wrap:wrap; padding:8px 0; border-top:1px solid #e2e8f0;">
            <span><i class="fas fa-info-circle"></i> <strong>Chú thích:</strong></span>
            <span>📁 Click vào tên module để toggle tất cả quyền của module đó cho tất cả phòng ban.</span>
            <span>✅ Quyền được cấp cho toàn bộ phòng ban.</span>
            <span>⬜ Chưa được cấp.</span>
        </div>
    `;

    return html;
}

// Helper: lấy map quyền của department
function getDepartmentPermissionMap(deptId) {
    console.log('getDepartmentPermissionMap called with deptId:', deptId);
    console.log('_adminPermissions:', _adminPermissions);
    const key = `dept_${deptId}`;
    if (!window._deptPermMap) {
        window._deptPermMap = {};
        const perms = _adminPermissions || {};
        
        // Nếu perms là mảng (từ API mới)
        if (Array.isArray(perms)) {
            perms.forEach(p => {
                if (p.departmentId) {
                    const k = `dept_${p.departmentId}`;
                    if (!window._deptPermMap[k]) window._deptPermMap[k] = {};
                    window._deptPermMap[k][p.permissionKey] = p.enabled !== undefined ? p.enabled : true;
                }
            });
        } 
        // Nếu perms là object (có thể từ localStorage cũ)
        else if (typeof perms === 'object') {
            Object.keys(perms).forEach(role => {
                const roleData = perms[role];
                if (typeof roleData === 'object') {
                    Object.keys(roleData).forEach(k => {
                        if (!isNaN(k)) {
                            const deptIdKey = parseInt(k);
                            const kMap = `dept_${deptIdKey}`;
                            if (!window._deptPermMap[kMap]) window._deptPermMap[kMap] = {};
                            const deptPerms = roleData[k];
                            Object.keys(deptPerms).forEach(pk => {
                                window._deptPermMap[kMap][pk] = deptPerms[pk];
                            });
                        }
                    });
                }
            });
        }
    }
    return window._deptPermMap[key] || {};
}

// Toggle tất cả quyền của một module cho tất cả phòng ban
function toggleModuleForAllDepts(module) {
    const checkboxes = document.querySelectorAll(`.dept-perm-checkbox[data-perm^="${module}."]`);
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

function setAllDeptPermissions(checked) {
    document.querySelectorAll('.dept-perm-checkbox').forEach(cb => cb.checked = checked);
}

async function saveDepartmentPermissions() {
    const checkboxes = document.querySelectorAll('.dept-perm-checkbox');
    const permissionsToSave = [];
    checkboxes.forEach(cb => {
        const deptId = parseInt(cb.dataset.dept);
        const permKey = cb.dataset.perm;
        const enabled = cb.checked;
        permissionsToSave.push({ departmentId: deptId, permissionKey: permKey, enabled });
    });

    try {
        showLoading('Đang lưu...');
        for (const perm of permissionsToSave) {
            if (perm.enabled) {
                await api.assignDepartmentPermission(perm.departmentId, perm.permissionKey, true);
            } else {
                await api.removeDepartmentPermission(perm.departmentId, perm.permissionKey);
            }
        }
        await refreshAdminPermissions();
        window._deptPermMap = null;
        renderAdminUI('department-permissions');
        showSuccess('Lưu phân quyền phòng ban thành công!');
    } catch (error) {
        showError('Lỗi: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Export
window.renderDepartmentPermissionsTab = renderDepartmentPermissionsTab;
window.setAllDeptPermissions = setAllDeptPermissions;
window.toggleModuleForAllDepts = toggleModuleForAllDepts;
window.saveDepartmentPermissions = saveDepartmentPermissions;