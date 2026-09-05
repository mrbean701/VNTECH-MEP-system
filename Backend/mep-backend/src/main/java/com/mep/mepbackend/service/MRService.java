package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.ApprovalHistory;
import com.mep.mepbackend.entity.MR;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ApprovalHistoryRepository;
import com.mep.mepbackend.repository.MRRepository;
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
public class MRService {

    private final MRRepository mrRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

            private static final List<String> PENDING_STATUSES = Arrays.asList("PENDING", "PENDING_PLANNING", "PENDING_PROJECT", "PENDING_CEO");

    // Các trạng thái "kết thúc / hoàn tất" không được tự áp dụng khi vẫn còn bước duyệt phía sau
    private static final List<String> FINAL_STATUS_CODES = Arrays.asList(
            "APPROVED", "COMPLETED", "COMPLETE", "CONFIRMED", "RECEIVED", "QC_CHECKED"
    );

    private static boolean isFinalStatusCode(String code) {
        return code != null && FINAL_STATUS_CODES.contains(code);
    }

    private String generateCode(String prefix) {
        long count = mrRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (mrRepository.existsByCode(code)) {
            count++;
            code = prefix + "-" + String.format("%03d", count);
        }
        return code;
    }

    private boolean isPendingStatus(String status) {
        return PENDING_STATUSES.contains(status);
    }

    public List<MR> getAll() {
        return mrRepository.findAll();
    }

    public MR getById(Long id) {
        return mrRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with id: " + id));
    }

    public MR getByCode(String code) {
        return mrRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with code: " + code));
    }

    public List<MR> getByProjectCode(String projectCode) {
        return mrRepository.findByProjectCode(projectCode);
    }

    public List<MR> getByStatus(String status) {
        return mrRepository.findByStatus(status);
    }

    @Transactional
    public MR create(MR mr) {
        if (!currentUserUtil.hasPermission("mr.create")) {
            throw new RuntimeException("Bạn không có quyền tạo MR");
        }

        mr.setCode(generateCode("MR"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("mr");
        mr.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("mr").getCode();
        mr.setStatus(defaultStatus);
        mr.setApprovalStep(1);

        User currentUser = currentUserUtil.getCurrentUser();
        mr.setCreatedBy(currentUser.getId());
        mr.setCreatedByName(currentUser.getName());

        mr.setCreatedAt(LocalDate.now());
        return mrRepository.save(mr);
    }

    @Transactional
    public MR update(Long id, MR details) {
        MR mr = getById(id);
        if (!currentUserUtil.hasPermission("mr.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa MR");
        }

        if (!"DRAFT".equals(mr.getStatus())) {
            if (isPendingStatus(mr.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("MR", id)) {
                    throw new RuntimeException("Không thể sửa MR vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa MR ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        mr.setProjectCode(details.getProjectCode());
        mr.setProjectName(details.getProjectName());
        mr.setItems(details.getItems());
        mr.setNeedDate(details.getNeedDate());
        mr.setPurpose(details.getPurpose());
        mr.setRequester(details.getRequester());
        mr.setNote(details.getNote());
        mr.setUpdatedAt(LocalDate.now());
        return mrRepository.save(mr);
    }

    // ✅ SUBMIT - Bắt đầu tính currentStep
    @Transactional
    public void submit(Long id) {
        MR mr = getById(id);
        if (!currentUserUtil.hasPermission("mr.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt MR");
        }
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt MR ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(mr.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        if (steps.isEmpty()) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        // ✅ Bắt đầu tính currentStep = 1
        mr.setApprovalStep(1);
        String statusCode = workflowService.getStatusForStep(wf.getId(), 1);
        mr.setStatus(statusCode != null && !statusCode.isEmpty() ? statusCode : "PENDING");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    // ✅ APPROVE
    @Transactional
    public void approve(Long id) {
        MR mr = getById(id);
        if (!isPendingStatus(mr.getStatus())) {
            throw new RuntimeException("MR không ở trạng thái chờ duyệt");
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

        // ✅ Kiểm tra điều kiện duyệt
        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này");
        }

        User currentUser = currentUserUtil.getCurrentUser();

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("MR");
        history.setEntityId(mr.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
                history.setStatusBefore(mr.getStatus());

        // ✅ Nếu là bước cuối cùng
        if (currentStep == steps.size()) {
            mr.setStatus("APPROVED");
            mr.setApprovalStep(0); // Kết thúc
        } else {
            // ✅ Vẫn còn các bước phía sau → chỉ di chuyển tới bước kế tiếp, không tự "kết thúc" sớm
            mr.setApprovalStep(currentStep + 1);

            int nextStep = currentStep + 1;
            String nextStatusCode = workflowService.getStatusForStep(wf.getId(), nextStep);
            // Trạng thái kế tiếp chỉ dùng được khi KHÔNG phải trạng thái kết thúc.
            // Nếu người quản trị cấu hình code của bước sau bằng code kết thúc (APPROVED, CONFIRMED, ...),
            // thì phải chuyển về PENDING chờ người duyệt cuối xác nhận, tuyệt đối không áp dụng sớm.
            boolean lastCodeIsFinal = isFinalStatusCode(nextStatusCode);
            mr.setStatus((!lastCodeIsFinal && nextStatusCode != null && !nextStatusCode.isEmpty())
                    ? nextStatusCode : "PENDING");
        }

        history.setStatusAfter(mr.getStatus());

        approvalHistoryRepository.save(history);
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    @Transactional
    public void reject(Long id) {
        MR mr = getById(id);
        if (!isPendingStatus(mr.getStatus())) {
            throw new RuntimeException("MR không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("mr.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối MR");
        }
        mr.setStatus("REJECTED");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    @Transactional
    public void delete(Long id) {
        MR mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa MR ở trạng thái DRAFT");
        }
        if (!currentUserUtil.hasPermission("mr.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa MR");
        }
        mrRepository.delete(mr);
    }
}