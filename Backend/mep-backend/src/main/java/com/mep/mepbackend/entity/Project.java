package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private String name;
    private String client;
    private String commander;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // ACTIVE, INACTIVE
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    public Project(Long id, String code, String name, String client, String commander, LocalDate startDate, LocalDate endDate, String status, String note, LocalDate createdAt, LocalDate updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.client = client;
        this.commander = commander;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}