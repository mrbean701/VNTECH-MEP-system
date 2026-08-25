package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class GRNQCRequest {
    private String qcName;
    private String result; // PASS, FAIL, PARTIAL
    private String note;
}