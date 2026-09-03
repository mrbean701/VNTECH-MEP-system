package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity đại diện cho bảng vendor_groups.
 * Lưu trữ các nhóm hàng của nhà cung cấp (1 vendor có nhiều group).
 */
@Entity
@Table(name = "vendor_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của nhà cung cấp
     */
    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    /**
     * Tên nhóm hàng (VD: Thép, Điện, VLXD, ...)
     */
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}