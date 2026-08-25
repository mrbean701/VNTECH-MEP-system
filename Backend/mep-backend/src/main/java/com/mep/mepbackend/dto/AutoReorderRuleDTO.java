package com.mep.mepbackend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AutoReorderRuleDTO {
    private String id;
    private Long itemId;
    private String itemName;
    private String unit;
    private Long warehouseId;
    private BigDecimal minStock;
    private BigDecimal reorderQuantity;
    private String vendorId;
    private String orderType;
    private Boolean enabled;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}