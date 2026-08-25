package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "vendors")
@Data
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
}