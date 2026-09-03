package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity đại diện cho bảng project_members.
 * Lưu trữ quan hệ giữa user và project, kèm vai trò, thời gian tham gia/rời.
 */
@Entity
@Table(name = "project_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của project mà user tham gia
     */
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    /**
     * ID của user
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * Vai trò của user trong project (VD: Project Manager, Engineer, ...)
     */
    @Column(length = 100)
    private String role;

    /**
     * Ngày bắt đầu tham gia dự án
     */
    @Column(name = "joined_at")
    private LocalDate joinedAt;

    /**
     * Ngày rời dự án (null nếu chưa rời)
     */
    @Column(name = "left_at")
    private LocalDate leftAt;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}