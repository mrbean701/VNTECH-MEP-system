// ================================================================
// ADMIN USER PERMISSIONS - Phan quyen rieng tung user (ghi de phong ban)
// ================================================================

let _userPermSearchKeyword = '';

function getFilteredUsersForPerm() {
    var users = getUsersData();
    var keyword = _userPermSearchKeyword.toLowerCase().trim();
    if (!keyword) return users;
    return users.filter(function(u){
        return (u.name || '').toLowerCase().indexOf(keyword) >= 0 ||
               (u.email || '').toLowerCase().indexOf(keyword) >= 0;
    });
}

function renderUserPermissionsTab() {
    var users = getFilteredUsersForPerm();
    var departments = getDepartmentsData();
    var userPermissions = getUserPermissionsCache();

    if (!users || users.length === 0) {
        return '<div style="padding:20px; text-align:center; color:#999;">Chua co nguoi dung nao</div>';
    }

    var selectedUserId = null;
    var filterEl = document.getElementById('user-perm-user-filter');
    var stored = filterEl ? parseInt(filterEl.value) : null;
    if (stored && users.some(function(u){ return u.id === stored; })) selectedUserId = stored;
    if (!selectedUserId) selectedUserId = users[0].id;

    var selectedUser = null;
    for (var i=0;i<users.length;i++){ if(users[i].id===selectedUserId){ selectedUser=users[i]; break; } }
    if (!selectedUser) {
        return '<div style="padding:20px; text-align:center; color:#999;">Khong tim thay user</div>';
    }

    var deptPermMap = getDepartmentPermissionMap(selectedUser.departmentId);
    var deptPermKeys = [];
    for (var dk in deptPermMap) if (deptPermMap[dk] === true) deptPermKeys.push(dk);

    if (!userPermissions[selectedUserId]) {
        userPermissions[selectedUserId] = {};
        saveData('user_permissions', userPermissions);
    }
    var userPerms = userPermissions[selectedUser.id] || {};

    var dept = null;
    for (var j=0;j<departments.length;j++){ if(departments[j].id===selectedUser.departmentId){ dept=departments[j]; break; } }
    var deptName = dept ? dept.name : (selectedUser.department || 'Chua co phong ban');

    var moduleActions = getModuleActions();
    var modKeys = Object.keys(moduleActions);

    var userOpts = users.map(function(u){
        return '<option value="'+u.id+'" '+(u.id===selectedUserId?'selected':'')+'>'+u.name+' ('+u.email+')</option>';
    }).join('');

    var canCopy = selectedUser.departmentId != null && deptPermKeys.length > 0;

    var html = '';
    html += '<div style="margin-bottom:16px; display:flex; flex-wrap:wrap; gap:12px; align-items:center;">';
    html += '  <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">';
    html += '    <input type="text" id="user-perm-search-input" placeholder="Tim user theo ten/email..." value="'+_userPermSearchKeyword+'" style="padding:8px 12px; border:1px solid #ccc; border-radius:4px; min-width:200px;">';
    html += '    <button class="btn btn-sm" onclick="searchUserPermissions()"><i class="fas fa-search"></i></button>';
    html += '  </div>';
    html += '  <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-left:auto;">';
    html += '    <select id="user-perm-user-filter" onchange="renderAdminUI(\'user-permissions\')" style="padding:8px 14px; border:1px solid #ccc; border-radius:4px; min-width:200px;">'+userOpts+'</select>';
    if (canCopy) html += '<button class="btn btn-sm btn-info" onclick="copyDeptPermissionsToUser('+selectedUserId+')"><i class="fas fa-copy"></i> Copy quyen phong ban</button>';
    html += '    <button class="btn btn-sm btn-success" onclick="saveUserPermissions()"><i class="fas fa-save"></i> Luu</button>';
    html += '    <button class="btn btn-sm btn-warning" onclick="resetUserPermissions('+selectedUserId+')"><i class="fas fa-undo"></i> Reset</button>';
    html += '  </div>';
    html += '</div>';

    html += '<div style="background:#f8fafc; padding:12px 16px; border-radius:8px; margin-bottom:16px; border:1px solid #e2e8f0; display:flex; flex-wrap:wrap; gap:12px; align-items:center;">';
    html += '  <span style="font-weight:600; font-size:15px;">'+selectedUser.name+'</span>';
    html += '  <span style="color:#888;">'+selectedUser.email+'</span>';
    html += '  <span class="badge badge-info">'+(selectedUser.role||'')+'</span>';
    html += '  <span>'+deptName+'</span>';
    html += '  <span style="color:#888; margin-left:auto;">Phong ban co <strong>'+deptPermKeys.length+'</strong> quyen</span>';
    html += '</div>';

    if (!selectedUser.departmentId) {
        html += '<div style="padding:20px; text-align:center; color:#999; background:white; border-radius:12px; border:1px solid #e2e8f0;">User chua co phong ban. Vui long gan phong ban truoc.</div>';
        setTimeout(bindUserPermEvents, 0);
        return html;
    }
    if (deptPermKeys.length === 0) {
        html += '<div style="padding:20px; text-align:center; color:#999; background:white; border-radius:12px; border:1px solid #e2e8f0;">Phong ban "<strong>'+deptName+'</strong>" chua duoc cap quyen nao. Hay cap quyen cho phong ban truoc.</div>';
        setTimeout(bindUserPermEvents, 0);
        return html;
    }

    html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">';
    modKeys.forEach(function(module){
        var moduleLabel = getModuleLabel(module);
        var actions = moduleActions[module];
        var allKeysInDept = actions.map(function(a){ return module+'.'+a; }).filter(function(k){ return deptPermKeys.indexOf(k) >= 0; });
        if (allKeysInDept.length === 0) return;

        var checkedCount = allKeysInDept.filter(function(k){ return userPerms[k] === true; }).length;
        var totalCount = allKeysInDept.length;

        html += '<div style="background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">';
        html += '  <div style="background:#f0f4f8; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border-bottom:1px solid #e2e8f0;" onclick="toggleModulePerms('+selectedUserId+',\''+module+'\')">';
        html += '    <span style="font-weight:600; font-size:14px; color:blue;">'+moduleLabel+'</span>';
        html += '    <span style="font-size:12px; color:#888;"><strong>'+checkedCount+'/'+totalCount+'</strong> <span style="margin-left:8px; font-size:11px;">Chon tat ca</span></span>';
        html += '  </div>';
        html += '  <div style="padding:8px 14px;">';
        allKeysInDept.forEach(function(key){
            var action = key.split('.').slice(1).join('.');
            var checked = userPerms[key] === true ? 'checked' : '';
            html += '<label style="display:flex; align-items:center; gap:8px; padding:4px 0; font-size:13px; cursor:pointer; border-bottom:1px solid #f5f5f5;">';
            html += '  <input type="checkbox" data-user="'+selectedUserId+'" data-perm="'+key+'" data-module="'+module+'" '+checked+' style="width:15px; height:15px; cursor:pointer; accent-color:blue;" onchange="togglePermCb('+selectedUserId+',\''+key+'\',this.checked)">';
            html += '  <span>'+getActionLabel(action)+'</span>';
            html += '</label>';
        });
        html += '  </div>';
        html += '</div>';
    });
    html += '</div>';

    html += '<div style="margin-top:16px; font-size:13px; color:#888;">Luu y: User chi chon duoc quyen ma phong ban da co. Quyen gan rieng cho user se ghi de phong ban.</div>';

    setTimeout(bindUserPermEvents, 0);
    return html;
}

function bindUserPermEvents() {
    var input = document.getElementById('user-perm-search-input');
    if (input) {
        input.onchange = function(){ _userPermSearchKeyword = this.value; if (typeof renderAdminUI === 'function') renderAdminUI('user-permissions'); };
    }
}

function togglePermCb(userId, permKey, checked) {
    var userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) userPermissions[userId] = {};
    userPermissions[userId][permKey] = checked;
    saveUserPermissionsData(userPermissions);
}

function toggleModulePerms(userId, module) {
    var cbs = document.querySelectorAll('input[data-user="'+userId+'"][data-module="'+module+'"]');
    if (cbs.length === 0) return;
    var allChecked = true;
    for (var i=0;i<cbs.length;i++){ if(!cbs[i].checked){ allChecked=false; break; } }
    var newChecked = !allChecked;
    var userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) userPermissions[userId] = {};
    for (var j=0;j<cbs.length;j++){
        cbs[j].checked = newChecked;
        userPermissions[userId][cbs[j].dataset.permissionKey || cbs[j].getAttribute('data-perm')] = newChecked;
    }
    saveUserPermissionsData(userPermissions);
}

function saveUserPermissions() {
    var userFilter = document.getElementById('user-perm-user-filter');
    if (!userFilter) { showError('Khong tim thay dropdown chon user'); return; }
    var userId = parseInt(userFilter.value);
    if (!userId) { showError('Vui long chon user'); return; }
    var userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) userPermissions[userId] = {};
    var cbs = document.querySelectorAll('input[data-user="'+userId+'"]');
    for (var i=0;i<cbs.length;i++){ userPermissions[userId][cbs[i].getAttribute('data-perm')] = cbs[i].checked; }
    saveUserPermissionsData(userPermissions);
    showSuccess('Da luu phan quyen cho user!');
    syncUserPermissionsToServer(userId);
    if (typeof renderAdminUI === 'function') renderAdminUI('user-permissions');
}

async function syncUserPermissionsToServer(userId) {
    try {
        var userPermissions = getUserPermissionsCache();
        var perms = userPermissions[userId] || {};
        for (var key in perms) { try { await api.removeUserPermission(userId, key); } catch(e){} }
        for (var k2 in perms) { if (perms[k2] === true) { try { await api.assignUserPermission(userId, k2, true); } catch(e){} } }
    } catch (e) { console.warn('sync user permission:', e); }
}

async function resetUserPermissions(userId) {
    if (!userId) {
        var userFilter = document.getElementById('user-perm-user-filter');
        userId = userFilter ? parseInt(userFilter.value) : null;
    }
    if (!userId) { showError('Vui long chon user'); return; }
    if (!confirm('Reset toan bo quyen rieng cua user nay?')) return;
    var userPermissions = getUserPermissionsCache();
    delete userPermissions[userId];
    saveUserPermissionsData(userPermissions);
    if (typeof renderAdminUI === 'function') renderAdminUI('user-permissions');
    showSuccess('Da reset quyen rieng cua user.');
}

async function copyDeptPermissionsToUser(userId) {
    var user = getUsersData().find(function(u){ return u.id === userId; });
    if (!user) { showError('Khong tim thay user!'); return; }
    if (!user.departmentId) { showError('User chua co phong ban!'); return; }
    var deptPermMap = getDepartmentPermissionMap(user.departmentId);
    var deptPermKeys = [];
    for (var dk in deptPermMap) if (deptPermMap[dk] === true) deptPermKeys.push(dk);
    if (deptPermKeys.length === 0) { showWarning('Phong ban nay chua co quyen nao!'); return; }
    if (!confirm('Copy tat ca '+deptPermKeys.length+' quyen cua phong ban vao user nay?')) return;
    var userPermissions = getUserPermissionsCache();
    if (!userPermissions[userId]) userPermissions[userId] = {};
    deptPermKeys.forEach(function(key){ userPermissions[userId][key] = true; });
    saveUserPermissionsData(userPermissions);
    showSuccess('Da copy '+deptPermKeys.length+' quyen tu phong ban vao user!');
    if (typeof renderAdminUI === 'function') renderAdminUI('user-permissions');
}

function searchUserPermissions() {
    var input = document.getElementById('user-perm-search-input');
    if (input) _userPermSearchKeyword = input.value;
    if (typeof renderAdminUI === 'function') renderAdminUI('user-permissions');
}

function getUserPermissionsCache() {
    try { var d = getData('user_permissions'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; }
}
function saveUserPermissionsData(data) { saveData('user_permissions', data); }

function getDepartmentPermissionMap(deptId) {
    if (!deptId) return {};
    var perms = getAdminPermissions();
    var result = {};
    if (Array.isArray(perms)) {
        perms.forEach(function(p){ if (p.departmentId === deptId && p.enabled) result[p.permissionKey] = true; });
        return result;
    }
    Object.keys(perms).forEach(function(role){
        var rd = perms[role];
        if (rd && typeof rd === 'object') {
            Object.keys(rd).forEach(function(k){
                if (!isNaN(parseInt(k)) && parseInt(k) === deptId) {
                    var dp = rd[k];
                    Object.keys(dp).forEach(function(pk){ if (dp[pk]) result[pk] = true; });
                }
            });
        }
    });
    return result;
}
function getAdminPermissions() {
    try { var d = getData('permissions'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; }
}

window.renderUserPermissionsTab = renderUserPermissionsTab;
window.searchUserPermissions = searchUserPermissions;
window.toggleModulePerms = toggleModulePerms;
window.togglePermCb = togglePermCb;
window.saveUserPermissions = saveUserPermissions;
window.resetUserPermissions = resetUserPermissions;
window.copyDeptPermissionsToUser = copyDeptPermissionsToUser;
window.getUserPermissionsCache = getUserPermissionsCache;
window.getDepartmentPermissionMap = getDepartmentPermissionMap;
window.getAdminPermissions = getAdminPermissions;
window.syncUserPermissionsToServer = syncUserPermissionsToServer;

console.log('Admin User Permissions module loaded.');
