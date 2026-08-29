package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "min_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MinStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "min_quantity", precision = 15, scale = 2)
    private BigDecimal minQuantity;

    // === Các trường mới (Giai đoạn 1) ===
    @Column(name = "safe_quantity", precision = 15, scale = 2)
    private BigDecimal safeQuantity;

    @Column(name = "alert_percent", precision = 5, scale = 2)
    private BigDecimal alertPercent;

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}