package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class WarehouseDTO {
    private Long id;
    private String code;
    private String name;
    private String type;
    private Long projectId;
    private String manager;
    private String address;
    private String status;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}