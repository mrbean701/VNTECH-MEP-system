package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "mr")
@Data
public class MR {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private String projectCode;
    private String projectName;
    @Column(columnDefinition = "JSON")
    private String items; // Lưu JSON
    private LocalDate needDate;
    private String purpose;
    private String requester;
    private String status; // DRAFT, PENDING, APPROVED, REJECTED
    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String note;
}