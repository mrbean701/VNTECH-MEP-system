package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.MR;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.MRRepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Service quản lý Material Request (MR) - Sử dụng workflow động
 */
@Service
@RequiredArgsConstructor
public class MRService {

    private final MRRepository mrRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowService workflowService;
    private final CurrentUserUtil currentUserUtil;

    // ===== GETTERS =====
    public List<MR> getAll() {
        return mrRepository.findAll();
    }

    public MR getById(Long id) {
        return mrRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with id: " + id));
    }

    public MR getByCode(String code) {
        return mrRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with code: " + code));
    }

    public List<MR> getByProjectCode(String projectCode) {
        return mrRepository.findByProjectCode(projectCode);
    }

    public List<MR> getByStatus(String status) {
        return mrRepository.findByStatus(status);
    }

    public List<MR> getByCreatedBy(Long createdBy) {
        return mrRepository.findByCreatedBy(createdBy);
    }

    // ===== CREATE =====
    @Transactional
    public MR create(MR mr) {
        // Kiểm tra quyền tạo MR
        if (!currentUserUtil.hasPermission("mr.create")) {
            throw new RuntimeException("Bạn không có quyền tạo MR");
        }

        long count = mrRepository.count();
        String nextCode = "MR-" + String.format("%03d", count + 1);
        if (mrRepository.existsByCode(nextCode)) {
            long i = count + 2;
            while (mrRepository.existsByCode("MR-" + String.format("%03d", i))) i++;
            nextCode = "MR-" + String.format("%03d", i);
        }
        mr.setCode(nextCode);
        mr.setStatus("DRAFT");
        mr.setApprovalStep(1);
        mr.setCreatedAt(LocalDate.now());
        return mrRepository.save(mr);
    }

    // ===== UPDATE =====
    @Transactional
    public MR update(Long id, MR details) {
        MR mr = getById(id);

        // Kiểm tra quyền sửa
        if (!currentUserUtil.hasPermission("mr.edit")) {
            throw new RuntimeException("Bạn không có quyền sửa MR");
        }

        if (!"DRAFT".equals(mr.getStatus()) && !"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa MR ở trạng thái DRAFT hoặc PENDING");
        }
        mr.setProjectCode(details.getProjectCode());
        mr.setProjectName(details.getProjectName());
        mr.setItems(details.getItems());
        mr.setNeedDate(details.getNeedDate());
        mr.setPurpose(details.getPurpose());
        mr.setRequester(details.getRequester());
        mr.setNote(details.getNote());
        mr.setUpdatedAt(LocalDate.now());
        return mrRepository.save(mr);
    }

    // ===== SUBMIT =====
    @Transactional
    public void submit(Long id) {
        MR mr = getById(id);

        if (!currentUserUtil.hasPermission("mr.submit")) {
            throw new RuntimeException("Bạn không có quyền gửi duyệt MR");
        }

        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt MR ở trạng thái DRAFT");
        }
        mr.setStatus("PENDING");
        mr.setApprovalStep(1);
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    // ===== APPROVE (SỬ DỤNG WORKFLOW ĐỘNG) =====
    @Transactional
    public void approve(Long id) {
        MR mr = getById(id);
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("MR không ở trạng thái chờ duyệt");
        }

        // Lấy steps từ workflow đang active của module "mr"
        List<Map<String, Object>> steps = workflowService.getStepsByModule("mr");
        int currentStep = mr.getApprovalStep() != null ? mr.getApprovalStep() : 1;

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
        if (!currentUserUtil.hasPermission("mr.approve")) {
            throw new RuntimeException("Bạn không có quyền duyệt MR (user permission)");
        }

        // Kiểm tra nếu đã duyệt xong bước cuối cùng
        if (currentStep == steps.size()) {
            mr.setStatus("APPROVED");
        } else {
            mr.setApprovalStep(currentStep + 1);
            mr.setStatus("PENDING");
        }
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    // ===== REJECT =====
    @Transactional
    public void reject(Long id) {
        MR mr = getById(id);
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("MR không ở trạng thái chờ duyệt");
        }

        if (!currentUserUtil.hasPermission("mr.reject")) {
            throw new RuntimeException("Bạn không có quyền từ chối MR");
        }

        mr.setStatus("REJECTED");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    // ===== DELETE =====
    @Transactional
    public void delete(Long id) {
        MR mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa MR ở trạng thái DRAFT");
        }

        if (!currentUserUtil.hasPermission("mr.delete")) {
            throw new RuntimeException("Bạn không có quyền xóa MR");
        }

        mrRepository.delete(mr);
    }
}