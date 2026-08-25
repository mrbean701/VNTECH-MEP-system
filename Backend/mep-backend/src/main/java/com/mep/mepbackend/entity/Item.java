package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "items")
@Data
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private String name;
    private String itemGroup;
    private String model;
    private String unit;
    private BigDecimal standardPrice;
    private String status; // ACTIVE, INACTIVE
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}