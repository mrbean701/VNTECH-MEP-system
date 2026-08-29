// ================================================================
// ADMIN AUDIT LOG - Nhật ký hoạt động hệ thống
// ================================================================
async function renderAuditTab() {
    let logs = [];
    try {
        logs = await api.getAuditLogs();
        saveData('audit_logs', logs);
    } catch (e) {
        console.warn('getAuditLogs fallback:', e);
        logs = getData('audit_logs') || [];
    }

    const canManage = getUser()?.role === 'ADMIN';

    let html = `
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3 style="margin:0;">📜 Nhật ký hoạt động (Audit Log)</h3>
            ${canManage ? `<button class="btn btn-danger btn-sm" onclick="clearAuditLogs()"><i class="fas fa-trash"></i> Xóa nhật ký</button>` : ''}
        </div>
        <div class="filter-bar" style="margin:12px 0;">
            <input type="text" id="audit-filter" placeholder="Tìm theo hành động, người thực hiện, mô tả..." style="flex:1;">
            <button class="btn btn-sm" onclick="renderAuditTab()"><i class="fas fa-search"></i></button>
        </div>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Hành động</th>
                        <th>Đối tượng</th>
                        <th>Mô tả</th>
                        <th>Người thực hiện</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const filter = document.getElementById('audit-filter')?.value?.toLowerCase() || '';
    const filtered = logs.filter(l =>
        (l.action || '').toLowerCase().includes(filter) ||
        (l.entityType || '').toLowerCase().includes(filter) ||
        (l.description || '').toLowerCase().includes(filter) ||
        (l.performedBy || '').toLowerCase().includes(filter)
    );

    if (!filtered.length) {
        html += `<tr><td colspan="5" style="text-align:center; color:#999;">Chưa có nhật ký hoạt động.</td></tr>`;
    }

    filtered.slice(0, 200).forEach(l => {
        const actionClass = {
            'CREATE': 'badge-approved',
            'UPDATE': 'badge-pending',
            'DELETE': 'badge-draft',
            'SUBMIT': 'badge-pending',
            'APPROVE': 'badge-approved',
            'REJECT': 'badge-draft',
            'LOGIN': 'badge-info'
        }[l.action] || 'badge-draft';
        const time = l.performedAt ? String(l.performedAt).replace('T', ' ') : '';
        html += `
            <tr>
                <td style="white-space:nowrap;">${time}</td>
                <td><span class="badge ${actionClass}">${l.action || '--'}</span></td>
                <td>${l.entityType || '--'} ${l.entityId ? '(' + l.entityId + ')' : ''}</td>
                <td style="max-width:350px;">${l.description || '--'}</td>
                <td>${l.performedBy || 'SYSTEM'}</td>
            </tr>
        `;
    });

    if (filtered.length > 200) {
        html += `<tr><td colspan="5" style="text-align:center; color:#999;">Hiển thị 200/${filtered.length} bản ghi. Vui lòng lọc để xem thêm.</td></tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>
    `;
    const container = document.getElementById('admin-tab-content');
    if (container) container.innerHTML = html;
    document.getElementById('audit-filter')?.addEventListener('input', renderAuditTab);
}

async function clearAuditLogs() {
    const canManage = getUser()?.role === 'ADMIN';
    if (!canManage) { showWarning('Bạn không có quyền xóa nhật ký!'); return; }
    if (!confirm('Xóa toàn bộ nhật ký hoạt động?')) return;
    try {
        await api.clearAuditLogs();
        saveData('audit_logs', []);
        await renderAuditTab();
        showSuccess('Đã xóa nhật ký.');
    } catch (error) {
        showError('Lỗi khi xóa nhật ký: ' + error.message);
    }
}

window.renderAuditTab = renderAuditTab;
window.clearAuditLogs = clearAuditLogs;
