package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.Issue;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.IssueRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ObjectMapper objectMapper;

    public List<Issue> getAll() {
        return issueRepository.findAll();
    }

    public Issue getById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
    }

    @Transactional
    public Issue create(Issue issue) {
        issue.setStatus("DRAFT");
        issue.setCreatedAt(LocalDate.now());
        return issueRepository.save(issue);
    }

    @Transactional
    public Issue update(Long id, Issue details) {
        Issue issue = getById(id);
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa phiếu ở trạng thái DRAFT");
        }
        issue.setProjectCode(details.getProjectCode());
        issue.setProjectName(details.getProjectName());
        issue.setDate(details.getDate());
        issue.setArea(details.getArea());
        issue.setTeam(details.getTeam());
        issue.setRequester(details.getRequester());
        issue.setItems(details.getItems());
        issue.setNote(details.getNote());
        issue.setUpdatedAt(LocalDate.now());
        return issueRepository.save(issue);
    }

    @Transactional
    public void submit(Long id) {
        Issue issue = getById(id);
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt phiếu ở trạng thái DRAFT");
        }
        issue.setStatus("PENDING");
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    @Transactional
    public void approve(Long id) {
        Issue issue = getById(id);
        if (!"PENDING".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }
        issue.setStatus("APPROVED");
        issue.setApprovedBy(getCurrentUser());
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    @Transactional
    public void reject(Long id) {
        Issue issue = getById(id);
        if (!"PENDING".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }
        issue.setStatus("REJECTED");
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    @Transactional
    public void complete(Long id, Long warehouseId, String itemsUpdateJson) {
        Issue issue = getById(id);
        if (!"APPROVED".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu chưa được duyệt");
        }
        warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsUpdateJson);
            issue.setItems(itemsUpdateJson);
            issue.setWarehouseId(warehouseId);
            issue.setStatus("COMPLETED");
            issue.setCompletedBy(getCurrentUser());
            issue.setUpdatedAt(LocalDate.now());

            // Trừ tồn kho
            for (var item : itemsArray) {
                Long itemId = item.get("itemId").asLong();
                BigDecimal actualQty = new BigDecimal(item.get("actualQty").asText());
                var inventory = inventoryRepository.findByWarehouseIdAndItemId(warehouseId, itemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
                if (inventory.getQuantity().compareTo(actualQty) < 0) {
                    throw new RuntimeException("Tồn kho không đủ");
                }
                inventory.setQuantity(inventory.getQuantity().subtract(actualQty));
                inventory.setUpdatedAt(LocalDate.now());
                inventoryRepository.save(inventory);
            }
            issueRepository.save(issue);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi cập nhật: " + e.getMessage());
        }
    }

    @Transactional
    public void confirm(Long id) {
        Issue issue = getById(id);
        if (!"COMPLETED".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu chưa được hoàn thành");
        }
        issue.setStatus("CONFIRMED");
        issue.setConfirmedBy(getCurrentUser());
        issue.setCompletionDate(LocalDate.now());
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    @Transactional
    public void delete(Long id) {
        Issue issue = getById(id);
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa phiếu ở trạng thái DRAFT");
        }
        issueRepository.delete(issue);
    }

    private String getCurrentUser() {
        return "system";
    }
}