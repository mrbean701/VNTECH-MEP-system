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
    private final PRRepository prRepository;
    private final MRRepository mrRepository;
    private final InventoryRepository inventoryRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

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

    // Helper parse items
    private List<Map<String, Object>> parseItems(String itemsJson) {
        try {
            if (itemsJson == null || itemsJson.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(itemsJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<GRN> getAll() {
        return grnRepository.findAll();
    }

    public GRN getById(Long id) {
        return grnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GRN not found with id: " + id));
    }

    public GRN getByCode(String code) {
        return grnRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("GRN not found with code: " + code));
    }

    public List<GRN> getByStatus(String status) {
        return grnRepository.findByStatus(status);
    }

    public List<GRN> getByProjectCode(String projectCode) {
        return grnRepository.findByProjectCode(projectCode);
    }

    @Transactional
    public GRN create(GRN grn) {
        if (!currentUserUtil.hasPermission("grn.create")) {
            throw new RuntimeException("Bạn không có quyền tạo GRN");
        }

        var po = poRepository.findById(grn.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with id: " + grn.getPoId()));
        if (!"APPROVED".equals(po.getStatus())) {
            throw new RuntimeException("PO chưa được duyệt, không thể tạo GRN");
        }

        grn.setCode(generateCode("GRN"));
        Workflow activeWorkflow = workflowService.getActiveWorkflow("grn");
        grn.setWorkflowId(activeWorkflow.getId());

        String defaultStatus = statusService.getDefaultStatus("grn").getCode();
        grn.setStatus(defaultStatus);
        grn.setApprovalStep(1);

        User currentUser = currentUserUtil.getCurrentUser();
        grn.setCreatedBy(currentUser.getId());
        grn.setCreatedByName(currentUser.getName());

        grn.setCreatedAt(LocalDate.now());
        return grnRepository.save(grn);
    }

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

    @Transactional
    public void receive(Long id, String warehouseStaff, LocalDate receiptDate) {
        // ... giữ nguyên logic cũ (không thay đổi)
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.receive")) {
            throw new RuntimeException("Bạn không có quyền nhận GRN");
        }
        if (!"DRAFT".equals(grn.getStatus())) {
            throw new RuntimeException("Chỉ có thể nhận GRN ở trạng thái DRAFT");
        }

        Workflow wf = workflowService.getById(grn.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = 2;
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

        String statusCode = (String) step.get("statusCode");

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("GRN");
        history.setEntityId(grn.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(grn.getStatus());

        grn.setWarehouseStaff(warehouseStaff);
        grn.setReceiptDate(receiptDate);
        if (statusCode == null || statusCode.isEmpty()) {
            statusCode = "RECEIVED";
        }
        grn.setStatus(statusCode);
        grn.setApprovalStep(currentStep);
        history.setStatusAfter(grn.getStatus());

        approvalHistoryRepository.save(history);
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
    }

    @Transactional
    public void qcCheck(Long id, String qcName, String result, String note) {
        // ... giữ nguyên logic cũ (không thay đổi)
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.qc")) {
            throw new RuntimeException("Bạn không có quyền QC GRN");
        }
        if (!"RECEIVED".equals(grn.getStatus())) {
            throw new RuntimeException("GRN chưa được nhận hoặc đã qua bước QC");
        }

        Workflow wf = workflowService.getById(grn.getWorkflowId());
        List<Map<String, Object>> steps = workflowService.getStepsByWorkflowId(wf.getId());
        int currentStep = 3;
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

        String statusCode = (String) step.get("statusCode");

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("GRN");
        history.setEntityId(grn.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(grn.getStatus());

        if ("FAIL".equals(result)) {
            grn.setStatus("REJECTED");
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - KHÔNG ĐẠT - " + note);
        } else {
            grn.setQcConfirm(qcName);
            if (statusCode == null || statusCode.isEmpty()) {
                statusCode = "QC_CHECKED";
            }
            grn.setStatus(statusCode);
            grn.setApprovalStep(currentStep);
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - " + result + " - " + note);
        }
        history.setStatusAfter(grn.getStatus());

        approvalHistoryRepository.save(history);
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
    }

    // ✅ COMPLETE - Cập nhật inventory và set PO/PR/MR complete
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
        int currentStep = 4;
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
        if (currentUser.getId().equals(grn.getCreatedBy())) {
            throw new RuntimeException("Bạn không thể tự hoàn thành GRN do chính mình tạo");
        }

        String statusCode = (String) step.get("statusCode");

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

        ApprovalHistory history = new ApprovalHistory();
        history.setEntityType("GRN");
        history.setEntityId(grn.getId());
        history.setWorkflowId(wf.getId());
        history.setStep(currentStep);
        history.setApproverId(currentUser.getId());
        history.setApproverName(currentUser.getName());
        history.setStatusBefore(grn.getStatus());

        if (statusCode == null || statusCode.isEmpty()) {
            statusCode = "COMPLETED";
        }
        grn.setStatus(statusCode);
        grn.setApprovalStep(currentStep);
        history.setStatusAfter(grn.getStatus());

        approvalHistoryRepository.save(history);
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);

        // ✅ Sau khi GRN complete, kiểm tra và set PO complete
        if (grn.getPoId() != null) {
            checkAndUpdatePOComplete(grn.getPoId());
        }
    }

    // ✅ Kiểm tra và set PO complete
    private void checkAndUpdatePOComplete(Long poId) {
        PO po = poRepository.findById(poId).orElse(null);
        if (po == null) return;

        // Lấy tất cả GRN của PO
        List<GRN> grns = grnRepository.findByPoId(poId);

                // Tính tổng số mã vật tư đã nhập (chỉ tính GRN đã HOÀN THÀNH - bỏ qua GRN còn DRAFT/RECEIVED/QC hoặc bị REJECTED)
        Set<Long> itemsInGRN = new HashSet<>();
        for (GRN g : grns) {
            if (g.getStatus() == null || isPendingStatus(g.getStatus()) || "REJECTED".equals(g.getStatus())) {
                continue;
            }
            List<Map<String, Object>> items = parseItems(g.getItems());
            for (Map<String, Object> item : items) {
                Long itemId = ((Number) item.get("itemId")).longValue();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").toString());
                if (actualQty.compareTo(BigDecimal.ZERO) > 0) {
                    itemsInGRN.add(itemId);
                }
            }
        }

        // Lấy danh sách mã vật tư trong PO
        List<Map<String, Object>> poItems = parseItems(po.getItems());
        Set<Long> itemsInPO = new HashSet<>();
        for (Map<String, Object> item : poItems) {
            itemsInPO.add(((Number) item.get("itemId")).longValue());
        }

        // Nếu tất cả mã vật tư trong PO đã được nhập đủ số lượng
        if (itemsInGRN.containsAll(itemsInPO) && itemsInGRN.size() == itemsInPO.size()) {
            po.setStatus("COMPLETE");
            poRepository.save(po);

            // ✅ Kiểm tra PR complete
            if (po.getPrId() != null) {
                checkAndUpdatePRComplete(po.getPrId());
            }
        }
    }

    // ✅ Kiểm tra và set PR complete
    private void checkAndUpdatePRComplete(Long prId) {
        PR pr = prRepository.findById(prId).orElse(null);
        if (pr == null) return;

        List<PO> pos = poRepository.findByPrId(prId);
        Set<Long> itemsInPO = new HashSet<>();
        for (PO po : pos) {
            if (!"COMPLETE".equals(po.getStatus())) {
                return; // Có PO chưa complete → chưa thể set PR complete
            }
            List<Map<String, Object>> items = parseItems(po.getItems());
            for (Map<String, Object> item : items) {
                itemsInPO.add(((Number) item.get("itemId")).longValue());
            }
        }

        List<Map<String, Object>> prItems = parseItems(pr.getItems());
        Set<Long> itemsInPR = new HashSet<>();
        for (Map<String, Object> item : prItems) {
            itemsInPR.add(((Number) item.get("itemId")).longValue());
        }

        if (itemsInPO.containsAll(itemsInPR) && itemsInPO.size() == itemsInPR.size()) {
            pr.setStatus("COMPLETE");
            prRepository.save(pr);

            // ✅ Kiểm tra MR complete
            if (pr.getMrId() != null) {
                checkAndUpdateMRComplete(pr.getMrId());
            }
        }
    }

    // ✅ Kiểm tra và set MR complete
    private void checkAndUpdateMRComplete(Long mrId) {
        MR mr = mrRepository.findById(mrId).orElse(null);
        if (mr == null) return;

        List<PR> prs = prRepository.findByMrId(mrId);
        Set<Long> itemsInPR = new HashSet<>();
        for (PR pr : prs) {
            if (!"COMPLETE".equals(pr.getStatus())) {
                return; // Có PR chưa complete → chưa thể set MR complete
            }
            List<Map<String, Object>> items = parseItems(pr.getItems());
            for (Map<String, Object> item : items) {
                itemsInPR.add(((Number) item.get("itemId")).longValue());
            }
        }

        List<Map<String, Object>> mrItems = parseItems(mr.getItems());
        Set<Long> itemsInMR = new HashSet<>();
        for (Map<String, Object> item : mrItems) {
            itemsInMR.add(((Number) item.get("itemId")).longValue());
        }

        if (itemsInPR.containsAll(itemsInMR) && itemsInPR.size() == itemsInMR.size()) {
            mr.setStatus("COMPLETE");
            mrRepository.save(mr);
        }
    }

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