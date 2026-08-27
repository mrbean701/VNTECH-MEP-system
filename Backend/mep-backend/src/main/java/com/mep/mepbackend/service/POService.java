package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.PO;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.PORepository;
import com.mep.mepbackend.repository.PRRepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class POService {

    private final PORepository poRepository;
    private final PRRepository prRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final StatusService statusService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====

    public List<PO> getAll() {
        return poRepository.findAll();
    }

    public PO getById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with id: " + id));
    }

    public PO getByCode(String code) {
        return poRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with code: " + code));
    }

    public List<PO> getByProjectCode(String projectCode) {
        return poRepository.findByProjectCode(projectCode);
    }

    public List<PO> getByStatus(String status) {
        return poRepository.findByStatus(status);
    }

    public List<PO> getByPrId(Long prId) {
        return poRepository.findByPrId(prId);
    }

    public List<PO> getByVendorCode(String vendorCode) {
        return poRepository.findByVendorCode(vendorCode);
    }

    // ===== CREATE =====

    @Transactional
    public PO create(PO po) {
        if (!currentUserUtil.hasPermission("po.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PO");
        }

        long count = poRepository.count();
        String nextCode = "PO-" + String.format("%03d", count + 1);
        if (poRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (poRepository.existsByCode("PO-" + String.format("%03d", i))) i++;
            nextCode = "PO-" + String.format("%03d", i);
        }

        String defaultStatus = statusService.getDefaultStatus("po").getCode();
        po.setCode(nextCode);
        po.setStatus(defaultStatus);
        po.setApprovalStep(1);
        po.setCreatedAt(LocalDate.now());
        return poRepository.save(po);
    }

    @Transactional
    public PO createFromPR(Long prId, PO poDetails) {
        if (!currentUserUtil.hasPermission("po.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PO từ PR");
        }
        var pr = prRepository.findById(prId)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with id: " + prId));
        if (!"APPROVED".equals(pr.getStatus())) {
            throw new RuntimeException("PR chưa được duyệt");
        }
        poDetails.setProjectCode(pr.getProjectCode());
        poDetails.setProjectName(pr.getProjectName());
        poDetails.setVendorCode(pr.getVendorCode());
        poDetails.setVendorName(pr.getVendorName());
        poDetails.setItems(pr.getItems());
        poDetails.setPrId(pr.getId());
        return create(poDetails);
    }

    // ===== UPDATE =====

    @Transactional
    public PO update(Long id, PO details) {
        PO po = getById(id);
        if (!currentUserUtil.hasPermission("po.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa PO");
        }
        if (!"DRAFT".equals(po.getStatus()) && !"PENDING".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa PO ở trạng thái DRAFT hoặc PENDING");
        }
        po.setProjectCode(details.getProjectCode());
        po.setProjectName(details.getProjectName());
        po.setVendorCode(details.getVendorCode());
        po.setVendorName(details.getVendorName());
        po.setItems(details.getItems());
        po.setNote(details.getNote());
        po.setUpdatedAt(LocalDate.now());
        return poRepository.save(po);
    }

    // ===== SUBMIT =====

    @Transactional
    public void submit(Long id) {
        PO po = getById(id);
        if (!currentUserUtil.hasPermission("po.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt PO");
        }
        if (!"DRAFT".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt PO ở trạng thái DRAFT");
        }
        po.setStatus("PENDING");
        po.setApprovalStep(1);
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    // ===== APPROVE =====

    @Transactional
    public void approve(Long id) {
        PO po = getById(id);
        if (!"PENDING".equals(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }

        List<Map<String, Object>> steps = workflowService.getStepsWithStatusByModule("po");
        int currentStep = po.getApprovalStep() != null ? po.getApprovalStep() : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt " + currentStep));

        String requiredRole = (String) step.get("role");
        Integer requiredDeptId = step.get("departmentId") != null ? (Integer) step.get("departmentId") : null;

        User currentUser = currentUserUtil.getCurrentUser();

        if (!currentUser.getRole().equals(requiredRole)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này (yêu cầu role: " + requiredRole + ")");
        }
        if (requiredDeptId != null && (currentUser.getDepartmentId() == null ||
                !currentUser.getDepartmentId().equals(Long.valueOf(requiredDeptId)))) {
            throw new RuntimeException("Bạn không thuộc phòng ban được chỉ định để duyệt");
        }

        if (!currentUserUtil.hasPermission("po.approve")) {
            throw new RuntimeException("Bạn không có quyền duyệt PO (user permission)");
        }

        String statusCode = (String) step.get("statusCode");

        if (currentStep == steps.size()) {
            po.setStatus("APPROVED");
        } else {
            po.setApprovalStep(currentStep + 1);
            if (statusCode != null && !statusCode.isEmpty()) {
                po.setStatus(statusCode);
            } else {
                po.setStatus("PENDING");
            }
        }
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    // ===== REJECT =====

    @Transactional
    public void reject(Long id) {
        PO po = getById(id);
        if (!"PENDING".equals(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }
        if (!currentUserUtil.hasPermission("po.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối PO");
        }
        po.setStatus("REJECTED");
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        PO po = getById(id);
        if (!"DRAFT".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa PO ở trạng thái DRAFT");
        }
        if (!currentUserUtil.hasPermission("po.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa PO");
        }
        poRepository.delete(po);
    }
}