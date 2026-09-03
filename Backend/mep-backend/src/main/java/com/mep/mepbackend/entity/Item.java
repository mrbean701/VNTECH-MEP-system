package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "items")
@Data
@NoArgsConstructor
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)  // ✅ XÓA unique=true
    private String code;

    @Column(nullable = false)
    private String name;

    private String itemGroup;
    private String model;
    private String unit;
    private BigDecimal standardPrice;
    private String status; // ACTIVE, INACTIVE
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    // ✅ Thêm trường isMain
    @Column(name = "is_main", nullable = false)
    private Boolean isMain = true;  // Mặc định là tên chính

    // ✅ Quan hệ 1-n với chính nó (alias) – không cần thiết nếu ta coi mỗi bản ghi là một tên
    // Ta sẽ xử lý bằng cách query theo code và lấy danh sách

    // Constructor tiện ích
    public Item(Long id, String code, String name, String itemGroup, String model, String unit,
                BigDecimal standardPrice, String status, String note, LocalDate createdAt,
                LocalDate updatedAt, Boolean isMain) {
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
        this.isMain = isMain != null ? isMain : true;
    }
}