package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {



    /**
     * Tìm permission theo department và permissionKey
     */
    Optional<Permission> findByDepartmentIdAndPermissionKey(Long departmentId, String permissionKey);

    /**
     * Xóa permission theo department và permissionKey
     */
    void deleteByDepartmentIdAndPermissionKey(Long departmentId, String permissionKey);
    // ===== GETTERS =====

    List<Permission> findByRole(String role);

    Optional<Permission> findByRoleAndPermissionKey(String role, String permissionKey);

    /**
     * Tìm permission theo role, department và permissionKey
     */
    Optional<Permission> findByRoleAndDepartmentIdAndPermissionKey(String role, Long departmentId, String permissionKey);

    /**
     * Lấy tất cả permission của một role trong một department cụ thể
     */
    List<Permission> findByRoleAndDepartmentId(String role, Long departmentId);

    /**
     * Lấy tất cả permission của một department (không phân biệt role)
     */
    List<Permission> findByDepartmentId(Long departmentId);

    /**
     * Lấy tất cả permission của một role, không giới hạn department (departmentId = null)
     */
    List<Permission> findByRoleAndDepartmentIdIsNull(String role);

    List<Permission> findByRoleAndEnabled(String role, Boolean enabled);

    // ===== EXISTS =====

    boolean existsByRoleAndDepartmentIdAndPermissionKey(String role, Long departmentId, String permissionKey);

    // ===== DELETE =====

    void deleteByRoleAndDepartmentIdAndPermissionKey(String role, Long departmentId, String permissionKey);


}