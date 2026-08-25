package com.mep.mepbackend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InventoryDTO {
    private Long id;
    private Long warehouseId;
    private Long itemId;
    private BigDecimal quantity;
    private LocalDate updatedAt;
}