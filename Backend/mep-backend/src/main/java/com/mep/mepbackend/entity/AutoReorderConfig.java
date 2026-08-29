package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "auto_reorder_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AutoReorderConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Boolean enabled = false;

    @Column(precision = 5, scale = 2)
    private BigDecimal multiplier = BigDecimal.valueOf(2.0);

    @Column(name = "default_vendor_code", length = 50)
    private String defaultVendorCode;

    // === Các trường mới (Giai đoạn 1) ===
    @Column(length = 100)
    private String schedule; // Lưu cron expression hoặc ngày giờ cụ thể

    @Column(columnDefinition = "TEXT")
    private String note; // Ghi chú tùy chỉnh của người dùng

    @Column(name = "created_by")
    private Long createdBy; // ID của người cấu hình

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}