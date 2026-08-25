package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.MaterialReturn;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.MaterialReturnRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialReturnService {

    private final MaterialReturnRepository returnRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    public List<MaterialReturn> getAll() {
        return returnRepository.findAll();
    }

    public MaterialReturn getById(Long id) {
        return returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaterialReturn not found"));
    }

    @Transactional
    public MaterialReturn create(MaterialReturn materialReturn) {
        materialReturn.setStatus("DRAFT");
        materialReturn.setCreatedAt(LocalDate.now());
        return returnRepository.save(materialReturn);
    }

    @Transactional
    public MaterialReturn update(Long id, MaterialReturn details) {
        MaterialReturn mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa phiếu ở trạng thái DRAFT");
        }
        mr.setProjectCode(details.getProjectCode());
        mr.setProjectName(details.getProjectName());
        mr.setReturnDate(details.getReturnDate());
        mr.setWarehouseId(details.getWarehouseId());
        mr.setReturnFrom(details.getReturnFrom());
        mr.setItems(details.getItems());
        mr.setReturner(details.getReturner());
        mr.setNote(details.getNote());
        mr.setUpdatedAt(LocalDate.now());
        return returnRepository.save(mr);
    }

    @Transactional
    public void submit(Long id) {
        MaterialReturn mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt phiếu ở trạng thái DRAFT");
        }
        mr.setStatus("PENDING");
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    @Transactional
    public void approve(Long id, String itemsUpdateJson) {
        MaterialReturn mr = getById(id);
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }
        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsUpdateJson);
            mr.setItems(itemsUpdateJson);
            mr.setStatus("APPROVED");
            mr.setApprovedBy(getCurrentUser());
            mr.setUpdatedAt(LocalDate.now());

            // Cập nhật tồn kho (tăng kho nhận)
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var inventory = inventoryRepository.findByWarehouseIdAndItemId(
                        mr.getWarehouseId(), itemId);
                if (inventory.isPresent()) {
                    Inventory inv = inventory.get();
                    inv.setQuantity(inv.getQuantity().add(actualQty));
                    inv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(inv);
                } else {
                    Inventory newInv = new Inventory();
                    newInv.setWarehouseId(mr.getWarehouseId());
                    newInv.setItemId(itemId);
                    newInv.setQuantity(actualQty);
                    newInv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(newInv);
                }
            }
            returnRepository.save(mr);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật: " + e.getMessage());
        }
    }

    @Transactional
    public void confirm(Long id) {
        MaterialReturn mr = getById(id);
        if (!"APPROVED".equals(mr.getStatus())) {
            throw new RuntimeException("Phiếu chưa được thủ kho xác nhận");
        }
        mr.setStatus("CONFIRMED");
        mr.setConfirmedBy(getCurrentUser());
        mr.setCompletionDate(LocalDate.now());
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    @Transactional
    public void reject(Long id) {
        MaterialReturn mr = getById(id);
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể từ chối phiếu ở trạng thái PENDING");
        }
        mr.setStatus("REJECTED");
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    @Transactional
    public void delete(Long id) {
        MaterialReturn mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa phiếu ở trạng thái DRAFT");
        }
        returnRepository.delete(mr);
    }

    private String getCurrentUser() {
        return "system";
    }
}