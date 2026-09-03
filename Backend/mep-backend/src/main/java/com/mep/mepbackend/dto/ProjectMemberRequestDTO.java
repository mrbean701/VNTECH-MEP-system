package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectMemberRequestDTO {

    private Long projectId;   // ✅ Trường này đã có
    private Long userId;
    private String role;
    private LocalDate joinedAt;
    private LocalDate leftAt;

    
}