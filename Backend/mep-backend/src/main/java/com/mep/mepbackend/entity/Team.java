package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity đại diện cho bảng teams.
 * Team là một nhóm người dùng từ nhiều phòng ban khác nhau, không phụ thuộc vào department.
 */
@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tên của team (bắt buộc, duy nhất theo logic nhưng không có ràng buộc UNIQUE ở DB để linh hoạt)
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Mô tả chi tiết về team
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    private LocalDate updatedAt;
}