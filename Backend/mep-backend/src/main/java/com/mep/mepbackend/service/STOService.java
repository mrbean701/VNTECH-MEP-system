package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.STO;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.STORepository;
import com.mep.mepbackend.repository.InventoryRepository;
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
public class STOService {

    private final STORepository stoRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====

    public List<STO> getAll() {
        return stoRepository.findAll();
    }

    public STO getById(Long id) {
        return stoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("STO not found with id: " + id));
    }

    public STO getByCode(String code) {
        return stoRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("STO not found with code: " + code));
    }

    // ===== CREATE =====

    @Transactional
    public STO create(STO sto) {
        if (!currentUserUtil.hasPermission("sto.create")) {
            throw new RuntimeException("Bạn không có quyền tạo STO");
        }

        long count = stoRepository.count();
        String nextCode = "STO-" + String.format("%03d", count + 1);
        if (stoRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (stoRepository.existsByCode("STO-" + String.format("%03d", i))) i++;
            nextCode = "STO-" + String.format("%03d", i);
        }

        String defaultStatus = statusService.getDefaultStatus("sto").getCode();
        sto.setCode(nextCode);
        sto.setStatus(defaultStatus);
        sto.setCreatedAt(LocalDate.now());
        return stoRepository.save(sto);
    }

    // ===== UPDATE =====

    @Transactional
    public STO update(Long id, STO details) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa STO");
        }
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

    // ===== SUBMIT =====

    @Transactional
    public void submit(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt STO");
        }
        if (!"DRAFT".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt STO ở trạng thái DRAFT");
        }
        sto.setStatus("PENDING");
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    // ===== APPROVE =====

    @Transactional
    public void approve(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.approve")) {
            throw new RuntimeException("Bạn không có quyền duyệt STO");
        }
        if (!"PENDING".equals(sto.getStatus())) {
            throw new RuntimeException("STO không ở trạng thái chờ duyệt");
        }

        String statusCode = workflowService.getStatusForStep("sto", 2);

        sto.setStatus(statusCode != null ? statusCode : "APPROVED");
        sto.setApprovedBy(currentUserUtil.getCurrentUser().getName());
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    // ===== COMPLETE =====

    @Transactional
    public void complete(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.complete")) {
            throw new RuntimeException("Bạn không có quyền hoàn thành STO");
        }
        if (!"APPROVED".equals(sto.getStatus())) {
            throw new RuntimeException("STO chưa được duyệt");
        }

        String statusCode = workflowService.getStatusForStep("sto", 3);

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

            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());

                var invFrom = inventoryRepository.findByWarehouseIdAndItemId(
                        sto.getFromWarehouseId(), itemId).get();
                invFrom.setQuantity(invFrom.getQuantity().subtract(actualQty));
                invFrom.setUpdatedAt(LocalDate.now());
                inventoryRepository.save(invFrom);

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

        sto.setStatus(statusCode != null ? statusCode : "COMPLETED");
        sto.setUpdatedAt(LocalDate.now());
        stoRepository.save(sto);
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        STO sto = getById(id);
        if (!currentUserUtil.hasPermission("sto.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa STO");
        }
        if (!"DRAFT".equals(sto.getStatus()) && !"PENDING".equals(sto.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa STO ở trạng thái DRAFT hoặc PENDING");
        }
        stoRepository.delete(sto);
    }
}