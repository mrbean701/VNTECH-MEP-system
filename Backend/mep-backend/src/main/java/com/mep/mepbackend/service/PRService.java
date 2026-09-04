package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.ApprovalHistory;
import com.mep.mepbackend.entity.PR;
import com.mep.mepbackend.entity.Status;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ApprovalHistoryRepository;
import com.mep.mepbackend.repository.MRRepository;
import com.mep.mepbackend.repository.PRRepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PRService {

    private final PRRepository prRepository;
    private final MRRepository mrRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService; // ✅ Đã thêm
    private final CurrentUserUtil currentUserUtil;

    private static final List<String> PENDING_STATUSES = Arrays.asList(
            "PENDING", "PENDING_PLANNING", "PENDING_PROJECT", "PENDING_CEO",
            "PLANNING_APPROVED", "PROJECT_APPROVED"
    );

    // ===== HELPERS =====
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

    // ===== GETTERS =====
    public List<PR> getAll() {
        return prRepository.findAll();
    }

    public PR getById(Long id) {
        return prRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with id: " + id));
    }

    public PR getByCode(String code) {
        return prRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with code: " + code));
    }

    public List<PR> getByProjectCode(String projectCode) {
        return prRepository.findByProjectCode(projectCode);
    }

    public List<PR> getByStatus(String status) {
        return prRepository.findByStatus(status);
    }

    public List<PR> getByMrId(Long mrId) {
        return prRepository.findByMrId(mrId);
    }

    public List<PR> getByVendorCode(String vendorCode) {
        return prRepository.findByVendorCode(vendorCode);
    }

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
        pr.setStatus(defaultStatus);
        pr.setApprovalStep(1);

        User currentUser = currentUserUtil.getCurrentUser();
        pr.setCreatedBy(currentUser.getId());
        pr.setCreatedByName(currentUser.getName());

        pr.setCreatedAt(LocalDate.now());
        return prRepository.save(pr);
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

        // Nếu workflow có 1 bước → tự động duyệt luôn
        if (steps.size() == 1) {
            if (!currentUserUtil.hasPermission("pr.approve")) {
                throw new RuntimeException("Bạn không có quyền duyệt PR");
            }

            Map<String, Object> firstStep = steps.get(0);
            String statusCode = (String) firstStep.get("statusCode");
            pr.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
            pr.setApprovalStep(1);
            pr.setUpdatedAt(LocalDate.now());
            prRepository.save(pr);

            approve(id);
            return;
        }

        // Nhiều bước → chuyển sang PENDING bước 1
        Map<String, Object> firstStep = steps.get(0);
        String statusCode = (String) firstStep.get("statusCode");
        pr.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
        pr.setApprovalStep(1);
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
        int currentStep = pr.getApprovalStep() != null ? pr.getApprovalStep() : 1;

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
        if (steps.size() > 1 && currentUser.getId().equals(pr.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự duyệt PR do chính mình tạo");
        }

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("PR");
        history.setEntityId(pr.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(pr.getStatus());

        if (currentStep == steps.size()) {
            // Bước cuối → APPROVED
            pr.setStatus("APPROVED");
            pr.setApprovalStep(currentStep);
        } else {
            // Chuyển sang bước tiếp theo
            pr.setApprovalStep(currentStep + 1);
            String nextStatusCode = workflowService.getStatusForStep(wf.getId(), currentStep + 1);

            // ✅ Fallback an toàn: nếu không có mapping, lấy status mặc định của PR
            if (nextStatusCode == null || nextStatusCode.isEmpty()) {
                try {
                    Status defaultStatus = statusService.getDefaultStatus("pr");
                    nextStatusCode = defaultStatus != null ? defaultStatus.getCode() : "PENDING";
                } catch (Exception e) {
                    nextStatusCode = "PENDING";
                }
            }
            pr.setStatus(nextStatusCode);
        }

        history.setStatusAfter(pr.getStatus());

        approvalHistoryRepository.save(history);
        pr.setUpdatedAt(LocalDate.now());
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
}