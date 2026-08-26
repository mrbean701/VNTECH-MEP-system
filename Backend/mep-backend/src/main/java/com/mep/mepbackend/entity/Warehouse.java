package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "warehouses")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private String name;
    private String type; // CENTRAL, SITE
    private Long projectId;
    private String manager;
    private String address;
    private String status; // ACTIVE, INACTIVE
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    public Warehouse(Long id, String code, String name, String type, Long projectId, String manager, String address, String status, String note, LocalDate createdAt, LocalDate updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.type = type;
        this.projectId = projectId;
        this.manager = manager;
        this.address = address;
        this.status = status;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}