package com.mep.mepbackend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class VendorGroupDTO {

    private Long id;
    private Long vendorId;
    private String name;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}