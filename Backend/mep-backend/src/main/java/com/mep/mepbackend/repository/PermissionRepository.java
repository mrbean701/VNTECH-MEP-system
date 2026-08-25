package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    List<Permission> findByRole(String role);

    Optional<Permission> findByRoleAndPermissionKey(String role, String permissionKey);

    List<Permission> findByRoleAndEnabled(String role, Boolean enabled);

    boolean existsByRoleAndPermissionKey(String role, String permissionKey);

    void deleteByRoleAndPermissionKey(String role, String permissionKey);
}