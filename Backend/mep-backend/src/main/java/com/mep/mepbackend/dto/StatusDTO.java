package com.mep.mepbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusDTO {

    private Long id;
    private String entityType;
    private String name;
    private String code;
    private String description;
    private Boolean isDefault;
    private Boolean isFinal;
    private Integer sortOrder;
    private String color;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}