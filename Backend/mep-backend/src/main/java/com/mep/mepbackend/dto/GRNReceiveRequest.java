package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GRNReceiveRequest {
    private String warehouseStaff;
    private LocalDate receiptDate;
}