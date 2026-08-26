package com.mep.mepbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepDTO {
    private Integer step;
    private String role;
    private String label;
    private Long departmentId; // Có thể null nếu không giới hạn phòng ban
}