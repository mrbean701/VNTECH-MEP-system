package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "warehouses")
@Data
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
}