package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.*;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.*;
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
public class STOService {

    private final STORepository stoRepository;
    private final InventoryRepository inventoryRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;
    private final WorkflowProgressService workflowProgressService; // ✅ Thêm

    private static final List<String> PENDING_STATUSES = Arrays.asList("PENDING");

    // ===== HELPERS =====
    private String generateCode(String prefix) {
        long count = stoRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (stoRepository.existsByCode(code)) {
            count++;
            code = prefix + "-" + String.format("%03d", count);
        }
        return code;
    }

    private boolean isPendingStatus(String status) {
        return PENDING_STATUSES.contains(status);
    }

    // ===== GETTERS =====
    public List<STO> getAll() {
        return stoRepository.findAll();
    }

    public STO getById(Long id) {
        return stoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("STO not found with id: " + id));
    }

    public STO getByCode(String code) {
        return stoRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("STO not found with code: " + code));
    }

    // ===== CREATE =====
    @Transactional
    public STO create(STO sto) {
        if (!currentUserUtil.hasPermission("sto.create")) {
            throw new RuntimeException("Bạn không có quyền tạo STO");
        }

        sto.setCode(generateCode("STO"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("sto");
        sto.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("sto").getCode();
        sto.setStatus(defaultStatus); // DRAFT
        sto.setApprovalStep(0);

        User currentUser = currentUserUtil.getCurrentUser();
        sto.setCreatedBy(currentUser.getId());
        sto.setCreatedByName(currentUser.getName());
        sto.setCreatedAt(LocalDate.now());

        STO saved = stoRepository.save(sto);

        // ✅ Khởi tạo workflow progress
        workflowProgressService.initProgress("sto", saved.getId(), activeWorkflow.getId());

        return saved;
    }

    // ===== UPDATE =====
    @Transactional
    public STO update(Long id, STO details) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa STO");
        }

        if (!"DRAFT".equals(sto.getStatus())) {
            if (isPendingStatus(sto.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("STO", id)) {
                    throw new RuntimeException("Không thể sửa STO vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa STO ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        sto.setTransferDate(details.getTransferDate());
        sto.setRequestedBy(details.getRequestedBy());
        sto.setWarehouseStaff(details.getWarehouseStaff());
        sto.setTransporter(details.getTransporter());
        sto.setDepartureTime(details.getDepartureTime());
        sto.setItems(details.getItems());
        sto.setNote(details.getNote());
        sto.setUpdatedAt(LocalDate.now());
        return stoRepository.save(sto);
    }

    // ===== SUBMIT =====
    @Transactional
    public void submit(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt STO");
        }
        if (!"DRAFT".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt STO ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(sto.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        if (steps.isEmpty()) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        // ✅ Cập nhật tiến trình
        workflowProgressService.submitProgress("sto", sto.getId());

        sto.setApprovalStep(0);
        sto.setStatus("PENDING");
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    // ===== APPROVE =====
    @Transactional
    public void approve(Long id) {
        STO sto = getById(id);
        if (!isPendingStatus(sto.getStatus())) {
            throw new RuntimeException("STO không ở trạng thái chờ duyệt");
        }

        Workflow wf = workflowService.getById(sto.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = sto.getApprovalStep() != null ? sto.getApprovalStep() + 1 : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt " + currentStep));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (steps.size() > 1 && currentUser.getId().equals(sto.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự duyệt STO do chính mình tạo");
        }

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("STO");
        history.setEntityId(sto.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(sto.getStatus());

        // ✅ Cập nhật tiến trình
        WorkflowProgress progress = workflowProgressService.approveProgress("sto", sto.getId());

        sto.setApprovalStep(progress.getApprovalStep());
        sto.setStatus(progress.getStatus());
        sto.setApprovedBy(currentUser.getName());
        sto.setUpdatedAt(LocalDate.now());

        history.setStatusAfter(sto.getStatus());
        approvalHistoryRepository.save(history);
        stoRepository.save(sto);
    }

    // ===== COMPLETE (Xuất kho) =====
    @Transactional
    public void complete(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.complete")) {
            throw new RuntimeException("Bạn không có quyền hoàn thành STO");
        }
        if (!"APPROVED".equals(sto.getStatus()) && !sto.getIsApproved()) {
            throw new RuntimeException("STO chưa được duyệt");
        }

        Workflow wf = workflowService.getById(sto.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = sto.getApprovalStep() != null ? sto.getApprovalStep() + 1 : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước hoàn thành"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền hoàn thành STO");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(sto.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự hoàn thành STO do chính mình tạo");
        }

        // Cập nhật tồn kho
        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(sto.getItems());
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());

                // Trừ kho đi
                var invFrom = inventoryRepository.findByWarehouseIdAndItemId(
                        sto.getFromWarehouseId(), itemId);
                if (invFrom.isEmpty() || invFrom.get().getQuantity().compareTo(actualQty) < 0) {
                    throw new RuntimeException("Tồn kho không đủ cho vật tư " + itemId);
                }
                invFrom.get().setQuantity(invFrom.get().getQuantity().subtract(actualQty));
                invFrom.get().setUpdatedAt(LocalDate.now());
                inventoryRepository.save(invFrom.get());

                // Cộng kho đến
                var invTo = inventoryRepository.findByWarehouseIdAndItemId(
                        sto.getToWarehouseId(), itemId);
                if (invTo.isPresent()) {
                    invTo.get().setQuantity(invTo.get().getQuantity().add(actualQty));
                    invTo.get().setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(invTo.get());
                } else {
                    Inventory newInv = new Inventory();
                    newInv.setWarehouseId(sto.getToWarehouseId());
                    newInv.setItemId(itemId);
                    newInv.setQuantity(actualQty);
                    newInv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(newInv);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật tồn kho: " + e.getMessage());
        }

        // ✅ Cập nhật tiến trình (hoàn thành)
        WorkflowProgress progress = workflowProgressService.completeProgress("sto", sto.getId());

        sto.setApprovalStep(progress.getApprovalStep());
        sto.setStatus(progress.getStatus());
        sto.setUpdatedAt(LocalDate.now());

        // Ghi log
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("STO");
        history.setEntityId(sto.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(sto.getStatus());
        history.setStatusAfter(sto.getStatus());
        approvalHistoryRepository.save(history);

        stoRepository.save(sto);
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa STO");
        }
        if (!"DRAFT".equals(sto.getStatus()) && !"PENDING".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa STO ở trạng thái DRAFT hoặc PENDING");
        }
        stoRepository.delete(sto);
    }
}