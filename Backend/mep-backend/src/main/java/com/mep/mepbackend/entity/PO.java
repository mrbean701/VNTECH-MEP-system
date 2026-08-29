package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "po")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "pr_id")
    private Long prId;

    @Column(name = "workflow_id")
    private Long workflowId;

    @Column(name = "project_code", nullable = false, length = 50)
    private String projectCode;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "vendor_code", length = 50)
    private String vendorCode;

    @Column(name = "vendor_name", length = 200)
    private String vendorName;

    @Column(columnDefinition = "JSON")
    private String items;

    @Column(length = 20)
    private String status;

    @Column(name = "approval_step")
    private Integer approvalStep; // ✅ Đã sửa từ int → Integer

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_by_name", length = 100)
    private String createdByName;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @Column(columnDefinition = "TEXT")
    private String note;
}