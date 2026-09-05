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
import java.util.stream.Collectors;

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

    private static final List<String> PENDING_STATUSES = Arrays.asList(
            "PENDING", "PENDING_PLANNING", "PENDING_PROJECT", "PENDING_CEO",
            "PLANNING_APPROVED", "PROJECT_APPROVED"
    );

    // Các trạng thái "kết thúc / hoàn tất" không được tự áp dụng khi vẫn còn bước duyệt phía sau
    private static final java.util.Set<String> FINAL_STATUS_CODES = new java.util.HashSet<>(Arrays.asList(
            "APPROVED", "COMPLETED", "COMPLETE", "CONFIRMED", "RECEIVED", "QC_CHECKED"
    ));

    private static boolean isFinalStatusCode(String code) {
        return code != null && FINAL_STATUS_CODES.contains(code);
    }

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

        pr.setApprovalStep(1);
        String statusCode = workflowService.getStatusForStep(wf.getId(), 1);
        pr.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
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

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
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
            pr.setStatus("APPROVED");
            pr.setApprovalStep(0);
        } else {
            // ✅ Vẫn còn các bước phía sau → chỉ di chuyển tới bước kế tiếp,
            //    tuyệt đối không được tự đánh dấu trạng thái "kết thúc" trước hạn.
            int nextStep = currentStep + 1;
            pr.setApprovalStep(nextStep);

            String nextStatusCode = workflowService.getStatusForStep(wf.getId(), nextStep);
            // Trạng thái "kế tiếp" chỉ dùng được khi nó KHÔNG phải trạng thái kết thúc
            // (vd APPROVED / COMPLETED / CONFIRMED...). Nếu người quản trị cấu hình code
            // của bước (như bước CEO) bằng một trạng thái kết thúc thì không được áp dụng
            // ngay — vì người duyệt bước cuối chưa bấm duyệt.
            if (nextStep < steps.size()) {
                pr.setStatus(nextStatusCode != null && !nextStatusCode.isEmpty() ? nextStatusCode : "PENDING");
            } else {
                // Đang dừng ở bước cuối chờ người duyệt cuối cùng → giữ trạng thái chờ duyệt
                boolean lastCodeIsFinal = isFinalStatusCode(nextStatusCode);
                pr.setStatus((!lastCodeIsFinal && nextStatusCode != null && !nextStatusCode.isEmpty())
                        ? nextStatusCode : "PENDING");
            }
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

    // ===== ✅ KIỂM TRA VÀ CẬP NHẬT MR COMPLETE =====
    @Transactional
    public void checkAndUpdateMRComplete(Long prId) {
        PR pr = getById(prId);
        if (pr.getMrId() == null) return;

        MR mr = mrRepository.findById(pr.getMrId()).orElse(null);
        if (mr == null) return;

        // Lấy tất cả PR của MR
        List<PR> prs = prRepository.findByMrId(mr.getId());

        // Kiểm tra tất cả PR đã COMPLETE chưa
        boolean allComplete = prs.stream().allMatch(p -> "COMPLETE".equals(p.getStatus()));
        if (!allComplete) return;

        // Lấy danh sách item trong MR
        List<Map<String, Object>> mrItems = parseItems(mr.getItems());
        Set<Long> mrItemIds = mrItems.stream()
                .map(item -> ((Number) item.get("itemId")).longValue())
                .collect(Collectors.toSet());

        // Lấy danh sách item từ tất cả PR đã COMPLETE
        Set<Long> prItemIds = new HashSet<>();
        for (PR p : prs) {
            if ("COMPLETE".equals(p.getStatus())) {
                List<Map<String, Object>> prItems = parseItems(p.getItems());
                prItemIds.addAll(prItems.stream()
                        .map(item -> ((Number) item.get("itemId")).longValue())
                        .collect(Collectors.toSet()));
            }
        }

        // Nếu tất cả item trong MR đã có trong PR
        if (mrItemIds.containsAll(prItemIds) && mrItemIds.size() == prItemIds.size()) {
            mr.setStatus("COMPLETE");
            mr.setUpdatedAt(LocalDate.now());
            mrRepository.save(mr);
        }
    }
}