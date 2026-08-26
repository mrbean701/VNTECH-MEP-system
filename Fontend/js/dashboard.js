// ================================================================
// DASHBOARD - SỬ DỤNG API (FIX LỖI NULL & THIẾU CONTAINER)
// ================================================================

let orderStatusChartInstance = null;
let itemGroupChartInstance = null;

async function renderDashboard() {
    try {
        // Lấy toàn bộ dữ liệu từ API
        const [mr, pr, po, items, projects, vendors, warehouses, inventory, grn, sto, issues, materialReturns] = await Promise.all([
            api.getMRs(),
            api.getPRs(),
            api.getPOs(),
            api.getItems(),
            api.getProjects(),
            api.getVendors(),
            api.getWarehouses(),
            api.getInventory(),
            api.getGRNs(),
            api.getSTOs(),
            api.getIssues(),
            api.getMaterialReturns()
        ]);

        const user = getUser();
        const totalQty = Array.isArray(inventory) ? inventory.reduce((sum, i) => sum + (i.quantity || 0), 0) : 0;

        // Thống kê chờ duyệt
        const mrPending = Array.isArray(mr) ? mr.filter(m => m.status === 'PENDING').length : 0;
        const prPending = Array.isArray(pr) ? pr.filter(p => p.status === 'PENDING').length : 0;
        const poPending = Array.isArray(po) ? po.filter(p => p.status === 'PENDING').length : 0;

        // GRN/STO chờ xử lý
        const grnPending = Array.isArray(grn) ? grn.filter(g => g.status === 'DRAFT').length : 0;
        const stoPending = Array.isArray(sto) ? sto.filter(s => s.status === 'PENDING' || s.status === 'DRAFT').length : 0;

        // Thống kê theo trạng thái
        const mrApproved = Array.isArray(mr) ? mr.filter(m => m.status === 'APPROVED').length : 0;
        const prApproved = Array.isArray(pr) ? pr.filter(p => p.status === 'APPROVED').length : 0;
        const poApproved = Array.isArray(po) ? po.filter(p => p.status === 'APPROVED').length : 0;
        const mrRejected = Array.isArray(mr) ? mr.filter(m => m.status === 'REJECTED').length : 0;
        const prRejected = Array.isArray(pr) ? pr.filter(p => p.status === 'REJECTED').length : 0;
        const poRejected = Array.isArray(po) ? po.filter(p => p.status === 'REJECTED').length : 0;

        // Issue
        const issueDraft = Array.isArray(issues) ? issues.filter(i => i.status === 'DRAFT').length : 0;
        const issuePending = Array.isArray(issues) ? issues.filter(i => i.status === 'PENDING').length : 0;
        const issueApproved = Array.isArray(issues) ? issues.filter(i => i.status === 'APPROVED').length : 0;
        const issueCompleted = Array.isArray(issues) ? issues.filter(i => i.status === 'COMPLETED').length : 0;
        const issueConfirmed = Array.isArray(issues) ? issues.filter(i => i.status === 'CONFIRMED').length : 0;
        const issueRejected = Array.isArray(issues) ? issues.filter(i => i.status === 'REJECTED').length : 0;

        // Material Return
        const returnDraft = Array.isArray(materialReturns) ? materialReturns.filter(r => r.status === 'DRAFT').length : 0;
        const returnPending = Array.isArray(materialReturns) ? materialReturns.filter(r => r.status === 'PENDING').length : 0;
        const returnApproved = Array.isArray(materialReturns) ? materialReturns.filter(r => r.status === 'APPROVED').length : 0;
        const returnConfirmed = Array.isArray(materialReturns) ? materialReturns.filter(r => r.status === 'CONFIRMED').length : 0;
        const returnRejected = Array.isArray(materialReturns) ? materialReturns.filter(r => r.status === 'REJECTED').length : 0;

        // Hoạt động gần đây
        const recentActivities = [];
        if (Array.isArray(mr)) {
            mr.forEach(m => {
                recentActivities.push({ type: 'MR', code: m.code, project: m.projectName || m.projectCode || '', date: m.createdAt || '', status: m.status, id: m.id });
            });
        }
        if (Array.isArray(pr)) {
            pr.forEach(p => {
                recentActivities.push({ type: 'PR', code: p.code, project: p.projectName || p.projectCode || '', date: p.createdAt || '', status: p.status, id: p.id });
            });
        }
        if (Array.isArray(po)) {
            po.forEach(p => {
                recentActivities.push({ type: 'PO', code: p.code, project: p.projectName || p.projectCode || '', date: p.createdAt || '', status: p.status, id: p.id });
            });
        }
        recentActivities.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const latestActivities = recentActivities.slice(0, 5);

        // Ngày hiện tại
        const dateStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

        // Min stock
        let minStats = { under: 0, warning: 0, safe: 0 };
        try {
            if (typeof api.getMinStock === 'function') {
                const minData = await api.getMinStock();
                if (minData && typeof minData === 'object') {
                    minStats = minData;
                }
            }
        } catch (e) {
            console.warn('Không thể lấy min stock:', e);
        }
        const totalUnder = minStats.under || 0;
        const totalWarning = minStats.warning || 0;
        const totalSafe = minStats.safe || 0;

        // Auto Reorder
        let autoConfig = { enabled: false };
        try {
            if (typeof api.getAutoReorderConfig === 'function') {
                autoConfig = await api.getAutoReorderConfig() || { enabled: false };
            }
        } catch (e) {
            console.warn('Không thể lấy auto reorder config:', e);
        }
        const isAutoEnabled = autoConfig.enabled || false;
        const autoStatusIcon = isAutoEnabled ? '🟢' : '🔴';
        const autoStatusText = isAutoEnabled ? 'Đang bật' : 'Đã tắt';
        const autoStatusColor = isAutoEnabled ? '#15803d' : '#dc3545';
        const autoDraft = Array.isArray(pr) ? pr.filter(p => p.status === 'DRAFT' && p.note && p.note.includes('Auto Reorder')).length : 0;
        const autoPending = Array.isArray(pr) ? pr.filter(p => p.status === 'PENDING' && p.note && p.note.includes('Auto Reorder')).length : 0;
        const hasAutoOrder = (autoDraft + autoPending) > 0;

        // Widget min stock
        const minStockWidgetHtml = `
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                <div style="background:#fef2f2; padding:10px 8px; border-radius:8px; text-align:center; cursor:pointer;" onclick="window.navigateTo('min-stock'); setTimeout(() => { const el = document.getElementById('min-stock-status-filter'); if(el) el.value='under'; renderMinStockList(); }, 100);">
                    <div style="font-size:20px; font-weight:700; color:#dc3545;">${totalUnder}</div>
                    <div style="font-size:12px; color:#555;">⚠️ Dưới ngưỡng</div>
                </div>
                <div style="background:#fef9e7; padding:10px 8px; border-radius:8px; text-align:center; cursor:pointer;" onclick="window.navigateTo('min-stock'); setTimeout(() => { const el = document.getElementById('min-stock-status-filter'); if(el) el.value='warning'; renderMinStockList(); }, 100);">
                    <div style="font-size:20px; font-weight:700; color:#f39c12;">${totalWarning}</div>
                    <div style="font-size:12px; color:#555;">⚡ Gần ngưỡng</div>
                </div>
                <div style="background:#f0fdf4; padding:10px 8px; border-radius:8px; text-align:center; cursor:pointer;" onclick="window.navigateTo('min-stock'); setTimeout(() => { const el = document.getElementById('min-stock-status-filter'); if(el) el.value='safe'; renderMinStockList(); }, 100);">
                    <div style="font-size:20px; font-weight:700; color:#28a745;">${totalSafe}</div>
                    <div style="font-size:12px; color:#555;">✅ An toàn</div>
                </div>
            </div>
        `;

        // Widget auto reorder
        let autoWidgetHtml = '';
        if (!hasAutoOrder) {
            autoWidgetHtml = '<div class="widget-empty">✅ Không có đơn hàng tự động chờ duyệt</div>';
        } else {
            autoWidgetHtml = `
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <div style="background:#f0fdf4; padding:8px 14px; border-radius:8px; cursor:pointer;" onclick="window.navigateTo('pr')">
                        <span style="font-weight:700; color:#15803d;">${autoDraft}</span> PR DRAFT
                    </div>
                    <div style="background:#fef9e7; padding:8px 14px; border-radius:8px; cursor:pointer;" onclick="window.navigateTo('pr')">
                        <span style="font-weight:700; color:#b45309;">${autoPending}</span> PR PENDING
                    </div>
                </div>
            `;
        }

        // Issue widget
        const issueWidgetHtml = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div style="background:#f0fdf4; padding:8px; border-radius:6px; text-align:center; cursor:pointer;" onclick="window.navigateTo('issue')">
                    <div style="font-size:16px; font-weight:700; color:#15803d;">${issueConfirmed + issueCompleted}</div>
                    <div style="font-size:11px; color:#555;">Đã cấp phát</div>
                </div>
                <div style="background:#fef9e7; padding:8px; border-radius:6px; text-align:center; cursor:pointer;" onclick="window.navigateTo('issue')">
                    <div style="font-size:16px; font-weight:700; color:#b45309;">${issuePending + issueApproved}</div>
                    <div style="font-size:11px; color:#555;">Cấp phát chờ xử lý</div>
                </div>
                <div style="background:#f0fdf4; padding:8px; border-radius:6px; text-align:center; cursor:pointer;" onclick="window.navigateTo('material-return')">
                    <div style="font-size:16px; font-weight:700; color:#15803d;">${returnConfirmed}</div>
                    <div style="font-size:11px; color:#555;">Đã hoàn trả</div>
                </div>
                <div style="background:#fef9e7; padding:8px; border-radius:6px; text-align:center; cursor:pointer;" onclick="window.navigateTo('material-return')">
                    <div style="font-size:16px; font-weight:700; color:#b45309;">${returnPending + returnApproved}</div>
                    <div style="font-size:11px; color:#555;">Hoàn trả chờ xử lý</div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12px; color:#888;">
                <span>📤 Cấp phát: ${Array.isArray(issues) ? issues.length : 0} phiếu</span>
                <span>🔄 Hoàn trả: ${Array.isArray(materialReturns) ? materialReturns.length : 0} phiếu</span>
            </div>
        `;

        // Kiểm tra quyền admin
        const isAdmin = user && (user.role === 'ADMIN' || (typeof hasPermission === 'function' && hasPermission('admin.view')));

        // ===== HTML =====
        let html = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div>
                        <h2><i class="fas fa-chart-line"></i> Dashboard</h2>
                        ${user ? `<span style="font-size:14px; color:#888; margin-left:8px;">👋 Chào, ${user.name || 'Người dùng'} (${user.role || 'Không xác định'})</span>` : ''}
                        ${user && user.department ? `<span style="font-size:13px; color:#888; margin-left:8px;">🏢 ${user.department}</span>` : ''}
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        ${isAdmin ? `<button class="btn btn-sm btn-info" onclick="window.navigateTo('admin')"><i class="fas fa-user-shield"></i> Quản trị</button>` : ''}
                        <span class="dashboard-date"><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                    </div>
                </div>

                <div class="dashboard-two-col">
                    <div class="dashboard-left">
                        <div class="dashboard-section">
                            <div class="section-title"><i class="fas fa-chart-pie"></i> Tổng quan</div>
                            <div class="stats-grid">
                                <div class="stat-card-main" onclick="window.navigateTo('projects')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #ebf5fb; color: #3498db;"><i class="fas fa-project-diagram"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(projects) ? projects.length : 0}</div><div class="stat-label">Dự án</div></div>
                                </div>
                                <div class="stat-card-main" onclick="window.navigateTo('vendors')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #f4ecf7; color: #9b59b6;"><i class="fas fa-truck"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(vendors) ? vendors.length : 0}</div><div class="stat-label">Nhà cung cấp</div></div>
                                </div>
                                <div class="stat-card-main" onclick="window.navigateTo('items')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #e8f8f5; color: #1abc9c;"><i class="fas fa-cubes"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(items) ? items.length : 0}</div><div class="stat-label">Vật tư</div></div>
                                </div>
                                <div class="stat-card-main" onclick="window.navigateTo('warehouse')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #fef5e7; color: #e67e22;"><i class="fas fa-warehouse"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(warehouses) ? warehouses.length : 0}</div><div class="stat-label">Kho</div></div>
                                </div>
                                <div class="stat-card-main" onclick="window.navigateTo('warehouse')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #eafaf1; color: #27ae60;"><i class="fas fa-weight-hanging"></i></div>
                                    <div class="stat-content"><div class="stat-number">${totalQty.toLocaleString()}</div><div class="stat-label">Tổng tồn (đvt)</div></div>
                                </div>
                            </div>
                        </div>

                        <div class="dashboard-section">
                            <div class="section-title"><i class="fas fa-clipboard-list"></i> Đơn hàng</div>
                            <div class="order-grid">
                                <div class="stat-card-main stat-card-order" onclick="window.navigateTo('mr')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #fef9e7; color: #f39c12;"><i class="fas fa-clipboard-list"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(mr) ? mr.length : 0}</div><div class="stat-label">MR</div></div>
                                </div>
                                <div class="stat-card-main stat-card-order" onclick="window.navigateTo('pr')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #fef5e7; color: #e67e22;"><i class="fas fa-file-invoice"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(pr) ? pr.length : 0}</div><div class="stat-label">PR</div></div>
                                </div>
                                <div class="stat-card-main stat-card-order" onclick="window.navigateTo('po')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #eafaf1; color: #2ecc71;"><i class="fas fa-shopping-cart"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(po) ? po.length : 0}</div><div class="stat-label">PO</div></div>
                                </div>
                            </div>
                        </div>

                        <div class="dashboard-section">
                            <div class="section-title"><i class="fas fa-exchange-alt"></i> Phiếu xuất/nhập</div>
                            <div class="order-grid">
                                <div class="stat-card-main stat-card-order" onclick="window.navigateTo('grn')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #ebf5fb; color: #3498db;"><i class="fas fa-arrow-left"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(grn) ? grn.length : 0}</div><div class="stat-label">GRN</div></div>
                                </div>
                                <div class="stat-card-main stat-card-order" onclick="window.navigateTo('sto')" style="cursor:pointer;">
                                    <div class="stat-icon-wrapper" style="background: #f4ecf7; color: #9b59b6;"><i class="fas fa-arrow-right"></i></div>
                                    <div class="stat-content"><div class="stat-number">${Array.isArray(sto) ? sto.length : 0}</div><div class="stat-label">STO</div></div>
                                </div>
                            </div>
                        </div>

                        <div class="dashboard-section">
                            <div class="section-title"><i class="fas fa-exclamation-triangle"></i> Cảnh báo tồn kho</div>
                            <div style="background: white; border-radius: 14px; padding: 16px 20px; border: 1px solid #f0f0f0;">
                                <div class="widget-content">${minStockWidgetHtml}</div>
                                <div style="text-align:right; margin-top:8px;">
                                    <button class="btn btn-sm btn-info" onclick="window.navigateTo('min-stock')">Xem chi tiết</button>
                                </div>
                            </div>
                        </div>

                        <div class="dashboard-section">
                            <div class="section-title"><i class="fas fa-robot"></i> Đơn hàng tự động</div>
                            <div style="background: white; border-radius: 14px; padding: 16px 20px; border: 1px solid #f0f0f0;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #f0f0f0;">
                                    <span style="font-weight:600;">Trạng thái hệ thống:</span>
                                    <span style="color:${autoStatusColor}; font-weight:600;">${autoStatusIcon} ${autoStatusText}</span>
                                </div>
                                <div class="widget-content">${autoWidgetHtml}</div>
                                <div style="text-align:right; margin-top:8px;">
                                    <button class="btn btn-sm btn-info" onclick="window.navigateTo('auto-reorder')">Cấu hình</button>
                                    <button class="btn btn-sm btn-info" onclick="window.navigateTo('pr')">Xem chi tiết</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-right">
                        <div class="dashboard-widget">
                            <div class="widget-title"><i class="fas fa-clock"></i> Hoạt động gần đây</div>
                            <div class="widget-content">
                                ${latestActivities.length === 0 ? `<div class="widget-empty">Chưa có hoạt động nào</div>` : latestActivities.map(item => `
                                    <div class="widget-item" onclick="view${item.type}(${item.id})">
                                        <span class="widget-badge" style="background: #fef9e7; color: #f39c12;">${item.type}</span>
                                        <span class="widget-text">${item.code} - ${item.project || 'N/A'}</span>
                                        <span class="widget-time">${item.date || ''}</span>
                                        <span class="widget-status">${getStatusBadge(item.status)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="dashboard-widget" onclick="showPendingModal()" style="cursor:pointer;">
                            <div class="widget-title"><i class="fas fa-hourglass-half"></i> Đơn hàng chờ duyệt</div>
                            <div class="widget-content">
                                <div class="pending-item" style="border-left-color: #f39c12;">
                                    <div class="pending-icon" style="color: #f39c12;"><i class="fas fa-clipboard-list"></i></div>
                                    <div class="pending-content"><div class="pending-number">${mrPending}</div><div class="pending-label">MR chờ duyệt</div></div>
                                </div>
                                <div class="pending-item" style="border-left-color: #e67e22;">
                                    <div class="pending-icon" style="color: #e67e22;"><i class="fas fa-file-invoice"></i></div>
                                    <div class="pending-content"><div class="pending-number">${prPending}</div><div class="pending-label">PR chờ duyệt</div></div>
                                </div>
                                <div class="pending-item" style="border-left-color: #2ecc71;">
                                    <div class="pending-icon" style="color: #2ecc71;"><i class="fas fa-shopping-cart"></i></div>
                                    <div class="pending-content"><div class="pending-number">${poPending}</div><div class="pending-label">PO chờ duyệt</div></div>
                                </div>
                            </div>
                        </div>

                        <div class="dashboard-widget" onclick="showPendingWarehouseModal()" style="cursor:pointer;">
                            <div class="widget-title"><i class="fas fa-exchange-alt"></i> Phiếu xuất/nhập chờ xử lý</div>
                            <div class="widget-content">
                                <div class="pending-item" style="border-left-color: #3498db;">
                                    <div class="pending-icon" style="color: #3498db;"><i class="fas fa-arrow-left"></i></div>
                                    <div class="pending-content"><div class="pending-number">${grnPending}</div><div class="pending-label">GRN chờ nhập</div></div>
                                </div>
                                <div class="pending-item" style="border-left-color: #9b59b6;">
                                    <div class="pending-icon" style="color: #9b59b6;"><i class="fas fa-arrow-right"></i></div>
                                    <div class="pending-content"><div class="pending-number">${stoPending}</div><div class="pending-label">STO chờ duyệt</div></div>
                                </div>
                            </div>
                        </div>

                        <div class="dashboard-widget" onclick="window.navigateTo('issue')" style="cursor:pointer;">
                            <div class="widget-title"><i class="fas fa-hand-holding"></i> Cấp phát & Hoàn trả</div>
                            <div class="widget-content">${issueWidgetHtml}</div>
                        </div>

                        <div class="dashboard-widget">
                            <div class="widget-title"><i class="fas fa-chart-bar"></i> Tình trạng đơn hàng</div>
                            <div class="widget-content" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                <div style="background: #f0fdf4; padding: 10px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: 700; color: #15803d;">${mrApproved}</div>
                                    <div style="font-size: 12px; color: #555;">MR Đã duyệt</div>
                                </div>
                                <div style="background: #f0fdf4; padding: 10px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: 700; color: #15803d;">${prApproved}</div>
                                    <div style="font-size: 12px; color: #555;">PR Đã duyệt</div>
                                </div>
                                <div style="background: #f0fdf4; padding: 10px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: 700; color: #15803d;">${poApproved}</div>
                                    <div style="font-size: 12px; color: #555;">PO Đã duyệt</div>
                                </div>
                                <div style="background: #fef2f2; padding: 10px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: 700; color: #b91c1c;">${mrRejected}</div>
                                    <div style="font-size: 12px; color: #555;">MR Từ chối</div>
                                </div>
                                <div style="background: #fef2f2; padding: 10px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: 700; color: #b91c1c;">${prRejected}</div>
                                    <div style="font-size: 12px; color: #555;">PR Từ chối</div>
                                </div>
                                <div style="background: #fef2f2; padding: 10px 8px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 18px; font-weight: 700; color: #b91c1c;">${poRejected}</div>
                                    <div style="font-size: 12px; color: #555;">PO Từ chối</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chart-container">
                    <div class="chart-box">
                        <h4><i class="fas fa-chart-bar"></i> Đơn hàng theo trạng thái</h4>
                        <canvas id="orderStatusChart"></canvas>
                    </div>
                    <div class="chart-box">
                        <h4><i class="fas fa-chart-pie"></i> Vật tư theo nhóm</h4>
                        <canvas id="itemGroupChart"></canvas>
                    </div>
                </div>

                <div style="margin-top: 24px; background: white; border-radius: 14px; padding: 16px 20px; border: 1px solid #f0f0f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <div style="display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center;">
                        <span style="font-weight: 600; color: #1a3c6e; font-size: 15px;"><i class="fas fa-info-circle"></i> Hướng dẫn nhanh:</span>
                        <span><span class="badge badge-pending" style="background:#27ae60;">MR</span> <a href="#" onclick="window.navigateTo('mr'); return false;" style="color: #1a3c6e; text-decoration: none;">Tạo & duyệt</a></span>
                        <span><span class="badge badge-pending" style="background:#f39c12;">PR</span> <a href="#" onclick="window.navigateTo('pr'); return false;" style="color: #1a3c6e; text-decoration: none;">3 bước duyệt</a></span>
                        <span><span class="badge badge-pending" style="background:#2ecc71;">PO</span> <a href="#" onclick="window.navigateTo('po'); return false;" style="color: #1a3c6e; text-decoration: none;">3 bước duyệt</a></span>
                        <span><span class="badge badge-pending" style="background:#3498db;">GRN</span> <a href="#" onclick="window.navigateTo('grn'); return false;" style="color: #1a3c6e; text-decoration: none;">Nhập kho</a></span>
                        <span><span class="badge badge-pending" style="background:#9b59b6;">STO</span> <a href="#" onclick="window.navigateTo('sto'); return false;" style="color: #1a3c6e; text-decoration: none;">Chuyển kho</a></span>
                        <span><span class="badge badge-pending" style="background:#e67e22;">Kho</span> <a href="#" onclick="window.navigateTo('warehouse'); return false;" style="color: #1a3c6e; text-decoration: none;">Quản lý tồn</a></span>
                        <span><span class="badge badge-pending" style="background:#2c3e50;">Cấp phát</span> <a href="#" onclick="window.navigateTo('issue'); return false;" style="color: #1a3c6e; text-decoration: none;">Cấp phát</a></span>
                        <span><span class="badge badge-pending" style="background:#8e44ad;">Hoàn trả</span> <a href="#" onclick="window.navigateTo('material-return'); return false;" style="color: #1a3c6e; text-decoration: none;">Hoàn trả</a></span>
                    </div>
                    <div style="margin-top: 6px; font-size: 13px; color: #888;">
                        <i class="fas fa-mouse-pointer"></i> Click vào các thẻ thống kê để chuyển nhanh đến trang tương ứng.
                    </div>
                </div>
            </div>
        `;

        document.getElementById('stats-container').innerHTML = html;

        // Vẽ biểu đồ
        setTimeout(() => {
            drawOrderStatusChart(mr, pr, po);
            drawItemGroupChart(items);
            renderTopWarehouses(warehouses, inventory);
            renderTopItems(items, inventory);
        }, 150);

    } catch (error) {
        showError('Không thể tải dashboard: ' + error.message);
        console.error('Dashboard error:', error);
    }
}

// ====== VẼ BIỂU ĐỒ ======
function drawOrderStatusChart(mr, pr, po) {
    const canvas = document.getElementById('orderStatusChart');
    if (!canvas) return;
    if (orderStatusChartInstance) { orderStatusChartInstance.destroy(); orderStatusChartInstance = null; }

    const ctx = canvas.getContext('2d');
    const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
    const mrCounts = statuses.map(s => Array.isArray(mr) ? mr.filter(m => m.status === s).length : 0);
    const prCounts = statuses.map(s => Array.isArray(pr) ? pr.filter(p => p.status === s).length : 0);
    const poCounts = statuses.map(s => Array.isArray(po) ? po.filter(p => p.status === s).length : 0);

    orderStatusChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: statuses,
            datasets: [
                { label: 'MR', data: mrCounts, backgroundColor: 'rgba(243, 156, 18, 0.7)', borderColor: '#f39c12', borderWidth: 2 },
                { label: 'PR', data: prCounts, backgroundColor: 'rgba(230, 126, 34, 0.7)', borderColor: '#e67e22', borderWidth: 2 },
                { label: 'PO', data: poCounts, backgroundColor: 'rgba(46, 204, 113, 0.7)', borderColor: '#2ecc71', borderWidth: 2 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 14 } } }, scales: { y: { beginAtZero: true, stepSize: 1, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } }
    });
}

function drawItemGroupChart(items) {
    const canvas = document.getElementById('itemGroupChart');
    if (!canvas) return;
    if (itemGroupChartInstance) { itemGroupChartInstance.destroy(); itemGroupChartInstance = null; }

    const ctx = canvas.getContext('2d');
    const groups = {};
    if (Array.isArray(items)) {
        items.forEach(item => { const g = item.itemGroup || 'Chưa phân nhóm'; groups[g] = (groups[g] || 0) + 1; });
    }
    const labels = Object.keys(groups);
    const data = Object.values(groups);
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e84393', '#00b894', '#6c5ce7'];

    if (data.length === 0 || data.every(v => v === 0)) {
        canvas.parentElement.innerHTML = `<div style="text-align:center; color:#999; padding:30px 0;"><i class="fas fa-box-open" style="font-size:32px; display:block; margin-bottom:8px;"></i>Chưa có dữ liệu vật tư</div>`;
        return;
    }

    itemGroupChartInstance = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderColor: '#fff', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14, padding: 8 } } } }
    });
}

// ====== TOP TỒN KHO ======
function renderTopWarehouses(warehouses, inventory) {
    const container = document.getElementById('top-warehouses-list');
    if (!container) {
        // Tạo container nếu chưa có
        const statsContainer = document.getElementById('stats-container');
        if (statsContainer) {
            const newContainer = document.createElement('div');
            newContainer.id = 'top-warehouses-list';
            statsContainer.appendChild(newContainer);
        }
        return;
    }
    if (!Array.isArray(warehouses) || !Array.isArray(inventory)) {
        container.innerHTML = '<div style="color:#999; font-size:13px;">Chưa có dữ liệu tồn kho</div>';
        return;
    }
    const totals = warehouses.map(w => ({ ...w, total: inventory.filter(i => i.warehouseId === w.id).reduce((s, i) => s + (i.quantity || 0), 0) }));
    const top = totals.sort((a, b) => b.total - a.total).slice(0, 3);
    if (top.length === 0 || top.every(t => t.total === 0)) { container.innerHTML = '<div style="color:#999; font-size:13px;">Chưa có dữ liệu tồn kho</div>'; return; }
    let html = '';
    top.forEach((w, idx) => {
        const colors = ['#3498db', '#2ecc71', '#f39c12'];
        const bgColors = ['#ebf5fb', '#eafaf1', '#fef9e7'];
        html += `
            <div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #f5f5f5; cursor:pointer;" onclick="window.navigateTo('warehouse'); setTimeout(() => viewWarehouseDetail(${w.id}), 200);">
                <div style="width:28px; height:28px; border-radius:50%; background:${bgColors[idx] || '#f0f0f0'}; display:flex; align-items:center; justify-content:center; color:${colors[idx] || '#666'}; font-weight:bold; font-size:13px;">${idx + 1}</div>
                <div style="flex:1;"><div style="font-weight:500; font-size:14px; color:#1a3c6e;">${w.code}</div><div style="font-size:12px; color:#888;">${w.name}</div></div>
                <div style="font-weight:600; font-size:15px; color:#1a3c6e;">${w.total.toLocaleString()}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderTopItems(items, inventory) {
    const container = document.getElementById('top-items-list');
    if (!container) {
        // Tạo container nếu chưa có
        const statsContainer = document.getElementById('stats-container');
        if (statsContainer) {
            const newContainer = document.createElement('div');
            newContainer.id = 'top-items-list';
            statsContainer.appendChild(newContainer);
        }
        return;
    }
    if (!Array.isArray(items) || !Array.isArray(inventory)) {
        container.innerHTML = '<div style="color:#999; font-size:13px;">Chưa có dữ liệu tồn kho</div>';
        return;
    }
    const totals = items.map(item => ({ ...item, total: inventory.filter(i => i.itemId === item.id).reduce((s, i) => s + (i.quantity || 0), 0) }));
    const top = totals.sort((a, b) => b.total - a.total).slice(0, 3);
    if (top.length === 0 || top.every(t => t.total === 0)) { container.innerHTML = '<div style="color:#999; font-size:13px;">Chưa có dữ liệu tồn kho</div>'; return; }
    let html = '';
    top.forEach((item, idx) => {
        const colors = ['#1abc9c', '#3498db', '#9b59b6'];
        const bgColors = ['#e8f8f5', '#ebf5fb', '#f4ecf7'];
        html += `
            <div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #f5f5f5; cursor:pointer;" onclick="viewItem(${item.id})">
                <div style="width:28px; height:28px; border-radius:50%; background:${bgColors[idx] || '#f0f0f0'}; display:flex; align-items:center; justify-content:center; color:${colors[idx] || '#666'}; font-weight:bold; font-size:13px;">${idx + 1}</div>
                <div style="flex:1;"><div style="font-weight:500; font-size:14px; color:#1a3c6e;">${item.code}</div><div style="font-size:12px; color:#888;">${item.name} (${item.unit || 'đvt'})</div></div>
                <div style="font-weight:600; font-size:15px; color:#1a3c6e;">${item.total.toLocaleString()}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ====== MODAL HIỂN THỊ ĐƠN HÀNG CHỜ DUYỆT ======
async function showPendingModal() {
    try {
        const mr = await api.getMRs();
        const pr = await api.getPRs();
        const po = await api.getPOs();
        const mrPending = Array.isArray(mr) ? mr.filter(m => m.status === 'PENDING') : [];
        const prPending = Array.isArray(pr) ? pr.filter(p => p.status === 'PENDING') : [];
        const poPending = Array.isArray(po) ? po.filter(p => p.status === 'PENDING') : [];

        if (mrPending.length === 0 && prPending.length === 0 && poPending.length === 0) {
            showInfo('Không có đơn hàng nào đang chờ duyệt.');
            return;
        }

        let html = `<div style="margin-bottom:12px;"><strong>Danh sách đơn hàng chờ duyệt</strong></div>`;

        if (mrPending.length > 0) {
            html += `<h4 style="margin:10px 0 6px; color:#f39c12;">MR chờ duyệt</h4><div class="table-responsive"><table><thead><tr><th>Mã</th><th>Dự án</th><th>Ngày tạo</th><th>Hành động</th></tr></thead><tbody>`;
            mrPending.forEach(m => {
                html += `<tr><td>${m.code}</td><td>${m.projectName || m.projectCode || ''}</td><td>${m.createdAt || ''}</td><td><button class="btn btn-success btn-sm" onclick="approveMR(${m.id}); closeModal(); showPendingModal();">Duyệt</button> <button class="btn btn-danger btn-sm" onclick="rejectMR(${m.id}); closeModal(); showPendingModal();">Từ chối</button> <button class="btn btn-info btn-sm" onclick="closeModal(); viewMR(${m.id});">Xem</button></td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
        if (prPending.length > 0) {
            html += `<h4 style="margin:10px 0 6px; color:#e67e22;">PR chờ duyệt</h4><div class="table-responsive"><table><thead><tr><th>Mã</th><th>Dự án</th><th>Nhà cung cấp</th><th>Bước</th><th>Hành động</th></tr></thead><tbody>`;
            prPending.forEach(p => {
                const stepName = getApprovalStepName(p.approvalStep);
                html += `<tr><td>${p.code}</td><td>${p.projectName || p.projectCode || ''}</td><td>${p.vendorName || p.vendorCode || ''}</td><td>Bước ${p.approvalStep} (${stepName})</td><td><button class="btn btn-success btn-sm" onclick="approvePR(${p.id}); closeModal(); showPendingModal();">Duyệt</button> <button class="btn btn-danger btn-sm" onclick="rejectPR(${p.id}); closeModal(); showPendingModal();">Từ chối</button> <button class="btn btn-info btn-sm" onclick="closeModal(); viewPR(${p.id});">Xem</button></td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
        if (poPending.length > 0) {
            html += `<h4 style="margin:10px 0 6px; color:#2ecc71;">PO chờ duyệt</h4><div class="table-responsive"><table><thead><tr><th>Mã</th><th>Dự án</th><th>Nhà cung cấp</th><th>Bước</th><th>Hành động</th></tr></thead><tbody>`;
            poPending.forEach(p => {
                const stepName = getApprovalStepName(p.approvalStep);
                html += `<tr><td>${p.code}</td><td>${p.projectName || p.projectCode || ''}</td><td>${p.vendorName || p.vendorCode || ''}</td><td>Bước ${p.approvalStep} (${stepName})</td><td><button class="btn btn-success btn-sm" onclick="approvePO(${p.id}); closeModal(); showPendingModal();">Duyệt</button> <button class="btn btn-danger btn-sm" onclick="rejectPO(${p.id}); closeModal(); showPendingModal();">Từ chối</button> <button class="btn btn-info btn-sm" onclick="closeModal(); viewPO(${p.id});">Xem</button></td></tr>`;
            });
            html += `</tbody></table></div>`;
        }
        html += `<div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>`;
        showModal('Đơn hàng chờ duyệt', html);
    } catch (error) {
        showError('Lỗi tải danh sách: ' + error.message);
    }
}

async function showPendingWarehouseModal() {
    try {
        const grn = await api.getGRNs();
        const sto = await api.getSTOs();
        const grnPending = Array.isArray(grn) ? grn.filter(g => g.status === 'DRAFT') : [];
        const stoPending = Array.isArray(sto) ? sto.filter(s => s.status === 'PENDING' || s.status === 'DRAFT') : [];

        if (grnPending.length === 0 && stoPending.length === 0) {
            showInfo('Không có phiếu xuất/nhập nào đang chờ xử lý.');
            return;
        }

        let html = `<div style="margin-bottom:12px;"><strong>Phiếu xuất/nhập chờ xử lý</strong></div>`;

        if (grnPending.length > 0) {
            html += `<h4 style="margin:10px 0 6px; color:#3498db;">GRN chờ nhập kho</h4><div class="table-responsive"><table><thead><tr><th>Mã</th><th>PO</th><th>Dự án</th><th>Hành động</th></tr></thead><tbody>`;
            for (const g of grnPending) {
                const po = (await api.getPOs()).find(p => p.id === g.poId);
                const poCode = po ? po.code : 'N/A';
                html += `<tr><td>${g.code}</td><td>${poCode}</td><td>${g.projectName || ''}</td><td><button class="btn btn-success btn-sm" onclick="completeGRN(${g.id}); closeModal(); showPendingWarehouseModal();">Hoàn thành</button> <button class="btn btn-danger btn-sm" onclick="deleteGRN(${g.id}); closeModal(); showPendingWarehouseModal();">Hủy</button> <button class="btn btn-info btn-sm" onclick="closeModal(); viewGRN(${g.id});">Xem</button></td></tr>`;
            }
            html += `</tbody></table></div>`;
        }
        if (stoPending.length > 0) {
            html += `<h4 style="margin:10px 0 6px; color:#9b59b6;">STO chờ duyệt</h4><div class="table-responsive"><table><thead><tr><th>Mã</th><th>Kho đi</th><th>Kho đến</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>`;
            for (const s of stoPending) {
                const fromWh = getWarehouseCode(s.fromWarehouseId);
                const toWh = getWarehouseCode(s.toWarehouseId);
                html += `<tr><td>${s.code}</td><td>${fromWh}</td><td>${toWh}</td><td>${s.status}</td><td>
                    ${s.status === 'DRAFT' ? `<button class="btn btn-success btn-sm" onclick="submitSTO(${s.id}); closeModal(); showPendingWarehouseModal();">Gửi duyệt</button>` : ''}
                    ${s.status === 'PENDING' ? `<button class="btn btn-success btn-sm" onclick="approveSTO(${s.id}); closeModal(); showPendingWarehouseModal();">Duyệt</button>` : ''}
                    ${s.status === 'APPROVED' ? `<button class="btn btn-success btn-sm" onclick="completeSTO(${s.id}); closeModal(); showPendingWarehouseModal();">Xuất kho</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteSTO(${s.id}); closeModal(); showPendingWarehouseModal();">Hủy</button>
                    <button class="btn btn-info btn-sm" onclick="closeModal(); viewSTO(${s.id});">Xem</button>
                </td></tr>`;
            }
            html += `</tbody></table></div>`;
        }
        html += `<div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>`;
        showModal('Phiếu xuất/nhập chờ xử lý', html);
    } catch (error) {
        showError('Lỗi tải danh sách: ' + error.message);
    }
}

// ====== EXPORT ======
window.renderDashboard = renderDashboard;
window.drawOrderStatusChart = drawOrderStatusChart;
window.drawItemGroupChart = drawItemGroupChart;
window.renderTopWarehouses = renderTopWarehouses;
window.renderTopItems = renderTopItems;
window.showPendingModal = showPendingModal;
window.showPendingWarehouseModal = showPendingWarehouseModal;

console.log('✅ Dashboard module updated: fixed null values, added container fallback.');