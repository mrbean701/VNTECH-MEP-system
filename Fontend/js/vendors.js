// ================================================================
// VENDORS - QUẢN LÝ NHÀ CUNG CẤP (Cập nhật Phần VI)
// ================================================================

let vendorsPageState = { page: 1, perPage: 10 };

// ====== RENDER DANH SÁCH NHÀ CUNG CẤP ======
async function renderVendors(page = null) {
    try {
        const vendors = await api.getVendors();
        const filter = document.getElementById('vendor-filter')?.value?.toLowerCase() || '';
        const filtered = vendors.filter(v =>
            (v.code || '').toLowerCase().includes(filter) ||
            (v.name || '').toLowerCase().includes(filter)
        );

        if (page) vendorsPageState.page = page;
        const perPage = getPageSize('vendors');
        vendorsPageState.perPage = perPage;
        const paging = paginate(filtered, vendorsPageState.page, perPage);

        const user = getUser();

        const canCreate = hasPermission('vendors.create');
        const canEdit = hasPermission('vendors.edit');
        const canDelete = hasPermission('vendors.delete');

        const btnCreate = document.getElementById('btn-create-vendor');
        if (btnCreate) {
            btnCreate.style.display = canCreate ? 'inline-block' : 'none';
        }

        let html = `
            <div class="filter-bar">
                <input type="text" id="vendor-filter" placeholder="Tìm theo mã hoặc tên..." style="flex:1;" />
                <button class="btn btn-sm" onclick="renderVendors()"><i class="fas fa-search"></i></button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên NCC</th>
                            <th>Nhóm hàng</th>
                            <th>Liên hệ</th>
                            <th>Điện thoại</th>
                            <th>Email</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!paging.items.length) {
            html += `<tr><td colspan="8" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const v of paging.items) {
            const statusBadge = v.status === 'ACTIVE'
                ? '<span class="badge badge-active">🟢 Đang hợp tác</span>'
                : '<span class="badge badge-inactive">🔴 Ngừng hợp tác</span>';

            let actions = `<button class="btn btn-info btn-sm" onclick="viewVendor(${v.id})"><i class="fas fa-eye"></i></button>`;
            if (canEdit) {
                actions += ` <button class="btn btn-warning btn-sm" onclick="editVendor(${v.id})"><i class="fas fa-edit"></i></button>`;
            }
            if (canDelete && (user?.role === 'ADMIN' || user?.role === 'PURCHASING')) {
                actions += ` <button class="btn btn-danger btn-sm" onclick="deleteVendor(${v.id})"><i class="fas fa-trash"></i></button>`;
            }

            const groups = v.vendorGroups && v.vendorGroups.length > 0
                ? v.vendorGroups.join(', ')
                : '--';

            html += `<tr>
                <td><strong>${v.code || '--'}</strong></td>
                <td>${v.name || '--'}</td>
                <td>${groups}</td>
                <td>${v.contact || '--'}</td>
                <td>${v.phone || '--'}</td>
                <td>${v.email || '--'}</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
        html += buildPaginationHTML(paging, 'renderVendors', 'vendors');
        document.getElementById('vendors-container').innerHTML = html;

        document.getElementById('vendor-filter')?.addEventListener('input', () => { vendorsPageState.page = 1; renderVendors(); });

    } catch (error) {
        showError('Không thể tải danh sách nhà cung cấp: ' + error.message);
        console.error('renderVendors error:', error);
    }
}

// ====== HIỂN THỊ MODAL THÊM NCC ======
function showAddVendorModal() {
    showModal('Thêm nhà cung cấp', `
        <div class="form-group"><label>Mã NCC</label><input id="f-vendor-code" placeholder="NCCxxx" required></div>
        <div class="form-group"><label>Tên NCC</label><input id="f-vendor-name" required></div>
        <div class="form-group"><label>Nhóm hàng</label>
            <div id="vendor-group-container">
                <div class="item-row">
                    <input type="text" class="vendor-group-input" placeholder="Nhập nhóm hàng" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-success" onclick="addVendorGroupInput()"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div style="font-size:12px; color:#888; margin-top:4px;">Thêm nhiều nhóm hàng bằng cách nhập và nhấn Enter hoặc nút +</div>
        </div>
        <div class="form-group"><label>Người liên hệ</label><input id="f-vendor-contact" placeholder="Tên người liên hệ"></div>
        <div class="form-group"><label>Số điện thoại</label><input id="f-vendor-phone" placeholder="Số điện thoại"></div>
        <div class="form-group"><label>Email</label><input id="f-vendor-email" type="email" placeholder="email@domain.com"></div>
        <div class="form-group"><label>Điều khoản TT</label><input id="f-vendor-payment" placeholder="Ví dụ: 30 ngày, 45 ngày..."></div>
        <div class="form-group"><label>Ghi chú</label><textarea id="f-vendor-note" rows="2"></textarea></div>
        <div class="modal-actions">
            <button class="btn" onclick="saveVendor()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
}

// ====== THÊM NHÓM HÀNG (DYNAMIC) ======
function addVendorGroupInput(value = '') {
    const container = document.getElementById('vendor-group-container');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.style.marginTop = '4px';
    row.innerHTML = `
        <input type="text" class="vendor-group-input" placeholder="Nhập nhóm hàng" value="${value}" style="flex:1;">
        <button type="button" class="btn btn-sm btn-danger" onclick="removeVendorGroupInput(this)"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(row);
}

function removeVendorGroupInput(btn) {
    const row = btn.parentElement;
    const container = row.parentElement;
    if (container.querySelectorAll('.item-row').length <= 1) {
        // Nếu chỉ còn 1 dòng, clear value thay vì xóa
        const input = row.querySelector('.vendor-group-input');
        if (input) input.value = '';
        return;
    }
    row.remove();
}

function collectVendorGroups() {
    const inputs = document.querySelectorAll('.vendor-group-input');
    const groups = [];
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) groups.push(val);
    });
    return groups;
}

// ====== LƯU NCC MỚI ======
async function saveVendor() {
    const code = document.getElementById('f-vendor-code').value.trim().toUpperCase();
    const name = document.getElementById('f-vendor-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên nhà cung cấp');
        return;
    }

    const groups = collectVendorGroups();

    try {
        const newVendor = {
            code,
            name,
            vendorGroup: groups.length > 0 ? groups[0] : '',
            contact: document.getElementById('f-vendor-contact').value.trim(),
            phone: document.getElementById('f-vendor-phone').value.trim(),
            email: document.getElementById('f-vendor-email').value.trim(),
            paymentTerm: document.getElementById('f-vendor-payment').value.trim(),
            note: document.getElementById('f-vendor-note').value.trim(),
            status: 'ACTIVE'
        };

        const vendor = await api.createVendor(newVendor);
        // ✅ Thêm groups sau khi tạo
        if (groups.length > 0 && typeof api.updateVendorGroups === 'function') {
            await api.updateVendorGroups(vendor.id, groups);
        }
        closeModal();
        await renderVendors();
        showSuccess(`Thêm nhà cung cấp ${code} - ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm nhà cung cấp: ' + error.message);
    }
}

// ====== XEM CHI TIẾT NCC ======
async function viewVendor(id) {
    try {
        let v = await api.getVendorById ? await api.getVendorById(id) : null;
        if (!v) {
            const vendors = await api.getVendors();
            v = vendors.find(item => item.id === id);
        }
        if (!v) {
            showError('Không tìm thấy nhà cung cấp!');
            return;
        }

        const groups = v.vendorGroups && v.vendorGroups.length > 0
            ? v.vendorGroups.join(', ')
            : 'Chưa có nhóm hàng';
        const statusLabel = v.status === 'ACTIVE' ? '🟢 Đang hợp tác' : '🔴 Ngừng hợp tác';

        showModal('Chi tiết nhà cung cấp', `
            <div class="detail-grid">
                <div><span class="label">Mã NCC:</span> <span class="value"><strong>${v.code || '--'}</strong></span></div>
                <div><span class="label">Tên NCC:</span> <span class="value">${v.name || '--'}</span></div>
                <div><span class="label">Nhóm hàng:</span> <span class="value">${groups}</span></div>
                <div><span class="label">Người liên hệ:</span> <span class="value">${v.contact || '--'}</span></div>
                <div><span class="label">Số điện thoại:</span> <span class="value">${v.phone || '--'}</span></div>
                <div><span class="label">Email:</span> <span class="value">${v.email || '--'}</span></div>
                <div><span class="label">Điều khoản TT:</span> <span class="value">${v.paymentTerm || '--'}</span></div>
                <div><span class="label">Trạng thái:</span> <span class="value">${statusLabel}</span></div>
                ${v.inactiveDate ? `<div><span class="label">Ngày ngừng hợp tác:</span> <span class="value">${formatDate(v.inactiveDate)}</span></div>` : ''}
                <div><span class="label">Ngày tạo:</span> <span class="value">${v.createdAt || '--'}</span></div>
                <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${v.note || '--'}</span></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
            </div>
        `);
    } catch (error) {
        showError('Lỗi khi tải chi tiết: ' + error.message);
    }
}

// ====== SỬA NCC ======
async function editVendor(id) {
    if (!hasPermission('vendors.edit')) {
        showWarning('Bạn không có quyền sửa nhà cung cấp!');
        return;
    }

    try {
        const vendors = await api.getVendors();
        const v = vendors.find(item => item.id === id);
        if (!v) {
            showError('Không tìm thấy nhà cung cấp!');
            return;
        }

        // Lấy danh sách group
        let groups = v.vendorGroups || [];

        let groupsHtml = '';
        if (groups.length === 0) {
            groupsHtml = `
                <div class="item-row">
                    <input type="text" class="vendor-group-input" placeholder="Nhập nhóm hàng" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-success" onclick="addVendorGroupInput()"><i class="fas fa-plus"></i></button>
                </div>
            `;
        } else {
            groupsHtml = groups.map(g => `
                <div class="item-row">
                    <input type="text" class="vendor-group-input" placeholder="Nhập nhóm hàng" value="${g}" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeVendorGroupInput(this)"><i class="fas fa-times"></i></button>
                </div>
            `).join('');
            // Thêm dòng trống
            groupsHtml += `
                <div class="item-row">
                    <input type="text" class="vendor-group-input" placeholder="Nhập nhóm hàng" style="flex:1;">
                    <button type="button" class="btn btn-sm btn-success" onclick="addVendorGroupInput()"><i class="fas fa-plus"></i></button>
                </div>
            `;
        }

        showModal('Sửa nhà cung cấp', `
            <div class="form-group"><label>Mã NCC</label><input id="f-vendor-code" value="${v.code || ''}" required></div>
            <div class="form-group"><label>Tên NCC</label><input id="f-vendor-name" value="${v.name || ''}" required></div>
            <div class="form-group"><label>Nhóm hàng</label>
                <div id="vendor-group-container">
                    ${groupsHtml}
                </div>
                <div style="font-size:12px; color:#888; margin-top:4px;">Thêm nhiều nhóm hàng bằng cách nhập và nhấn Enter hoặc nút +</div>
            </div>
            <div class="form-group"><label>Người liên hệ</label><input id="f-vendor-contact" value="${v.contact || ''}"></div>
            <div class="form-group"><label>Số điện thoại</label><input id="f-vendor-phone" value="${v.phone || ''}"></div>
            <div class="form-group"><label>Email</label><input id="f-vendor-email" value="${v.email || ''}"></div>
            <div class="form-group"><label>Điều khoản TT</label><input id="f-vendor-payment" value="${v.paymentTerm || ''}"></div>
            <div class="form-group"><label>Trạng thái</label>
                <select id="f-vendor-status">
                    <option value="ACTIVE" ${v.status === 'ACTIVE' ? 'selected' : ''}>🟢 Đang hợp tác</option>
                    <option value="INACTIVE" ${v.status === 'INACTIVE' ? 'selected' : ''}>🔴 Ngừng hợp tác</option>
                </select>
            </div>
            <div class="form-group"><label>Ngày ngừng hợp tác (nếu có)</label>
                <input id="f-vendor-inactive-date" type="date" value="${v.inactiveDate || ''}" ${v.status === 'ACTIVE' ? 'disabled' : ''}>
                <div style="font-size:12px; color:#888; margin-top:4px;">Chỉ nhập khi chọn trạng thái "Ngừng hợp tác"</div>
            </div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-vendor-note" rows="2">${v.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateVendor(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);

        // Sự kiện thay đổi status
        document.getElementById('f-vendor-status')?.addEventListener('change', function() {
            const dateInput = document.getElementById('f-vendor-inactive-date');
            if (this.value === 'INACTIVE') {
                dateInput.disabled = false;
                if (!dateInput.value) {
                    dateInput.value = new Date().toISOString().slice(0, 10);
                }
            } else {
                dateInput.disabled = true;
                dateInput.value = '';
            }
        });

    } catch (error) {
        showError('Lỗi khi tải thông tin nhà cung cấp: ' + error.message);
    }
}

// ====== CẬP NHẬT NCC ======
async function updateVendor(id) {
    const code = document.getElementById('f-vendor-code').value.trim().toUpperCase();
    const name = document.getElementById('f-vendor-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên');
        return;
    }

    const groups = collectVendorGroups();
    const status = document.getElementById('f-vendor-status').value;
    const inactiveDate = document.getElementById('f-vendor-inactive-date').value;

    try {
        const updatedVendor = {
            code,
            name,
            vendorGroup: groups.length > 0 ? groups[0] : '',
            contact: document.getElementById('f-vendor-contact').value.trim(),
            phone: document.getElementById('f-vendor-phone').value.trim(),
            email: document.getElementById('f-vendor-email').value.trim(),
            paymentTerm: document.getElementById('f-vendor-payment').value.trim(),
            note: document.getElementById('f-vendor-note').value.trim(),
            status,
            inactiveDate: status === 'INACTIVE' ? (inactiveDate || new Date().toISOString().slice(0, 10)) : null
        };

        // ✅ Cập nhật vendor trước
        await api.updateVendor(id, updatedVendor);

        // ✅ Cập nhật groups (nếu có)
        if (typeof api.updateVendorGroups === 'function') {
            await api.updateVendorGroups(id, groups);
        }

        closeModal();
        await renderVendors();
        showSuccess(`Cập nhật nhà cung cấp ${code} thành công!`);
    } catch (error) {
        showError('Lỗi khi cập nhật nhà cung cấp: ' + error.message);
    }
}

// ====== XÓA NCC ======
async function deleteVendor(id) {
    if (!hasPermission('vendors.delete')) {
        showWarning('Bạn không có quyền xóa nhà cung cấp!');
        return;
    }

    try {
        const vendors = await api.getVendors();
        const v = vendors.find(item => item.id === id);
        if (!v) {
            showError('Không tìm thấy nhà cung cấp!');
            return;
        }

        if (!confirm(`Xóa nhà cung cấp "${v.name}"?`)) return;

        await api.deleteVendor(id);
        await renderVendors();
        showSuccess('Xóa nhà cung cấp thành công!');
    } catch (error) {
        if (error.message && error.message.includes('đang được sử dụng')) {
            showWarning('Nhà cung cấp này đang được sử dụng trong các đơn hàng, không thể xóa!');
        } else {
            showError('Lỗi khi xóa nhà cung cấp: ' + error.message);
        }
    }
}

// ====== EXPORT ======
window.renderVendors = renderVendors;
window.viewVendor = viewVendor;
window.editVendor = editVendor;
window.updateVendor = updateVendor;
window.deleteVendor = deleteVendor;
window.saveVendor = saveVendor;
window.showAddVendorModal = showAddVendorModal;

console.log('✅ Vendors module updated with status and vendor groups.');