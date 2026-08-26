package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity Workflow - Lưu cấu hình luồng duyệt cho từng module.
 * Hỗ trợ nhiều mẫu (templates) cho cùng một module.
 */
@Entity
@Table(name = "workflows")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Workflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Module áp dụng: mr, pr, po, grn, sto, issue, materialreturn
     * KHÔNG UNIQUE nữa - cho phép nhiều mẫu cho cùng module
     */
    @Column(nullable = false, length = 50)
    private String module;

    /**
     * Tên của mẫu quy trình (VD: "Quy trình 3 bước mặc định")
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Mô tả chi tiết về quy trình
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Các bước duyệt dạng JSON
     * Format: [{"step":1,"role":"PLANNING","label":"Kế hoạch duyệt","departmentId":2}, ...]
     */
    @Column(columnDefinition = "JSON", nullable = false)
    private String steps;

    /**
     * Trạng thái áp dụng: TRUE nếu đang được sử dụng
     * Mỗi module chỉ có DUY NHẤT 1 bản ghi isActive = TRUE
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    /**
     * Mẫu hệ thống: TRUE nếu do hệ thống tạo sẵn
     * Mẫu hệ thống không cho xóa, chỉ cho phép copy
     */
    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    /**
     * Constructor tiện ích cho DataInitializer
     */
    public Workflow(String module, String name, String description, String steps, Boolean isSystem, Boolean isActive) {
        this.module = module;
        this.name = name;
        this.description = description;
        this.steps = steps;
        this.isSystem = isSystem != null ? isSystem : false;
        this.isActive = isActive != null ? isActive : false;
        this.createdAt = LocalDate.now();
        this.updatedAt = LocalDate.now();
    }

    /**
     * Constructor tiện ích cho DataInitializer (ngắn gọn)
     */
    public Workflow(String module, String name, String steps) {
        this(module, name, null, steps, false, false);
    }
}