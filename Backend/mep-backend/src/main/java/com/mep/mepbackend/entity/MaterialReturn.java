package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "material_returns")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "project_code", nullable = false, length = 50)
    private String projectCode;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "return_from", length = 200)
    private String returnFrom;

    @Column(columnDefinition = "JSON")
    private String items; // JSON: [{itemId, requestedQty, actualQty, condition, note}]

    @Column(length = 100)
    private String returner;

    @Column(length = 20)
    private String status; // DRAFT, PENDING, APPROVED, CONFIRMED, REJECTED

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

    @Column(name = "confirmed_by", length = 100)
    private String confirmedBy;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(columnDefinition = "TEXT")
    private String note;
}