package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GRNDTO {
    private Long id;
    private String code;
    private Long poId;
    private String projectCode;
    private String projectName;
    private Long warehouseId;
    private String vendorCode;
    private String vendorName;
    private String items; // JSON
    private LocalDate receiptDate;
    private String receiver;
    private String warehouseStaff;
    private String qcConfirm;
    private String accountantConfirm;
    private String invoice;
    private String status;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}