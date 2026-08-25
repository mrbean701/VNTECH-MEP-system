package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class MaterialReturnApproveRequest {
    private String itemsUpdateJson; // JSON cập nhật số lượng thực tế
}