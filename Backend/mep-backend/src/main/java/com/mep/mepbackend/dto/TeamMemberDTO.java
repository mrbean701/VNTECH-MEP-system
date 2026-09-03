package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO cho TeamMember, dùng khi thêm/xóa thành viên team.
 */
@Data
public class TeamMemberDTO {

    private Long id;
    private Long teamId;
    private Long userId;
    private String role;
    private LocalDate joinedAt;
    private LocalDate leftAt;

    // Thông tin bổ sung từ User (để hiển thị)
    private String userName;
    private String userEmail;
    private String userPosition;
    private String departmentName;
}