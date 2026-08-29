package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // MR, PR, PO, GRN, STO, ISSUE, MATERIAL_RETURN

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "workflow_id")
    private Long workflowId;

    @Column(name = "step", nullable = false)
    private Integer step;

    @Column(name = "approver_id")
    private Long approverId;

    @Column(name = "approver_name", length = 100)
    private String approverName;

    @Column(name = "status_before", length = 50)
    private String statusBefore;

    @Column(name = "status_after", length = 50)
    private String statusAfter;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "approved_at", updatable = false)
    private LocalDateTime approvedAt;
}