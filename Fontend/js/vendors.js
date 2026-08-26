// ================================================================
// VENDORS - QUẢN LÝ NHÀ CUNG CẤP (SỬ DỤNG API) - ĐÃ SỬA LỖI NULL
// ================================================================

// ====== RENDER DANH SÁCH NHÀ CUNG CẤP ======
async function renderVendors() {
    try {
        const vendors = await api.getVendors();
        const filter = document.getElementById('vendor-filter')?.value?.toLowerCase() || '';
        const filtered = vendors.filter(v =>
            (v.code || '').toLowerCase().includes(filter) ||
            (v.name || '').toLowerCase().includes(filter)
        );
        const user = getUser();
        const canEdit = ['ADMIN', 'PURCHASING'].includes(user?.role || '');

        let html = `
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
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (!filtered.length) {
            html += `<tr><td colspan="7" style="text-align:center; color:#999;">Không có dữ liệu</td></tr>`;
        }

        for (const v of filtered) {
            let actions = `<button class="btn btn-info btn-sm" onclick="viewVendor(${v.id})"><i class="fas fa-eye"></i></button>`;
            if (canEdit) {
                actions += ` <button class="btn btn-warning btn-sm" onclick="editVendor(${v.id})"><i class="fas fa-edit"></i></button>`;
                if (user?.role === 'ADMIN') {
                    actions += ` <button class="btn btn-danger btn-sm" onclick="deleteVendor(${v.id})"><i class="fas fa-trash"></i></button>`;
                }
            }
            html += `<tr>
                <td><strong>${v.code || '--'}</strong></td>
                <td>${v.name || '--'}</td>
                <td>${v.vendorGroup || '--'}</td>
                <td>${v.contact || '--'}</td>
                <td>${v.phone || '--'}</td>
                <td>${v.email || '--'}</td>
                <td>${actions}</td>
            </tr>`;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('vendors-container').innerHTML = html;

        const btnCreate = document.getElementById('btn-create-vendor');
        if (btnCreate) {
            btnCreate.style.display = canEdit ? 'inline-block' : 'none';
        }
    } catch (error) {
        showError('Không thể tải danh sách nhà cung cấp: ' + error.message);
        console.error('renderVendors error:', error);
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

        showModal('Chi tiết nhà cung cấp', `
            <div class="detail-grid">
                <div><span class="label">Mã NCC:</span> <span class="value"><strong>${v.code || '--'}</strong></span></div>
                <div><span class="label">Tên NCC:</span> <span class="value">${v.name || '--'}</span></div>
                <div><span class="label">Nhóm hàng:</span> <span class="value">${v.vendorGroup || '--'}</span></div>
                <div><span class="label">Người liên hệ:</span> <span class="value">${v.contact || '--'}</span></div>
                <div><span class="label">Số điện thoại:</span> <span class="value">${v.phone || '--'}</span></div>
                <div><span class="label">Email:</span> <span class="value">${v.email || '--'}</span></div>
                <div><span class="label">Điều khoản TT:</span> <span class="value">${v.paymentTerm || '--'}</span></div>
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

// ====== THÊM NCC MỚI ======
async function saveVendor() {
    const code = document.getElementById('f-vendor-code').value.trim().toUpperCase();
    const name = document.getElementById('f-vendor-name').value.trim();
    if (!code || !name) {
        showError('Vui lòng nhập mã và tên nhà cung cấp');
        return;
    }

    try {
        const newVendor = {
            code,
            name,
            vendorGroup: document.getElementById('f-vendor-group').value.trim(),
            contact: document.getElementById('f-vendor-contact').value.trim(),
            phone: document.getElementById('f-vendor-phone').value.trim(),
            email: document.getElementById('f-vendor-email').value.trim(),
            paymentTerm: document.getElementById('f-vendor-payment').value.trim(),
            note: document.getElementById('f-vendor-note').value.trim(),
        };

        await api.createVendor(newVendor);
        closeModal();
        await renderVendors();
        showSuccess(`Thêm nhà cung cấp ${code} - ${name} thành công!`);
    } catch (error) {
        showError('Lỗi khi thêm nhà cung cấp: ' + error.message);
    }
}

// ====== SỬA NCC ======
async function editVendor(id) {
    try {
        const vendors = await api.getVendors();
        const v = vendors.find(item => item.id === id);
        if (!v) {
            showError('Không tìm thấy nhà cung cấp!');
            return;
        }

        const user = getUser();
        if (!['ADMIN', 'PURCHASING'].includes(user?.role || '')) {
            showWarning('Bạn không có quyền sửa nhà cung cấp!');
            return;
        }

        showModal('Sửa nhà cung cấp', `
            <div class="form-group"><label>Mã NCC</label><input id="f-vendor-code" value="${v.code || ''}" required></div>
            <div class="form-group"><label>Tên NCC</label><input id="f-vendor-name" value="${v.name || ''}" required></div>
            <div class="form-group"><label>Nhóm hàng</label><input id="f-vendor-group" value="${v.vendorGroup || ''}"></div>
            <div class="form-group"><label>Người liên hệ</label><input id="f-vendor-contact" value="${v.contact || ''}"></div>
            <div class="form-group"><label>Số điện thoại</label><input id="f-vendor-phone" value="${v.phone || ''}"></div>
            <div class="form-group"><label>Email</label><input id="f-vendor-email" value="${v.email || ''}"></div>
            <div class="form-group"><label>Điều khoản TT</label><input id="f-vendor-payment" value="${v.paymentTerm || ''}"></div>
            <div class="form-group"><label>Ghi chú</label><textarea id="f-vendor-note" rows="2">${v.note || ''}</textarea></div>
            <div class="modal-actions">
                <button class="btn" onclick="updateVendor(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `);
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

    try {
        const updatedVendor = {
            code,
            name,
            vendorGroup: document.getElementById('f-vendor-group').value.trim(),
            contact: document.getElementById('f-vendor-contact').value.trim(),
            phone: document.getElementById('f-vendor-phone').value.trim(),
            email: document.getElementById('f-vendor-email').value.trim(),
            paymentTerm: document.getElementById('f-vendor-payment').value.trim(),
            note: document.getElementById('f-vendor-note').value.trim(),
        };

        await api.updateVendor(id, updatedVendor);
        closeModal();
        await renderVendors();
        showSuccess(`Cập nhật nhà cung cấp ${code} thành công!`);
    } catch (error) {
        showError('Lỗi khi cập nhật nhà cung cấp: ' + error.message);
    }
}

// ====== XÓA NCC ======
async function deleteVendor(id) {
    const user = getUser();
    if (!['ADMIN', 'PURCHASING'].includes(user?.role || '')) {
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

// ====== GẮN SỰ KIỆN CHO NÚT THÊM NCC ======
document.getElementById('btn-create-vendor')?.addEventListener('click', function() {
    const user = getUser();
    if (!['ADMIN', 'PURCHASING'].includes(user?.role || '')) {
        showWarning('Bạn không có quyền thêm nhà cung cấp!');
        return;
    }
    showModal('Thêm nhà cung cấp', `
        <div class="form-group">
            <label>Mã NCC</label>
            <input id="f-vendor-code" placeholder="NCCxxx" required>
        </div>
        <div class="form-group">
            <label>Tên NCC</label>
            <input id="f-vendor-name" required>
        </div>
        <div class="form-group">
            <label>Nhóm hàng</label>
            <input id="f-vendor-group" placeholder="Ví dụ: Thép, Điện, VLXD...">
        </div>
        <div class="form-group">
            <label>Người liên hệ</label>
            <input id="f-vendor-contact" placeholder="Tên người liên hệ">
        </div>
        <div class="form-group">
            <label>Số điện thoại</label>
            <input id="f-vendor-phone" placeholder="Số điện thoại">
        </div>
        <div class="form-group">
            <label>Email</label>
            <input id="f-vendor-email" type="email" placeholder="email@domain.com">
        </div>
        <div class="form-group">
            <label>Điều khoản TT</label>
            <input id="f-vendor-payment" placeholder="Ví dụ: 30 ngày, 45 ngày...">
        </div>
        <div class="form-group">
            <label>Ghi chú</label>
            <textarea id="f-vendor-note" rows="2"></textarea>
        </div>
        <div class="modal-actions">
            <button class="btn" onclick="saveVendor()"><i class="fas fa-save"></i> Lưu</button>
            <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
        </div>
    `);
});

// ====== EXPORT ======
window.renderVendors = renderVendors;
window.viewVendor = viewVendor;
window.editVendor = editVendor;
window.updateVendor = updateVendor;
window.deleteVendor = deleteVendor;
window.saveVendor = saveVendor;

console.log('✅ Vendors module updated to use API (fixed null display).');