package com.mep.mepbackend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MinStockDTO {
    private Long id;
    private Long warehouseId;
    private Long itemId;
    private BigDecimal minQuantity;
    private LocalDate updatedAt;
}