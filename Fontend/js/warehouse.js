// ================================================================
// WAREHOUSE - GRN & STO (SỬ DỤNG API) - ĐÃ TÍCH HỢP APPROVAL LEVEL
// ================================================================

let currentWhTab = 'wh-list';
let showAllWarehouses = false;

// ====== STATE CHO GRN ======
const grnState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    projectFilter: '',
    warehouseFilter: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};

// ====== STATE CHO STO ======
const stoState = {
    page: 1,
    perPage: 10,
    filterText: '',
    statusFilter: '',
    projectFilter: '',
    fromWarehouseFilter: '',
    toWarehouseFilter: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};

const debouncedGRNFilter = debounce(() => {
    grnState.page = 1;
    switchWarehouseTab('wh-grn');
}, 300);

const debouncedSTOFilter = debounce(() => {
    stoState.page = 1;
    switchWarehouseTab('wh-sto');
}, 300);

// ================================================================
// RENDER PAGE
// ================================================================
async function renderWarehousePage(tab) {
    currentWhTab = tab || 'wh-list';
    const container = document.getElementById('inventory-content');

    if (!hasPermission('inventory.view')) {
        container.innerHTML = `
            <div style="padding:20px; text-align:center; color:#e74c3c;">
                <i class="fas fa-lock" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                Bạn không có quyền xem kho
            </div>
        `;
        return;
    }

    const canEditInventory = hasPermission('inventory.edit');
    const canCreateGRN = hasPermission('grn.create');
    const canCreateSTO = hasPermission('sto.create');

    // ✅ Ẩn/hiện nút "Thêm kho"
    const btnAddWH = document.querySelector('#page-inventory .page-header .btn[onclick*="showAddWarehouse"]');
    if (btnAddWH) {
        btnAddWH.style.display = (tab === 'wh-list' && canEditInventory) ? 'inline-block' : 'none';
    }

    // ✅ Ẩn/hiện nút "Tạo GRN"
    const btnAddGRN = document.querySelector('#page-inventory .page-header .btn[onclick*="showAddGRN"]');
    if (btnAddGRN) {
        btnAddGRN.style.display = (tab === 'wh-grn' && canCreateGRN) ? 'inline-block' : 'none';
    }

    // ✅ Ẩn/hiện nút "Tạo STO"
    const btnAddSTO = document.querySelector('#page-inventory .page-header .btn[onclick*="showAddSTO"]');
    if (btnAddSTO) {
        btnAddSTO.style.display = (tab === 'wh-sto' && canCreateSTO) ? 'inline-block' : 'none';
    }

    let html = `
        <div class="tab-bar">
            <div class="tab ${tab === 'wh-list' ? 'active' : ''}" onclick="switchWarehouseTab('wh-list')">📋 Danh sách kho</div>
            <div class="tab ${tab === 'wh-grn' ? 'active' : ''}" onclick="switchWarehouseTab('wh-grn')">📥 Nhập kho (GRN)</div>
            <div class="tab ${tab === 'wh-sto' ? 'active' : ''}" onclick="switchWarehouseTab('wh-sto')">📤 Chuyển kho (STO)</div>
        </div>
        <div id="wh-tab-content">
    `;

    try {
        if (tab === 'wh-list') {
            html += await renderWarehouseListHTML();
        } else if (tab === 'wh-grn') {
            html += await renderGRNListHTML();
        } else if (tab === 'wh-sto') {
            html += await renderSTOListHTML();
        }
    } catch (error) {
        console.error('renderWarehousePage error:', error);
        html += `<div style="padding:20px; text-align:center; color:#e74c3c;">Lỗi tải dữ liệu: ${error.message}</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    if (tab === 'wh-grn') {
        attachGRNEvents();
    }
    if (tab === 'wh-sto') {
        attachSTOEvents();
    }
}

// ================================================================
// WAREHOUSE LIST
// ================================================================
async function renderWarehouseListHTML() {
    try {
        const warehouses = await api.getWarehouses();
        const inventory = await api.getInventory();
        const canEditInventory = hasPermission('inventory.edit');

        let filteredWarehouses = warehouses;
        if (!showAllWarehouses) {
            filteredWarehouses = warehouses.filter(w => w.status === 'ACTIVE');
        }

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                <span style="font-size:14px; color:#888;">
                    ${showAllWarehouses ? 'Hiển thị tất cả kho' : 'Chỉ hiển thị kho đang hoạt động'}
                </span>
                <button class="btn btn-sm" onclick="toggleWarehouseFilter()">
                    ${showAllWarehouses ? '🔽 Chỉ hiện hoạt động' : '🔼 Hiện tất cả'}
                </button>
            </div>
            <div class="warehouse-grid">
        `;

        if (!filteredWarehouses || filteredWarehouses.length === 0) {
            html += `<p style="grid-column:1/-1;text-align:center;color:#999;">Không có kho nào ${showAllWarehouses ? '' : 'đang hoạt động'}</p>`;
        } else {
            for (const w of filteredWarehouses) {
                const itemCount = (inventory || []).filter(i => i.warehouseId === w.id).length;
                const totalQty = (inventory || []).filter(i => i.warehouseId === w.id).reduce((s, i) => s + (i.quantity || 0), 0);
                const icon = w.type === 'CENTRAL' ? 'fa-warehouse' : 'fa-building';
                const statusBadge = w.status === 'ACTIVE' ?
                    '<span class="badge badge-status-active"><i class="fas fa-check-circle"></i> Đang hoạt động</span>' :
                    '<span class="badge badge-status-inactive"><i class="fas fa-times-circle"></i> Ngừng</span>';
                const projectName = w.type === 'SITE' ? await getProjectNameById(w.projectId) : '';

                html += `
                    <div class="warehouse-card" onclick="viewWarehouseDetail(${w.id})">
                        <div class="wh-status-badge">${statusBadge}</div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <i class="fas ${icon} wh-icon"></i><span class="wh-code">${w.code || '--'}</span>
                        </div>
                        <div class="wh-name">${w.name || '--'}</div>
                        <div><span class="badge-wh ${w.type === 'CENTRAL' ? 'badge-central' : 'badge-site'}">${w.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án'}</span>
                        ${w.type === 'SITE' ? ` <span style="font-size:13px;color:#666;">(Dự án: ${projectName || 'N/A'})</span>` : ''}</div>
                        <div class="wh-meta">
                            <span><i class="fas fa-cubes"></i> ${itemCount} loại</span>
                            <span><i class="fas fa-weight-hanging"></i> ${totalQty.toLocaleString()} đvt</span>
                        </div>
                        <div style="font-size:13px;color:#888;margin-top:4px;"><i class="fas fa-map-marker-alt"></i> ${w.address || 'Chưa có địa chỉ'}</div>
                        <div style="font-size:13px;color:#888;margin-top:2px;"><i class="fas fa-user"></i> ${w.manager || 'Chưa có quản lý'}</div>
                        ${canEditInventory ? `<div style="margin-top:8px;"><button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); showEditWarehouse(${w.id})"><i class="fas fa-edit"></i> Sửa</button></div>` : ''}
                    </div>
                `;
            }
        }

        html += `</div>`;
        return html;
    } catch (error) {
        console.error('renderWarehouseListHTML error:', error);
        return `<p style="color:red;">Lỗi tải dữ liệu kho: ${error.message}</p>`;
    }
}

function toggleWarehouseFilter() {
    showAllWarehouses = !showAllWarehouses;
    switchWarehouseTab('wh-list');
}

async function getProjectNameById(projectId) {
    if (!projectId) return 'Không áp dụng';
    try {
        const projects = await api.getProjects();
        const p = projects.find(pr => pr.id === projectId);
        return p ? p.name : 'Không tìm thấy';
    } catch {
        return 'Không tìm thấy';
    }
}

// ================================================================
// VIEW WAREHOUSE DETAIL
// ================================================================
async function viewWarehouseDetail(whId) {
    if (!hasPermission('inventory.view')) {
        showWarning('Bạn không có quyền xem chi tiết kho');
        return;
    }

    try {
        const warehouses = await api.getWarehouses();
        const wh = warehouses.find(w => w.id === whId);
        if (!wh) {
            showError('Không tìm thấy kho!');
            return;
        }
        const inventory = await api.getInventoryByWarehouse ? await api.getInventoryByWarehouse(whId) : await api.getInventory();
        const items = await api.getItems();
        const canEditInventory = hasPermission('inventory.edit');

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                <h3 style="margin:0;"><i class="fas fa-arrow-left" style="cursor:pointer; color:#1a3c6e; margin-right:12px;" onclick="switchWarehouseTab('wh-list')"></i> ${wh.code || '--'} - ${wh.name || '--'}</h3>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm" onclick="switchWarehouseTab('wh-list')"><i class="fas fa-arrow-left"></i> Quay lại</button>
                    ${canEditInventory ? `<button class="btn btn-sm" onclick="showEditWarehouse(${wh.id})"><i class="fas fa-edit"></i> Sửa kho</button>` : ''}
                    ${canEditInventory ? `<button class="btn btn-sm" onclick="showAddInventoryItem(${wh.id})"><i class="fas fa-plus"></i> Thêm tồn kho</button>` : ''}
                </div>
            </div>
            <div class="inventory-view">
                <div class="wh-detail-header">
                    <i class="fas ${wh.type === 'CENTRAL' ? 'fa-warehouse' : 'fa-building'} wh-icon-large"></i>
                    <div class="wh-info">
                        <div class="wh-title">${wh.code || '--'} - ${wh.name || '--'}</div>
                        <div class="wh-sub">
                            <span class="badge-wh ${wh.type === 'CENTRAL' ? 'badge-central' : 'badge-site'}">${wh.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án'}</span>
                            ${wh.type === 'SITE' ? ` | Dự án: ${await getProjectNameById(wh.projectId)}` : ''}
                            ${wh.status === 'ACTIVE' ? '<span class="badge badge-status-active">🟢 Đang hoạt động</span>' : '<span class="badge badge-status-inactive">🔴 Ngừng</span>'}
                        </div>
                        <div class="wh-sub"><i class="fas fa-map-marker-alt"></i> ${wh.address || 'Chưa có địa chỉ'} &nbsp;|&nbsp; <i class="fas fa-user"></i> ${wh.manager || 'Chưa có quản lý'}</div>
                        ${wh.note ? `<div class="wh-sub"><i class="fas fa-comment"></i> ${wh.note}</div>` : ''}
                    </div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead><tr><th>Mã</th><th>Tên vật tư</th><th>ĐVT</th><th>Số lượng</th>${canEditInventory ? '<th>HĐ</th>' : ''}</tr></thead>
                        <tbody>
        `;

        const invList = (inventory || []).filter(i => i.warehouseId === whId || i.warehouse_id === whId);
        if (!invList || invList.length === 0) {
            html += `<tr><td colspan="${canEditInventory ? 5 : 4}" style="text-align:center;color:#999;">Kho này chưa có vật tư</td></tr>`;
        } else {
            for (const inv of invList) {
                const item = items.find(i => i.id === (inv.itemId || inv.item_id));
                if (!item) continue;
                html += `<tr>
                    <td style="cursor:pointer;color:#1a3c6e;" onclick="closeModal(); viewItem(${item.id})">${item.code || '--'}</td>
                    <td style="cursor:pointer;color:#1a3c6e;" onclick="closeModal(); viewItem(${item.id})">${item.name || '--'}</td>
                    <td>${item.unit || ''}</td>
                    <td>${inv.quantity || 0}</td>`;
                if (canEditInventory) {
                    html += `<td>
                        <button class="btn btn-warning btn-sm" onclick="editInventoryItem(${inv.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteInventoryItem(${inv.id})"><i class="fas fa-trash"></i></button>
                    </td>`;
                }
                html += `</tr>`;
            }
        }
        html += `</tbody></table></div></div>`;
        document.getElementById('wh-tab-content').innerHTML = html;
    } catch (error) {
        showError('Lỗi khi tải chi tiết kho: ' + error.message);
    }
}

// ================================================================
// GRN - NHẬP KHO
// ================================================================
async function renderGRNListHTML() {
    try {
        const [grnList, projects, warehouses, statuses] = await Promise.all([
            api.getGRNs(),
            api.getProjects(),
            api.getWarehouses(),
            api.getStatuses('grn')
        ]);
        
        window._projectsCache = projects;
        window._warehousesCache = warehouses;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['grn'] = statuses;
        
        saveData('projects', projects);
        saveData('warehouses', warehouses);

        const canCreateGRN = hasPermission('grn.create');
        const canEditGRN = hasPermission('grn.edit');
        const canDeleteGRN = hasPermission('grn.delete');
        const canReceiveGRN = hasPermission('grn.receive');
        const canQCGRN = hasPermission('grn.qc');
        const canCompleteGRN = hasPermission('grn.complete');

        const keyword = grnState.filterText.toLowerCase().trim();
        let filtered = grnList.filter(g => {
            let matchKeyword = true;
            if (keyword) {
                const codeMatch = (g.code || '').toLowerCase().includes(keyword);
                const projectNameMatch = (g.projectName || '').toLowerCase().includes(keyword);
                const projectCodeMatch = (g.projectCode || '').toLowerCase().includes(keyword);
                const vendorNameMatch = (g.vendorName || '').toLowerCase().includes(keyword);
                const warehouseNameMatch = getWarehouseName(g.warehouseId).toLowerCase().includes(keyword);
                matchKeyword = codeMatch || projectNameMatch || projectCodeMatch || vendorNameMatch || warehouseNameMatch;
            }
            const matchStatus = grnState.statusFilter ? g.status === grnState.statusFilter : true;
            let matchProject = true;
            if (grnState.projectFilter) {
                const selectedProject = projects.find(p => p.code === grnState.projectFilter || p.id === parseInt(grnState.projectFilter));
                matchProject = selectedProject ? g.projectCode === selectedProject.code : false;
            }
            let matchWarehouse = true;
            if (grnState.warehouseFilter) {
                matchWarehouse = g.warehouseId === parseInt(grnState.warehouseFilter);
            }
            return matchKeyword && matchStatus && matchProject && matchWarehouse;
        });

        const order = grnState.sortOrder === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            let valA = a[grnState.sortBy] || '';
            let valB = b[grnState.sortBy] || '';
            if (grnState.sortBy === 'projectName') {
                valA = a.projectName || a.projectCode || '';
                valB = b.projectName || b.projectCode || '';
            } else if (grnState.sortBy === 'createdAt') {
                valA = new Date(a.createdAt || 0);
                valB = new Date(b.createdAt || 0);
            } else if (grnState.sortBy === 'status') {
                const statusOrder = { 'DRAFT': 0, 'RECEIVED': 1, 'QC_CHECKED': 2, 'COMPLETED': 3, 'REJECTED': 4 };
                valA = statusOrder[a.status] || 0;
                valB = statusOrder[b.status] || 0;
            }
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
        });

        const perPage = getPageSize('grn');
        grnState.perPage = perPage;
        const paging = paginate(filtered, grnState.page, perPage);

        let html = `
            <div class="filter-bar">
                <input type="text" id="grn-filter" placeholder="Tìm theo mã, dự án, NCC, kho..." style="flex:2;" value="${grnState.filterText}">
                <select id="grn-status-filter" style="flex:1;">
                    <option value="">Tất cả</option>
                    ${statuses.map(s => `<option value="${s.code}" ${grnState.statusFilter === s.code ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <select id="grn-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${grnState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="grn-warehouse-filter" style="flex:1;">
                    <option value="">Tất cả kho</option>
                    ${warehouses.map(w => `<option value="${w.id}" ${grnState.warehouseFilter == w.id ? 'selected' : ''}>${w.code} - ${w.name}</option>`).join('')}
                </select>
                <select id="grn-sort" style="flex:1;">
                    <option value="createdAt_desc" ${grnState.sortBy === 'createdAt' && grnState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${grnState.sortBy === 'createdAt' && grnState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="code_asc" ${grnState.sortBy === 'code' && grnState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${grnState.sortBy === 'code' && grnState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${grnState.sortBy === 'projectName' && grnState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${grnState.sortBy === 'projectName' && grnState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="status" ${grnState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetGRNFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Mã</th><th>PO</th><th>Dự án</th><th>Kho</th><th>NCC</th><th>Ngày nhập</th><th>Trạng thái</th><th>HĐ</th></tr></thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="8" style="text-align:center;color:#999;">Không có dữ liệu</td></tr>`;
        } else {
            for (const g of paging.items) {
                const po = await getPOById(g.poId);
                const projectId = po ? getProjectIdByCode(po.projectCode) : null;
                const projectLink = projectId ?
                    `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${g.projectName || ''}</span>` :
                    (g.projectName || '');
                const poLink = po ?
                    `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="viewPO(${po.id})">${po.code}</span>` :
                    `PO-${String(g.poId || '').padStart(3, '0')}`;
                const whLink = `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="showWarehouseInfoModal(${g.warehouseId})">${getWarehouseCode(g.warehouseId)}</span>`;
                const statusBadge = getStatusBadgeWithInfo(g.status, statuses);

                let actions = `<button class="btn btn-info btn-sm" onclick="viewGRN(${g.id})"><i class="fas fa-eye"></i></button>`;
                
                // ✅ SỬ DỤNG canApprove (đã sửa với level === step)
                const currentStep = g.approvalStep || 1;
                
                if (g.status === 'DRAFT' && canEditGRN) {
                    actions += ` <button class="btn btn-warning btn-sm" onclick="editGRN(${g.id})"><i class="fas fa-edit"></i></button>`;
                }
                
                if (g.status === 'DRAFT' && canReceiveGRN && canApprove(currentStep, 'grn.receive', null)) {
                    actions += ` <button class="btn btn-primary btn-sm" onclick="receiveGRN(${g.id})">Nhận vật tư</button>`;
                }
                
                if (g.status === 'RECEIVED' && canQCGRN && canApprove(currentStep, 'grn.qc', null)) {
                    actions += ` <button class="btn btn-primary btn-sm" onclick="qcCheckGRN(${g.id})">QC kiểm tra</button>`;
                }
                
                if (g.status === 'QC_CHECKED' && canCompleteGRN && canApprove(currentStep, 'grn.complete', null)) {
                    actions += ` <button class="btn btn-success btn-sm" onclick="completeGRN(${g.id})">Hoàn thành</button>`;
                }
                
                if ((g.status === 'DRAFT' || g.status === 'RECEIVED') && canDeleteGRN) {
                    actions += ` <button class="btn btn-danger btn-sm" onclick="deleteGRN(${g.id})"><i class="fas fa-trash"></i></button>`;
                }

                html += `<tr>
                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewGRN(${g.id})">${g.code || '--'}</td>
                    <td>${poLink}</td>
                    <td>${projectLink}</td>
                    <td>${whLink}</td>
                    <td>${g.vendorName || ''}</td>
                    <td>${g.receiptDate || ''}</td>
                    <td>${statusBadge}</td>
                    <td>${actions}</td>
                </tr>`;
            }
        }

        html += `</tbody></table></div>`;
        return html;
    } catch (error) {
        showError('Lỗi tải GRN: ' + error.message);
        return '<p style="color:red;">Lỗi tải dữ liệu</p>';
    }
}

async function getPOById(id) {
    try {
        const pos = await api.getPOs();
        return pos.find(p => p.id === id) || null;
    } catch {
        return null;
    }
}

function renderGRN() { switchWarehouseTab('wh-grn'); }

// ================================================================
// GRN CRUD & WORKFLOW
// ================================================================
function showAddGRN(poId = null) {
    if (!hasPermission('grn.create')) {
        showWarning('Bạn không có quyền tạo GRN');
        return;
    }
    api.getPOs().then(pos => {
        let poList = pos.filter(p => p.status === 'APPROVED' || p.status === 'COMPLETE');
        if (poId) {
            poList = poList.filter(p => p.id === poId);
            if (poList.length === 0) {
                showWarning('PO này chưa được duyệt hoặc đã có GRN.');
                return;
            }
        }
        if (!poList.length) {
            showWarning('Không có PO nào APPROVED để nhập kho.');
            return;
        }
        api.getWarehouses().then(warehouses => {
            const whOpts = warehouses.map(w => `<option value="${w.id}">${w.code} - ${w.name}</option>`).join('');
            const poOpts = poList.map(p => `<option value="${p.id}" ${p.id === poId ? 'selected' : ''}>${p.code} - ${p.projectName}</option>`).join('');
            showModal('Tạo phiếu nhập kho (GRN)', `
                <div class="form-group"><label>PO nguồn</label><select id="f-grn-po">${poOpts}</select></div>
                <div class="form-group"><label>Kho nhập</label><select id="f-grn-wh">${whOpts}</select></div>
                <div class="form-group"><label>Ngày nhập</label><input id="f-grn-date" type="date"></div>
                <div class="form-group"><label>Người giao</label><input id="f-grn-receiver"></div>
                <div class="form-group"><label>Thủ kho nhận</label><input id="f-grn-whstaff"></div>
                <div class="form-group"><label>QC xác nhận</label><input id="f-grn-qc"></div>
                <div class="form-group"><label>Kế toán xác nhận</label><input id="f-grn-accountant"></div>
                <div class="form-group"><label>Số hóa đơn/CO/CQ</label><input id="f-grn-invoice"></div>
                <div class="form-group"><label>Ghi chú</label><textarea id="f-grn-note" rows="2"></textarea></div>
                <div id="grn-items-container"></div>
                <div class="modal-actions">
                    <button class="btn" onclick="saveGRN()">Lưu</button>
                    <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
                </div>
            `);
            document.getElementById('f-grn-po').addEventListener('change', function() {
                loadGRNItemsFromPO(parseInt(this.value));
            });
            setTimeout(() => {
                const selectedPoId = parseInt(document.getElementById('f-grn-po').value);
                if (selectedPoId) loadGRNItemsFromPO(selectedPoId);
            }, 100);
        }).catch(err => showError('Không thể tải kho: ' + err.message));
    }).catch(err => showError('Không thể tải PO: ' + err.message));
}

async function loadGRNItemsFromPO(poId) {
    try {
        const pos = await api.getPOs();
        const po = pos.find(p => p.id === poId);
        if (!po) return;
        const container = document.getElementById('grn-items-container');
        let items = [];
        try {
            if (po.items) {
                items = typeof po.items === 'string' ? JSON.parse(po.items) : po.items;
            }
        } catch (e) { items = []; }
        let html = `<div class="form-group"><label>Danh sách vật tư</label>`;
        items.forEach(item => {
            const itemName = getItemName(item.itemId);
            const unit = getItemUnit(item.itemId);
            html += `
                <div class="item-row" data-item-id="${item.itemId}">
                    <span style="min-width:150px;">${itemName || '--'} (${unit || ''})</span>
                    <input type="number" class="grn-po-qty" value="${item.quantity || 0}" readonly style="width:80px; background:#f0f0f0;">
                    <input type="number" class="grn-actual-qty" value="${item.quantity || 0}" placeholder="Thực nhận" style="width:100px;" step="0.01">
                    <input type="text" class="grn-serial" placeholder="Serial/Lô" style="width:150px;">
                    <select class="grn-condition"><option value="GOOD">Tốt</option><option value="DAMAGED">Hỏng</option><option value="REJECTED">Từ chối</option></select>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    } catch (error) {
        showError('Lỗi tải items từ PO: ' + error.message);
    }
}

async function saveGRN() {
    if (!hasPermission('grn.create')) {
        showWarning('Bạn không có quyền tạo GRN');
        return;
    }
    const poId = parseInt(document.getElementById('f-grn-po').value);
    const warehouseId = parseInt(document.getElementById('f-grn-wh').value);
    const receiptDate = document.getElementById('f-grn-date').value;
    const receiver = document.getElementById('f-grn-receiver').value.trim();
    const whstaff = document.getElementById('f-grn-whstaff').value.trim();
    const qc = document.getElementById('f-grn-qc').value.trim();
    const accountant = document.getElementById('f-grn-accountant').value.trim();
    const invoice = document.getElementById('f-grn-invoice').value.trim();
    const note = document.getElementById('f-grn-note').value.trim();
    if (!poId || !warehouseId || !receiptDate) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    try {
        const pos = await api.getPOs();
        const po = pos.find(p => p.id === poId);
        if (!po) {
            showError('Không tìm thấy PO!');
            return;
        }
        const rows = document.querySelectorAll('#grn-items-container .item-row');
        const items = [];
        let hasError = false;
        rows.forEach(row => {
            const itemId = parseInt(row.dataset.itemId);
            const poQty = parseFloat(row.querySelector('.grn-po-qty')?.value) || 0;
            const actualQty = parseFloat(row.querySelector('.grn-actual-qty')?.value) || 0;
            const serial = row.querySelector('.grn-serial')?.value || '';
            const condition = row.querySelector('.grn-condition')?.value || 'GOOD';
            if (actualQty < 0) {
                showError(`Số lượng thực nhận của ${getItemName(itemId)} không được âm.`);
                hasError = true;
                return;
            }
            if (actualQty > poQty) {
                showError(`Số lượng thực nhận của ${getItemName(itemId)} không được vượt quá PO (${poQty}).`);
                hasError = true;
                return;
            }
            items.push({ itemId, poQty, actualQty, diff: actualQty - poQty, serial, condition });
        });
        if (hasError || !items.length) return;

        const newGRN = {
            poId,
            projectCode: po.projectCode,
            projectName: po.projectName,
            warehouseId,
            vendorCode: po.vendorCode,
            vendorName: po.vendorName,
            items: JSON.stringify(items),
            receiptDate,
            receiver,
            warehouseStaff: whstaff,
            qcConfirm: qc,
            accountantConfirm: accountant,
            invoice,
            note
        };

        await api.createGRN(newGRN);
        closeModal();
        switchWarehouseTab('wh-grn');
        showSuccess('Tạo phiếu nhập thành công!');
    } catch (error) {
        showError('Lỗi khi tạo GRN: ' + error.message);
    }
}

// ====== VIEW GRN ======
async function viewGRN(id) {
    try {
        let g = await api.getGRNById ? await api.getGRNById(id) : null;
        if (!g) {
            const grns = await api.getGRNs();
            g = grns.find(item => item.id === id);
            if (!g) {
                showError('Không tìm thấy phiếu nhập!');
                return;
            }
        }
        
        const statuses = await api.getStatuses('grn');
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['grn'] = statuses;
        
        let items = [];
        try {
            if (g.items) {
                items = typeof g.items === 'string' ? JSON.parse(g.items) : g.items;
            }
        } catch (e) { items = []; }

        let itemsHtml = items.map(it => {
            const item = getItemName(it.itemId);
            return `<tr><td>${getItemCode(it.itemId)}</td><td>${item}</td><td>${it.poQty || 0}</td><td>${it.actualQty || 0}</td><td>${it.diff || (it.actualQty - it.poQty)}</td><td>${it.serial || ''}</td><td>${it.condition || ''}</td></tr>`;
        }).join('');

        let stepsConfig = [
            { id: 1, label: 'Lập phiếu' },
            { id: 2, label: 'Thủ kho nhận' },
            { id: 3, label: 'QC kiểm tra' },
            { id: 4, label: 'Hoàn thành' }
        ];
        if (g.workflowId) {
            try {
                const wf = await api.getWorkflowById ? await api.getWorkflowById(g.workflowId) : null;
                if (wf && wf.steps) {
                    const steps = JSON.parse(wf.steps);
                    stepsConfig = steps.map(s => ({
                        id: s.step || s.id,
                        label: s.label || `Bước ${s.step || s.id}`
                    }));
                }
            } catch (e) {
                console.warn('Không lấy được workflow steps:', e);
            }
        }
        const currentStep = g.approvalStep || 1;
        const progressHtml = renderApprovalProgress(g.status, currentStep, stepsConfig, statuses);
        const statusBadge = getStatusBadgeWithInfo(g.status, statuses);

        showModal('Chi tiết phiếu nhập', `
            <div class="detail-grid">
                <div><span class="label">Mã phiếu:</span> <span class="value">${g.code || '--'}</span></div>
                <div><span class="label">PO liên quan:</span> <span class="value">${g.poId ? 'PO-'+String(g.poId).padStart(3,'0') : ''}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${g.projectName || ''}</span></div>
                <div><span class="label">Kho:</span> <span class="value">${getWarehouseName(g.warehouseId)}</span></div>
                <div><span class="label">Nhà cung cấp:</span> <span class="value">${g.vendorName || ''}</span></div>
                <div><span class="label">Ngày nhập:</span> <span class="value">${g.receiptDate || ''}</span></div>
                <div><span class="label">Người giao:</span> <span class="value">${g.receiver || ''}</span></div>
                <div><span class="label">Thủ kho nhận:</span> <span class="value">${g.warehouseStaff || ''}</span></div>
                <div><span class="label">QC xác nhận:</span> <span class="value">${g.qcConfirm || ''}</span></div>
                <div><span class="label">Kế toán xác nhận:</span> <span class="value">${g.accountantConfirm || ''}</span></div>
                <div><span class="label">Hóa đơn:</span> <span class="value">${g.invoice || ''}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${statusBadge}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Tiến độ thực hiện:</span><br>${progressHtml}</div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${g.note || ''}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Chi tiết vật tư:</span>
                    <div class="table-responsive">
                        <table><thead><tr><th>Mã</th><th>Tên</th><th>PO Qty</th><th>Actual</th><th>Chênh lệch</th><th>Serial/Lô</th><th>Tình trạng</th></tr></thead>
                        <tbody>${itemsHtml}</tbody></table>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printGRN(${g.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết GRN: ' + error.message);
    }
}

// ====== EDIT GRN ======
async function editGRN(id) {
    if (!hasPermission('grn.edit')) {
        showWarning('Bạn không có quyền sửa GRN');
        return;
    }
    try {
        let grn = await api.getGRNById ? await api.getGRNById(id) : null;
        if (!grn) {
            const grns = await api.getGRNs();
            grn = grns.find(g => g.id === id);
            if (!grn) {
                showError('Không tìm thấy phiếu!');
                return;
            }
        }
        if (grn.status !== 'DRAFT') {
            showWarning('Chỉ có thể sửa phiếu ở trạng thái DRAFT.');
            return;
        }
        let items = [];
        try {
            if (grn.items) {
                items = typeof grn.items === 'string' ? JSON.parse(grn.items) : grn.items;
            }
        } catch (e) { items = []; }
        let itemsHtml = items.map(it => {
            const itemName = getItemName(it.itemId);
            const unit = getItemUnit(it.itemId);
            return `
                <div class="item-row" data-item-id="${it.itemId}">
                    <span style="min-width:150px; font-weight:500;">${itemName || '--'} (${unit || ''})</span>
                    <input type="number" class="grn-po-qty" value="${it.poQty || 0}" readonly style="width:80px; background:#f0f0f0;">
                    <input type="number" class="grn-actual-qty" value="${it.actualQty || 0}" placeholder="Thực nhận" style="width:100px;" step="0.01">
                    <input type="text" class="grn-serial" value="${it.serial || ''}" placeholder="Serial/Lô" style="width:150px;">
                    <select class="grn-condition">
                        <option value="GOOD" ${it.condition === 'GOOD' ? 'selected' : ''}>Tốt</option>
                        <option value="DAMAGED" ${it.condition === 'DAMAGED' ? 'selected' : ''}>Hỏng</option>
                        <option value="REJECTED" ${it.condition === 'REJECTED' ? 'selected' : ''}>Từ chối</option>
                    </select>
                </div>
            `;
        }).join('');

        showModal('Sửa phiếu nhập kho', `
            <div class="form-group"><label>Mã phiếu</label><input value="${grn.code || '--'}" readonly style="background:#f0f0f0;"></div>
            <div class="form-group"><label>Ngày nhập</label><input id="f-grn-edit-date" type="date" value="${grn.receiptDate || ''}"></div>
            <div class="form-group"><label>Người giao</label><input id="f-grn-edit-receiver" value="${grn.receiver || ''}"></div>
            <div class="form-group"><label>Thủ kho nhận</label><input id="f-grn-edit-whstaff" value="${grn.warehouseStaff || ''}"></div>
            <div class="form-group"><label>QC xác nhận</label><input id="f-grn-edit-qc" value="${grn.qcConfirm || ''}"></div>
            <div class="form-group"><label>Kế toán xác nhận</label><input id="f-grn-edit-accountant" value="${grn.accountantConfirm || ''}"></div>
            <div class="form-group"><label>Số hóa đơn / CO / CQ</label><input id="f-grn-edit-invoice" value="${grn.invoice || ''}"></div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-grn-edit-note" rows="2">${grn.note || ''}</textarea></div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="grn-edit-items-container">${itemsHtml}</div>
                <div style="font-size:13px; color:#888; margin-top:4px;"><i class="fas fa-info-circle"></i> Chỉnh sửa số lượng thực nhận, serial và tình trạng.</div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateGRN(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải GRN: ' + error.message);
    }
}

async function updateGRN(id) {
    const receiptDate = document.getElementById('f-grn-edit-date').value;
    const receiver = document.getElementById('f-grn-edit-receiver').value.trim();
    const whstaff = document.getElementById('f-grn-edit-whstaff').value.trim();
    const qc = document.getElementById('f-grn-edit-qc').value.trim();
    const accountant = document.getElementById('f-grn-edit-accountant').value.trim();
    const invoice = document.getElementById('f-grn-edit-invoice').value.trim();
    const note = document.getElementById('f-grn-edit-note').value.trim();

    if (!receiptDate) {
        showError('Vui lòng chọn ngày nhập.');
        return;
    }

    try {
        const rows = document.querySelectorAll('#grn-edit-items-container .item-row');
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (!grn) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        let items = [];
        try {
            if (grn.items) {
                items = typeof grn.items === 'string' ? JSON.parse(grn.items) : grn.items;
            }
        } catch (e) { items = []; }
        let hasError = false;
        rows.forEach(row => {
            const itemId = parseInt(row.dataset.itemId);
            const actualQty = parseFloat(row.querySelector('.grn-actual-qty')?.value) || 0;
            const serial = row.querySelector('.grn-serial')?.value || '';
            const condition = row.querySelector('.grn-condition')?.value || 'GOOD';
            const item = items.find(it => it.itemId === itemId);
            if (!item) return;
            if (actualQty < 0) {
                showError(`Số lượng thực nhận của ${getItemName(itemId)} không được âm.`);
                hasError = true;
                return;
            }
            if (actualQty > item.poQty) {
                showError(`Số lượng thực nhận của ${getItemName(itemId)} không được vượt quá PO (${item.poQty}).`);
                hasError = true;
                return;
            }
            item.actualQty = actualQty;
            item.diff = actualQty - item.poQty;
            item.serial = serial;
            item.condition = condition;
        });
        if (hasError) return;

        const updatedGRN = {
            ...grn,
            receiptDate,
            receiver,
            warehouseStaff: whstaff,
            qcConfirm: qc,
            accountantConfirm: accountant,
            invoice,
            note,
            items: JSON.stringify(items)
        };
        await api.updateGRN(id, updatedGRN);
        closeModal();
        switchWarehouseTab('wh-grn');
        showSuccess('Cập nhật phiếu nhập thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật GRN: ' + error.message);
    }
}

// ====== RECEIVE GRN ======
async function receiveGRN(id) {
    if (!hasPermission('grn.receive')) {
        showWarning('Bạn không có quyền nhận GRN');
        return;
    }
    try {
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (!grn) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (grn.status !== 'DRAFT') {
            showWarning('Chỉ có thể nhận phiếu ở trạng thái DRAFT.');
            return;
        }
        let items = [];
        try {
            if (grn.items) {
                items = typeof grn.items === 'string' ? JSON.parse(grn.items) : grn.items;
            }
        } catch (e) { items = []; }
        let itemsHtml = items.map(it => {
            const itemName = getItemName(it.itemId);
            const unit = getItemUnit(it.itemId);
            return `
                <div class="item-row" data-item-id="${it.itemId}">
                    <span style="min-width:150px; font-weight:500;">${itemName || '--'} (${unit || ''})</span>
                    <input type="number" class="grn-po-qty" value="${it.poQty || 0}" readonly style="width:80px; background:#f0f0f0;">
                    <input type="number" class="grn-actual-qty" value="${it.actualQty || 0}" placeholder="Thực nhận" style="width:100px;" step="0.01">
                    <input type="text" class="grn-serial" value="${it.serial || ''}" placeholder="Serial/Lô" style="width:150px;">
                    <select class="grn-condition">
                        <option value="GOOD" ${it.condition === 'GOOD' ? 'selected' : ''}>Tốt</option>
                        <option value="DAMAGED" ${it.condition === 'DAMAGED' ? 'selected' : ''}>Hỏng</option>
                        <option value="REJECTED" ${it.condition === 'REJECTED' ? 'selected' : ''}>Từ chối</option>
                    </select>
                </div>
            `;
        }).join('');

        showModal('Thủ kho nhận vật tư', `
            <div style="margin-bottom:12px;">
                <strong>Phiếu:</strong> ${grn.code || '--'} - ${grn.projectName || ''}
            </div>
            <div class="form-group">
                <label>Thủ kho nhận</label>
                <input id="f-grn-whstaff" value="${grn.warehouseStaff || getUser()?.name || ''}" placeholder="Tên thủ kho">
            </div>
            <div class="form-group">
                <label>Ngày nhận</label>
                <input id="f-grn-receive-date" type="date" value="${grn.receiptDate || new Date().toISOString().slice(0,10)}">
            </div>
            <div class="form-group">
                <label>Danh sách vật tư (nhập số lượng thực nhận)</label>
                <div id="grn-receive-items-container">${itemsHtml}</div>
                <div style="font-size:13px; color:#888; margin-top:4px;">
                    <i class="fas fa-info-circle"></i> Số lượng thực nhận không được vượt quá PO.
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="confirmReceiveGRN(${id})">Xác nhận nhận</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải GRN: ' + error.message);
    }
}

async function confirmReceiveGRN(id) {
    const whstaff = document.getElementById('f-grn-whstaff').value.trim();
    const receiptDate = document.getElementById('f-grn-receive-date').value;
    if (!whstaff || !receiptDate) {
        showError('Vui lòng nhập đầy đủ thông tin.');
        return;
    }

    try {
        const rows = document.querySelectorAll('#grn-receive-items-container .item-row');
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (!grn) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        let items = [];
        try {
            if (grn.items) {
                items = typeof grn.items === 'string' ? JSON.parse(grn.items) : grn.items;
            }
        } catch (e) { items = []; }
        let hasError = false;
        const updatedItems = [];
        rows.forEach(row => {
            const itemId = parseInt(row.dataset.itemId);
            const actualQty = parseFloat(row.querySelector('.grn-actual-qty').value) || 0;
            const serial = row.querySelector('.grn-serial').value || '';
            const condition = row.querySelector('.grn-condition').value || 'GOOD';
            const original = items.find(it => it.itemId === itemId);
            if (!original) return;
            if (actualQty < 0) {
                showError(`Số lượng thực nhận của ${getItemName(itemId)} không được âm.`);
                hasError = true;
                return;
            }
            if (actualQty > original.poQty) {
                showError(`Số lượng thực nhận của ${getItemName(itemId)} không được vượt quá PO (${original.poQty}).`);
                hasError = true;
                return;
            }
            updatedItems.push({
                ...original,
                actualQty,
                serial,
                condition,
                diff: actualQty - original.poQty
            });
        });
        if (hasError) return;

        grn.items = JSON.stringify(updatedItems);
        grn.warehouseStaff = whstaff;
        grn.receiptDate = receiptDate;
        grn.status = 'RECEIVED';
        await api.updateGRN(id, grn);
        closeModal();
        switchWarehouseTab('wh-grn');
        showSuccess('Đã nhận vật tư! Chờ QC kiểm tra.');
    } catch (error) {
        showError('Lỗi khi xác nhận nhận: ' + error.message);
    }
}

// ====== QC CHECK GRN ======
async function qcCheckGRN(id) {
    if (!hasPermission('grn.qc')) {
        showWarning('Bạn không có quyền QC GRN');
        return;
    }
    try {
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (!grn) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (grn.status !== 'RECEIVED') {
            showWarning('Phiếu chưa được thủ kho nhận hoặc đã qua bước này.');
            return;
        }

        showModal('QC kiểm tra chất lượng', `
            <div style="margin-bottom:12px;">
                <strong>Phiếu:</strong> ${grn.code || '--'} - ${grn.projectName || ''}
            </div>
            <div class="form-group">
                <label>QC xác nhận</label>
                <input id="f-grn-qc" value="${grn.qcConfirm || getUser()?.name || ''}" placeholder="Tên QC">
            </div>
            <div class="form-group">
                <label>Kết quả kiểm tra</label>
                <select id="f-grn-qc-result" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    <option value="PASS">Đạt</option>
                    <option value="FAIL">Không đạt</option>
                    <option value="PARTIAL">Đạt một phần</option>
                </select>
            </div>
            <div class="form-group">
                <label>Ghi chú QC</label>
                <textarea id="f-grn-qc-note" rows="2" placeholder="Nhận xét của QC..."></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="confirmQCCheckGRN(${id})">Xác nhận QC</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải GRN: ' + error.message);
    }
}

async function confirmQCCheckGRN(id) {
    const qcName = document.getElementById('f-grn-qc').value.trim();
    const qcResult = document.getElementById('f-grn-qc-result').value;
    const qcNote = document.getElementById('f-grn-qc-note').value.trim();
    if (!qcName) {
        showError('Vui lòng nhập tên QC.');
        return;
    }

    try {
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (!grn) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (qcResult === 'FAIL') {
            grn.note = (grn.note || '') + ` | QC: ${qcName} - KHÔNG ĐẠT - ${qcNote}`;
            grn.status = 'REJECTED';
            await api.updateGRN(id, grn);
            showWarning('QC đánh giá không đạt. Vui lòng xử lý.');
        } else {
            grn.qcConfirm = qcName;
            grn.status = 'QC_CHECKED';
            grn.note = (grn.note || '') + ` | QC: ${qcName} - ${qcResult} - ${qcNote}`;
            await api.updateGRN(id, grn);
            showSuccess('QC xác nhận thành công! Chờ thủ kho hoàn thành nhập kho.');
        }
        closeModal();
        switchWarehouseTab('wh-grn');
    } catch (error) {
        showError('Lỗi khi xác nhận QC: ' + error.message);
    }
}

// ====== COMPLETE GRN ======
async function completeGRN(id) {
    if (!hasPermission('grn.complete')) {
        showWarning('Bạn không có quyền hoàn thành GRN');
        return;
    }
    try {
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (!grn) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        if (grn.status !== 'QC_CHECKED') {
            showWarning('Vui lòng đợi QC kiểm tra xong trước khi hoàn thành.');
            return;
        }
        if (!confirm('Xác nhận hoàn thành phiếu nhập? Hàng sẽ được cập nhật vào kho.')) return;

        withLoading(async () => {
            await api.completeGRN(id);
            switchWarehouseTab('wh-grn');
            showSuccess('Hoàn thành nhập kho! Tồn kho đã được cập nhật.');
        }, 'Đang xử lý nhập kho...');
    } catch (error) {
        showError('Lỗi khi hoàn thành GRN: ' + error.message);
    }
}

// ====== DELETE GRN ======
async function deleteGRN(id) {
    if (!hasPermission('grn.delete')) {
        showWarning('Bạn không có quyền xóa GRN');
        return;
    }
    if (!confirm('Xóa phiếu nhập này?')) return;
    try {
        const grns = await api.getGRNs();
        const grn = grns.find(g => g.id === id);
        if (grn && grn.status === 'COMPLETED') {
            showWarning('Không thể xóa phiếu đã hoàn thành.');
            return;
        }
        await api.deleteGRN(id);
        switchWarehouseTab('wh-grn');
        showSuccess('Xóa GRN thành công!');
    } catch (error) {
        showError('Lỗi khi xóa GRN: ' + error.message);
    }
}

function attachGRNEvents() {
    const filterInput = document.getElementById('grn-filter');
    const statusSelect = document.getElementById('grn-status-filter');
    const projectSelect = document.getElementById('grn-project-filter');
    const warehouseSelect = document.getElementById('grn-warehouse-filter');
    const sortSelect = document.getElementById('grn-sort');

    if (filterInput) {
        filterInput.removeEventListener('input', debouncedGRNFilter);
        filterInput.addEventListener('input', function(e) {
            grnState.filterText = this.value;
            debouncedGRNFilter();
        });
    }
    if (statusSelect) {
        statusSelect.removeEventListener('change', debouncedGRNFilter);
        statusSelect.addEventListener('change', function(e) {
            grnState.statusFilter = this.value;
            debouncedGRNFilter();
        });
    }
    if (projectSelect) {
        projectSelect.removeEventListener('change', debouncedGRNFilter);
        projectSelect.addEventListener('change', function(e) {
            grnState.projectFilter = this.value;
            debouncedGRNFilter();
        });
    }
    if (warehouseSelect) {
        warehouseSelect.removeEventListener('change', debouncedGRNFilter);
        warehouseSelect.addEventListener('change', function(e) {
            grnState.warehouseFilter = this.value;
            debouncedGRNFilter();
        });
    }
    if (sortSelect) {
        sortSelect.removeEventListener('change', debouncedGRNFilter);
        sortSelect.addEventListener('change', function(e) {
            const [sortBy, sortOrder] = this.value.split('_');
            grnState.sortBy = sortBy;
            grnState.sortOrder = sortOrder || 'desc';
            debouncedGRNFilter();
        });
    }
}

function resetGRNFilters() {
    grnState.filterText = '';
    grnState.statusFilter = '';
    grnState.projectFilter = '';
    grnState.warehouseFilter = '';
    grnState.sortBy = 'createdAt';
    grnState.sortOrder = 'desc';
    grnState.page = 1;
    switchWarehouseTab('wh-grn');
}

// ================================================================
// STO - CHUYỂN KHO
// ================================================================
async function renderSTOListHTML() {
    try {
        const [stoList, projects, warehouses, statuses] = await Promise.all([
            api.getSTOs(),
            api.getProjects(),
            api.getWarehouses(),
            api.getStatuses('sto')
        ]);
        
        window._projectsCache = projects;
        window._warehousesCache = warehouses;
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['sto'] = statuses;
        
        saveData('projects', projects);
        saveData('warehouses', warehouses);

        const canCreateSTO = hasPermission('sto.create');
        const canEditSTO = hasPermission('sto.edit');
        const canDeleteSTO = hasPermission('sto.delete');
        const canSubmitSTO = hasPermission('sto.submit');
        const canApproveSTO = hasPermission('sto.approve');
        const canCompleteSTO = hasPermission('sto.complete');

        const keyword = stoState.filterText.toLowerCase().trim();
        let filtered = stoList.filter(s => {
            let matchKeyword = true;
            if (keyword) {
                const codeMatch = (s.code || '').toLowerCase().includes(keyword);
                const projectNameMatch = (s.projectName || '').toLowerCase().includes(keyword);
                const projectCodeMatch = (s.projectCode || '').toLowerCase().includes(keyword);
                const fromWhName = getWarehouseName(s.fromWarehouseId).toLowerCase().includes(keyword);
                const toWhName = getWarehouseName(s.toWarehouseId).toLowerCase().includes(keyword);
                matchKeyword = codeMatch || projectNameMatch || projectCodeMatch || fromWhName || toWhName;
            }
            const matchStatus = stoState.statusFilter ? s.status === stoState.statusFilter : true;
            let matchProject = true;
            if (stoState.projectFilter) {
                const selectedProject = projects.find(p => p.code === stoState.projectFilter || p.id === parseInt(stoState.projectFilter));
                matchProject = selectedProject ? s.projectCode === selectedProject.code : false;
            }
            let matchFromWarehouse = true;
            if (stoState.fromWarehouseFilter) {
                matchFromWarehouse = s.fromWarehouseId === parseInt(stoState.fromWarehouseFilter);
            }
            let matchToWarehouse = true;
            if (stoState.toWarehouseFilter) {
                matchToWarehouse = s.toWarehouseId === parseInt(stoState.toWarehouseFilter);
            }
            return matchKeyword && matchStatus && matchProject && matchFromWarehouse && matchToWarehouse;
        });

        const order = stoState.sortOrder === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            let valA = a[stoState.sortBy] || '';
            let valB = b[stoState.sortBy] || '';
            if (stoState.sortBy === 'projectName') {
                valA = a.projectName || a.projectCode || '';
                valB = b.projectName || b.projectCode || '';
            } else if (stoState.sortBy === 'createdAt') {
                valA = new Date(a.createdAt || 0);
                valB = new Date(b.createdAt || 0);
            } else if (stoState.sortBy === 'status') {
                const statusOrder = { 'DRAFT': 0, 'PENDING': 1, 'APPROVED': 2, 'COMPLETED': 3 };
                valA = statusOrder[a.status] || 0;
                valB = statusOrder[b.status] || 0;
            }
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
        });

        const perPage = getPageSize('sto');
        stoState.perPage = perPage;
        const paging = paginate(filtered, stoState.page, perPage);

        let html = `
            <div class="filter-bar">
                <input type="text" id="sto-filter" placeholder="Tìm theo mã, dự án, kho..." style="flex:2;" value="${stoState.filterText}">
                <select id="sto-status-filter" style="flex:1;">
                    <option value="">Tất cả</option>
                    ${statuses.map(s => `<option value="${s.code}" ${stoState.statusFilter === s.code ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <select id="sto-project-filter" style="flex:1;">
                    <option value="">Tất cả dự án</option>
                    ${projects.map(p => `<option value="${p.code}" ${stoState.projectFilter === p.code ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('')}
                </select>
                <select id="sto-from-warehouse-filter" style="flex:1;">
                    <option value="">Tất cả kho đi</option>
                    ${warehouses.map(w => `<option value="${w.id}" ${stoState.fromWarehouseFilter == w.id ? 'selected' : ''}>${w.code} - ${w.name}</option>`).join('')}
                </select>
                <select id="sto-to-warehouse-filter" style="flex:1;">
                    <option value="">Tất cả kho đến</option>
                    ${warehouses.map(w => `<option value="${w.id}" ${stoState.toWarehouseFilter == w.id ? 'selected' : ''}>${w.code} - ${w.name}</option>`).join('')}
                </select>
                <select id="sto-sort" style="flex:1;">
                    <option value="createdAt_desc" ${stoState.sortBy === 'createdAt' && stoState.sortOrder === 'desc' ? 'selected' : ''}>Ngày tạo (mới nhất)</option>
                    <option value="createdAt_asc" ${stoState.sortBy === 'createdAt' && stoState.sortOrder === 'asc' ? 'selected' : ''}>Ngày tạo (cũ nhất)</option>
                    <option value="code_asc" ${stoState.sortBy === 'code' && stoState.sortOrder === 'asc' ? 'selected' : ''}>Mã (A→Z)</option>
                    <option value="code_desc" ${stoState.sortBy === 'code' && stoState.sortOrder === 'desc' ? 'selected' : ''}>Mã (Z→A)</option>
                    <option value="projectName_asc" ${stoState.sortBy === 'projectName' && stoState.sortOrder === 'asc' ? 'selected' : ''}>Dự án (A→Z)</option>
                    <option value="projectName_desc" ${stoState.sortBy === 'projectName' && stoState.sortOrder === 'desc' ? 'selected' : ''}>Dự án (Z→A)</option>
                    <option value="status" ${stoState.sortBy === 'status' ? 'selected' : ''}>Trạng thái</option>
                </select>
                <button class="btn btn-sm" onclick="resetSTOFilters()"><i class="fas fa-undo"></i> Reset</button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead><tr><th>Mã</th><th>Kho đi</th><th>Kho đến</th><th>Dự án</th><th>Ngày xuất</th><th>Trạng thái</th><th>HĐ</th></tr></thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="7" style="text-align:center;color:#999;">Chưa có phiếu chuyển kho</td></tr>`;
        } else {
            for (const s of paging.items) {
                const projectId = getProjectIdByCode(s.projectCode);
                const projectLink = projectId ?
                    `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="closeModal(); viewProject(${projectId});">${s.projectName || ''}</span>` :
                    (s.projectName || '');
                const fromWhLink = `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="showWarehouseInfoModal(${s.fromWarehouseId})">${getWarehouseCode(s.fromWarehouseId)}</span>`;
                const toWhLink = `<span style="cursor:pointer; color:#1a3c6e; text-decoration:underline;" onclick="showWarehouseInfoModal(${s.toWarehouseId})">${getWarehouseCode(s.toWarehouseId)}</span>`;
                const statusBadge = getStatusBadgeWithInfo(s.status, statuses);

                let actions = `<button class="btn btn-info btn-sm" onclick="viewSTO(${s.id})"><i class="fas fa-eye"></i></button>`;
                
                // ✅ SỬ DỤNG canApprove (đã sửa với level === step)
                const currentStep = s.approvalStep || 1;
                
                if (s.status === 'DRAFT' && canEditSTO) {
                    actions += ` <button class="btn btn-warning btn-sm" onclick="editSTO(${s.id})"><i class="fas fa-edit"></i></button>`;
                }
                
                if (s.status === 'DRAFT' && canSubmitSTO && canApprove(currentStep, 'sto.submit', null)) {
                    actions += ` <button class="btn btn-success btn-sm" onclick="submitSTO(${s.id})">Xác nhận</button>`;
                }
                
                if (s.status === 'PENDING' && canApproveSTO && canApprove(currentStep, 'sto.approve', null)) {
                    actions += ` <button class="btn btn-success btn-sm" onclick="approveSTO(${s.id})">Duyệt</button>`;
                }
                
                if (s.status === 'APPROVED' && canCompleteSTO && canApprove(currentStep, 'sto.complete', null)) {
                    actions += ` <button class="btn btn-success btn-sm" onclick="completeSTO(${s.id})">Hoàn thành</button>`;
                }
                
                if ((s.status === 'DRAFT' || s.status === 'PENDING') && canDeleteSTO) {
                    actions += ` <button class="btn btn-danger btn-sm" onclick="deleteSTO(${s.id})"><i class="fas fa-trash"></i></button>`;
                }

                html += `<tr>
                    <td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="viewSTO(${s.id})">${s.code || '--'}</td>
                    <td>${fromWhLink}</td>
                    <td>${toWhLink}</td>
                    <td>${projectLink}</td>
                    <td>${s.transferDate || ''}</td>
                    <td>${statusBadge}</td>
                    <td>${actions}</td>
                </tr>`;
            }
        }

        html += `</tbody></table></div>`;
        return html;
    } catch (error) {
        showError('Lỗi tải STO: ' + error.message);
        return '<p style="color:red;">Lỗi tải dữ liệu</p>';
    }
}

function attachSTOEvents() {
    const filterInput = document.getElementById('sto-filter');
    const statusSelect = document.getElementById('sto-status-filter');
    const projectSelect = document.getElementById('sto-project-filter');
    const fromWarehouseSelect = document.getElementById('sto-from-warehouse-filter');
    const toWarehouseSelect = document.getElementById('sto-to-warehouse-filter');
    const sortSelect = document.getElementById('sto-sort');

    if (filterInput) {
        filterInput.removeEventListener('input', debouncedSTOFilter);
        filterInput.addEventListener('input', function(e) {
            stoState.filterText = this.value;
            debouncedSTOFilter();
        });
    }
    if (statusSelect) {
        statusSelect.removeEventListener('change', debouncedSTOFilter);
        statusSelect.addEventListener('change', function(e) {
            stoState.statusFilter = this.value;
            debouncedSTOFilter();
        });
    }
    if (projectSelect) {
        projectSelect.removeEventListener('change', debouncedSTOFilter);
        projectSelect.addEventListener('change', function(e) {
            stoState.projectFilter = this.value;
            debouncedSTOFilter();
        });
    }
    if (fromWarehouseSelect) {
        fromWarehouseSelect.removeEventListener('change', debouncedSTOFilter);
        fromWarehouseSelect.addEventListener('change', function(e) {
            stoState.fromWarehouseFilter = this.value;
            debouncedSTOFilter();
        });
    }
    if (toWarehouseSelect) {
        toWarehouseSelect.removeEventListener('change', debouncedSTOFilter);
        toWarehouseSelect.addEventListener('change', function(e) {
            stoState.toWarehouseFilter = this.value;
            debouncedSTOFilter();
        });
    }
    if (sortSelect) {
        sortSelect.removeEventListener('change', debouncedSTOFilter);
        sortSelect.addEventListener('change', function(e) {
            const [sortBy, sortOrder] = this.value.split('_');
            stoState.sortBy = sortBy;
            stoState.sortOrder = sortOrder || 'desc';
            debouncedSTOFilter();
        });
    }
}

function resetSTOFilters() {
    stoState.filterText = '';
    stoState.statusFilter = '';
    stoState.projectFilter = '';
    stoState.fromWarehouseFilter = '';
    stoState.toWarehouseFilter = '';
    stoState.sortBy = 'createdAt';
    stoState.sortOrder = 'desc';
    stoState.page = 1;
    switchWarehouseTab('wh-sto');
}

function renderSTO() { switchWarehouseTab('wh-sto'); }

// ====== VIEW STO ======
async function viewSTO(id) {
    try {
        let s = await api.getSTOById ? await api.getSTOById(id) : null;
        if (!s) {
            const stos = await api.getSTOs();
            s = stos.find(item => item.id === id);
            if (!s) {
                showError('Không tìm thấy phiếu chuyển!');
                return;
            }
        }
        
        const statuses = await api.getStatuses('sto');
        if (!window._statusesCache) window._statusesCache = {};
        window._statusesCache['sto'] = statuses;
        
        let items = [];
        try {
            if (s.items) {
                items = typeof s.items === 'string' ? JSON.parse(s.items) : s.items;
            }
        } catch (e) { items = []; }
        let itemsHtml = items.map(it =>
            `<tr><td>${getItemCode(it.itemId)}</td><td>${getItemName(it.itemId)}</td><td>${it.requestedQty || 0}</td><td>${it.actualQty || 0}</td></tr>`
        ).join('');

        let stepsConfig = [
            { id: 1, label: 'Lập phiếu' },
            { id: 2, label: 'Duyệt' },
            { id: 3, label: 'Xuất kho' }
        ];
        if (s.workflowId) {
            try {
                const wf = await api.getWorkflowById ? await api.getWorkflowById(s.workflowId) : null;
                if (wf && wf.steps) {
                    const steps = JSON.parse(wf.steps);
                    stepsConfig = steps.map(s => ({
                        id: s.step || s.id,
                        label: s.label || `Bước ${s.step || s.id}`
                    }));
                }
            } catch (e) {
                console.warn('Không lấy được workflow steps:', e);
            }
        }
        const currentStep = s.approvalStep || 1;
        const progressHtml = renderApprovalProgress(s.status, currentStep, stepsConfig, statuses);
        const statusBadge = getStatusBadgeWithInfo(s.status, statuses);
        const noteHtml = s.status === 'COMPLETED' 
            ? `<div style="padding:8px; background:#f0fdf4; border-radius:4px; color:#15803d; font-weight:500;">${s.note || ''}</div>`
            : `<div style="padding:8px; background:#f8fafc; border-radius:4px; border:1px solid #e2e8f0;">${s.note || ''}</div>`;

        showModal('Chi tiết phiếu chuyển kho', `
            <div class="detail-grid">
                <div><span class="label">Mã phiếu:</span> <span class="value">${s.code || '--'}</span></div>
                <div><span class="label">Kho đi:</span> <span class="value">${getWarehouseName(s.fromWarehouseId)}</span></div>
                <div><span class="label">Kho đến:</span> <span class="value">${getWarehouseName(s.toWarehouseId)}</span></div>
                <div><span class="label">Dự án:</span> <span class="value">${s.projectName || ''}</span></div>
                <div><span class="label">Ngày xuất:</span> <span class="value">${s.transferDate || ''}</span></div>
                <div><span class="label">Người lập:</span> <span class="value">${s.requestedBy || ''}</span></div>
                <div><span class="label">Người duyệt:</span> <span class="value">${s.approvedBy || ''}</span></div>
                <div><span class="label">Thủ kho xuất:</span> <span class="value">${s.warehouseStaff || ''}</span></div>
                <div><span class="label">Người vận chuyển:</span> <span class="value">${s.transporter || ''}</span></div>
                <div><span class="label">Giờ xuất:</span> <span class="value">${s.departureTime || ''}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${statusBadge}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Tiến độ thực hiện:</span><br>${progressHtml}</div>
                <div style="grid-column:1/-1;">
                    <span class="label">Ghi chú:</span> ${noteHtml}
                    ${s.status === 'COMPLETED' ? '<div style="font-size:12px; color:#15803d; margin-top:4px;"><i class="fas fa-lock"></i> Ghi chú đã khóa (phiếu đã hoàn thành)</div>' : ''}
                </div>
                <div style="grid-column:1/-1;"><span class="label">Chi tiết vật tư:</span>
                    <div class="table-responsive">
                        <table><thead><tr><th>Mã</th><th>Tên</th><th>Đề nghị</th><th>Thực xuất</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="printSTO(${s.id}); closeModal();"><i class="fas fa-print"></i> In phiếu</button>
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết STO: ' + error.message);
    }
}

// ====== CREATE STO ======
function showAddSTO() {
    if (!hasPermission('sto.create')) {
        showWarning('Bạn không có quyền tạo STO');
        return;
    }
    api.getWarehouses().then(warehouses => {
        const whOpts = warehouses.map(w => `<option value="${w.id}">${w.code} - ${w.name}</option>`).join('');
        api.getProjects().then(projects => {
            const projOpts = projects.map(p => `<option value="${p.code}">${p.code} - ${p.name}</option>`).join('');
            showModal('Tạo phiếu chuyển kho (STO)', `
                <div class="form-group"><label>Kho đi</label><select id="f-sto-from">${whOpts}</select></div>
                <div class="form-group"><label>Kho đến</label><select id="f-sto-to">${whOpts}</select></div>
                <div class="form-group"><label>Dự án</label><select id="f-sto-project"><option value="">-- Chọn --</option>${projOpts}</select></div>
                <div class="form-group"><label>Ngày xuất</label><input id="f-sto-date" type="date"></div>
                <div class="form-group"><label>Người lập phiếu</label><input id="f-sto-requester"></div>
                <div class="form-group"><label>Thủ kho xuất</label><input id="f-sto-whstaff"></div>
                <div class="form-group"><label>Người vận chuyển</label><input id="f-sto-transporter"></div>
                <div class="form-group"><label>Giờ xuất</label><input id="f-sto-time" type="time"></div>
                <div class="form-group"><label>Ghi chú</label><textarea id="f-sto-note" rows="2"></textarea></div>
                <div id="sto-items-container">
                    <div class="form-group"><label>Danh sách vật tư</label>
                        ${buildItemRowsForForm([{itemId:'', quantity:''}], 'sto')}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn" onclick="saveSTO()">Lưu</button>
                    <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
                </div>
            `);
        }).catch(err => showError('Không thể tải dự án: ' + err.message));
    }).catch(err => showError('Không thể tải kho: ' + err.message));
}

function collectItemsFromModal(container) {
    const rows = container.querySelectorAll('.item-row');
    const items = [];
    rows.forEach(row => {
        const sel = row.querySelector('select');
        const qty = row.querySelector('input[type="number"]');
        if (!sel || !qty) return;
        const itemId = parseInt(sel.value);
        const quantity = parseFloat(qty.value);
        if (itemId && !isNaN(quantity) && quantity > 0) items.push({ itemId, quantity });
    });
    return items;
}

async function saveSTO() {
    const fromWH = parseInt(document.getElementById('f-sto-from').value);
    const toWH = parseInt(document.getElementById('f-sto-to').value);
    const projectCode = document.getElementById('f-sto-project').value;
    const transferDate = document.getElementById('f-sto-date').value;
    const requester = document.getElementById('f-sto-requester').value.trim();
    const whstaff = document.getElementById('f-sto-whstaff').value.trim();
    const transporter = document.getElementById('f-sto-transporter').value.trim();
    const time = document.getElementById('f-sto-time').value;
    const note = document.getElementById('f-sto-note').value.trim();
    if (!fromWH || !toWH || !transferDate) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    const container = document.getElementById('sto-items-container');
    const items = collectItemsFromModal(container);
    if (!items.length) {
        showError('Cần ít nhất một vật tư');
        return;
    }
    try {
        const inventory = await api.getInventoryByWarehouse(fromWH) || await api.getInventory();
        const invList = (inventory || []).filter(i => i.warehouseId === fromWH || i.warehouse_id === fromWH);
        let hasError = false;
        items.forEach(it => {
            const inv = invList.find(i => (i.itemId || i.item_id) === it.itemId);
            const currentQty = inv ? (inv.quantity || 0) : 0;
            if (it.quantity > currentQty) {
                showError(`Tồn kho của ${getItemName(it.itemId)} trong kho đi là ${currentQty}, không đủ để xuất ${it.quantity}. Vui lòng giảm số lượng.`);
                hasError = true;
            }
        });
        if (hasError) return;

        const projects = await api.getProjects();
        const proj = projects.find(p => p.code === projectCode);
        const newSTO = {
            fromWarehouseId: fromWH,
            toWarehouseId: toWH,
            projectCode,
            projectName: proj ? proj.name : '',
            items: JSON.stringify(items.map(it => ({ itemId: it.itemId, requestedQty: it.quantity, actualQty: it.quantity }))),
            transferDate,
            requestedBy: requester,
            warehouseStaff: whstaff,
            transporter,
            departureTime: time,
            note
        };

        await api.createSTO(newSTO);
        closeModal();
        switchWarehouseTab('wh-sto');
        showSuccess('Tạo phiếu chuyển kho thành công!');
    } catch (error) {
        showError('Lỗi khi tạo STO: ' + error.message);
    }
}

// ====== EDIT STO ======
async function editSTO(id) {
    if (!hasPermission('sto.edit')) {
        showWarning('Bạn không có quyền sửa STO');
        return;
    }
    try {
        let sto = await api.getSTOById ? await api.getSTOById(id) : null;
        if (!sto) {
            const stos = await api.getSTOs();
            sto = stos.find(s => s.id === id);
            if (!sto) {
                showError('Không tìm thấy phiếu!');
                return;
            }
        }
        if (sto.status !== 'DRAFT') {
            showWarning('Chỉ có thể sửa phiếu ở trạng thái DRAFT.');
            return;
        }
        let items = [];
        try {
            if (sto.items) {
                items = typeof sto.items === 'string' ? JSON.parse(sto.items) : sto.items;
            }
        } catch (e) { items = []; }
        let itemsHtml = items.map(it => {
            const itemName = getItemName(it.itemId);
            const unit = getItemUnit(it.itemId);
            return `
                <div class="item-row" data-item-id="${it.itemId}">
                    <span style="min-width:150px; font-weight:500;">${itemName || '--'} (${unit || ''})</span>
                    <input type="number" class="sto-req-qty" value="${it.requestedQty || 0}" readonly style="width:80px; background:#f0f0f0;">
                    <input type="number" class="sto-actual-qty" value="${it.actualQty || 0}" placeholder="Thực xuất" style="width:100px;" step="0.01">
                </div>
            `;
        }).join('');

        showModal('Sửa phiếu chuyển kho', `
            <div class="form-group"><label>Mã phiếu</label><input value="${sto.code || '--'}" readonly style="background:#f0f0f0;"></div>
            <div class="form-group"><label>Ngày xuất</label><input id="f-sto-edit-date" type="date" value="${sto.transferDate || ''}"></div>
            <div class="form-group"><label>Người lập phiếu</label><input id="f-sto-edit-requester" value="${sto.requestedBy || ''}"></div>
            <div class="form-group"><label>Thủ kho xuất</label><input id="f-sto-edit-whstaff" value="${sto.warehouseStaff || ''}"></div>
            <div class="form-group"><label>Người vận chuyển</label><input id="f-sto-edit-transporter" value="${sto.transporter || ''}"></div>
            <div class="form-group"><label>Giờ xuất</label><input id="f-sto-edit-time" type="time" value="${sto.departureTime || ''}"></div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-sto-edit-note" rows="2">${sto.note || ''}</textarea></div>
            <div class="form-group"><label>Danh sách vật tư</label>
                <div id="sto-edit-items-container">${itemsHtml}</div>
                <div style="font-size:13px; color:#888; margin-top:4px;"><i class="fas fa-info-circle"></i> Chỉnh sửa số lượng thực xuất (không vượt quá tồn kho hiện có).</div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateSTO(${id})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải STO: ' + error.message);
    }
}

async function updateSTO(id) {
    const transferDate = document.getElementById('f-sto-edit-date').value;
    const requester = document.getElementById('f-sto-edit-requester').value.trim();
    const whstaff = document.getElementById('f-sto-edit-whstaff').value.trim();
    const transporter = document.getElementById('f-sto-edit-transporter').value.trim();
    const time = document.getElementById('f-sto-edit-time').value;
    const note = document.getElementById('f-sto-edit-note').value.trim();

    if (!transferDate) {
        showError('Vui lòng chọn ngày xuất.');
        return;
    }

    try {
        const stos = await api.getSTOs();
        const sto = stos.find(s => s.id === id);
        if (!sto) {
            showError('Không tìm thấy phiếu!');
            return;
        }
        let items = [];
        try {
            if (sto.items) {
                items = typeof sto.items === 'string' ? JSON.parse(sto.items) : sto.items;
            }
        } catch (e) { items = []; }
        const fromWhId = sto.fromWarehouseId;
        const inventory = await api.getInventoryByWarehouse(fromWhId) || await api.getInventory();
        const invList = (inventory || []).filter(i => i.warehouseId === fromWhId || i.warehouse_id === fromWhId);
        const rows = document.querySelectorAll('#sto-edit-items-container .item-row');
        let hasError = false;
        rows.forEach(row => {
            const itemId = parseInt(row.dataset.itemId);
            const actualQty = parseFloat(row.querySelector('.sto-actual-qty')?.value) || 0;
            const item = items.find(it => it.itemId === itemId);
            if (!item) return;
            if (actualQty < 0) {
                showError(`Số lượng thực xuất của ${getItemName(itemId)} không được âm.`);
                hasError = true;
                return;
            }
            if (actualQty > item.requestedQty) {
                showError(`Số lượng thực xuất của ${getItemName(itemId)} không được vượt quá đề nghị (${item.requestedQty}).`);
                hasError = true;
                return;
            }
            const currentInv = invList.find(inv => (inv.itemId || inv.item_id) === itemId);
            const currentQty = currentInv ? (currentInv.quantity || 0) : 0;
            if (actualQty > currentQty) {
                showError(`Tồn kho của ${getItemName(itemId)} trong kho đi là ${currentQty}, không đủ để xuất ${actualQty}.`);
                hasError = true;
                return;
            }
            item.actualQty = actualQty;
        });
        if (hasError) return;

        sto.transferDate = transferDate;
        sto.requestedBy = requester;
        sto.warehouseStaff = whstaff;
        sto.transporter = transporter;
        sto.departureTime = time;
        sto.note = note;
        sto.items = JSON.stringify(items);

        await api.updateSTO(id, sto);
        closeModal();
        switchWarehouseTab('wh-sto');
        showSuccess('Cập nhật phiếu chuyển kho thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật STO: ' + error.message);
    }
}

// ====== SUBMIT STO ======
async function submitSTO(id) {
    if (!hasPermission('sto.submit')) {
        showWarning('Bạn không có quyền gửi duyệt STO');
        return;
    }
    try {
        await api.submitSTO(id);
        switchWarehouseTab('wh-sto');
        showSuccess('Đã gửi yêu cầu duyệt STO!');
    } catch (error) {
        showError('Lỗi khi gửi duyệt STO: ' + error.message);
    }
}

// ====== APPROVE STO ======
async function approveSTO(id) {
    if (!hasPermission('sto.approve')) {
        showWarning('Bạn không có quyền duyệt STO');
        return;
    }
    try {
        await api.approveSTO(id);
        switchWarehouseTab('wh-sto');
        showSuccess('Duyệt STO thành công!');
    } catch (error) {
        showError('Lỗi khi duyệt STO: ' + error.message);
    }
}

// ====== COMPLETE STO ======
async function completeSTO(id) {
    if (!hasPermission('sto.complete')) {
        showWarning('Bạn không có quyền hoàn thành STO');
        return;
    }
    if (!confirm('Xác nhận hoàn thành chuyển kho? Hàng sẽ được cập nhật tồn kho.')) return;
    try {
        withLoading(async () => {
            await api.completeSTO(id);
            switchWarehouseTab('wh-sto');
            showSuccess('Hoàn thành chuyển kho! Tồn kho đã được cập nhật.');
        }, 'Đang xử lý chuyển kho...');
    } catch (error) {
        showError('Lỗi khi hoàn thành STO: ' + error.message);
    }
}

// ====== DELETE STO ======
async function deleteSTO(id) {
    if (!hasPermission('sto.delete')) {
        showWarning('Bạn không có quyền xóa STO');
        return;
    }
    if (!confirm('Xóa phiếu chuyển kho này?')) return;
    try {
        await api.deleteSTO(id);
        switchWarehouseTab('wh-sto');
        showSuccess('Xóa STO thành công!');
    } catch (error) {
        showError('Lỗi khi xóa STO: ' + error.message);
    }
}

// ================================================================
// CRUD KHO & INVENTORY
// ================================================================
async function showAddWarehouse() {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền thêm kho');
        return;
    }
    const projects = await api.getProjects();
    const projectOpts = projects.map(p => `<option value="${p.id}">${p.code} - ${p.name}</option>`).join('');
    showModal('Thêm kho mới', `
        <div class="form-group"><label>Mã kho</label><input id="f-wh-code" placeholder="KHO_xxx"></div>
        <div class="form-group"><label>Tên kho</label><input id="f-wh-name"></div>
        <div class="form-group"><label>Loại kho</label>
            <select id="f-wh-type" onchange="toggleProjectField()">
                <option value="CENTRAL">Kho tổng</option>
                <option value="SITE">Kho dự án</option>
            </select>
        </div>
        <div class="form-group" id="wh-project-group">
            <label>Dự án</label>
            <select id="f-wh-project"><option value="">-- Chọn --</option>${projectOpts}</select>
        </div>
        <div class="form-group"><label>Quản lý</label><input id="f-wh-manager"></div>
        <div class="form-group"><label>Địa chỉ</label><input id="f-wh-address"></div>
        <div class="form-group"><label>Trạng thái</label>
            <select id="f-wh-status"><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng</option></select>
        </div>
        <div class="form-group"><label>Ghi chú</label><textarea id="f-wh-note" rows="2"></textarea></div>
        <div class="modal-actions">
            <button class="btn" onclick="saveWarehouse()">Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
    toggleProjectField();
}

function toggleProjectField() {
    const type = document.getElementById('f-wh-type').value;
    document.getElementById('wh-project-group').style.display = (type === 'SITE') ? 'block' : 'none';
}

async function saveWarehouse() {
    const code = document.getElementById('f-wh-code').value.trim();
    const name = document.getElementById('f-wh-name').value.trim();
    const type = document.getElementById('f-wh-type').value;
    const projectId = parseInt(document.getElementById('f-wh-project').value) || null;
    const manager = document.getElementById('f-wh-manager').value.trim();
    const address = document.getElementById('f-wh-address').value.trim();
    const status = document.getElementById('f-wh-status').value;
    const note = document.getElementById('f-wh-note').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên kho');
        return;
    }
    if (type === 'SITE' && !projectId) {
        showError('Vui lòng chọn dự án');
        return;
    }
    try {
        const newWh = { code, name, type, projectId: type === 'SITE' ? projectId : null, manager, address, status, note };
        await api.createWarehouse(newWh);
        closeModal();
        const freshWarehouses = await api.getWarehouses();
        window._warehousesCache = freshWarehouses;
        saveData('warehouses', freshWarehouses);
        switchWarehouseTab('wh-list');
        showSuccess('Thêm kho thành công!');
    } catch (error) {
        showError('Lỗi khi thêm kho: ' + error.message);
    }
}

async function showEditWarehouse(whId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền sửa kho');
        return;
    }
    try {
        const warehouses = await api.getWarehouses();
        const wh = warehouses.find(w => w.id === whId);
        if (!wh) {
            showError('Không tìm thấy kho!');
            return;
        }
        const projects = await api.getProjects();
        const projectOpts = projects.map(p =>
            `<option value="${p.id}" ${p.id === wh.projectId ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');
        showModal('Sửa kho', `
            <div class="form-group"><label>Mã kho</label><input id="f-wh-code" value="${wh.code || ''}"></div>
            <div class="form-group"><label>Tên kho</label><input id="f-wh-name" value="${wh.name || ''}"></div>
            <div class="form-group"><label>Loại kho</label>
                <select id="f-wh-type" onchange="toggleProjectField()">
                    <option value="CENTRAL" ${wh.type === 'CENTRAL' ? 'selected' : ''}>Kho tổng</option>
                    <option value="SITE" ${wh.type === 'SITE' ? 'selected' : ''}>Kho dự án</option>
                </select>
            </div>
            <div class="form-group" id="wh-project-group" style="${wh.type === 'SITE' ? 'block' : 'none'}">
                <label>Dự án</label>
                <select id="f-wh-project">${projectOpts}</select>
            </div>
            <div class="form-group"><label>Quản lý</label><input id="f-wh-manager" value="${wh.manager || ''}"></div>
            <div class="form-group"><label>Địa chỉ</label><input id="f-wh-address" value="${wh.address || ''}"></div>
            <div class="form-group"><label>Trạng thái</label>
                <select id="f-wh-status"><option value="ACTIVE" ${wh.status === 'ACTIVE' ? 'selected' : ''}>Đang hoạt động</option><option value="INACTIVE" ${wh.status === 'INACTIVE' ? 'selected' : ''}>Ngừng</option></select>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-wh-note" rows="2">${wh.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateWarehouse(${whId})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
        toggleProjectField();
    } catch (error) {
        showError('Lỗi khi tải kho: ' + error.message);
    }
}

async function updateWarehouse(whId) {
    const code = document.getElementById('f-wh-code').value.trim();
    const name = document.getElementById('f-wh-name').value.trim();
    const type = document.getElementById('f-wh-type').value;
    const projectId = parseInt(document.getElementById('f-wh-project').value) || null;
    const manager = document.getElementById('f-wh-manager').value.trim();
    const address = document.getElementById('f-wh-address').value.trim();
    const status = document.getElementById('f-wh-status').value;
    const note = document.getElementById('f-wh-note').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên');
        return;
    }
    if (type === 'SITE' && !projectId) {
        showError('Vui lòng chọn dự án');
        return;
    }
    try {
        const updatedWh = { code, name, type, projectId: type === 'SITE' ? projectId : null, manager, address, status, note };
        await api.updateWarehouse(whId, updatedWh);
        closeModal();
        switchWarehouseTab('wh-list');
        showSuccess('Cập nhật kho thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật kho: ' + error.message);
    }
}

async function showAddInventoryItem(whId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền thêm tồn kho');
        return;
    }
    const items = await api.getItems();
    const itemOpts = items.map(i => `<option value="${i.id}">${i.code} - ${i.name}</option>`).join('');
    showModal('Thêm tồn kho', `
        <div class="form-group"><label>Vật tư</label>
            <select id="f-inv-item">${itemOpts}</select>
        </div>
        <div class="form-group"><label>Số lượng</label><input id="f-inv-qty" type="number" step="0.01" value="0"></div>
        <div class="modal-actions">
            <button class="btn" onclick="saveInventoryItem(${whId})">Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

async function saveInventoryItem(whId) {
    const itemId = parseInt(document.getElementById('f-inv-item').value);
    const quantity = parseFloat(document.getElementById('f-inv-qty').value) || 0;
    if (!itemId) {
        showError('Vui lòng chọn vật tư');
        return;
    }
    try {
        await api.updateInventoryQuantity(whId, itemId, quantity);
        closeModal();
        viewWarehouseDetail(whId);
        showSuccess('Cập nhật tồn kho thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật tồn kho: ' + error.message);
    }
}

async function editInventoryItem(invId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền sửa tồn kho');
        return;
    }
    try {
        const inventory = await api.getInventory();
        const inv = inventory.find(i => i.id === invId);
        if (!inv) {
            showError('Không tìm thấy tồn kho!');
            return;
        }
        const items = await api.getItems();
        const itemOpts = items.map(i =>
            `<option value="${i.id}" ${i.id === inv.itemId ? 'selected' : ''}>${i.code} - ${i.name}</option>`).join('');
        showModal('Sửa tồn kho', `
            <div class="form-group"><label>Vật tư</label>
                <select id="f-inv-item">${itemOpts}</select>
            </div>
            <div class="form-group"><label>Số lượng</label><input id="f-inv-qty" type="number" step="0.01" value="${inv.quantity || 0}"></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateInventoryItem(${invId})">Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải tồn kho: ' + error.message);
    }
}

async function updateInventoryItem(invId) {
    const itemId = parseInt(document.getElementById('f-inv-item').value);
    const quantity = parseFloat(document.getElementById('f-inv-qty').value) || 0;
    if (!itemId) {
        showError('Vui lòng chọn vật tư');
        return;
    }
    try {
        const inventory = await api.getInventory();
        const inv = inventory.find(i => i.id === invId);
        if (!inv) {
            showError('Không tìm thấy tồn kho!');
            return;
        }
        await api.updateInventoryQuantity(inv.warehouseId, itemId, quantity);
        closeModal();
        viewWarehouseDetail(inv.warehouseId);
        showSuccess('Cập nhật tồn kho thành công!');
    } catch (error) {
        showError('Lỗi khi cập nhật tồn kho: ' + error.message);
    }
}

async function deleteInventoryItem(invId) {
    if (!hasPermission('inventory.edit')) {
        showWarning('Bạn không có quyền xóa tồn kho');
        return;
    }
    if (!confirm('Xóa tồn kho này?')) return;
    try {
        const inventory = await api.getInventory();
        const inv = inventory.find(i => i.id === invId);
        if (!inv) {
            showError('Không tìm thấy tồn kho!');
            return;
        }
        await api.updateInventoryQuantity(inv.warehouseId, inv.itemId, 0);
        viewWarehouseDetail(inv.warehouseId);
        showSuccess('Xóa tồn kho thành công!');
    } catch (error) {
        showError('Lỗi khi xóa tồn kho: ' + error.message);
    }
}

// ====== IN PHIẾU ======
window.printGRN = function(id) {
    showInfo('Chức năng in GRN đang được phát triển.');
};

window.printSTO = function(id) {
    showInfo('Chức năng in STO đang được phát triển.');
};

// ====== EXPORT ======
window.renderWarehousePage = renderWarehousePage;
window.renderWarehouseListHTML = renderWarehouseListHTML;
window.viewWarehouseDetail = viewWarehouseDetail;
window.renderGRN = renderGRN;
window.viewGRN = viewGRN;
window.showAddGRN = showAddGRN;
window.saveGRN = saveGRN;
window.editGRN = editGRN;
window.updateGRN = updateGRN;
window.deleteGRN = deleteGRN;
window.completeGRN = completeGRN;
window.receiveGRN = receiveGRN;
window.confirmReceiveGRN = confirmReceiveGRN;
window.qcCheckGRN = qcCheckGRN;
window.confirmQCCheckGRN = confirmQCCheckGRN;
window.renderSTO = renderSTO;
window.viewSTO = viewSTO;
window.showAddSTO = showAddSTO;
window.saveSTO = saveSTO;
window.submitSTO = submitSTO;
window.approveSTO = approveSTO;
window.completeSTO = completeSTO;
window.deleteSTO = deleteSTO;
window.editSTO = editSTO;
window.updateSTO = updateSTO;
window.showAddWarehouse = showAddWarehouse;
window.saveWarehouse = saveWarehouse;
window.showEditWarehouse = showEditWarehouse;
window.updateWarehouse = updateWarehouse;
window.showAddInventoryItem = showAddInventoryItem;
window.saveInventoryItem = saveInventoryItem;
window.editInventoryItem = editInventoryItem;
window.updateInventoryItem = updateInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.showWarehouseInfoModal = showWarehouseInfoModal;
window.printGRN = printGRN;
window.printSTO = printSTO;
window.resetGRNFilters = resetGRNFilters;
window.resetSTOFilters = resetSTOFilters;
window.toggleWarehouseFilter = toggleWarehouseFilter;
window.showAllWarehouses = showAllWarehouses;

console.log('✅ Warehouse module updated with approval level and permission checks for create buttons.');