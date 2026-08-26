package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "pr")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
@AllArgsConstructor // ✅ Thêm nếu cần
public class PR {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private Long mrId;
    private String projectCode;
    private String projectName;
    private String vendorCode;
    private String vendorName;

    @Column(columnDefinition = "JSON")
    private String items;

    private String status;

    @Column(name = "approval_step")
    private Integer approvalStep; // ✅ Đã sửa từ int → Integer

    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String note;
}