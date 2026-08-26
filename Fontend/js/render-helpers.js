// ================================================================
// RENDER HELPERS - Hàm dùng chung cho MR, PR, PO
// ================================================================

function renderApprovalList({ data, filterId, statusFilterId, containerId, columns, getActions, viewFunction, emptyMessage = 'Không có dữ liệu' }) {
    const filter = document.getElementById(filterId)?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById(statusFilterId)?.value || '';
    const filtered = data.filter(item => {
        const matchSearch = item.code?.toLowerCase().includes(filter) || (item.projectName || '').toLowerCase().includes(filter);
        const matchStatus = statusFilter ? item.status === statusFilter : true;
        return matchSearch && matchStatus;
    });

    let html = `<div class="table-responsive"><table><thead><tr>`;
    columns.forEach(col => html += `<th>${col}</th>`);
    html += `</tr></thead><tbody>`;

    if (!filtered.length) {
        html += `<tr><td colspan="${columns.length}" style="text-align:center; color:#999;">${emptyMessage}</td></tr>`;
    }

    filtered.forEach(item => {
        const projectId = getProjectIdByCode(item.projectCode);
        html += `<tr>`;
        html += `<td style="cursor:pointer; color:#1a3c6e; font-weight:500;" onclick="${viewFunction}(${item.id})">${item.code}</td>`;
        html += `<td style="cursor:pointer; color:#1a3c6e;" onclick="${projectId ? `viewProject(${projectId})` : `alert('Không tìm thấy dự án')`}">${item.projectName || item.projectCode || ''}</td>`;
        // Các cột khác sẽ được xử lý riêng trong từng module
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    document.getElementById(containerId).innerHTML = html;
}

function renderApprovalDetail({ item, title, extraFields, itemsTable, approvalHtml, projectLink, actions }) {
    let detailHtml = `
        <div class="detail-grid">
            <div><span class="label">Mã ${title}:</span> <span class="value">${item.code}</span></div>
            <div><span class="label">Ngày tạo:</span> <span class="value">${item.createdAt || ''}</span></div>
            ${extraFields || ''}
            <div><span class="label">Dự án:</span> <span class="value">${projectLink}</span></div>
            <div><span class="label">Trạng thái:</span> <span class="value">${getStatusBadge(item.status)}</span></div>
            <div style="grid-column:1/-1;"><span class="label">Tiến độ duyệt:</span><br>${approvalHtml}</div>
            <div style="grid-column:1/-1;"><span class="label">Danh sách vật tư:</span><br>${itemsTable}</div>
            <div style="grid-column:1/-1;"><span class="label">Ghi chú:</span> <span class="value">${item.note || ''}</span></div>
        </div>
        ${actions || ''}
        <div class="modal-actions"><button class="btn btn-danger" onclick="closeModal()">Đóng</button></div>
    `;
    showModal(`Chi tiết ${title}`, detailHtml);
}

function buildItemsTable(items) {
    if (!items || items.length === 0) return '<p>Không có vật tư</p>';
    return `
        <div class="table-responsive">
            <table>
                <thead><tr><th>Mã</th><th>Tên vật tư</th><th>ĐVT</th><th>Số lượng</th></tr></thead>
                <tbody>
                    ${items.map(it => `
                        <tr>
                            <td>${getItemCode(it.itemId)}</td>
                            <td>${getItemName(it.itemId)}</td>
                            <td>${getItemUnit(it.itemId)}</td>
                            <td>${it.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function buildItemRowsForForm(itemsData, namePrefix) {
    const allItems = window._itemsCache || [];
    let html = '';
    if (!itemsData || itemsData.length === 0) itemsData = [{ itemId: '', quantity: '' }];
    itemsData.forEach((item, index) => {
        const selected = item.itemId || '';
        html += `<div class="item-row" data-index="${index}">
            <select class="item-select" data-name="${namePrefix}[${index}].itemId">
                <option value="">-- Chọn --</option>
                ${allItems.map(it => `<option value="${it.id}" ${it.id == selected ? 'selected' : ''}>${it.code} - ${it.name}</option>`).join('')}
            </select>
            <input type="number" class="item-qty" data-name="${namePrefix}[${index}].quantity" value="${item.quantity || ''}" placeholder="SL" style="width:100px;">
            <button type="button" class="remove-item" onclick="removeItemRow(this)"><i class="fas fa-minus"></i></button>
        </div>`;
    });
    html += `<button type="button" class="btn-add-item" onclick="addItemRow(this)"><i class="fas fa-plus"></i> Thêm vật tư</button>`;
    return html;
}

function collectItemsFromForm(container) {
    const rows = container.querySelectorAll('.item-row');
    const items = [];
    rows.forEach(row => {
        const sel = row.querySelector('.item-select');
        const qty = row.querySelector('.item-qty');
        const itemId = parseInt(sel.value);
        const quantity = parseFloat(qty.value);
        if (itemId && !isNaN(quantity) && quantity > 0) items.push({ itemId, quantity });
    });
    return items;
}

function addItemRow(btn) {
    const container = btn.parentElement;
    const index = container.querySelectorAll('.item-row').length;
    const allItems = window._itemsCache || [];
    let opts = allItems.map(it => `<option value="${it.id}">${it.code} - ${it.name}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.index = index;
    row.innerHTML = `
        <select class="item-select" data-name="items[${index}].itemId"><option value="">-- Chọn --</option>${opts}</select>
        <input type="number" class="item-qty" data-name="items[${index}].quantity" placeholder="SL" style="width:100px;">
        <button type="button" class="remove-item" onclick="removeItemRow(this)"><i class="fas fa-minus"></i></button>
    `;
    container.insertBefore(row, btn);
}

function removeItemRow(btn) {
    const row = btn.parentElement;
    const container = row.parentElement;
    if (container.querySelectorAll('.item-row').length <= 1) {
        showWarning('Cần ít nhất một dòng');
        return;
    }
    row.remove();
    container.querySelectorAll('.item-row').forEach((r, i) => {
        r.dataset.index = i;
        const sel = r.querySelector('.item-select');
        const qty = r.querySelector('.item-qty');
        if (sel) sel.dataset.name = `items[${i}].itemId`;
        if (qty) qty.dataset.name = `items[${i}].quantity`;
    });
}

// Export ra window
window.renderApprovalList = renderApprovalList;
window.renderApprovalDetail = renderApprovalDetail;
window.buildItemsTable = buildItemsTable;
window.buildItemRowsForForm = buildItemRowsForForm;
window.collectItemsFromForm = collectItemsFromForm;
window.addItemRow = addItemRow;
window.removeItemRow = removeItemRow;

console.log('✅ Render helpers loaded successfully.');