package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity đại diện cho bảng team_members.
 * Lưu trữ quan hệ giữa user và team, kèm vai trò trong team.
 */
@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của team mà user tham gia
     */
    @Column(name = "team_id", nullable = false)
    private Long teamId;

    /**
     * ID của user
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * Vai trò của user trong team (VD: Trưởng nhóm, Thành viên, ...)
     */
    @Column(length = 100)
    private String role;

    /**
     * Ngày tham gia team
     */
    @Column(name = "joined_at")
    private LocalDate joinedAt;

    /**
     * Ngày rời team (null nếu chưa rời)
     */
    @Column(name = "left_at")
    private LocalDate leftAt;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}