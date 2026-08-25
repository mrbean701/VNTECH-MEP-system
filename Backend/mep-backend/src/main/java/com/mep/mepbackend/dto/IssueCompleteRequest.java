package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class IssueCompleteRequest {
    private Long warehouseId;
    private String itemsUpdateJson; // JSON cập nhật số lượng thực tế
}