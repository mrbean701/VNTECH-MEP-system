package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity lưu trữ các trạng thái tùy chỉnh cho từng loại đối tượng (MR, PR, PO, ...)
 */
@Entity
@Table(name = "statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Status {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Loại đối tượng áp dụng: mr, pr, po, grn, sto, issue, materialreturn
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /**
     * Tên hiển thị của trạng thái (VD: "Chờ duyệt", "Đã duyệt")
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Mã code duy nhất của trạng thái (VD: 'PENDING', 'APPROVED')
     * Dùng để ánh xạ trong code và workflow
     */
    @Column(nullable = false, length = 50, unique = true)
    private String code;

    /**
     * Mô tả chi tiết về trạng thái
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Đánh dấu là trạng thái mặc định khi tạo mới đối tượng
     * Mỗi entity_type chỉ có 1 status is_default = true
     */
    @Column(name = "is_default")
    private Boolean isDefault = false;

    /**
     * Đánh dấu là trạng thái kết thúc (không thể chuyển tiếp sang trạng thái khác)
     * Ví dụ: REJECTED, COMPLETED, CANCELLED
     */
    @Column(name = "is_final")
    private Boolean isFinal = false;

    /**
     * Thứ tự sắp xếp hiển thị
     */
    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    /**
     * Màu sắc hiển thị (mã hex, VD: #22c55e)
     */
    @Column(length = 20)
    private String color;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    /**
     * Constructor tiện ích cho DataInitializer
     */
    public Status(String entityType, String name, String code, String description,
                  Boolean isDefault, Boolean isFinal, Integer sortOrder, String color) {
        this.entityType = entityType;
        this.name = name;
        this.code = code;
        this.description = description;
        this.isDefault = isDefault != null ? isDefault : false;
        this.isFinal = isFinal != null ? isFinal : false;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.color = color;
        this.createdAt = LocalDate.now();
        this.updatedAt = LocalDate.now();
    }
}