package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.STO;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.STORepository;
import com.mep.mepbackend.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class STOService {

    private final STORepository stoRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    public List<STO> getAll() {
        return stoRepository.findAll();
    }

    public STO getById(Long id) {
        return stoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("STO not found"));
    }

    public STO getByCode(String code) {
        return stoRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("STO not found with code: " + code));
    }

    @Transactional
    public STO create(STO sto) {
        if (stoRepository.existsByCode(sto.getCode())) {
            throw new RuntimeException("Mã STO đã tồn tại");
        }
        sto.setStatus("DRAFT");
        sto.setCreatedAt(LocalDate.now());
        return stoRepository.save(sto);
    }

    @Transactional
    public STO update(Long id, STO details) {
        STO sto = getById(id);
        if (!"DRAFT".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa STO ở trạng thái DRAFT");
        }
        sto.setTransferDate(details.getTransferDate());
        sto.setRequestedBy(details.getRequestedBy());
        sto.setWarehouseStaff(details.getWarehouseStaff());
        sto.setTransporter(details.getTransporter());
        sto.setDepartureTime(details.getDepartureTime());
        sto.setItems(details.getItems());
        sto.setNote(details.getNote());
        sto.setUpdatedAt(LocalDate.now());
        return stoRepository.save(sto);
    }

    @Transactional
    public void submit(Long id) {
        STO sto = getById(id);
        if (!"DRAFT".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt STO ở trạng thái DRAFT");
        }
        sto.setStatus("PENDING");
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    @Transactional
    public void approve(Long id) {
        STO sto = getById(id);
        if (!"PENDING".equals(sto.getStatus())) {
            throw new RuntimeException("STO không ở trạng thái chờ duyệt");
        }
        sto.setStatus("APPROVED");
        sto.setApprovedBy(getCurrentUser());
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    @Transactional
    public void complete(Long id) {
        STO sto = getById(id);
        if (!"APPROVED".equals(sto.getStatus())) {
            throw new RuntimeException("STO chưa được duyệt");
        }
        // Kiểm tra tồn kho trước khi xuất
        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(sto.getItems());
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var invFrom = inventoryRepository.findByWarehouseIdAndItemId(
                        sto.getFromWarehouseId(), itemId);
                if (invFrom.isEmpty() || invFrom.get().getQuantity().compareTo(actualQty) < 0) {
                    throw new RuntimeException("Tồn kho không đủ cho vật tư " + itemId);
                }
            }
            // Trừ kho đi, cộng kho đến
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                // Trừ kho đi
                var invFrom = inventoryRepository.findByWarehouseIdAndItemId(
                        sto.getFromWarehouseId(), itemId).get();
                invFrom.setQuantity(invFrom.getQuantity().subtract(actualQty));
                invFrom.setUpdatedAt(LocalDate.now());
                inventoryRepository.save(invFrom);
                // Cộng kho đến
                var invTo = inventoryRepository.findByWarehouseIdAndItemId(
                        sto.getToWarehouseId(), itemId);
                if (invTo.isPresent()) {
                    Inventory inv = invTo.get();
                    inv.setQuantity(inv.getQuantity().add(actualQty));
                    inv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(inv);
                } else {
                    Inventory newInv = new Inventory();
                    newInv.setWarehouseId(sto.getToWarehouseId());
                    newInv.setItemId(itemId);
                    newInv.setQuantity(actualQty);
                    newInv.setUpdatedAt(LocalDate.now());
                    inventoryRepository.save(newInv);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật tồn kho: " + e.getMessage());
        }
        sto.setStatus("COMPLETED");
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    @Transactional
    public void delete(Long id) {
        STO sto = getById(id);
        if (!"DRAFT".equals(sto.getStatus()) && !"PENDING".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa STO ở trạng thái DRAFT hoặc PENDING");
        }
        stoRepository.delete(sto);
    }

    private String getCurrentUser() {
        // Lấy từ SecurityContextHolder
        return "system";
    }
}