package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class VendorDTO {
    private Long id;
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