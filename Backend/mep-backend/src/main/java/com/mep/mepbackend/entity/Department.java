package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
@AllArgsConstructor // ✅ Thêm nếu cần
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private String name;
    private Long managerId;
    private String managerName;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    public Department(Object o, String bgd, String banGiámĐốc, long l, String admin, LocalDate now, Object o1) {
    }
}