package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "permission_key", nullable = false, length = 100)
    private String permissionKey;

    @Column(nullable = false)
    private Boolean enabled = true;

    // Constructor tiện ích
    public Permission(String role, Long departmentId, String permissionKey, Boolean enabled) {
        this.role = role;
        this.departmentId = departmentId;
        this.permissionKey = permissionKey;
        this.enabled = enabled != null ? enabled : true;
    }
}