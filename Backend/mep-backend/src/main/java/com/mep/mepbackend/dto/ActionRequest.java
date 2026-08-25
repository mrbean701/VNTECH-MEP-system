package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class ActionRequest {
    private String note; // Ghi chú khi duyệt/từ chối
    private String approvedBy; // Người duyệt (có thể lấy từ token)
    private String result; // Dành cho QC: PASS/FAIL
    private String qcName;
    // Các trường khác tùy nghiệp vụ
}