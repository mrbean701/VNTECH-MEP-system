package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "auto_reorder_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AutoReorderRule {

    @Id
    @Column(length = 50)
    private String id; // Sử dụng ID tự sinh từ frontend (dạng ar_xxx)

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_name", length = 200)
    private String itemName;

    @Column(length = 20)
    private String unit;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(name = "min_stock", precision = 15, scale = 2)
    private BigDecimal minStock;

    @Column(name = "reorder_quantity", precision = 15, scale = 2)
    private BigDecimal reorderQuantity;

    @Column(name = "vendor_id", length = 50)
    private String vendorId;

    @Column(name = "order_type", length = 20)
    private String orderType; // PR, PO

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}