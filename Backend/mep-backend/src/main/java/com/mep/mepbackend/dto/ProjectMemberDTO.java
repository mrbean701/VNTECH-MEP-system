package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO cơ bản cho ProjectMember, dùng cho CRUD.
 */
@Data
public class ProjectMemberDTO {

    private Long id;
    private Long projectId;
    private Long userId;
    private String role;
    private LocalDate joinedAt;
    private LocalDate leftAt;
}