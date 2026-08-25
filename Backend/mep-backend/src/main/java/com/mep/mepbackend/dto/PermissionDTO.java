package com.mep.mepbackend.dto;

import lombok.Data;

@Data
public class PermissionDTO {
    private Long id;
    private String role;
    private String permissionKey;
    private Boolean enabled;
}