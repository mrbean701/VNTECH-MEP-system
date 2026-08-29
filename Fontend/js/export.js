// ================================================================

// EXPORT FUNCTIONS - Xuất dữ liệu ra Excel/CSV
// ================================================================

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 * @param {Array} data - Mảng dữ liệu cần xuất
 * @param {String} filename - Tên file (không cần đuôi)
 * @param {Array} headers - Tiêu đề cột (nếu cần)
 */
function exportToExcel(data, filename = 'export', headers = null) {
    try {
        // Kiểm tra thư viện XLSX
        if (typeof XLSX === 'undefined') {
            showError('Thư viện XLSX chưa được tải. Vui lòng kiểm tra kết nối mạng hoặc tải lại trang.');
            return;
        }

        if (!data || data.length === 0) {
            showWarning('Không có dữ liệu để xuất!');
            return;
        }

        // Chuyển đổi dữ liệu thành mảng 2 chiều
        let wsData = [];

        // Thêm headers nếu có
        if (headers) {
            wsData.push(headers);
        }

        // Thêm dữ liệu
        data.forEach(row => {
            const rowData = [];
            if (headers) {
                // Nếu có headers, lấy giá trị theo thứ tự headers
                headers.forEach(key => {
                    let value = row[key] !== undefined && row[key] !== null ? row[key] : '';
                    // Xử lý đặc biệt cho object (ví dụ: items)
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    rowData.push(value);
                });
            } else {
                // Không có headers, lấy tất cả giá trị của object
                Object.values(row).forEach(value => {
                    if (typeof value === 'object') {
                        rowData.push(JSON.stringify(value));
                    } else {
                        rowData.push(value !== undefined && value !== null ? value : '');
                    }
                });
            }
            wsData.push(rowData);
        });

        // Tạo workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Tự động điều chỉnh độ rộng cột
        const colWidths = [];
        wsData.forEach(row => {
            row.forEach((cell, idx) => {
                const cellLength = String(cell).length;
                if (!colWidths[idx] || colWidths[idx] < cellLength) {
                    colWidths[idx] = Math.min(cellLength + 2, 30);
                }
            });
        });
        ws['!cols'] = colWidths.map(w => ({ wch: w }));

        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Xuất file
        XLSX.writeFile(wb, `${filename}.xlsx`);
        showSuccess(`Xuất file ${filename}.xlsx thành công!`);
    } catch (error) {
        console.error('Export error:', error);
        showError('Có lỗi xảy ra khi xuất dữ liệu: ' + error.message);
    }
}

// ====== XUẤT DỰ ÁN ======
function exportProjects() {
    try {
        const projects = getProjects();
        if (!projects.length) {
            showWarning('Không có dự án để xuất!');
            return;
        }
        const data = projects.map(p => ({
            'Mã dự án': p.code,
            'Tên dự án': p.name,
            'Chủ đầu tư': p.client || '',
            'PM/Chỉ huy': p.commander || '',
            'Ngày bắt đầu': p.startDate || '',
            'Ngày kết thúc KH': p.endDate || '',
            'Trạng thái': p.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng',
            'Ghi chú': p.note || ''
        }));
        exportToExcel(data, 'Danh_sach_du_an', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất dự án: ' + e.message);
    }
}

// ====== XUẤT NHÀ CUNG CẤP ======
function exportVendors() {
    try {
        const vendors = getVendors();
        if (!vendors.length) {
            showWarning('Không có nhà cung cấp để xuất!');
            return;
        }
        const data = vendors.map(v => ({
            'Mã NCC': v.code,
            'Tên NCC': v.name,
            'Nhóm hàng': v.group || '',
            'Người liên hệ': v.contact || '',
            'Số điện thoại': v.phone || '',
            'Email': v.email || '',
            'Điều khoản TT': v.paymentTerm || '',
            'Ghi chú': v.note || ''
        }));
        exportToExcel(data, 'Danh_sach_NCC', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất nhà cung cấp: ' + e.message);
    }
}

// ====== XUẤT VẬT TƯ ======
function exportItems() {
    try {
        const items = getItems();
        if (!items.length) {
            showWarning('Không có vật tư để xuất!');
            return;
        }
        const data = items.map(it => ({
            'Mã vật tư': it.code,
            'Tên vật tư': it.name,
            'Nhóm': it.group || '',
            'Quy cách/Model': it.model || '',
            'Đơn vị tính': it.unit || '',
            'Đơn giá chuẩn': (it.standardPrice || 0).toLocaleString(),
            'Trạng thái': it.status === 'ACTIVE' ? 'Sử dụng' : 'Ngừng',
            'Ghi chú': it.note || ''
        }));
        exportToExcel(data, 'Danh_sach_vat_tu', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất vật tư: ' + e.message);
    }
}

// ====== XUẤT MR ======
function exportMRs() {
    try {
        const mrs = getMRs();
        if (!mrs.length) {
            showWarning('Không có MR để xuất!');
            return;
        }
        const data = mrs.map(m => ({
            'Mã MR': m.code,
            'Dự án': m.projectName || m.projectCode || '',
            'Ngày tạo': m.createdAt || '',
            'Ngày cần': m.needDate || '',
            'Mục đích': m.purpose || '',
            'Người yêu cầu': m.requester || m.createdByName || '',
            'Trạng thái': m.status,
            'Số lượng vật tư': m.items ? m.items.reduce((sum, it) => sum + it.quantity, 0) : 0
        }));
        exportToExcel(data, 'Danh_sach_MR', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất MR: ' + e.message);
    }
}

// ====== XUẤT PR ======
function exportPRs() {
    try {
        const prs = getPRs();
        if (!prs.length) {
            showWarning('Không có PR để xuất!');
            return;
        }
        const data = prs.map(p => ({
            'Mã PR': p.code,
            'Dự án': p.projectName || p.projectCode || '',
            'Nhà cung cấp': p.vendorName || p.vendorCode || '',
            'Ngày tạo': p.createdAt || '',
            'Trạng thái': p.status,
            'Bước duyệt': p.approvalStep || 1,
            'MR nguồn': p.mrId ? `MR-${String(p.mrId).padStart(3, '0')}` : '',
            'Số lượng vật tư': p.items ? p.items.reduce((sum, it) => sum + it.quantity, 0) : 0
        }));
        exportToExcel(data, 'Danh_sach_PR', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất PR: ' + e.message);
    }
}

// ====== XUẤT PO ======
function exportPOs() {
    try {
        const pos = getPOs();
        if (!pos.length) {
            showWarning('Không có PO để xuất!');
            return;
        }
        const data = pos.map(p => ({
            'Mã PO': p.code,
            'Dự án': p.projectName || p.projectCode || '',
            'Nhà cung cấp': p.vendorName || p.vendorCode || '',
            'Ngày tạo': p.createdAt || '',
            'Trạng thái': p.status,
            'Bước duyệt': p.approvalStep || 1,
            'PR nguồn': p.prId ? `PR-${String(p.prId).padStart(3, '0')}` : '',
            'Tổng tiền': p.items ? p.items.reduce((sum, it) => sum + (it.price || 0) * it.quantity, 0).toLocaleString() : 0,
            'Số lượng vật tư': p.items ? p.items.reduce((sum, it) => sum + it.quantity, 0) : 0
        }));
        exportToExcel(data, 'Danh_sach_PO', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất PO: ' + e.message);
    }
}

// ====== XUẤT TỒN KHO ======
function exportInventory() {
    try {
        const warehouses = getWarehouses();
        const inventory = getInventory();
        const items = getItems();

        if (!warehouses.length) {
            showWarning('Không có dữ liệu tồn kho để xuất!');
            return;
        }

        const data = [];
        warehouses.forEach(wh => {
            const invs = inventory.filter(i =>
                (i.warehouseId || i.warehouse_id) === wh.id
            );
            invs.forEach(inv => {
                const item = items.find(it => it.id === (inv.itemId || inv.item_id));
                data.push({
                    'Mã kho': wh.code,
                    'Tên kho': wh.name,
                    'Loại kho': wh.type === 'CENTRAL' ? 'Kho tổng' : 'Kho dự án',
                    'Mã vật tư': item ? item.code : '',
                    'Tên vật tư': item ? item.name : '',
                    'ĐVT': item ? item.unit : '',
                    'Số lượng tồn': inv.quantity
                });
            });
        });

        if (!data.length) {
            showWarning('Không có dữ liệu tồn kho chi tiết!');
            return;
        }
        exportToExcel(data, 'Danh_sach_ton_kho', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất tồn kho: ' + e.message);
    }
}

// ====== XUẤT GRN ======
function exportGRNs() {
    try {
        const grns = getGRNs();
        if (!grns.length) {
            showWarning('Không có GRN để xuất!');
            return;
        }
        const data = grns.map(g => {
            const warehouseId = g.warehouseId || g.warehouse_id;
            const poId = g.poId || g.po_id;
            let items = [];
            if (g.items) {
                try { items = typeof g.items === 'string' ? JSON.parse(g.items) : g.items; } catch(e) { items = []; }
            }
            return {
                'Mã GRN': g.code,
                'PO nguồn': poId ? `PO-${String(poId).padStart(3, '0')}` : '',
                'Dự án': g.projectName || '',
                'Kho nhập': getWarehouseName(warehouseId),
                'Nhà cung cấp': g.vendorName || '',
                'Ngày nhập': g.receiptDate || '',
                'Người giao': g.receiver || '',
                'Thủ kho': g.warehouseStaff || '',
                'QC xác nhận': g.qcConfirm || '',
                'Kế toán xác nhận': g.accountantConfirm || '',
                'Trạng thái': g.status,
                'Số lượng vật tư': items.reduce((sum, it) => sum + (it.actualQty || it.poQty || 0), 0)
            };
        });
        exportToExcel(data, 'Danh_sach_GRN', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất GRN: ' + e.message);
    }
}

// ====== XUẤT STO ======
function exportSTOs() {
    try {
        const stos = getSTOs();
        if (!stos.length) {
            showWarning('Không có STO để xuất!');
            return;
        }
        const data = stos.map(s => ({
            'Mã STO': s.code,
            'Kho đi': getWarehouseName(s.from_warehouse_id),
            'Kho đến': getWarehouseName(s.to_warehouse_id),
            'Dự án': s.projectName || '',
            'Ngày xuất': s.transferDate || '',
            'Người lập': s.requestedBy || '',
            'Người duyệt': s.approvedBy || '',
            'Trạng thái': s.status,
            'Số lượng vật tư': s.items ? s.items.reduce((sum, it) => sum + it.actualQty, 0) : 0
        }));
        exportToExcel(data, 'Danh_sach_STO', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất STO: ' + e.message);
    }
}

// ====== XUẤT CẤP PHÁT (ISSUE) ======
function exportIssues() {
    try {
        const issues = getIssues();
        if (!issues.length) {
            showWarning('Không có phiếu cấp phát để xuất!');
            return;
        }
        const data = issues.map(item => ({
            'Mã phiếu': item.code,
            'Dự án': item.projectName || item.projectCode || '',
            'Ngày cấp': item.date || '',
            'Khu vực/Hạng mục': item.area || '',
            'Đội thi công': item.team || '',
            'Người yêu cầu': item.requester || '',
            'Trạng thái': item.status,
            'Số lượng vật tư': item.items ? item.items.reduce((sum, it) => sum + (it.actualQty || it.requestedQty), 0) : 0,
            'Kho xuất': item.warehouseId ? getWarehouseName(item.warehouseId) : '',
            'Người duyệt': item.approvedBy || '',
            'Người hoàn thành': item.completedBy || '',
            'Ngày hoàn tất': item.completionDate || '',
            'Ghi chú': item.note || ''
        }));
        exportToExcel(data, 'Danh_sach_cap_phat', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất cấp phát: ' + e.message);
    }
}

// ====== XUẤT HOÀN TRẢ (MATERIAL RETURN) ======
function exportMaterialReturns() {
    try {
        const returns = getMaterialReturns();
        if (!returns.length) {
            showWarning('Không có phiếu hoàn trả để xuất!');
            return;
        }
        const data = returns.map(item => ({
            'Mã phiếu': item.code,
            'Dự án': item.projectName || item.projectCode || '',
            'Ngày trả': item.returnDate || '',
            'Kho nhận': getWarehouseName(item.warehouseId),
            'Trả từ': item.returnFrom || '',
            'Người trả': item.returner || '',
            'Trạng thái': item.status,
            'Số lượng vật tư': item.items ? item.items.reduce((sum, it) => sum + (it.actualQty || it.requestedQty), 0) : 0,
            'Người duyệt': item.approvedBy || '',
            'Người xác nhận': item.confirmedBy || '',
            'Ngày hoàn tất': item.completionDate || '',
            'Ghi chú': item.note || ''
        }));
        exportToExcel(data, 'Danh_sach_hoan_tra', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất hoàn trả: ' + e.message);
    }
}

// ====== XUẤT CẢNH BÁO TỒN KHO (MIN STOCK) ======
function exportMinStock() {
    try {
        const warehouses = getWarehouses();
        const data = [];

        warehouses.forEach(wh => {
            // Kiểm tra hàm getItemsByMinStockStatus đã được định nghĩa
            if (typeof getItemsByMinStockStatus === 'function') {
                const items = getItemsByMinStockStatus(wh.id, 'all');
                items.forEach(item => {
                    data.push({
                        'Kho': wh.code,
                        'Tên kho': wh.name,
                        'Mã vật tư': item.code,
                        'Tên vật tư': item.name,
                        'ĐVT': item.unit || '',
                        'Tồn kho': item.currentQty,
                        'Ngưỡng': item.minQty,
                        'Trạng thái': item.status === 'under' ? '⚠️ Dưới ngưỡng' : (item.status === 'warning' ? '⚡ Gần ngưỡng' : '✅ An toàn')
                    });
                });
            } else {
                showWarning('Hàm getItemsByMinStockStatus chưa được định nghĩa. Vui lòng kiểm tra file api.js hoặc min-stock.js.');
                return;
            }
        });

        if (!data.length) {
            showWarning('Không có dữ liệu cảnh báo tồn kho để xuất!');
            return;
        }
        exportToExcel(data, 'Canh_bao_ton_kho_toi_thieu', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất cảnh báo tồn kho: ' + e.message);
    }
}

// ====== XUẤT ĐƠN HÀNG TỰ ĐỘNG (AUTO REORDER) ======
function exportAutoReorderHistory() {
    try {
                const prs = getPRs();
        const autoPRs = prs.filter(pr => pr.note && (String(pr.note).includes('Auto Reorder') || String(pr.note).includes('Tự động tạo từ Auto Reorder')));

        if (!autoPRs.length) {
            showWarning('Không có đơn hàng tự động nào để xuất!');
            return;
        }

        const data = autoPRs.map(pr => ({
            'Mã PR': pr.code,
            'Dự án': pr.projectName || pr.projectCode || '',
            'Nhà cung cấp': pr.vendorName || pr.vendorCode || '',
            'Vật tư': pr.items ? pr.items.map(it => `${getItemName(it.itemId)} (${it.quantity})`).join('; ') : '',
            'Trạng thái': pr.status,
            'Bước duyệt': pr.approvalStep || 1,
            'Ngày tạo': pr.createdAt || '',
            'Ghi chú': pr.note || ''
        }));

        exportToExcel(data, 'Lich_su_dat_hang_tu_dong', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất đơn hàng tự động: ' + e.message);
    }
}

// ====== XUẤT DANH SÁCH USER (ADMIN) ======
function exportUsers() {
    try {
        const users = getUsers();
        const departments = getDepartments();

        if (!users.length) {
            showWarning('Không có dữ liệu người dùng để xuất!');
            return;
        }

        const data = users.map(u => {
            const dept = departments.find(d => d.id === u.departmentId);
            return {
                'ID': u.id,
                'Họ tên': u.name,
                'Email': u.email,
                'Role': u.role,
                'Phòng ban': dept ? dept.name : (u.department || '--'),
                'Chức danh': u.position || '--',
                'Ngày tạo': u.createdAt || '--'
            };
        });

        exportToExcel(data, 'Danh_sach_nguoi_dung', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất người dùng: ' + e.message);
    }
}

// ====== XUẤT PHÒNG BAN (ADMIN) ======
function exportDepartments() {
    try {
        const departments = getDepartments();
        const users = getUsers();

        if (!departments.length) {
            showWarning('Không có dữ liệu phòng ban để xuất!');
            return;
        }

        const data = departments.map(d => {
            const members = users.filter(u => u.departmentId === d.id);
            const manager = users.find(u => u.id === d.managerId);
            return {
                'Mã phòng ban': d.code,
                'Tên phòng ban': d.name,
                'Trưởng phòng': manager ? manager.name : (d.managerName || '--'),
                'Số nhân viên': members.length,
                'Danh sách nhân viên': members.map(m => `${m.name} (${m.position || '--'})`).join('; '),
                'Ngày tạo': d.createdAt || '--'
            };
        });

        exportToExcel(data, 'Danh_sach_phong_ban', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất phòng ban: ' + e.message);
    }
}

// ====== XUẤT WORKFLOW (ADMIN) ======
function exportWorkflows() {
    try {
        const workflows = getWorkflows();

        if (!workflows || Object.keys(workflows).length === 0) {
            showWarning('Không có dữ liệu workflow để xuất!');
            return;
        }

        const data = [];
        Object.keys(workflows).forEach(module => {
            const wf = workflows[module];
            wf.steps.forEach(step => {
                data.push({
                    'Module': wf.name,
                    'Bước': step.step,
                    'Vai trò duyệt': step.role,
                    'Tên bước': step.label || ''
                });
            });
        });

        exportToExcel(data, 'Cau_hinh_workflow', Object.keys(data[0]));
    } catch (e) {
        showError('Lỗi xuất workflow: ' + e.message);
    }
}

// ====== XUẤT DỮ LIỆU KHO THEO TAB HIỆN TẠI ======
function exportWarehouseData() {
    const currentTab = window.currentWhTab || 'wh-list';
    if (currentTab === 'wh-grn') {
        exportGRNs();
    } else if (currentTab === 'wh-sto') {
        exportSTOs();
    } else {
        exportInventory();
    }
}

// ====== EXPORT GLOBAL ======
window.exportToExcel = exportToExcel;
window.exportProjects = exportProjects;
window.exportVendors = exportVendors;
window.exportItems = exportItems;
window.exportMRs = exportMRs;
window.exportPRs = exportPRs;
window.exportPOs = exportPOs;
window.exportInventory = exportInventory;
window.exportGRNs = exportGRNs;
window.exportSTOs = exportSTOs;
window.exportWarehouseData = exportWarehouseData;
window.exportIssues = exportIssues;
window.exportMaterialReturns = exportMaterialReturns;
window.exportMinStock = exportMinStock;
window.exportAutoReorderHistory = exportAutoReorderHistory;
window.exportUsers = exportUsers;
window.exportDepartments = exportDepartments;
window.exportWorkflows = exportWorkflows;

console.log('✅ Export module loaded successfully (fully fixed).');