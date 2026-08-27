package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.GRN;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.GRNRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.PORepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GRNService {

    private final GRNRepository grnRepository;
    private final PORepository poRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====

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

    public List<GRN> getByPoId(Long poId) {
        return grnRepository.findByPoId(poId);
    }

    public List<GRN> getByWarehouseId(Long warehouseId) {
        return grnRepository.findByWarehouseId(warehouseId);
    }

    public List<GRN> getByStatus(String status) {
        return grnRepository.findByStatus(status);
    }

    // ===== CREATE =====

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

        long count = grnRepository.count();
        String nextCode = "GRN-" + String.format("%03d", count + 1);
        if (grnRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (grnRepository.existsByCode("GRN-" + String.format("%03d", i))) i++;
            nextCode = "GRN-" + String.format("%03d", i);
        }

        String defaultStatus = statusService.getDefaultStatus("grn").getCode();
        grn.setCode(nextCode);
        grn.setStatus(defaultStatus);
        grn.setCreatedAt(LocalDate.now());
        return grnRepository.save(grn);
    }

    // ===== UPDATE =====

    @Transactional
    public GRN update(Long id, GRN details) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa GRN");
        }
        if (!"DRAFT".equals(grn.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa GRN ở trạng thái DRAFT");
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

        // Lấy status cho bước 2 từ workflow
        String statusCode = workflowService.getStatusForStep("grn", 2);

        grn.setWarehouseStaff(warehouseStaff);
        grn.setReceiptDate(receiptDate);
        grn.setStatus(statusCode != null ? statusCode : "RECEIVED");
        grn.setUpdatedAt(LocalDate.now());
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

        // Lấy status cho bước 3 từ workflow
        String statusCode = workflowService.getStatusForStep("grn", 3);

        if ("FAIL".equals(result)) {
            grn.setStatus("REJECTED");
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - KHÔNG ĐẠT - " + note);
        } else {
            grn.setQcConfirm(qcName);
            grn.setStatus(statusCode != null ? statusCode : "QC_CHECKED");
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - " + result + " - " + note);
        }
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
    }

    // ===== COMPLETE =====

    @Transactional
    public void complete(Long id) {
        GRN grn = getById(id);
        if (!currentUserUtil.hasPermission("grn.complete")) {
            throw new RuntimeException("Bạn không có quyền hoàn thành GRN");
        }
        if (!"QC_CHECKED".equals(grn.getStatus())) {
            throw new RuntimeException("GRN chưa được QC kiểm tra");
        }

        // Lấy status cho bước cuối từ workflow
        String statusCode = workflowService.getStatusForStep("grn", 4);

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

        grn.setStatus(statusCode != null ? statusCode : "COMPLETED");
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
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