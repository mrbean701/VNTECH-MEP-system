package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "projects")
@Data
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
}