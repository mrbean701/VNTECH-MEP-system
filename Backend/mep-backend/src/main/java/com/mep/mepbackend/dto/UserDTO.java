package com.mep.mepbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String role;
    private Long departmentId;      // ✅ Thêm trường này
    private String department;      // Tên phòng ban (optional)
    private String position;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    // Không bao gồm password
}