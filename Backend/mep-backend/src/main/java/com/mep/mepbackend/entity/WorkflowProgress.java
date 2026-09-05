package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "workflow_id", nullable = false)
    private Long workflowId;

    @Column(name = "current_step", nullable = false)
    private Integer currentStep = 0;

    @Column(name = "total_steps", nullable = false)
    private Integer totalSteps;

    @Column(name = "approval_step", nullable = false)
    private Integer approvalStep = 0;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}