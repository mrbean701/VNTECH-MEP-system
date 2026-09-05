package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String role;
    private Long departmentId;
    private String department;
    private String position;
    private LocalDate createdAt;
    private LocalDate updatedAt;

    // ✅ Thêm field approvalLevel
    private Integer approvalLevel;

    private Boolean grantAllDeptPermissions;
}