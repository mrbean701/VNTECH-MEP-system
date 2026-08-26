package com.mep.mepbackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Service quản lý workflow động - Hỗ trợ đa mẫu (templates).
 */
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final ObjectMapper objectMapper;

    // ===== GETTERS =====

    /**
     * Lấy tất cả workflow (tất cả module, tất cả mẫu).
     */
    public List<Workflow> getAll() {
        return workflowRepository.findAll();
    }

    /**
     * Lấy workflow theo ID.
     */
    public Workflow getById(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
    }

    /**
     * Lấy tất cả workflow của một module.
     */
    public List<Workflow> getByModule(String module) {
        return workflowRepository.findByModule(module);
    }

    /**
     * Lấy workflow đang active của một module.
     * Mỗi module chỉ có DUY NHẤT 1 workflow active.
     */
    public Workflow getActiveWorkflow(String module) {
        return workflowRepository.findByModuleAndIsActiveTrue(module)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy workflow active cho module: " + module
                ));
    }

    /**
     * Lấy steps của workflow đang active (dùng trong các service nghiệp vụ).
     */
    public List<Map<String, Object>> getStepsByModule(String module) {
        Workflow wf = getActiveWorkflow(module);
        try {
            return objectMapper.readValue(wf.getSteps(), new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Lỗi parse steps của workflow: " + e.getMessage());
        }
    }

    /**
     * Kiểm tra xem module đã có workflow active chưa.
     */
    public boolean hasActiveWorkflow(String module) {
        return workflowRepository.existsByModuleAndIsActiveTrue(module);
    }

    // ===== CREATE =====

    /**
     * Tạo mới một workflow template.
     * Mặc định isActive = false, isSystem = false.
     * Nếu module chưa có workflow nào, tự động active template này.
     */
    @Transactional
    public Workflow create(Workflow workflow) {
        // Kiểm tra trùng tên trong cùng module
        if (workflowRepository.existsByModuleAndName(workflow.getModule(), workflow.getName())) {
            throw new RuntimeException("Đã tồn tại workflow với tên '" + workflow.getName() + "' trong module " + workflow.getModule());
        }

        workflow.setIsActive(false);
        workflow.setIsSystem(false);
        workflow.setCreatedAt(LocalDate.now());
        workflow.setUpdatedAt(LocalDate.now());

        Workflow saved = workflowRepository.save(workflow);

        // Nếu chưa có workflow active nào trong module, tự động active template mới
        if (!workflowRepository.existsByModuleAndIsActiveTrue(workflow.getModule())) {
            activateWorkflow(workflow.getModule(), saved.getId());
        }

        return saved;
    }

    // ===== UPDATE =====

    /**
     * Cập nhật workflow (chỉ sửa name, description, steps).
     * KHÔNG cho sửa isActive và isSystem ở đây.
     */
    @Transactional
    public Workflow update(Long id, Workflow details) {
        Workflow wf = getById(id);
        wf.setName(details.getName());
        wf.setDescription(details.getDescription());
        wf.setSteps(details.getSteps());
        wf.setUpdatedAt(LocalDate.now());
        return workflowRepository.save(wf);
    }

    // ===== ACTIVATE =====

    /**
     * Kích hoạt một workflow của module.
     * Tất cả workflow khác trong cùng module sẽ bị deactivate.
     */
    @Transactional
    public void activateWorkflow(String module, Long id) {
        // Lấy workflow cần active
        Workflow toActivate = getById(id);
        if (!toActivate.getModule().equals(module)) {
            throw new RuntimeException("Workflow không thuộc module " + module);
        }

        // Deactivate tất cả workflow khác trong module
        List<Workflow> allInModule = workflowRepository.findByModule(module);
        for (Workflow wf : allInModule) {
            if (!wf.getId().equals(id) && wf.getIsActive()) {
                wf.setIsActive(false);
                wf.setUpdatedAt(LocalDate.now());
                workflowRepository.save(wf);
            }
        }

        // Activate workflow được chọn
        toActivate.setIsActive(true);
        toActivate.setUpdatedAt(LocalDate.now());
        workflowRepository.save(toActivate);
    }

    // ===== DUPLICATE =====

    /**
     * Sao chép một workflow hiện có thành template mới.
     * Template mới có isActive = false, isSystem = false.
     * Thêm hậu tố " (Copy)" vào tên.
     */
    @Transactional
    public Workflow duplicate(Long id) {
        Workflow original = getById(id);

        Workflow copy = new Workflow();
        copy.setModule(original.getModule());
        copy.setName(original.getName() + " (Copy)");
        copy.setDescription(original.getDescription());
        copy.setSteps(original.getSteps());
        copy.setIsActive(false);
        copy.setIsSystem(false);
        copy.setCreatedAt(LocalDate.now());
        copy.setUpdatedAt(LocalDate.now());

        // Nếu tên đã tồn tại, thêm số thứ tự
        String baseName = copy.getName();
        int counter = 1;
        while (workflowRepository.existsByModuleAndName(copy.getModule(), copy.getName())) {
            copy.setName(baseName + " " + (counter++));
        }

        return workflowRepository.save(copy);
    }

    // ===== DELETE =====

    /**
     * Xóa workflow.
     * Chỉ cho xóa nếu: KHÔNG phải mẫu hệ thống (isSystem = false) và KHÔNG đang active (isActive = false).
     */
    @Transactional
    public void delete(Long id) {
        Workflow wf = getById(id);
        if (wf.getIsSystem()) {
            throw new RuntimeException("Không thể xóa workflow hệ thống. Bạn có thể sao chép và chỉnh sửa bản sao.");
        }
        if (wf.getIsActive()) {
            throw new RuntimeException("Không thể xóa workflow đang được áp dụng. Hãy chọn workflow khác làm active trước.");
        }
        workflowRepository.delete(wf);
    }

    /**
     * Xóa tất cả workflow của một module (dùng trong reset/test).
     */
    @Transactional
    public void deleteByModule(String module) {
        workflowRepository.deleteByModule(module);
    }
}