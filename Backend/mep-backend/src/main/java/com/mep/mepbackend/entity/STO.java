package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "sto")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class STO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private Long fromWarehouseId;
    private Long toWarehouseId;
    private String projectCode;
    private String projectName;
    @Column(columnDefinition = "JSON")
    private String items;
    private LocalDate transferDate;
    private String requestedBy;
    private String approvedBy;
    private String warehouseStaff;
    private String transporter;
    private String departureTime;
    private String status;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    @Column(name = "workflow_id")
    private Long workflowId;

    @Column(name = "approval_step")
    private Integer approvalStep;

    // ✅ Thêm 2 trường này
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_by_name", length = 100)
    private String createdByName;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;
}