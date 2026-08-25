package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectDTO {
    private Long id;
    private String code;
    private String name;
    private String client;
    private String commander;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}