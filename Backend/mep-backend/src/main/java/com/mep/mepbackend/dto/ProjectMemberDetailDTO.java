package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO mở rộng cho ProjectMember, bao gồm thông tin user, department,
 * dùng khi hiển thị danh sách thành viên trong dự án.
 */
@Data
public class ProjectMemberDetailDTO {

    // Thông tin từ project_members
    private Long id;
    private Long projectId;
    private Long userId;
    private String role;               // Vai trò trong dự án
    private LocalDate joinedAt;
    private LocalDate leftAt;
    private Boolean isActive;          // leftAt == null → true

    // Thông tin từ users
    private String userName;
    private String userEmail;
    private String userPosition;       // Chức vụ của user
    private String userRole;           // Role hệ thống (ADMIN, CEO, ...)

    // Thông tin từ departments
    private Long departmentId;
    private String departmentName;

    // Thông tin từ projects (dùng khi hiển thị theo user)
    private String projectCode;
    private String projectName;
    private String projectStatus;
}