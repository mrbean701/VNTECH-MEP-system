package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "workflows")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Workflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "JSON", nullable = false)
    private String steps;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "DRAFT";  // ✅ Trường này đã có, giữ nguyên

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    // Constructor tiện ích
    public Workflow(String module, String name, String description, String steps, Boolean isSystem, Boolean isActive, String status) {
        this.module = module;
        this.name = name;
        this.description = description;
        this.steps = steps;
        this.isSystem = isSystem != null ? isSystem : false;
        this.isActive = isActive != null ? isActive : false;
        this.status = status != null ? status : "DRAFT";
        this.createdAt = LocalDate.now();
        this.updatedAt = LocalDate.now();
    }

    public Workflow(String module, String name, String steps) {
        this(module, name, null, steps, false, false, "DRAFT");
    }

    public Workflow(String mr, String s, Object o, String mrSteps1, boolean b, boolean b1) {
    }
}