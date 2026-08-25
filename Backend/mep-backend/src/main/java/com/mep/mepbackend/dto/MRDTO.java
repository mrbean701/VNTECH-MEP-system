package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MRDTO {
    private Long id;
    private String code;
    private String projectCode;
    private String projectName;
    private String items; // JSON string
    private LocalDate needDate;
    private String purpose;
    private String requester;
    private String status;
    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String note;
}