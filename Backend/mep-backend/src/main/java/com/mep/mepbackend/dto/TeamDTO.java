package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO cho Team, dùng để trao đổi dữ liệu với client.
 */
@Data
public class TeamDTO {

    private Long id;
    private String name;
    private String description;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    // Thêm các trường thống kê (không lưu DB)
    private Integer memberCount;        // Số thành viên hiện tại (chưa rời)
    private Integer totalMemberCount;   // Tổng số thành viên (kể cả đã rời)
}