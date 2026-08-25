package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class STODTO {
    private Long id;
    private String code;
    private Long fromWarehouseId;
    private Long toWarehouseId;
    private String projectCode;
    private String projectName;
    private String items; // JSON
    private LocalDate transferDate;
    private String requestedBy;
    private String approvedBy;
    private String warehouseStaff;
    private String transporter;
    private String departureTime;
    private String status;
    private String note;
    private LocalDate createdAt;
    private LocalDate updatedAt;
}