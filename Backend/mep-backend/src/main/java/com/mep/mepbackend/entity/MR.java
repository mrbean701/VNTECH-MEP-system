package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "mr")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
@AllArgsConstructor // ✅ Thêm nếu cần
public class MR {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private String projectCode;
    private String projectName;

    @Column(columnDefinition = "JSON")
    private String items;

    private LocalDate needDate;
    private String purpose;
    private String requester;

    private String status; // DRAFT, PENDING, APPROVED, REJECTED

    @Column(name = "approval_step")
    private Integer approvalStep; // ✅ Đã sửa từ int → Integer

    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String note;
}