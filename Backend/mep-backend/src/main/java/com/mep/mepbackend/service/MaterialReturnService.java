package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.ApprovalHistory;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.entity.MaterialReturn;
import com.mep.mepbackend.entity.Status;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ApprovalHistoryRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.MaterialReturnRepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MaterialReturnService {

    private final MaterialReturnRepository returnRepository;
    private final InventoryRepository inventoryRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService; // ✅ Đã thêm
    private final CurrentUserUtil currentUserUtil;

    private static final List<String> PENDING_STATUSES = Arrays.asList("PENDING");

    // ===== HELPERS =====
    private String generateCode(String prefix) {
        long count = returnRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (returnRepository.existsByCode(code)) {
            count++;
            code = prefix + "-" + String.format("%03d", count);
        }
        return code;
    }

    private boolean isPendingStatus(String status) {
        return PENDING_STATUSES.contains(status);
    }

    // ===== GETTERS =====
    public List<MaterialReturn> getAll() {
        return returnRepository.findAll();
    }

    public MaterialReturn getById(Long id) {
        return returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaterialReturn not found with id: " + id));
    }

    // ===== CREATE =====
    @Transactional
    public MaterialReturn create(MaterialReturn materialReturn) {
        if (!currentUserUtil.hasPermission("materialreturn.create")) {
            throw new RuntimeException("Bạn không có quyền tạo phiếu hoàn trả");
        }

        materialReturn.setCode(generateCode("MRET"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("materialreturn");
        materialReturn.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("materialreturn").getCode();
        materialReturn.setStatus(defaultStatus);
        materialReturn.setApprovalStep(1);

        User currentUser = currentUserUtil.getCurrentUser();
        materialReturn.setCreatedBy(currentUser.getId());
        materialReturn.setCreatedByName(currentUser.getName());

        materialReturn.setCreatedAt(LocalDate.now());
        return returnRepository.save(materialReturn);
    }

    // ===== UPDATE =====
    @Transactional
    public MaterialReturn update(Long id, MaterialReturn details) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa phiếu hoàn trả");
        }

        if (!"DRAFT".equals(mr.getStatus())) {
            if (isPendingStatus(mr.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("MATERIAL_RETURN", id)) {
                    throw new RuntimeException("Không thể sửa phiếu vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa phiếu ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        mr.setProjectCode(details.getProjectCode());
        mr.setProjectName(details.getProjectName());
        mr.setReturnDate(details.getReturnDate());
        mr.setWarehouseId(details.getWarehouseId());
        mr.setReturnFrom(details.getReturnFrom());
        mr.setItems(details.getItems());
        mr.setReturner(details.getReturner());
        mr.setNote(details.getNote());
        mr.setUpdatedAt(LocalDate.now());
        return returnRepository.save(mr);
    }

    // ===== SUBMIT =====
    @Transactional
    public void submit(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt phiếu hoàn trả");
        }
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt phiếu ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(mr.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        if (steps.isEmpty()) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        if (steps.size() == 1) {
            if (!currentUserUtil.hasPermission("materialreturn.approve")) {
                throw new RuntimeException("Bạn không có quyền duyệt phiếu hoàn trả");
            }

            Map<String, Object> firstStep = steps.get(0);
            String statusCode = (String) firstStep.get("statusCode");
            mr.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
            mr.setApprovalStep(1);
            mr.setUpdatedAt(LocalDate.now());
            returnRepository.save(mr);

            approve(id);
            return;
        }

        Map<String, Object> firstStep = steps.get(0);
        String statusCode = (String) firstStep.get("statusCode");
        mr.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
        mr.setApprovalStep(1);
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== APPROVE =====
    @Transactional
    public void approve(Long id, String itemsUpdateJson) {
        MaterialReturn mr = getById(id);
        if (!isPendingStatus(mr.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }

        Workflow wf = workflowService.getById(mr.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = mr.getApprovalStep() != null ? mr.getApprovalStep() : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt " + currentStep));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;
        if (!currentUserUtil.hasPermissionAndDepartment(permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (steps.size() > 1 && currentUser.getId().equals(mr.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự duyệt phiếu hoàn trả do chính mình tạo");
        }

        // Cập nhật tồn kho
        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsUpdateJson);
            mr.setItems(itemsUpdateJson);

            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var inventory = inventoryRepository.findByWarehouseIdAndItemId(
                        mr.getWarehouseId(), itemId);
                if (inventory.isPresent()) {
                    Inventory inv = inventory.get();
                    inv.setQuantity(inv.getQuantity().add(actualQty));
                    inv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(inv);
                } else {
                    Inventory newInv = new Inventory();
                    newInv.setWarehouseId(mr.getWarehouseId());
                    newInv.setItemId(itemId);
                    newInv.setQuantity(actualQty);
                    newInv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(newInv);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật tồn kho: " + e.getMessage());
        }

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("MATERIAL_RETURN");
        history.setEntityId(mr.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(mr.getStatus());

        if (currentStep == steps.size()) {
            mr.setStatus("APPROVED");
            mr.setApprovalStep(currentStep);
        } else {
            mr.setApprovalStep(currentStep + 1);
            String nextStatusCode = workflowService.getStatusForStep(wf.getId(), currentStep + 1);

            if (nextStatusCode == null || nextStatusCode.isEmpty()) {
                try {
                    Status defaultStatus = statusService.getDefaultStatus("materialreturn");
                    nextStatusCode = defaultStatus != null ? defaultStatus.getCode() : "APPROVED";
                } catch (Exception e) {
                    nextStatusCode = "APPROVED";
                }
            }
            mr.setStatus(nextStatusCode);
        }
        history.setStatusAfter(mr.getStatus());

        approvalHistoryRepository.save(history);
        mr.setApprovedBy(currentUser.getName());
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== CONFIRM =====
    @Transactional
    public void confirm(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.confirm")) {
            throw new RuntimeException("Bạn không có quyền xác nhận hoàn tất phiếu hoàn trả");
        }
        if (!"APPROVED".equals(mr.getStatus())) {
            throw new RuntimeException("Phiếu chưa được thủ kho xác nhận");
        }

        Workflow wf = workflowService.getById(mr.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = 3;
        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước xác nhận"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;
        if (!currentUserUtil.hasPermissionAndDepartment(permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền xác nhận");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(mr.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự xác nhận phiếu hoàn trả do chính mình tạo");
        }

        String statusCode = (String) step.get("statusCode");

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("MATERIAL_RETURN");
        history.setEntityId(mr.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(mr.getStatus());

        if (statusCode == null || statusCode.isEmpty()) {
            try {
                Status nextStatus = statusService.getByEntityTypeAndCode("materialreturn", "CONFIRMED");
                statusCode = nextStatus != null ? nextStatus.getCode() : "CONFIRMED";
            } catch (Exception e) {
                statusCode = "CONFIRMED";
            }
        }
        mr.setStatus(statusCode);
        mr.setApprovalStep(currentStep);
        mr.setConfirmedBy(currentUser.getName());
        mr.setCompletionDate(LocalDate.now());
        history.setStatusAfter(mr.getStatus());

        approvalHistoryRepository.save(history);
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== REJECT =====
    @Transactional
    public void reject(Long id) {
        MaterialReturn mr = getById(id);
        if (!isPendingStatus(mr.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("materialreturn.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối phiếu hoàn trả");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(mr.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự từ chối phiếu hoàn trả do chính mình tạo");
        }

        mr.setStatus("REJECTED");
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa phiếu hoàn trả");
        }
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa phiếu ở trạng thái DRAFT");
        }
        returnRepository.delete(mr);
    }

    // ===== OVERLOAD APPROVE (cho workflow 1 bước) =====
    @Transactional
    public void approve(Long id) {
        MaterialReturn mr = getById(id);
        String itemsJson = mr.getItems();
        approve(id, itemsJson);
    }
}