package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "vendors")
@Data
@NoArgsConstructor  // ✅ Thêm dòng này
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;
    private String name;
    private String vendorGroup;
    private String contact;
    private String phone;
    private String email;
    private String paymentTerm;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    public Vendor(Long id, String code, String name, String vendorGroup, String contact, String phone, String email, String paymentTerm, String note, LocalDate createdAt, LocalDate updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.vendorGroup = vendorGroup;
        this.contact = contact;
        this.phone = phone;
        this.email = email;
        this.paymentTerm = paymentTerm;
        this.note = note;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}