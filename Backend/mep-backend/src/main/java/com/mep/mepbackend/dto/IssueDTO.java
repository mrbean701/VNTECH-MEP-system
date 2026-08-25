package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class IssueDTO {
    private Long id;
    private String code;
    private String projectCode;
    private String projectName;
    private LocalDate date;
    private String area;
    private String team;
    private String requester;
    private String items; // JSON
    private String status;
    private Long createdBy;
    private String createdByName;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private String approvedBy;
    private String completedBy;
    private String confirmedBy;
    private LocalDate completionDate;
    private Long warehouseId;
    private String note;
}