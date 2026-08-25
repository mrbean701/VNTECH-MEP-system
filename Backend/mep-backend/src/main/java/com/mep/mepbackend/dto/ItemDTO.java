package com.mep.mepbackend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ItemDTO {
    private Long id;
    private String code;
    private String name;
    private String itemGroup;
    private String model;
    private String unit;
    private BigDecimal standardPrice;
    private String status;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}