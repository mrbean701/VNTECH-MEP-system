package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "project_code", nullable = false, length = 50)
    private String projectCode;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "date")
    private LocalDate date;

    @Column(length = 200)
    private String area;

    @Column(length = 100)
    private String team;

    @Column(length = 100)
    private String requester;

    @Column(columnDefinition = "JSON")
    private String items; // JSON: [{itemId, requestedQty, actualQty, condition}]

    @Column(length = 20)
    private String status; // DRAFT, PENDING, APPROVED, COMPLETED, CONFIRMED, REJECTED

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_by_name", length = 100)
    private String createdByName;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "completed_by", length = 100)
    private String completedBy;

    @Column(name = "confirmed_by", length = 100)
    private String confirmedBy;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "workflow_id")
    private Long workflowId;

    @Column(name = "approval_step")
    private Integer approvalStep; // ✅ Thêm trường này

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;
}