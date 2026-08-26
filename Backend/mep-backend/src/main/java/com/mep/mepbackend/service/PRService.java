package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.PR;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.PRRepository;
import com.mep.mepbackend.repository.MRRepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Service quản lý Purchase Request (PR) - Sử dụng workflow động
 */
@Service
@RequiredArgsConstructor
public class PRService {

    private final PRRepository prRepository;
    private final MRRepository mrRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====
    public List<PR> getAll() {
        return prRepository.findAll();
    }

    public PR getById(Long id) {
        return prRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with id: " + id));
    }

    public PR getByCode(String code) {
        return prRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with code: " + code));
    }

    public List<PR> getByProjectCode(String projectCode) {
        return prRepository.findByProjectCode(projectCode);
    }

    public List<PR> getByStatus(String status) {
        return prRepository.findByStatus(status);
    }

    public List<PR> getByMrId(Long mrId) {
        return prRepository.findByMrId(mrId);
    }

    public List<PR> getByVendorCode(String vendorCode) {
        return prRepository.findByVendorCode(vendorCode);
    }

    // ===== CREATE =====
    @Transactional
    public PR create(PR pr) {
        if (!currentUserUtil.hasPermission("pr.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PR");
        }

        long count = prRepository.count();
        String nextCode = "PR-" + String.format("%03d", count + 1);
        if (prRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (prRepository.existsByCode("PR-" + String.format("%03d", i))) i++;
            nextCode = "PR-" + String.format("%03d", i);
        }
        pr.setCode(nextCode);
        pr.setStatus("DRAFT");
        pr.setApprovalStep(1);
        pr.setCreatedAt(LocalDate.now());
        return prRepository.save(pr);
    }

    @Transactional
    public PR createFromMR(Long mrId, PR prDetails) {
        if (!currentUserUtil.hasPermission("pr.create")) {
            throw new RuntimeException("Bạn không có quyền tạo PR từ MR");
        }

        var mr = mrRepository.findById(mrId)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with id: " + mrId));
        if (!"APPROVED".equals(mr.getStatus())) {
            throw new RuntimeException("MR chưa được duyệt");
        }
        prDetails.setProjectCode(mr.getProjectCode());
        prDetails.setProjectName(mr.getProjectName());
        prDetails.setItems(mr.getItems());
        prDetails.setMrId(mr.getId());
        return create(prDetails);
    }

    // ===== UPDATE =====
    @Transactional
    public PR update(Long id, PR details) {
        PR pr = getById(id);

        if (!currentUserUtil.hasPermission("pr.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa PR");
        }

        if (!"DRAFT".equals(pr.getStatus()) && !"PENDING".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa PR ở trạng thái DRAFT hoặc PENDING");
        }
        pr.setProjectCode(details.getProjectCode());
        pr.setProjectName(details.getProjectName());
        pr.setVendorCode(details.getVendorCode());
        pr.setVendorName(details.getVendorName());
        pr.setItems(details.getItems());
        pr.setNote(details.getNote());
        pr.setUpdatedAt(LocalDate.now());
        return prRepository.save(pr);
    }

    // ===== SUBMIT =====
    @Transactional
    public void submit(Long id) {
        PR pr = getById(id);

        if (!currentUserUtil.hasPermission("pr.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt PR");
        }

        if (!"DRAFT".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt PR ở trạng thái DRAFT");
        }
        pr.setStatus("PENDING");
        pr.setApprovalStep(1);
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    // ===== APPROVE (SỬ DỤNG WORKFLOW ĐỘNG - 3 BƯỚC) =====
    @Transactional
    public void approve(Long id) {
        PR pr = getById(id);
        if (!"PENDING".equals(pr.getStatus())) {
            throw new RuntimeException("PR không ở trạng thái chờ duyệt");
        }

        // Lấy steps từ workflow đang active của module "pr"
        List<Map<String, Object>> steps = workflowService.getStepsByModule("pr");
        int currentStep = pr.getApprovalStep() != null ? pr.getApprovalStep() : 1;

        Map<String, Object> step = steps.stream()
                .filter(s -> (int) s.get("step") == currentStep)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bước duyệt " + currentStep));

        String requiredRole = (String) step.get("role");
        Integer requiredDeptId = step.get("departmentId") != null ? (Integer) step.get("departmentId") : null;

        User currentUser = currentUserUtil.getCurrentUser();

        // Kiểm tra role và department theo workflow
        if (!currentUser.getRole().equals(requiredRole)) {
            throw new RuntimeException("Bạn không có quyền duyệt bước này (yêu cầu role: " + requiredRole + ")");
        }
        if (requiredDeptId != null && (currentUser.getDepartmentId() == null ||
                !currentUser.getDepartmentId().equals(Long.valueOf(requiredDeptId)))) {
            throw new RuntimeException("Bạn không thuộc phòng ban được chỉ định để duyệt");
        }

        // Kiểm tra user permission (ghi đè role nếu có)
        if (!currentUserUtil.hasPermission("pr.approve")) {
            throw new RuntimeException("Bạn không có quyền duyệt PR (user permission)");
        }

        if (currentStep == steps.size()) {
            pr.setStatus("APPROVED");
        } else {
            pr.setApprovalStep(currentStep + 1);
            pr.setStatus("PENDING");
        }
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    // ===== REJECT =====
    @Transactional
    public void reject(Long id) {
        PR pr = getById(id);
        if (!"PENDING".equals(pr.getStatus())) {
            throw new RuntimeException("PR không ở trạng thái chờ duyệt");
        }

        if (!currentUserUtil.hasPermission("pr.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối PR");
        }

        pr.setStatus("REJECTED");
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        PR pr = getById(id);
        if (!"DRAFT".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa PR ở trạng thái DRAFT");
        }

        if (!currentUserUtil.hasPermission("pr.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa PR");
        }

        prRepository.delete(pr);
    }
}