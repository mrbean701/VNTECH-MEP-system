package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkflowDTO {
    private Long id;
    private String module;
    private String name;
    private String steps; // JSON
    private LocalDate updatedAt;
}