package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "pr")
@Data
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
    private Integer approvalStep;
    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String note;
}