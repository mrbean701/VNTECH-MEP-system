package com.mep.mepbackend.dto;

import com.mep.mepbackend.entity.WorkflowProgress;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowProgressDTO {

    private Long id;
    private String entityType;
    private Long entityId;
    private Long workflowId;
    private Integer currentStep;
    private Integer totalSteps;
    private Integer approvalStep;
    private String status;
    private Boolean isActive;
    private Boolean isApproved;
    private Boolean isCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Chuyển từ Entity sang DTO
     */
    public static WorkflowProgressDTO fromEntity(WorkflowProgress entity) {
        if (entity == null) return null;
        return new WorkflowProgressDTO(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getWorkflowId(),
                entity.getCurrentStep(),
                entity.getTotalSteps(),
                entity.getApprovalStep(),
                entity.getStatus(),
                entity.getIsActive(),
                entity.getIsApproved(),
                entity.getIsCompleted(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}