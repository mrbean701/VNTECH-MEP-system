package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mep.mepbackend.entity.Issue;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.IssueRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.WarehouseRepository;
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
public class IssueService {

    private final IssueRepository issueRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====

    public List<Issue> getAll() {
        return issueRepository.findAll();
    }

    public Issue getById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));
    }

    public List<Issue> getByProjectCode(String projectCode) {
        return issueRepository.findByProjectCode(projectCode);
    }

    public List<Issue> getByStatus(String status) {
        return issueRepository.findByStatus(status);
    }

    // ===== CREATE =====

    @Transactional
    public Issue create(Issue issue) {
        if (!currentUserUtil.hasPermission("issue.create")) {
            throw new RuntimeException("Bạn không có quyền tạo phiếu cấp phát");
        }

        long count = issueRepository.count();
        String nextCode = "ISS-" + String.format("%03d", count + 1);
        if (issueRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (issueRepository.existsByCode("ISS-" + String.format("%03d", i))) i++;
            nextCode = "ISS-" + String.format("%03d", i);
        }

        String defaultStatus = statusService.getDefaultStatus("issue").getCode();
        issue.setCode(nextCode);
        issue.setStatus(defaultStatus);
        issue.setCreatedAt(LocalDate.now());
        return issueRepository.save(issue);
    }

    // ===== UPDATE =====

    @Transactional
    public Issue update(Long id, Issue details) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa phiếu cấp phát");
        }
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

    // ===== SUBMIT =====

    @Transactional
    public void submit(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt phiếu cấp phát");
        }
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt phiếu ở trạng thái DRAFT");
        }
        issue.setStatus("PENDING");
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    // ===== APPROVE =====

    @Transactional
    public void approve(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.approve")) {
            throw new RuntimeException("Bạn không có quyền duyệt phiếu cấp phát");
        }
        if (!"PENDING".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }

        String statusCode = workflowService.getStatusForStep("issue", 2);

        issue.setStatus(statusCode != null ? statusCode : "APPROVED");
        issue.setApprovedBy(currentUserUtil.getCurrentUser().getName());
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    // ===== REJECT =====

    @Transactional
    public void reject(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối phiếu cấp phát");
        }
        if (!"PENDING".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt");
        }
        issue.setStatus("REJECTED");
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    // ===== COMPLETE =====

    @Transactional
    public void complete(Long id, Long warehouseId, String itemsUpdateJson) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.complete")) {
            throw new RuntimeException("Bạn không có quyền thực hiện cấp phát");
        }
        if (!"APPROVED".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu chưa được duyệt");
        }

        warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        String statusCode = workflowService.getStatusForStep("issue", 3);

        try {
            ArrayNode itemsArray = (ArrayNode) objectMapper.readTree(itemsUpdateJson);
            issue.setItems(itemsUpdateJson);
            issue.setWarehouseId(warehouseId);
            issue.setStatus(statusCode != null ? statusCode : "COMPLETED");
            issue.setCompletedBy(currentUserUtil.getCurrentUser().getName());
            issue.setUpdatedAt(LocalDate.now());

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

    // ===== CONFIRM =====

    @Transactional
    public void confirm(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.confirm")) {
            throw new RuntimeException("Bạn không có quyền xác nhận phiếu cấp phát");
        }
        if (!"COMPLETED".equals(issue.getStatus())) {
            throw new RuntimeException("Phiếu chưa được hoàn thành");
        }

        String statusCode = workflowService.getStatusForStep("issue", 4);

        issue.setStatus(statusCode != null ? statusCode : "CONFIRMED");
        issue.setConfirmedBy(currentUserUtil.getCurrentUser().getName());
        issue.setCompletionDate(LocalDate.now());
        issue.setUpdatedAt(LocalDate.now());
        issueRepository.save(issue);
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        Issue issue = getById(id);
        if (!currentUserUtil.hasPermission("issue.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa phiếu cấp phát");
        }
        if (!"DRAFT".equals(issue.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa phiếu ở trạng thái DRAFT");
        }
        issueRepository.delete(issue);
    }
}