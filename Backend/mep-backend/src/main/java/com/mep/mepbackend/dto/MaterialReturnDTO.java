package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MaterialReturnDTO {
    private Long id;
    private String code;
    private String projectCode;
    private String projectName;
    private LocalDate returnDate;
    private Long warehouseId;
    private String returnFrom;
    private String items; // JSON
    private String returner;
    private String status;
    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String approvedBy;
    private String confirmedBy;
    private LocalDate completionDate;
    private String note;
}