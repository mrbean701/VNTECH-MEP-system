package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class UserPermissionDTO {
    private Long id;
    private Long userId;
    private String permissionKey;
    private Boolean enabled;
}