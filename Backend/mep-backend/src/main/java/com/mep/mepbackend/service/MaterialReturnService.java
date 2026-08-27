package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.MaterialReturn;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.MaterialReturnRepository;
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
public class MaterialReturnService {

    private final MaterialReturnRepository returnRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====

    public List<MaterialReturn> getAll() {
        return returnRepository.findAll();
    }

    public MaterialReturn getById(Long id) {
        return returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaterialReturn not found with id: " + id));
    }

    public MaterialReturn getByCode(String code) {
        return returnRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("MaterialReturn not found with code: " + code));
    }

    public List<MaterialReturn> getByProjectCode(String projectCode) {
        return returnRepository.findByProjectCode(projectCode);
    }

    public List<MaterialReturn> getByStatus(String status) {
        return returnRepository.findByStatus(status);
    }

    // ===== CREATE =====

    @Transactional
    public MaterialReturn create(MaterialReturn materialReturn) {
        if (!currentUserUtil.hasPermission("materialreturn.create")) {
            throw new RuntimeException("Bạn không có quyền tạo phiếu hoàn trả");
        }

        long count = returnRepository.count();
        String nextCode = "MRET-" + String.format("%03d", count + 1);
        if (returnRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (returnRepository.existsByCode("MRET-" + String.format("%03d", i))) i++;
            nextCode = "MRET-" + String.format("%03d", i);
        }

        String defaultStatus = statusService.getDefaultStatus("materialreturn").getCode();
        materialReturn.setCode(nextCode);
        materialReturn.setStatus(defaultStatus);
        materialReturn.setCreatedAt(LocalDate.now());
        return returnRepository.save(materialReturn);
    }

    // ===== UPDATE =====

    @Transactional
    public MaterialReturn update(Long id, MaterialReturn details) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa phiếu hoàn trả");
        }
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

    // ===== SUBMIT =====

    @Transactional
    public void submit(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt phiếu hoàn trả");
        }
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt phiếu ở trạng thái DRAFT");
        }
        mr.setStatus("PENDING");
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== APPROVE =====

    @Transactional
    public void approve(Long id, String itemsUpdateJson) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.approve")) {
            throw new RuntimeException("Bạn không có quyền xác nhận nhập kho hoàn trả");
        }
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }

        String statusCode = workflowService.getStatusForStep("materialreturn", 2);

        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsUpdateJson);
            mr.setItems(itemsUpdateJson);
            mr.setStatus(statusCode != null ? statusCode : "APPROVED");
            mr.setApprovedBy(currentUserUtil.getCurrentUser().getName());
            mr.setUpdatedAt(LocalDate.now());

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
            throw new RuntimeException("Lỗi cập nhật tồn kho: " + e.getMessage());
        }
    }

    // ===== CONFIRM =====

    @Transactional
    public void confirm(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.confirm")) {
            throw new RuntimeException("Bạn không có quyền xác nhận hoàn tất phiếu hoàn trả");
        }
        if (!"APPROVED".equals(mr.getStatus())) {
            throw new RuntimeException("Phiếu chưa được thủ kho xác nhận");
        }

        String statusCode = workflowService.getStatusForStep("materialreturn", 3);

        mr.setStatus(statusCode != null ? statusCode : "CONFIRMED");
        mr.setConfirmedBy(currentUserUtil.getCurrentUser().getName());
        mr.setCompletionDate(LocalDate.now());
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== REJECT =====

    @Transactional
    public void reject(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối phiếu hoàn trả");
        }
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể từ chối phiếu ở trạng thái PENDING");
        }
        mr.setStatus("REJECTED");
        mr.setUpdatedAt(LocalDate.now());
        returnRepository.save(mr);
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        MaterialReturn mr = getById(id);
        if (!currentUserUtil.hasPermission("materialreturn.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa phiếu hoàn trả");
        }
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa phiếu ở trạng thái DRAFT");
        }
        returnRepository.delete(mr);
    }
}