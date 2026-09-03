package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendors")
@Data
@NoArgsConstructor
@AllArgsConstructor
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

    // ✅ Thêm 2 trường mới
    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "inactive_date")
    private LocalDate inactiveDate;

    // ✅ Thêm quan hệ 1-n với VendorGroup (không dùng cascade để tránh xóa vendor khi xóa group)
    @OneToMany
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private List<VendorGroup> groups = new ArrayList<>();

    public Vendor(Long id, String code, String name, String vendorGroup, String contact, String phone, String email,
                  String paymentTerm, String note, LocalDate createdAt, LocalDate updatedAt) {
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
        this.status = "ACTIVE";
    }
}