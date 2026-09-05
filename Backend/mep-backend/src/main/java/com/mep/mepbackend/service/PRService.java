package com.mep.mepbackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.*;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.*;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PRService {

    private final PRRepository prRepository;
    private final MRRepository mrRepository;
    private final PORepository poRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;
    private final WorkflowProgressService workflowProgressService; // ✅ Thêm

    private static final List<String> PENDING_STATUSES = Arrays.asList(
            "PENDING", "PENDING_PLANNING", "PENDING_PROJECT", "PENDING_CEO",
            "PLANNING_APPROVED", "PROJECT_APPROVED"
    );

    private String generateCode(String prefix) {
        long count = prRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (prRepository.existsByCode(code)) {
            count++;
            code = prefix + "-" + String.format("%03d", count);
        }
        return code;
    }

    private boolean isPendingStatus(String status) {
        return PENDING_STATUSES.contains(status);
    }

    private List<Map<String, Object>> parseItems(String itemsJson) {
        try {
            if (itemsJson == null || itemsJson.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(itemsJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // ===== GETTERS =====
    public List<PR> getAll() { return prRepository.findAll(); }
    public PR getById(Long id) { return prRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("PR not found")); }
    public PR getByCode(String code) { return prRepository.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("PR not found")); }
    public List<PR> getByProjectCode(String projectCode) { return prRepository.findByProjectCode(projectCode); }
    public List<PR> getByStatus(String status) { return prRepository.findByStatus(status); }
    public List<PR> getByMrId(Long mrId) { return prRepository.findByMrId(mrId); }
    public List<PR> getByVendorCode(String vendorCode) { return prRepository.findByVendorCode(vendorCode); }

    // ===== CREATE =====
    @Transactional
    public PR create(PR pr) {
        if (!currentUserUtil.hasPermission("pr.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PR");
        }

        pr.setCode(generateCode("PR"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("pr");
        pr.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("pr").getCode();
        pr.setStatus(defaultStatus); // DRAFT
        pr.setApprovalStep(0);

        User currentUser = currentUserUtil.getCurrentUser();
        pr.setCreatedBy(currentUser.getId());
        pr.setCreatedByName(currentUser.getName());
        pr.setCreatedAt(LocalDate.now());

        PR saved = prRepository.save(pr);

        // ✅ Khởi tạo workflow progress
        workflowProgressService.initProgress("pr", saved.getId(), activeWorkflow.getId());

        return saved;
    }

    @Transactional
    public PR createFromMR(Long mrId, PR prDetails) {
        if (!currentUserUtil.hasPermission("pr.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PR từ MR");
        }
        var mr = mrRepository.findById(mrId)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with id: " + mrId));
        if (!"APPROVED".equals(mr.getStatus())) {
            throw new RuntimeException("MR chưa được duyệt");
        }
        prDetails.setProjectCode(mr.getProjectCode());
        prDetails.setProjectName(mr.getProjectName());
        prDetails.setItems(mr.getItems());
        prDetails.setMrId(mr.getId());
        return create(prDetails);
    }

    // ===== UPDATE =====
    @Transactional
    public PR update(Long id, PR details) {
        PR pr = getById(id);
        if (!currentUserUtil.hasPermission("pr.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa PR");
        }

        if (!"DRAFT".equals(pr.getStatus())) {
            if (isPendingStatus(pr.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("PR", id)) {
                    throw new RuntimeException("Không thể sửa PR vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa PR ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        pr.setProjectCode(details.getProjectCode());
        pr.setProjectName(details.getProjectName());
        pr.setVendorCode(details.getVendorCode());
        pr.setVendorName(details.getVendorName());
        pr.setItems(details.getItems());
        pr.setNote(details.getNote());
        pr.setUpdatedAt(LocalDate.now());
        return prRepository.save(pr);
    }

    // ===== SUBMIT =====
    @Transactional
    public void submit(Long id) {
        PR pr = getById(id);
        if (!currentUserUtil.hasPermission("pr.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt PR");
        }
        if (!"DRAFT".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt PR ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(pr.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        if (steps.isEmpty()) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        // ✅ Cập nhật tiến trình
        workflowProgressService.submitProgress("pr", pr.getId());

        pr.setApprovalStep(0);
        pr.setStatus("PENDING");
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    // ===== APPROVE =====
    @Transactional
    public void approve(Long id) {
        PR pr = getById(id);
        if (!isPendingStatus(pr.getStatus())) {
            throw new RuntimeException("PR không ở trạng thái chờ duyệt");
        }

        Workflow wf = workflowService.getById(pr.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = pr.getApprovalStep() != null ? pr.getApprovalStep() + 1 : 1;

        // Kiểm tra quyền
        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt " + currentStep));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        // ✅ Kiểm tra quyền dùng currentStep (level >= currentStep)
        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này");
        }

        User currentUser = currentUserUtil.getCurrentUser();

        // Ghi lịch sử
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("PR");
        history.setEntityId(pr.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(pr.getStatus());

        // ✅ Cập nhật tiến trình
        WorkflowProgress progress = workflowProgressService.approveProgress("pr", pr.getId());

        pr.setApprovalStep(progress.getApprovalStep());
        pr.setStatus(progress.getStatus());
        pr.setUpdatedAt(LocalDate.now());

        history.setStatusAfter(pr.getStatus());
        approvalHistoryRepository.save(history);
        prRepository.save(pr);
    }

    // ===== REJECT =====
    @Transactional
    public void reject(Long id) {
        PR pr = getById(id);
        if (!isPendingStatus(pr.getStatus())) {
            throw new RuntimeException("PR không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("pr.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối PR");
        }

        workflowProgressService.rejectProgress("pr", pr.getId());

        pr.setStatus("REJECTED");
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        PR pr = getById(id);
        if (!"DRAFT".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa PR ở trạng thái DRAFT");
        }
        if (!currentUserUtil.hasPermission("pr.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa PR");
        }
        prRepository.delete(pr);
    }

    // ===== KIỂM TRA VÀ CẬP NHẬT PR COMPLETE (TỪ PO) =====
    @Transactional
    public void checkAndUpdatePRComplete(Long prId) {
        PR pr = getById(prId);
        if (pr == null) return;

        // Lấy tất cả PO của PR
        List<PO> pos = poRepository.findByPrId(prId);
        if (pos.isEmpty()) return;

        // Kiểm tra tất cả PO đã COMPLETE chưa
        boolean allComplete = pos.stream().allMatch(p -> "COMPLETE".equals(p.getStatus()) || "COMPLETED".equals(p.getStatus()));
        if (!allComplete) return;

        // ✅ Cập nhật PR thành COMPLETED
        pr.setStatus("COMPLETE");
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);

        // Cập nhật workflow progress
        workflowProgressService.completeProgress("pr", prId);

        // ✅ Kiểm tra MR complete
        if (pr.getMrId() != null) {
            checkAndUpdateMRComplete(pr.getMrId());
        }
    }

    // ===== KIỂM TRA VÀ CẬP NHẬT MR COMPLETE =====
    @Transactional
    public void checkAndUpdateMRComplete(Long mrId) {
        MR mr = mrRepository.findById(mrId).orElse(null);
        if (mr == null) return;

        List<PR> prs = prRepository.findByMrId(mrId);
        if (prs.isEmpty()) return;

        boolean allComplete = prs.stream().allMatch(p -> "COMPLETE".equals(p.getStatus()) || "COMPLETED".equals(p.getStatus()));
        if (!allComplete) return;

        mr.setStatus("COMPLETE");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);

        workflowProgressService.completeProgress("mr", mrId);
    }
}