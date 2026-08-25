package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.GRN;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.GRNRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.PORepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GRNService {

    private final GRNRepository grnRepository;
    private final PORepository poRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    public List<GRN> getAll() {
        return grnRepository.findAll();
    }

    public GRN getById(Long id) {
        return grnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GRN not found"));
    }

    public GRN getByCode(String code) {
        return grnRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("GRN not found with code: " + code));
    }

    @Transactional
    public GRN create(GRN grn) {
        if (grnRepository.existsByCode(grn.getCode())) {
            throw new RuntimeException("Mã GRN đã tồn tại");
        }
        var po = poRepository.findById(grn.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("PO not found"));
        if (!"APPROVED".equals(po.getStatus())) {
            throw new RuntimeException("PO chưa được duyệt");
        }
        grn.setStatus("DRAFT");
        grn.setCreatedAt(LocalDate.now());
        return grnRepository.save(grn);
    }

    @Transactional
    public GRN update(Long id, GRN details) {
        GRN grn = getById(id);
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

    @Transactional
    public void receive(Long id, String warehouseStaff, LocalDate receiptDate) {
        GRN grn = getById(id);
        if (!"DRAFT".equals(grn.getStatus())) {
            throw new RuntimeException("Chỉ có thể nhận GRN ở trạng thái DRAFT");
        }
        grn.setWarehouseStaff(warehouseStaff);
        grn.setReceiptDate(receiptDate);
        grn.setStatus("RECEIVED");
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
    }

    @Transactional
    public void qcCheck(Long id, String qcName, String result, String note) {
        GRN grn = getById(id);
        if (!"RECEIVED".equals(grn.getStatus())) {
            throw new RuntimeException("GRN chưa được nhận hoặc đã qua bước QC");
        }
        if ("FAIL".equals(result)) {
            grn.setStatus("REJECTED");
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - KHÔNG ĐẠT - " + note);
        } else {
            grn.setQcConfirm(qcName);
            grn.setStatus("QC_CHECKED");
            grn.setNote((grn.getNote() != null ? grn.getNote() + " | " : "") +
                    "QC: " + qcName + " - " + result + " - " + note);
        }
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
    }

    @Transactional
    public void complete(Long id) {
        GRN grn = getById(id);
        if (!"QC_CHECKED".equals(grn.getStatus())) {
            throw new RuntimeException("GRN chưa được QC kiểm tra");
        }
        // Cập nhật tồn kho
        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(grn.getItems());
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var inventory = inventoryRepository.findByWarehouseIdAndItemId(
                        grn.getWarehouseId(), itemId);
                if (inventory.isPresent()) {
                    Inventory inv = inventory.get();
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
        grn.setStatus("COMPLETED");
        grn.setUpdatedAt(LocalDate.now());
        grnRepository.save(grn);
    }

    @Transactional
    public void delete(Long id) {
        GRN grn = getById(id);
        if (!"DRAFT".equals(grn.getStatus()) && !"RECEIVED".equals(grn.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa GRN ở trạng thái DRAFT hoặc RECEIVED");
        }
        grnRepository.delete(grn);
    }
}