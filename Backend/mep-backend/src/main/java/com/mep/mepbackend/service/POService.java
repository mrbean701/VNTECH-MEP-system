package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.ApprovalHistory;
import com.mep.mepbackend.entity.PO;
import com.mep.mepbackend.entity.Status;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ApprovalHistoryRepository;
import com.mep.mepbackend.repository.PORepository;
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
public class POService {

    private final PORepository poRepository;
    private final PRRepository prRepository;
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
        long count = poRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (poRepository.existsByCode(code)) {
            count++;
            code = prefix + "-" + String.format("%03d", count);
        }
        return code;
    }

    private boolean isPendingStatus(String status) {
        return PENDING_STATUSES.contains(status);
    }

    public List<PO> getAll() {
        return poRepository.findAll();
    }

    public PO getById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with id: " + id));
    }

    public PO getByCode(String code) {
        return poRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with code: " + code));
    }

    public List<PO> getByProjectCode(String projectCode) {
        return poRepository.findByProjectCode(projectCode);
    }

    public List<PO> getByStatus(String status) {
        return poRepository.findByStatus(status);
    }

    @Transactional
    public PO create(PO po) {
        if (!currentUserUtil.hasPermission("po.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PO");
        }

        po.setCode(generateCode("PO"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("po");
        po.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("po").getCode();
        po.setStatus(defaultStatus);
        po.setApprovalStep(1);

        User currentUser = currentUserUtil.getCurrentUser();
        po.setCreatedBy(currentUser.getId());
        po.setCreatedByName(currentUser.getName());

        po.setCreatedAt(LocalDate.now());
        return poRepository.save(po);
    }

    @Transactional
    public PO createFromPR(Long prId, PO poDetails) {
        if (!currentUserUtil.hasPermission("po.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PO từ PR");
        }
        var pr = prRepository.findById(prId)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with id: " + prId));
        if (!"APPROVED".equals(pr.getStatus())) {
            throw new RuntimeException("PR chưa được duyệt");
        }
        poDetails.setProjectCode(pr.getProjectCode());
        poDetails.setProjectName(pr.getProjectName());
        poDetails.setVendorCode(pr.getVendorCode());
        poDetails.setVendorName(pr.getVendorName());
        poDetails.setItems(pr.getItems());
        poDetails.setPrId(pr.getId());
        return create(poDetails);
    }

    @Transactional
    public PO update(Long id, PO details) {
        PO po = getById(id);
        if (!currentUserUtil.hasPermission("po.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa PO");
        }

        if (!"DRAFT".equals(po.getStatus())) {
            if (isPendingStatus(po.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("PO", id)) {
                    throw new RuntimeException("Không thể sửa PO vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa PO ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        po.setProjectCode(details.getProjectCode());
        po.setProjectName(details.getProjectName());
        po.setVendorCode(details.getVendorCode());
        po.setVendorName(details.getVendorName());
        po.setItems(details.getItems());
        po.setNote(details.getNote());
        po.setUpdatedAt(LocalDate.now());
        return poRepository.save(po);
    }

    // ✅ SUBMIT - Bắt đầu tính currentStep
    @Transactional
    public void submit(Long id) {
        PO po = getById(id);
        if (!currentUserUtil.hasPermission("po.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt PO");
        }
        if (!"DRAFT".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt PO ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(po.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        if (steps.isEmpty()) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        // ✅ Bắt đầu tính currentStep = 1
        po.setApprovalStep(1);
        String statusCode = workflowService.getStatusForStep(wf.getId(), 1);
        po.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    // ✅ APPROVE
    @Transactional
    public void approve(Long id) {
        PO po = getById(id);
        if (!isPendingStatus(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }

        Workflow wf = workflowService.getById(po.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = po.getApprovalStep() != null ? po.getApprovalStep() : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt " + currentStep));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        // ✅ Kiểm tra điều kiện duyệt
        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (steps.size() > 1 && currentUser.getId().equals(po.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự duyệt PO do chính mình tạo");
        }

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("PO");
        history.setEntityId(po.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
                history.setApproverName(currentUser.getName());
        history.setStatusBefore(po.getStatus());

        // ✅ Nếu là bước cuối cùng → thực sự duyệt xong mới APPROVED
        if (currentStep == steps.size()) {
            po.setStatus("APPROVED");
            po.setApprovalStep(0); // Kết thúc
        } else {
            // ✅ Vẫn còn các bước phía sau → chỉ di chuyển tới bước kế tiếp,
            //    tuyệt đối không được tự đánh dấu trạng thái "kết thúc" trước hạn.
            int nextStep = currentStep + 1;
            po.setApprovalStep(nextStep);

            String nextStatusCode = workflowService.getStatusForStep(wf.getId(), nextStep);
            // Trạng thái "kế tiếp" chỉ dùng được khi nó KHÔNG phải trạng thái kết thúc
            // (vd APPROVED / COMPLETED / CONFIRMED...). Nếu người quản trị cấu hình code
            // của bước (như bước CEO) bằng một trạng thái kết thúc thì không được áp dụng
            // ngay — vì người duyệt bước cuối chưa bấm duyệt.
            if (nextStep < steps.size()) {
                po.setStatus(nextStatusCode != null && !nextStatusCode.isEmpty() ? nextStatusCode : "PENDING");
            } else {
                // Đang dừng ở bước cuối chờ người duyệt cuối cùng → giữ trạng thái chờ duyệt
                boolean lastCodeIsFinal = isFinalStatusCode(nextStatusCode);
                po.setStatus((!lastCodeIsFinal && nextStatusCode != null && !nextStatusCode.isEmpty())
                        ? nextStatusCode : "PENDING");
            }
        }

        history.setStatusAfter(po.getStatus());

        approvalHistoryRepository.save(history);
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    @Transactional
    public void reject(Long id) {
        PO po = getById(id);
        if (!isPendingStatus(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("po.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối PO");
        }
        po.setStatus("REJECTED");
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    @Transactional
    public void delete(Long id) {
        PO po = getById(id);
        if (!"DRAFT".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa PO ở trạng thái DRAFT");
        }
        if (!currentUserUtil.hasPermission("po.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa PO");
        }
        poRepository.delete(po);
    }
}