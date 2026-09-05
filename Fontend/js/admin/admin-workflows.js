// ================================================================
// ADMIN WORKFLOWS - Quản lý workflow đa mẫu + status mapping
// ================================================================

let stepCounter = 0;

function renderWorkflowsTab() {
    const workflows = _adminWorkflows || [];
    const modules = ['mr', 'pr', 'po', 'grn', 'sto', 'issue', 'materialreturn'];
    
    const grouped = {};
    modules.forEach(mod => {
        grouped[mod] = workflows.filter(w => w.module === mod);
    });

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">⚙️ Quản lý Workflow</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-success" onclick="createDefaultWorkflows()"><i class="fas fa-plus"></i> Tạo mặc định</button>
                <button class="btn btn-info" onclick="refreshWorkflows()"><i class="fas fa-sync"></i> Làm mới</button>
            </div>
        </div>
        <div style="font-size:13px; color:#888; margin-bottom:12px; padding:12px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0;">
            <i class="fas fa-info-circle"></i> 
            <strong>Hướng dẫn:</strong> Mỗi module chỉ có <strong>1</strong> workflow được kích hoạt (is_active = true). 
            Mẫu hệ thống (is_system = true) không thể xóa. 
            <span style="display:block; margin-top:4px;">
                <span class="badge badge-approved">✅ Đang áp dụng</span>
                <span class="badge badge-draft">⏸️ Không áp dụng</span>
                <span class="badge badge-info">Hệ thống</span>
                <span class="badge badge-draft">Tùy chỉnh</span>
            </span>
        </div>
    `;

    for (const module of modules) {
        const list = grouped[module] || [];
        const active = list.find(w => w.isActive === true);

        html += `
            <div style="background:white; border-radius:8px; padding:16px; margin-bottom:16px; border:1px solid #e2e8f0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:#1a3c6e; text-transform:uppercase; font-size:16px;">
                        ${module.toUpperCase()}
                        <span style="font-size:13px; font-weight:400; color:#888; margin-left:8px;">${list.length} mẫu</span>
                    </h4>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                        <button class="btn btn-sm btn-info" onclick="showCreateWorkflowModal('${module}')"><i class="fas fa-plus"></i> Thêm mẫu</button>
                        ${active ? `<span class="badge badge-approved" style="font-size:13px;">✅ Đang áp dụng: ${active.name}</span>` : '<span class="badge badge-draft" style="font-size:13px;">⚠️ Chưa có workflow active</span>'}
                    </div>
                </div>
                <div style="max-height:500px; overflow-y:auto;">
                    ${list.length === 0 ? '<div style="color:#999; padding:12px; text-align:center;">Chưa có workflow nào</div>' : ''}
                    ${list.map(w => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; margin-bottom:6px; background:${w.isActive ? '#f0fdf4' : '#f8fafc'}; border-radius:6px; border-left:4px solid ${w.isActive ? '#22c55e' : '#94a3b8'};">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:600; font-size:14px;">${w.name}</div>
                                <div style="font-size:12px; color:#888; flex-wrap:wrap; display:flex; gap:6px; margin-top:2px;">
                                    ${w.isSystem ? '<span class="badge badge-info">Hệ thống</span>' : '<span class="badge badge-draft">Tùy chỉnh</span>'}
                                    ${w.isActive ? '<span class="badge badge-approved">✅ Đang áp dụng</span>' : '<span class="badge badge-draft">⏸️ Không áp dụng</span>'}
                                    ${w.description ? `<span style="color:#94a3b8;">${w.description}</span>` : ''}
                                    <span style="color:#94a3b8;">| ${w.steps ? JSON.parse(w.steps).length : 0} bước</span>
                                </div>
                            </div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-left:8px;">
                                <button class="btn btn-info btn-sm" onclick="viewWorkflowDetail(${w.id})" title="Xem chi tiết"><i class="fas fa-info-circle"></i></button>
                                ${!w.isActive ? `<button class="btn btn-success btn-sm" onclick="activateWorkflow('${module}', ${w.id})" title="Kích hoạt"><i class="fas fa-check"></i></button>` : ''}
                                <button class="btn btn-info btn-sm" onclick="editWorkflow(${w.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-warning btn-sm" onclick="duplicateWorkflow(${w.id})" title="Sao chép"><i class="fas fa-copy"></i></button>
                                ${!w.isSystem && !w.isActive ? `<button class="btn btn-danger btn-sm" onclick="deleteWorkflow(${w.id})" title="Xóa"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return html;
}

async function activateWorkflow(module, id) {
    if (!confirm(`Xác nhận kích hoạt workflow ID ${id} cho module ${module}? Các workflow khác sẽ bị hủy kích hoạt.`)) return;
    try {
        await api.activateWorkflow(module, id);
        showSuccess('Kích hoạt workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi kích hoạt: ' + error.message);
    }
}

async function duplicateWorkflow(id) {
    try {
        const result = await api.duplicateWorkflow(id);
        showSuccess(`Đã sao chép workflow "${result.name}"`);
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi sao chép: ' + error.message);
    }
}

async function deleteWorkflow(id) {
    if (!confirm('Xóa workflow này? (Chỉ xóa được mẫu tùy chỉnh và không active)')) return;
    try {
        await api.deleteWorkflow(id);
        showSuccess('Xóa workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi xóa: ' + error.message);
    }
}

function viewWorkflowDetail(id) {
    const wf = _adminWorkflows.find(w => w.id === id);
    if (!wf) {
        showError('Không tìm thấy workflow!');
        return;
    }
    let steps = [];
    try {
        steps = JSON.parse(wf.steps || '[]');
    } catch(e) {
        steps = [];
    }
    const defaultStep = steps.length > 0 ? steps.length : 1;
    viewWorkflowDetailWithStep(id, defaultStep);
}

function viewWorkflowDetailWithStep(id, currentStep) {
    const wf = _adminWorkflows.find(w => w.id === id);
    if (!wf) {
        showError('Không tìm thấy workflow!');
        return;
    }

    let steps = [];
    try {
        steps = JSON.parse(wf.steps || '[]');
    } catch(e) {
        steps = [];
    }

    let statusMap = {};
    api.getWorkflowStepStatuses(wf.id).then(mappings => {
        if (mappings && Array.isArray(mappings)) {
            mappings.forEach(m => { statusMap[m.step] = m.statusCode; });
        }
    }).catch(() => {});

    const totalSteps = steps.length;
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;

    const stepsConfig = steps.map(s => ({
        id: s.step,
        label: s.label || `Bước ${s.step}`
    }));

    const progressHtml = renderApprovalProgress('PENDING', currentStep, stepsConfig);

    let stepsHtml = '';
    steps.forEach((step, idx) => {
        const stepNumber = idx + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const statusColor = isCompleted ? '#22c55e' : (isCurrent ? '#f59e0b' : '#d1d5db');
        const statusText = isCompleted ? 'Đã hoàn thành' : (isCurrent ? 'Đang thực hiện' : 'Chưa đến');

        const deptName = step.departmentId ? (getDepartmentsData().find(d => d.id === step.departmentId)?.name || 'N/A') : 'Không giới hạn';
        const permKey = step.permissionKey || '--';
        const stepStatus = statusMap[stepNumber] || '--';
        stepsHtml += `
            <tr>
                <td style="text-align:center; font-weight:600;">${stepNumber}</td>
                <td><span class="badge badge-info">${permKey}</span></td>
                <td>${deptName}</td>
                <td>${step.label || '--'}</td>
                <td><span style="color:${statusColor};">${statusText}</span></td>
                <td><span class="badge badge-info">${stepStatus}</span></td>
            </tr>
        `;
    });

    const modalContent = `
        <div style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0;">${wf.name}</h3>
                <span class="badge ${wf.isActive ? 'badge-approved' : 'badge-draft'}">${wf.isActive ? '✅ Đang áp dụng' : '⏸️ Không áp dụng'}</span>
            </div>
            <div style="color:#888; font-size:14px; margin-top:4px;">
                <strong>Module:</strong> ${wf.module.toUpperCase()} 
                ${wf.isSystem ? '| <span class="badge badge-info">Hệ thống</span>' : ''}
            </div>
            ${wf.description ? `<div style="margin-top:6px; color:#555;">${wf.description}</div>` : ''}
        </div>

        <div style="margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:15px;">📊 Tiến trình duyệt (mô phỏng)</strong>
                <div style="display:flex; align-items:center; gap:8px; font-size:13px;">
                    <span>Bước hiện tại:</span>
                    <select id="simulate-step" onchange="updateSimulation(${id})" style="padding:4px 8px; border:1px solid #ccc; border-radius:4px;">
                        ${steps.map((_, idx) => `<option value="${idx + 1}" ${idx + 1 === currentStep ? 'selected' : ''}>Bước ${idx + 1}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
                ${progressHtml}
            </div>
        </div>

        <div>
            <strong style="font-size:15px;">📋 Danh sách bước duyệt</strong>
            <div class="table-responsive" style="margin-top:8px; max-height:300px; overflow-y:auto;">
                <table>
                    <thead>
                        <tr>
                            <th style="width:60px;">#</th>
                            <th>Permission Key</th>
                            <th>Phòng ban</th>
                            <th>Tên bước</th>
                            <th>Trạng thái</th>
                            <th>Status code</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stepsHtml}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-danger" onclick="closeModal()">Đóng</button>
        </div>
    `;

    showModal('Chi tiết workflow', modalContent);
}

function updateSimulation(id) {
    const wf = _adminWorkflows.find(w => w.id === id);
    if (!wf) return;
    const selectedStep = parseInt(document.getElementById('simulate-step').value);
    closeModal();
    viewWorkflowDetailWithStep(id, selectedStep);
}

function showCreateWorkflowModal(module) {
    stepCounter = 0;
    Promise.all([refreshAdminDepartments(), refreshAdminStatuses()]).then(() => {
        const modalContent = `
            <div class="form-group">
                <label>Module</label>
                <input id="f-wf-module" value="${module}" readonly style="background:#f0f0f0; width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div class="form-group">
                <label>Tên workflow <span style="color:red;">*</span></label>
                <input id="f-wf-name" placeholder="Ví dụ: Quy trình 4 bước nâng cao" class="form-control">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea id="f-wf-desc" rows="2" class="form-control"></textarea>
            </div>
            <div class="form-group">
                <label>Các bước duyệt</label>
                <div style="margin-bottom:8px;">
                    <button type="button" class="btn btn-sm btn-info" onclick="addWorkflowStepFieldWithStatus('wf-steps-container', '${module}')"><i class="fas fa-plus"></i> Thêm bước</button>
                    <button type="button" class="btn btn-sm btn-warning" onclick="loadDefaultStepsWithStatus('wf-steps-container', '${module}')"><i class="fas fa-undo"></i> Tải mẫu</button>
                </div>
                <div id="wf-steps-container" style="max-height:300px; overflow-y:auto; padding:4px; border:1px solid #e2e8f0; border-radius:6px; background:white;">
                </div>
                <div style="font-size:12px; color:#888; margin-top:4px;">
                    <i class="fas fa-info-circle"></i> Mỗi bước gồm: Permission Key, Phòng ban (tùy chọn), Tên bước và Trạng thái.
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="saveNewWorkflow()"><i class="fas fa-save"></i> Lưu</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `;
        showModal('Tạo workflow mới', modalContent);
        setTimeout(() => {
            addWorkflowStepFieldWithStatus('wf-steps-container', module);
        }, 100);
    });
}

// ====== THÊM BƯỚC WORKFLOW (ĐÃ SỬA) ======
function addWorkflowStepFieldWithStatus(containerId, module, stepData = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    stepCounter++;
    const stepNumber = container.querySelectorAll('.wf-step-row').length + 1;

    const allPermissionKeys = getAllPermissionKeys();
    const permOpts = allPermissionKeys.map(key => 
        `<option value="${key}" ${(stepData && stepData.permissionKey === key) ? 'selected' : ''}>${key}</option>`
    ).join('');

    const departments = getDepartmentsData();
    const deptOpts = `<option value="">-- Không giới hạn --</option>` + 
        departments.map(d => 
            `<option value="${d.id}" ${(stepData && stepData.departmentId == d.id) ? 'selected' : ''}>${d.code} - ${d.name}</option>`
        ).join('');

    const statuses = _adminStatuses.filter(s => s.entityType === module);
    const statusOpts = statuses.map(s => 
        `<option value="${s.code}" ${(stepData && stepData.statusCode === s.code) ? 'selected' : ''}>${s.name} (${s.code})</option>`
    ).join('');

    const row = document.createElement('div');
    row.className = 'wf-step-row';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.alignItems = 'center';
    row.style.marginBottom = '8px';
    row.style.padding = '8px';
    row.style.background = '#f8fafc';
    row.style.borderRadius = '6px';
    row.style.border = '1px solid #e2e8f0';
    row.style.flexWrap = 'wrap';

    row.innerHTML = `
        <span style="min-width:40px; font-weight:600; color:#1a3c6e;">#${stepNumber}</span>
        <select class="wf-permission-select" style="flex:1; min-width:180px; padding:6px; border:1px solid #ccc; border-radius:4px;">
            <option value="">-- Chọn permission --</option>
            ${permOpts}
        </select>
        <select class="wf-dept-select" style="flex:1; min-width:150px; padding:6px; border:1px solid #ccc; border-radius:4px;">
            ${deptOpts}
        </select>
        <input type="text" class="wf-label-input" placeholder="Tên bước (VD: Duyệt KH)" value="${stepData ? stepData.label || '' : ''}" style="flex:2; min-width:150px; padding:6px; border:1px solid #ccc; border-radius:4px;">
        <select class="wf-status-select" style="flex:1; min-width:130px; padding:6px; border:1px solid #ccc; border-radius:4px;">
            <option value="">-- Không có status --</option>
            ${statusOpts}
        </select>
        <button type="button" class="btn btn-sm btn-danger remove-step-btn" onclick="removeWorkflowStepField(this)"><i class="fas fa-minus"></i></button>
    `;

    container.appendChild(row);
    updateStepNumbers(containerId);
}

function removeWorkflowStepField(btn) {
    const row = btn.closest('.wf-step-row');
    if (row) {
        const container = row.parentElement;
        row.remove();
        updateStepNumbers(container.id);
    }
}

function updateStepNumbers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const rows = container.querySelectorAll('.wf-step-row');
    rows.forEach((row, idx) => {
        const numberSpan = row.querySelector('span:first-child');
        if (numberSpan) numberSpan.textContent = `#${idx + 1}`;
    });
}

// ====== COLLECT WORKFLOW STEPS (ĐÃ SỬA - CÓ DEPARTMENT ID) ======
function collectWorkflowStepsWithStatus(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { steps: [], stepStatuses: [] };
    const rows = container.querySelectorAll('.wf-step-row');
    const steps = [];
    const stepStatuses = [];
    rows.forEach((row, idx) => {
        const permissionKey = row.querySelector('.wf-permission-select')?.value || '';
        // ✅ Lấy departmentId từ dropdown
        const deptId = row.querySelector('.wf-dept-select')?.value || '';
        const label = row.querySelector('.wf-label-input')?.value || `Bước ${idx + 1}`;
        const statusCode = row.querySelector('.wf-status-select')?.value || '';
        steps.push({
            step: idx + 1,
            permissionKey: permissionKey,
            label: label,
            departmentId: deptId ? parseInt(deptId) : null
        });
        if (statusCode) {
            stepStatuses.push({
                step: idx + 1,
                statusCode: statusCode
            });
        }
    });
    return { steps, stepStatuses };
}

function loadDefaultStepsWithStatus(containerId, module) {
    const defaults = {
        mr: [{ step: 1, permissionKey: 'mr.approve', label: 'Chỉ huy trưởng duyệt', departmentId: 5 }],
        pr: [
            { step: 1, permissionKey: 'pr.approve', label: 'Dự án duyệt', departmentId: 4 },
            { step: 2, permissionKey: 'pr.approve', label: 'Kế hoạch duyệt', departmentId: 3 },
            { step: 3, permissionKey: 'pr.approve', label: 'CEO duyệt', departmentId: 1 }
        ],
        po: [
            { step: 1, permissionKey: 'po.approve', label: 'Dự án duyệt', departmentId: 4 },
            { step: 2, permissionKey: 'po.approve', label: 'Kế hoạch duyệt', departmentId: 3 },
            { step: 3, permissionKey: 'po.approve', label: 'CEO duyệt', departmentId: 1 }
        ],
        grn: [
            { step: 1, permissionKey: 'grn.create', label: 'Lập phiếu', departmentId: 4 },
            { step: 2, permissionKey: 'grn.receive', label: 'Thủ kho nhận', departmentId: null },
            { step: 3, permissionKey: 'grn.qc', label: 'QC kiểm tra', departmentId: 5 },
            { step: 4, permissionKey: 'grn.complete', label: 'Hoàn thành', departmentId: 4 }
        ],
        sto: [
            { step: 1, permissionKey: 'sto.create', label: 'Lập phiếu', departmentId: 4 },
            { step: 2, permissionKey: 'sto.approve', label: 'Duyệt', departmentId: 4 },
            { step: 3, permissionKey: 'sto.complete', label: 'Xuất kho', departmentId: 4 }
        ],
        issue: [
            { step: 1, permissionKey: 'issue.create', label: 'Tạo phiếu', departmentId: 5 },
            { step: 2, permissionKey: 'issue.approve', label: 'Duyệt', departmentId: 5 },
            { step: 3, permissionKey: 'issue.complete', label: 'Cấp phát', departmentId: 4 },
            { step: 4, permissionKey: 'issue.confirm', label: 'Xác nhận', departmentId: 5 }
        ],
        materialreturn: [
            { step: 1, permissionKey: 'materialreturn.create', label: 'Tạo phiếu', departmentId: 5 },
            { step: 2, permissionKey: 'materialreturn.approve', label: 'Thủ kho nhận', departmentId: 4 },
            { step: 3, permissionKey: 'materialreturn.confirm', label: 'Xác nhận', departmentId: 5 }
        ]
    };

    const steps = defaults[module] || [{ step: 1, permissionKey: 'admin.view', label: 'Bước 1', departmentId: null }];
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
        steps.forEach(step => {
            addWorkflowStepFieldWithStatus(containerId, module, step);
        });
    }
}

async function saveNewWorkflow() {
    const module = document.getElementById('f-wf-module').value.trim();
    const name = document.getElementById('f-wf-name').value.trim();
    const description = document.getElementById('f-wf-desc').value.trim();
    const { steps, stepStatuses } = collectWorkflowStepsWithStatus('wf-steps-container');

    if (!name || steps.length === 0) {
        showError('Vui lòng nhập tên và ít nhất một bước duyệt');
        return;
    }
    for (const step of steps) {
        if (!step.permissionKey) {
            showError(`Bước ${step.step} chưa chọn permission key`);
            return;
        }
        if (!step.label) {
            showError(`Bước ${step.step} chưa nhập tên bước`);
            return;
        }
    }

    try {
        const payload = {
            module,
            name,
            description,
            steps: JSON.stringify(steps),
            status: 'DRAFT',
            isSystem: false,
            stepStatuses: stepStatuses
        };
        await api.createWorkflowWithStatuses(payload);
        closeModal();
        showSuccess('Tạo workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi tạo workflow: ' + error.message);
    }
}

async function editWorkflow(id) {
    try {
        const wf = _adminWorkflows.find(w => w.id === id);
        if (!wf) { showError('Không tìm thấy workflow'); return; }

        stepCounter = 0;
        await Promise.all([refreshAdminDepartments(), refreshAdminStatuses()]);

        let steps = [];
        try {
            steps = JSON.parse(wf.steps || '[]');
        } catch(e) { steps = []; }

        let currentMappings = [];
        try {
            currentMappings = await api.getWorkflowStepStatuses(wf.id);
            if (!Array.isArray(currentMappings)) currentMappings = [];
        } catch(e) { currentMappings = []; }

        const stepsWithStatus = steps.map(step => {
            const mapping = currentMappings.find(m => m.step === step.step);
            return { ...step, statusCode: mapping ? mapping.statusCode : '' };
        });

        const modalContent = `
            <div class="form-group">
                <label>Module</label>
                <input value="${wf.module}" readonly style="background:#f0f0f0; width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            </div>
            <div class="form-group">
                <label>Tên workflow <span style="color:red;">*</span></label>
                <input id="f-wf-edit-name" value="${wf.name || ''}" class="form-control">
            </div>
            <div class="form-group">
                <label>Mô tả</label>
                <textarea id="f-wf-edit-desc" rows="2" class="form-control">${wf.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Các bước duyệt</label>
                <div style="margin-bottom:8px;">
                    <button type="button" class="btn btn-sm btn-info" onclick="addWorkflowStepFieldWithStatus('wf-edit-steps-container', '${wf.module}')"><i class="fas fa-plus"></i> Thêm bước</button>
                    <button type="button" class="btn btn-sm btn-warning" onclick="loadDefaultStepsWithStatus('wf-edit-steps-container', '${wf.module}')"><i class="fas fa-undo"></i> Tải mẫu</button>
                </div>
                <div id="wf-edit-steps-container" style="max-height:300px; overflow-y:auto; padding:4px; border:1px solid #e2e8f0; border-radius:6px; background:white;">
                </div>
                <div style="font-size:12px; color:#888; margin-top:4px;">
                    <i class="fas fa-info-circle"></i> Mỗi bước gồm: Permission Key, Phòng ban (tùy chọn), Tên bước và Trạng thái.
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="updateWorkflow(${id})"><i class="fas fa-save"></i> Cập nhật</button>
                <button class="btn btn-danger" onclick="closeModal()">Hủy</button>
            </div>
        `;
        showModal('Sửa workflow', modalContent);
        setTimeout(() => {
            const container = document.getElementById('wf-edit-steps-container');
            if (container) {
                container.innerHTML = '';
                stepsWithStatus.forEach(step => {
                    addWorkflowStepFieldWithStatus('wf-edit-steps-container', wf.module, step);
                });
            }
        }, 100);
    } catch (error) {
        showError('Lỗi tải workflow: ' + error.message);
    }
}

async function updateWorkflow(id) {
    const name = document.getElementById('f-wf-edit-name').value.trim();
    const description = document.getElementById('f-wf-edit-desc').value.trim();
    const { steps, stepStatuses } = collectWorkflowStepsWithStatus('wf-edit-steps-container');

    if (!name || steps.length === 0) {
        showError('Vui lòng nhập tên và ít nhất một bước duyệt');
        return;
    }
    for (const step of steps) {
        if (!step.permissionKey) {
            showError(`Bước ${step.step} chưa chọn permission key`);
            return;
        }
        if (!step.label) {
            showError(`Bước ${step.step} chưa nhập tên bước`);
            return;
        }
    }

    try {
        const payload = {
            name,
            description,
            steps: JSON.stringify(steps),
            status: 'DRAFT',
            stepStatuses: stepStatuses
        };
        await api.updateWorkflowWithStatuses(id, payload);
        closeModal();
        showSuccess('Cập nhật workflow thành công!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi cập nhật: ' + error.message);
    }
}

async function createDefaultWorkflows() {
    if (!confirm('Tạo các workflow mặc định cho tất cả module? (sẽ không ghi đè nếu đã có)')) return;
    try {
        const defaults = {
            mr: [{ step: 1, permissionKey: 'mr.approve', label: 'Chỉ huy trưởng duyệt', departmentId: 5 }],
            pr: [
                { step: 1, permissionKey: 'pr.approve', label: 'Dự án duyệt', departmentId: 4 },
                { step: 2, permissionKey: 'pr.approve', label: 'Kế hoạch duyệt', departmentId: 3 },
                { step: 3, permissionKey: 'pr.approve', label: 'CEO duyệt', departmentId: 1 }
            ],
            po: [
                { step: 1, permissionKey: 'po.approve', label: 'Dự án duyệt', departmentId: 4 },
                { step: 2, permissionKey: 'po.approve', label: 'Kế hoạch duyệt', departmentId: 3 },
                { step: 3, permissionKey: 'po.approve', label: 'CEO duyệt', departmentId: 1 }
            ],
            grn: [
                { step: 1, permissionKey: 'grn.create', label: 'Lập phiếu', departmentId: 4 },
                { step: 2, permissionKey: 'grn.receive', label: 'Thủ kho nhận', departmentId: null },
                { step: 3, permissionKey: 'grn.qc', label: 'QC kiểm tra', departmentId: 5 },
                { step: 4, permissionKey: 'grn.complete', label: 'Hoàn thành', departmentId: 4 }
            ],
            sto: [
                { step: 1, permissionKey: 'sto.create', label: 'Lập phiếu', departmentId: 4 },
                { step: 2, permissionKey: 'sto.approve', label: 'Duyệt', departmentId: 4 },
                { step: 3, permissionKey: 'sto.complete', label: 'Xuất kho', departmentId: 4 }
            ],
            issue: [
                { step: 1, permissionKey: 'issue.create', label: 'Tạo phiếu', departmentId: 5 },
                { step: 2, permissionKey: 'issue.approve', label: 'Duyệt', departmentId: 5 },
                { step: 3, permissionKey: 'issue.complete', label: 'Cấp phát', departmentId: 4 },
                { step: 4, permissionKey: 'issue.confirm', label: 'Xác nhận', departmentId: 5 }
            ],
            materialreturn: [
                { step: 1, permissionKey: 'materialreturn.create', label: 'Tạo phiếu', departmentId: 5 },
                { step: 2, permissionKey: 'materialreturn.approve', label: 'Thủ kho nhận', departmentId: 4 },
                { step: 3, permissionKey: 'materialreturn.confirm', label: 'Xác nhận', departmentId: 5 }
            ]
        };

        for (const [module, steps] of Object.entries(defaults)) {
            const existing = await api.getWorkflowsByModule(module);
            if (existing && existing.length > 0) {
                console.log(`Module ${module} đã có workflow, bỏ qua`);
                continue;
            }
            const name = `${module.toUpperCase()} - Mặc định`;
            const stepStatuses = steps.map(step => ({
                step: step.step,
                statusCode: ''
            }));
            await api.createWorkflowWithStatuses({
                module,
                name,
                description: `Quy trình mặc định cho ${module}`,
                steps: JSON.stringify(steps),
                status: 'DRAFT',
                isSystem: true,
                stepStatuses: stepStatuses
            });
        }
        showSuccess('Đã tạo workflow mặc định cho các module chưa có!');
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
    } catch (error) {
        showError('Lỗi tạo workflow mặc định: ' + error.message);
    }
}

async function refreshWorkflows() {
    showLoading('Đang tải workflow...');
    try {
        await refreshAdminWorkflows();
        renderAdminUI('workflows');
        showSuccess('Làm mới thành công!');
    } catch(e) {
        showError('Lỗi làm mới: ' + e.message);
    } finally {
        hideLoading();
    }
}

// Export
window.renderWorkflowsTab = renderWorkflowsTab;
window.activateWorkflow = activateWorkflow;
window.duplicateWorkflow = duplicateWorkflow;
window.deleteWorkflow = deleteWorkflow;
window.viewWorkflowDetail = viewWorkflowDetail;
window.viewWorkflowDetailWithStep = viewWorkflowDetailWithStep;
window.updateSimulation = updateSimulation;
window.showCreateWorkflowModal = showCreateWorkflowModal;
window.saveNewWorkflow = saveNewWorkflow;
window.editWorkflow = editWorkflow;
window.updateWorkflow = updateWorkflow;
window.createDefaultWorkflows = createDefaultWorkflows;
window.refreshWorkflows = refreshWorkflows;
window.addWorkflowStepFieldWithStatus = addWorkflowStepFieldWithStatus;
window.removeWorkflowStepField = removeWorkflowStepField;
window.loadDefaultStepsWithStatus = loadDefaultStepsWithStatus;
window.collectWorkflowStepsWithStatus = collectWorkflowStepsWithStatus;

console.log('✅ Admin Workflows module updated with departmentId support.');