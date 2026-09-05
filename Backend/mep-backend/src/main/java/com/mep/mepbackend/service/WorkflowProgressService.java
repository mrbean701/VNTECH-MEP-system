package com.mep.mepbackend.service;

import com.mep.mepbackend.dto.WorkflowProgressDTO;
import com.mep.mepbackend.entity.WorkflowProgress;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.WorkflowProgressRepository;
import com.mep.mepbackend.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowProgressService {

    private final WorkflowProgressRepository progressRepository;
    private final WorkflowRepository workflowRepository;

    /**
     * Khởi tạo tiến trình workflow cho đơn hàng mới (DRAFT)
     */
    @Transactional
    public WorkflowProgress initProgress(String entityType, Long entityId, Long workflowId) {
        // Kiểm tra workflow tồn tại
        Workflow wf = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));

        // Lấy số bước
        int totalSteps = wf.getSteps() != null ? wf.getSteps().split("\"step\"").length - 1 : 0;
        if (totalSteps < 1) {
            throw new RuntimeException("Workflow không có bước duyệt nào");
        }

        // Xóa bản ghi cũ nếu có (phòng trường hợp khởi tạo lại)
        progressRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .ifPresent(progressRepository::delete);

        // Tạo bản ghi mới
        WorkflowProgress progress = new WorkflowProgress();
        progress.setEntityType(entityType);
        progress.setEntityId(entityId);
        progress.setWorkflowId(workflowId);
        progress.setTotalSteps(totalSteps);
        progress.setCurrentStep(0);          // DRAFT -> chưa bắt đầu
        progress.setApprovalStep(0);
        progress.setStatus("DRAFT");
        progress.setIsActive(false);
        progress.setIsApproved(false);
        progress.setIsCompleted(false);

        return progressRepository.save(progress);
    }

    /**
     * Lấy tiến trình của một đơn hàng
     */
    public WorkflowProgress getProgress(String entityType, Long entityId) {
        return progressRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Workflow progress not found for " + entityType + " " + entityId));
    }

    public WorkflowProgressDTO getProgressDTO(String entityType, Long entityId) {
        return WorkflowProgressDTO.fromEntity(getProgress(entityType, entityId));
    }

    /**
     * Cập nhật tiến trình khi submit (DRAFT → PENDING, bắt đầu workflow)
     */
    @Transactional
    public WorkflowProgress submitProgress(String entityType, Long entityId) {
        WorkflowProgress progress = getProgress(entityType, entityId);

        if (!"DRAFT".equals(progress.getStatus())) {
            throw new RuntimeException("Chỉ có thể submit đơn hàng ở trạng thái DRAFT");
        }

        // Bắt đầu workflow: chuyển đến bước 1
        progress.setCurrentStep(1);
        progress.setApprovalStep(0);
        progress.setStatus("PENDING");
        progress.setIsActive(true);
        progress.setIsApproved(false);
        progress.setIsCompleted(false);

        return progressRepository.save(progress);
    }

    /**
     * Cập nhật tiến trình khi duyệt (PENDING → PENDING/APPROVED)
     */
    @Transactional
    public WorkflowProgress approveProgress(String entityType, Long entityId) {
        WorkflowProgress progress = getProgress(entityType, entityId);

        if (!"PENDING".equals(progress.getStatus())) {
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ duyệt");
        }
        if (progress.getIsApproved()) {
            throw new RuntimeException("Đơn hàng đã được duyệt hoàn toàn");
        }

        int currentStep = progress.getCurrentStep();
        int totalSteps = progress.getTotalSteps();

        if (currentStep < 1 || currentStep > totalSteps) {
            throw new RuntimeException("Bước duyệt không hợp lệ: " + currentStep);
        }

        // Tăng số bước đã duyệt
        int newApprovalStep = progress.getApprovalStep() + 1;
        progress.setApprovalStep(newApprovalStep);

        if (newApprovalStep == totalSteps) {
            // Đã duyệt xong tất cả bước
            progress.setIsApproved(true);
            progress.setStatus("APPROVED");
            progress.setCurrentStep(totalSteps); // hoặc 0 tùy cách hiểu
            // isActive vẫn true, nhưng sẽ được set false khi hoàn thành (COMPLETED)
        } else {
            // Vẫn còn bước tiếp theo
            progress.setCurrentStep(newApprovalStep + 1);
            progress.setStatus("PENDING");
            progress.setIsApproved(false);
        }

        return progressRepository.save(progress);
    }

    /**
     * Cập nhật tiến trình khi từ chối (PENDING → REJECTED)
     */
    @Transactional
    public WorkflowProgress rejectProgress(String entityType, Long entityId) {
        WorkflowProgress progress = getProgress(entityType, entityId);

        if (!"PENDING".equals(progress.getStatus())) {
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ duyệt");
        }

        progress.setStatus("REJECTED");
        progress.setIsActive(false);
        progress.setIsApproved(false);

        return progressRepository.save(progress);
    }

    /**
     * Đánh dấu đơn hàng đã hoàn thành (COMPLETED)
     */
    @Transactional
    public WorkflowProgress completeProgress(String entityType, Long entityId) {
        WorkflowProgress progress = getProgress(entityType, entityId);

        // Chỉ cho phép complete nếu đã APPROVED hoặc đang ở APPROVED
        if (!"APPROVED".equals(progress.getStatus()) && !progress.getIsApproved()) {
            throw new RuntimeException("Đơn hàng chưa được duyệt, không thể đánh dấu hoàn thành");
        }

        progress.setStatus("COMPLETED");
        progress.setIsActive(false);
        progress.setIsCompleted(true);

        return progressRepository.save(progress);
    }

    /**
     * Lấy danh sách tiến trình theo trạng thái
     */
    public List<WorkflowProgressDTO> getByStatus(String entityType, String status) {
        return progressRepository.findByEntityTypeAndStatus(entityType, status)
                .stream()
                .map(WorkflowProgressDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Kiểm tra đơn hàng có tiến trình không
     */
    public boolean exists(String entityType, Long entityId) {
        return progressRepository.existsByEntityTypeAndEntityId(entityType, entityId);
    }

    // Thêm vào class WorkflowProgressService
    public List<WorkflowProgressDTO> getActiveProgress(String entityType) {
        return progressRepository.findByEntityTypeAndIsActiveTrue(entityType)
                .stream()
                .map(WorkflowProgressDTO::fromEntity)
                .collect(Collectors.toList());
    }
}