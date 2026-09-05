package com.mep.mepbackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
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
import java.util.*;

@Service
@RequiredArgsConstructor
public class GRNService {

    private final GRNRepository grnRepository;
    private final PORepository poRepository;
    private final InventoryRepository inventoryRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;
    private final WorkflowProgressService workflowProgressService; // ✅ Thêm
    private final POService poService; // ✅ Thêm để gọi checkAndUpdatePOComplete

    private static final List<String> PENDING_STATUSES = Arrays.asList("DRAFT", "RECEIVED", "QC_CHECKED");

    private String generateCode(String prefix) {
        long count = grnRepository.count() + 1;
        String code = prefix + "-" + String.format("%03d", count);
        while (grnRepository.existsByCode(code)) {
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
    public List<GRN> getAll() { return grnRepository.findAll(); }
    public GRN getById(Long id) { return grnRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("GRN not found")); }
    public GRN getByCode(String code) { return grnRepository.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("GRN not found")); }
    public List<GRN> getByStatus(String status) { return grnRepository.findByStatus(status); }
    public List<GRN> getByProjectCode(String projectCode) { return grnRepository.findByProjectCode(projectCode); }

    // ===== CREATE =====
    @Transactional
    public GRN create(GRN grn) {
        if (!currentUserUtil.hasPermission("grn.create")) {
            throw new RuntimeException("Bạn không có quyền tạo GRN");
        }

        var po = poRepository.findById(grn.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with id: " + grn.getPoId()));
        if (!"APPROVED".equals(po.getStatus()) && !"APPROVE".equals(po.getStatus())) {
            throw new RuntimeException("PO chưa được duyệt, không thể tạo GRN");
        }

        grn.setCode(generateCode("GRN"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("grn");
        grn.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("grn").getCode();
        grn.setStatus(defaultStatus); // DRAFT
        grn.setApprovalStep(0);

        User currentUser = currentUserUtil.getCurrentUser();
        grn.setCreatedBy(currentUser.getId());
        grn.setCreatedByName(currentUser.getName());
        grn.setCreatedAt(LocalDate.now());

        GRN saved = grnRepository.save(grn);

        // ✅ Khởi tạo workflow progress
        workflowProgressService.initProgress("grn", saved.getId(), activeWorkflow.getId());

        return saved;
    }

    // ===== UPDATE =====
    @Transactional
    public GRN update(Long id, GRN details) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa GRN");
        }

        if (!"DRAFT".equals(grn.getStatus())) {
            if (isPendingStatus(grn.getStatus())) {
                if (approvalHistoryRepository.existsByEntityTypeAndEntityId("GRN", id)) {
                    throw new RuntimeException("Không thể sửa GRN vì đã được duyệt bước 1");
                }
            } else {
                throw new RuntimeException("Chỉ có thể sửa GRN ở trạng thái DRAFT hoặc PENDING chưa duyệt");
            }
        }

        grn.setReceiptDate(details.getReceiptDate());
        grn.setReceiver(details.getReceiver());
        grn.setWarehouseStaff(details.getWarehouseStaff());
        grn.setQcConfirm(details.getQcConfirm());
        grn.setAccountantConfirm(details.getAccountantConfirm());
        grn.setInvoice(details.getInvoice());
        grn.setItems(details.getItems());
        grn.setNote(details.getNote());
        grn.setUpdatedAt(LocalDate.now());
        return grnRepository.save(grn);
    }

    // ===== RECEIVE =====
    @Transactional
    public void receive(Long id, String warehouseStaff, LocalDate receiptDate) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.receive")) {
            throw new RuntimeException("Bạn không có quyền nhận GRN");
        }
        if (!"DRAFT".equals(grn.getStatus())) {
            throw new RuntimeException("Chỉ có thể nhận GRN ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(grn.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = grn.getApprovalStep() != null ? grn.getApprovalStep() + 1 : 1;

        // Kiểm tra quyền
        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước nhận hàng"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền nhận hàng");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(grn.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự nhận GRN do chính mình tạo");
        }

        // Cập nhật tiến trình
        WorkflowProgress progress = workflowProgressService.approveProgress("grn", grn.getId());

        grn.setWarehouseStaff(warehouseStaff);
        grn.setReceiptDate(receiptDate);
        grn.setApprovalStep(progress.getApprovalStep());
        grn.setStatus(progress.getStatus());
        grn.setUpdatedAt(LocalDate.now());

        // Ghi log
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("GRN");
        history.setEntityId(grn.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(grn.getStatus());
        history.setStatusAfter(grn.getStatus());
        approvalHistoryRepository.save(history);

        grnRepository.save(grn);
    }

    // ===== QC CHECK =====
    @Transactional
    public void qcCheck(Long id, String qcName, String result, String note) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.qc")) {
            throw new RuntimeException("Bạn không có quyền QC GRN");
        }
        if (!"RECEIVED".equals(grn.getStatus())) {
            throw new RuntimeException("GRN chưa được nhận hoặc đã qua bước QC");
        }

        Workflow wf = workflowService.getById(grn.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = grn.getApprovalStep() != null ? grn.getApprovalStep() + 1 : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước QC"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền kiểm tra QC");
        }

        User currentUser = currentUserUtil.getCurrentUser();
        if (currentUser.getId().equals(grn.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự QC GRN do chính mình tạo");
        }

        // Cập nhật tiến trình
        WorkflowProgress progress = workflowProgressService.approveProgress("grn", grn.getId());

        if ("FAIL".equals(result)) {
            grn.setStatus("REJECTED");
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - KHÔNG ĐẠT - " + note);
        } else {
            grn.setQcConfirm(qcName);
            grn.setApprovalStep(progress.getApprovalStep());
            grn.setStatus(progress.getStatus());
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - " + result + " - " + note);
        }
        grn.setUpdatedAt(LocalDate.now());

        // Ghi log
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("GRN");
        history.setEntityId(grn.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(grn.getStatus());
        history.setStatusAfter(grn.getStatus());
        approvalHistoryRepository.save(history);

        grnRepository.save(grn);
    }

    // ===== COMPLETE (HOÀN THÀNH NHẬP KHO) =====
    @Transactional
    public void complete(Long id) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.complete")) {
            throw new RuntimeException("Bạn không có quyền hoàn thành GRN");
        }
        if (!"QC_CHECKED".equals(grn.getStatus())) {
            throw new RuntimeException("GRN chưa được QC kiểm tra");
        }

        Workflow wf = workflowService.getById(grn.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = grn.getApprovalStep() != null ? grn.getApprovalStep() + 1 : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước hoàn thành"));

        String permissionKey = (String) step.get("permissionKey");
        Long requiredDeptId = step.get("departmentId") != null ? ((Number) step.get("departmentId")).longValue() : null;

        if (!currentUserUtil.canApproveStep(currentStep, permissionKey, requiredDeptId)) {
            throw new RuntimeException("Bạn không có quyền hoàn thành GRN");
        }

        User currentUser = currentUserUtil.getCurrentUser();

        // Cập nhật tồn kho
        try {
            String itemsJson = grn.getItems();
            if (itemsJson == null || itemsJson.isEmpty()) {
                throw new RuntimeException("Không có danh sách vật tư trong GRN");
            }
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsJson);
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var inventoryOpt = inventoryRepository.findByWarehouseIdAndItemId(
                        grn.getWarehouseId(), itemId);
                if (inventoryOpt.isPresent()) {
                    Inventory inv = inventoryOpt.get();
                    inv.setQuantity(inv.getQuantity().add(actualQty));
                    inv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(inv);
                } else {
                    Inventory newInv = new Inventory();
                    newInv.setWarehouseId(grn.getWarehouseId());
                    newInv.setItemId(itemId);
                    newInv.setQuantity(actualQty);
                    newInv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(newInv);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật tồn kho: " + e.getMessage());
        }

        // Cập nhật tiến trình GRN
        WorkflowProgress progress = workflowProgressService.completeProgress("grn", grn.getId());

        grn.setApprovalStep(progress.getApprovalStep());
        grn.setStatus(progress.getStatus());
        grn.setUpdatedAt(LocalDate.now());

        // Ghi log
        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("GRN");
        history.setEntityId(grn.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(grn.getStatus());
        history.setStatusAfter(grn.getStatus());
        approvalHistoryRepository.save(history);

        grnRepository.save(grn);

        // ✅ Kiểm tra và cập nhật PO complete
        if (grn.getPoId() != null) {
            poService.checkAndUpdatePOComplete(grn.getPoId());
        }
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa GRN");
        }
        if (!"DRAFT".equals(grn.getStatus()) && !"RECEIVED".equals(grn.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa GRN ở trạng thái DRAFT hoặc RECEIVED");
        }
        grnRepository.delete(grn);
    }
}