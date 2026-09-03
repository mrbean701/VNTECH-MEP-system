package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

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

    // ✅ Các trường mới
    private String status;          // ACTIVE, INACTIVE
    private LocalDate inactiveDate;

    // ✅ Danh sách nhóm hàng
    private List<String> vendorGroups;
}