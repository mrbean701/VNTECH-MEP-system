package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PODTO {
    private Long id;
    private String code;
    private Long prId;
    private String projectCode;
    private String projectName;
    private String vendorCode;
    private String vendorName;
    private String items;
    private String status;
    private Integer approvalStep;
    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String note;
}