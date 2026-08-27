package com.mep.mepbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepStatusDTO {

    private Long id;
    private Long workflowId;
    private Integer step;
    private String statusCode;
}