package com.mep.mepbackend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AutoReorderConfigDTO {
    private Long id;
    private Boolean enabled;
    private BigDecimal multiplier;
    private String defaultVendorCode;
    private LocalDate updatedAt;
}