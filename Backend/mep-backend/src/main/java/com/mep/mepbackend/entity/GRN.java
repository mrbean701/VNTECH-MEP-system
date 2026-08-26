package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "grn")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
@AllArgsConstructor // ✅ Thêm nếu cần
public class GRN {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private Long poId;
    private String projectCode;
    private String projectName;
    private Long warehouseId;
    private String vendorCode;
    private String vendorName;
    @Column(columnDefinition = "JSON")
    private String items;
    private LocalDate receiptDate;
    private String receiver;
    private String warehouseStaff;
    private String qcConfirm;
    private String accountantConfirm;
    private String invoice;
    private String status; // DRAFT, RECEIVED, QC_CHECKED, COMPLETED, REJECTED, CANCELLED
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}