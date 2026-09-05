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
public class POService {

    private final PORepository poRepository;
    private final PRRepository prRepository;
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

    private List<Map<String, Object>> parseItems(String itemsJson) {
        try {
            if (itemsJson == null || itemsJson.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(itemsJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // ===== GETTERS =====
    public List<PO> getAll() { return poRepository.findAll(); }
    public PO getById(Long id) { return poRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("PO not found")); }
    public PO getByCode(String code) { return poRepository.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("PO not found")); }
    public List<PO> getByProjectCode(String projectCode) { return poRepository.findByProjectCode(projectCode); }
    public List<PO> getByStatus(String status) { return poRepository.findByStatus(status); }

    // ===== CREATE =====
    @Transactional
    public PO create(PO po) {
        if (!currentUserUtil.hasPermission("po.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PO");
        }

        po.setCode(generateCode("PO"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("po");
        po.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("po").getCode();
        po.setStatus(defaultStatus); // DRAFT
        po.setApprovalStep(0);

        User currentUser = currentUserUtil.getCurrentUser();
        po.setCreatedBy(currentUser.getId());
        po.setCreatedByName(currentUser.getName());
        po.setCreatedAt(LocalDate.now());

        PO saved = poRepository.save(po);

        // ✅ Khởi tạo workflow progress
        workflowProgressService.initProgress("po", saved.getId(), activeWorkflow.getId());

        return saved;
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

    // ===== UPDATE =====
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

    // ===== SUBMIT =====
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

        workflowProgressService.submitProgress("po", po.getId());

        po.setApprovalStep(0);
        po.setStatus("PENDING");
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    // ===== APPROVE =====
    @Transactional
    public void approve(Long id) {
        PO po = getById(id);
        if (!isPendingStatus(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }

        Workflow wf = workflowService.getById(po.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = po.getApprovalStep() != null ? po.getApprovalStep() + 1 : 1;

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

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("PO");
        history.setEntityId(po.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(po.getStatus());

        WorkflowProgress progress = workflowProgressService.approveProgress("po", po.getId());

        po.setApprovalStep(progress.getApprovalStep());
        po.setStatus(progress.getStatus());
        po.setUpdatedAt(LocalDate.now());

        history.setStatusAfter(po.getStatus());
        approvalHistoryRepository.save(history);
        poRepository.save(po);
    }

    // ===== REJECT =====
    @Transactional
    public void reject(Long id) {
        PO po = getById(id);
        if (!isPendingStatus(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("po.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối PO");
        }

        workflowProgressService.rejectProgress("po", po.getId());

        po.setStatus("REJECTED");
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    // ===== DELETE =====
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

    // ===== KIỂM TRA VÀ CẬP NHẬT PO COMPLETE (TỪ GRN) =====
    @Transactional
    public void checkAndUpdatePOComplete(Long poId) {
        PO po = getById(poId);
        if (po == null) return;

        // Lấy tất cả GRN của PO
        List<GRN> grns = grnRepository.findByPoId(poId);
        if (grns.isEmpty()) return;

        // Lấy items trong PO
        List<Map<String, Object>> poItems = parseItems(po.getItems());
        if (poItems.isEmpty()) return;

        // Tính tổng số lượng đã nhận cho từng item
        Map<Long, Double> receivedQty = new HashMap<>();
        for (GRN grn : grns) {
            if (!"COMPLETED".equals(grn.getStatus()) && !"COMPLETE".equals(grn.getStatus())) {
                continue; // Chỉ tính GRN đã hoàn thành
            }
            List<Map<String, Object>> grnItems = parseItems(grn.getItems());
            for (Map<String, Object> grnItem : grnItems) {
                Long itemId = ((Number) grnItem.get("itemId")).longValue();
                Double actualQty = ((Number) grnItem.get("actualQty")).doubleValue();
                receivedQty.merge(itemId, actualQty, Double::sum);
            }
        }

        // Kiểm tra tất cả item trong PO đã nhận đủ chưa
        boolean allFulfilled = true;
        for (Map<String, Object> poItem : poItems) {
            Long itemId = ((Number) poItem.get("itemId")).longValue();
            Double requestedQty = ((Number) poItem.get("quantity")).doubleValue();
            Double received = receivedQty.getOrDefault(itemId, 0.0);
            if (received < requestedQty) {
                allFulfilled = false;
                break;
            }
        }

        if (allFulfilled) {
            // ✅ PO đã nhận đủ → set COMPLETE
            po.setStatus("COMPLETE");
            po.setUpdatedAt(LocalDate.now());
            poRepository.save(po);

            // Cập nhật workflow progress
            workflowProgressService.completeProgress("po", poId);

            // ✅ Kiểm tra PR complete
            if (po.getPrId() != null) {
                prService.checkAndUpdatePRComplete(po.getPrId());
            }
        }
    }

    // Inject PRService và GRNRepository (cần thêm)
    private final PRService prService;
    private final GRNRepository grnRepository;

    // Nếu không dùng @RequiredArgsConstructor, cần thêm setter hoặc constructor
}