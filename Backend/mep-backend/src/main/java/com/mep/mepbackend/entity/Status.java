package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Status {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "is_final")
    private Boolean isFinal = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(length = 20)
    private String color;

    // ✅ Đổi tên trường và cột
    @Column(name = "status_group", length = 50)
    private String statusGroup;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    // Constructor tiện ích (cập nhật tham số)
    public Status(String entityType, String name, String code, String description,
                  Boolean isDefault, Boolean isFinal, Integer sortOrder, String color, String statusGroup) {
        this.entityType = entityType;
        this.name = name;
        this.code = code;
        this.description = description;
        this.isDefault = isDefault != null ? isDefault : false;
        this.isFinal = isFinal != null ? isFinal : false;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.color = color;
        this.statusGroup = statusGroup;
        this.createdAt = LocalDate.now();
        this.updatedAt = LocalDate.now();
    }
}