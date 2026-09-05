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
public class IssueService {

    private final IssueRepository issueRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;
    private final WorkflowProgressService workflowProgressService; // ✅ Thêm

    private static final List<String> PENDING_STATUSES = Arrays.asList("PENDING");

    // ===== HELPERS =====
    private String generateCode(String prefix) {
        long count = issueRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (issueRepository.existsByCode(code)) {
            count++;
            code = prefix + "-" + String.format("%03d", count);
        }
        return code;
    }

    private boolean isPendingStatus(String status) {
        return PENDING_STATUSES.contains(status);
    }

    // ===== GETTERS =====
    public List<Issue> getAll() {
        return issueRepository.findAll();
    }

    public Issue getById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));
    }

    // ===== CREATE =====
    @Transactional
    public Issue create(Issue issue) {
        if (!currentUserUtil.hasPermission("issue.create")) {
            throw new RuntimeException("Bạn không có quyền tạo phiếu cấp phát");
        }

        issue.setCode(generateCode("ISS"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("issue");
        issue.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("issue").getCode();
        issue.setStatus(defaultStatus); // DRAFT
        issue.setApprovalStep(0);

        User currentUser = currentUserUtil.getCurrentUser();
        issue.setCreatedBy(currentUser.getId());
        issue.setCreatedByName(currentUser.getName());
        issue.setCreatedAt(LocalDate.now());

        Issue saved = issueRepository.save(issue);

        // ✅ Khởi tạo workflow progress
        workflowProgressService.initProgress("issue", saved.getId(), activeWorkflow.getId());

        return saved;
    }

    // ===== UPDATE =====
    @Transactional
    public Issue update(Long id, Issue details) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa phiếu cấp phát");
        }

        if (!"DRAFT".equals(issue.getStatus())) {
            if (isPendingStatus(issue.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("ISSUE", id)) {
                    throw new RuntimeException("Không thể sửa phiếu vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa phiếu ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        issue.setProjectCode(details.getProjectCode());
        issue.setProjectName(details.getProjectName());
        issue.setDate(details.getDate());
        issue.setArea(details.getArea());
        issue.setTeam(details.getTeam());
        issue.setRequester(details.getRequester());
        issue.setItems(details.getItems());
        issue.setNote(details.getNote());
        issue.setUpdatedAt(LocalDate.now());
        return issueRepository.save(issue);
    }

    // ===== SUBMIT =====
    @Transactional
    public void submit(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt phiếu cấp phát");
        }
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt phiếu ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(issue.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        if (steps.isEmpty()) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        // ✅ Cập nhật tiến trình
        workflowProgressService.submitProgress("issue", issue.getId());

        issue.setApprovalStep(0);
        issue.setStatus("PENDING");
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    // ===== APPROVE =====
    @Transactional
    public void approve(Long id) {
        Issue issue = getById(id);
        if (!isPendingStatus(issue.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }

        Workflow wf = workflowService.getById(issue.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = issue.getApprovalStep() != null ? issue.getApprovalStep() + 1 : 1;

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
        if (steps.size() > 1 && currentUser.getId().equals(issue.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự duyệt phiếu do chính mình tạo");
        }

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("ISSUE");
        history.setEntityId(issue.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(issue.getStatus());

        // ✅ Cập nhật tiến trình
        WorkflowProgress progress = workflowProgressService.approveProgress("issue", issue.getId());

        issue.setApprovalStep(progress.getApprovalStep());
        issue.setStatus(progress.getStatus());
        issue.setApprovedBy(currentUser.getName());
        issue.setUpdatedAt(LocalDate.now());

        history.setStatusAfter(issue.getStatus());
        approvalHistoryRepository.save(history);
        issueRepository.save(issue);
    }

    // ===== REJECT =====
    @Transactional
    public void reject(Long id) {
        Issue issue = getById(id);
        if (!isPendingStatus(issue.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("issue.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối phiếu cấp phát");
        }

        workflowProgressService.rejectProgress("issue", issue.getId());

        issue.setStatus("REJECTED");
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    // ===== COMPLETE (Cấp phát) =====
    @Transactional
    public void complete(Long id, Long warehouseId, String itemsUpdateJson) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.complete")) {
            throw new RuntimeException("Bạn không có quyền thực hiện cấp phát");
        }
        if (!"APPROVED".equals(issue.getStatus()) && !issue.getIsApproved()) {
            throw new RuntimeException("Phiếu chưa được duyệt");
        }

        warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        Workflow wf = workflowService.getById(issue.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = issue.getApprovalStep() != null ? issue.getApprovalStep() + 1 : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước cấp phát"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền cấp phát");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(issue.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự cấp phát phiếu do chính mình tạo");
        }

        // Cập nhật tồn kho
        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsUpdateJson);
            issue.setItems(itemsUpdateJson);
            issue.setWarehouseId(warehouseId);

            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var inventory = inventoryRepository.findByWarehouseIdAndItemId(warehouseId, itemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for item " + itemId));
                if (inventory.getQuantity().compareTo(actualQty) < 0) {
                    throw new RuntimeException("Tồn kho không đủ cho vật tư " + itemId);
                }
                inventory.setQuantity(inventory.getQuantity().subtract(actualQty));
                inventory.setUpdatedAt(LocalDate.now());
                inventoryRepository.save(inventory);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật tồn kho: " + e.getMessage());
        }

        // ✅ Cập nhật tiến trình
        WorkflowProgress progress = workflowProgressService.completeProgress("issue", issue.getId());

        issue.setApprovalStep(progress.getApprovalStep());
        issue.setStatus(progress.getStatus());
        issue.setCompletedBy(currentUser.getName());
        issue.setUpdatedAt(LocalDate.now());

        // Ghi log
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("ISSUE");
        history.setEntityId(issue.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(issue.getStatus());
        history.setStatusAfter(issue.getStatus());
        approvalHistoryRepository.save(history);

        issueRepository.save(issue);
    }

    // ===== CONFIRM =====
    @Transactional
    public void confirm(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.confirm")) {
            throw new RuntimeException("Bạn không có quyền xác nhận phiếu cấp phát");
        }
        if (!"COMPLETED".equals(issue.getStatus()) && !issue.getIsCompleted()) {
            throw new RuntimeException("Phiếu chưa được hoàn thành cấp phát");
        }

        Workflow wf = workflowService.getById(issue.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = issue.getApprovalStep() != null ? issue.getApprovalStep() + 1 : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước xác nhận"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền xác nhận");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(issue.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự xác nhận phiếu do chính mình tạo");
        }

        // ✅ Cập nhật tiến trình (đánh dấu hoàn thành thực sự)
        WorkflowProgress progress = workflowProgressService.completeProgress("issue", issue.getId());

        issue.setApprovalStep(progress.getApprovalStep());
        issue.setStatus(progress.getStatus());
        issue.setConfirmedBy(currentUser.getName());
        issue.setCompletionDate(LocalDate.now());
        issue.setUpdatedAt(LocalDate.now());

        // Ghi log
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("ISSUE");
        history.setEntityId(issue.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(issue.getStatus());
        history.setStatusAfter(issue.getStatus());
        approvalHistoryRepository.save(history);

        issueRepository.save(issue);
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa phiếu cấp phát");
        }
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa phiếu ở trạng thái DRAFT");
        }
        issueRepository.delete(issue);
    }
}