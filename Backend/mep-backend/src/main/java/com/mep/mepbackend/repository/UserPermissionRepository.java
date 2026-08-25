package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByUserId(Long userId);

    Optional<UserPermission> findByUserIdAndPermissionKey(Long userId, String permissionKey);

    List<UserPermission> findByUserIdAndEnabled(Long userId, Boolean enabled);

    boolean existsByUserIdAndPermissionKey(Long userId, String permissionKey);

    void deleteByUserIdAndPermissionKey(Long userId, String permissionKey);

    void deleteByUserId(Long userId);
}