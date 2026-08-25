package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DepartmentDTO {
    private Long id;
    private String code;
    private String name;
    private Long managerId;
    private String managerName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}