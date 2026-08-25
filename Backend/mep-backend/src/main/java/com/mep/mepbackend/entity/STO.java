package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "sto")
@Data
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
    private String status; // DRAFT, PENDING, APPROVED, COMPLETED, CANCELLED
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}