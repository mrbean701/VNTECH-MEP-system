package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "items")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
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

    public Item(LocalDate updatedAt, LocalDate createdAt, String note, String status, BigDecimal standardPrice, String unit, String model, String itemGroup, String name, String code, Long id) {
        this.updatedAt = updatedAt;
        this.createdAt = createdAt;
        this.note = note;
        this.status = status;
        this.standardPrice = standardPrice;
        this.unit = unit;
        this.model = model;
        this.itemGroup = itemGroup;
        this.name = name;
        this.code = code;
        this.id = id;
    }

    public Item(Long id, String code, String name, String itemGroup, String model, String unit, BigDecimal standardPrice, String status, String note, LocalDate createdAt, LocalDate updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.itemGroup = itemGroup;
        this.model = model;
        this.unit = unit;
        this.standardPrice = standardPrice;
        this.status = status;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}