package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Permission;
import com.mep.mepbackend.entity.UserPermission;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.PermissionRepository;
import com.mep.mepbackend.repository.UserPermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;

    // ===== DEPARTMENT PERMISSIONS =====

    public List<Permission> getAll() {
        return permissionRepository.findAll();
    }

    public List<Permission> getByDepartmentId(Long departmentId) {
        return permissionRepository.findByDepartmentId(departmentId);
    }

    public Permission getByDepartmentAndPermission(Long departmentId, String permissionKey) {
        return permissionRepository.findByDepartmentIdAndPermissionKey(departmentId, permissionKey)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found"));
    }

    @Transactional
    public Permission assignDepartmentPermission(Long departmentId, String permissionKey, Boolean enabled) {
        Optional<Permission> existing = permissionRepository.findByDepartmentIdAndPermissionKey(departmentId, permissionKey);
        if (existing.isPresent()) {
            Permission p = existing.get();
            p.setEnabled(enabled);
            return permissionRepository.save(p);
        } else {
            Permission p = new Permission();
            p.setRole("DEPARTMENT");
            p.setDepartmentId(departmentId);
            p.setPermissionKey(permissionKey);
            p.setEnabled(enabled);
            return permissionRepository.save(p);
        }
    }

    @Transactional
    public void removeDepartmentPermission(Long departmentId, String permissionKey) {
        permissionRepository.deleteByDepartmentIdAndPermissionKey(departmentId, permissionKey);
    }

    // ===== USER PERMISSIONS =====

    public List<UserPermission> getUserPermissions(Long userId) {
        return userPermissionRepository.findByUserId(userId);
    }

    public Boolean hasUserPermission(Long userId, String permissionKey) {
        return userPermissionRepository.findByUserIdAndPermissionKey(userId, permissionKey)
                .map(UserPermission::getEnabled)
                .orElse(null);
    }

    @Transactional
    public UserPermission assignUserPermission(Long userId, String permissionKey, Boolean enabled) {
        Optional<UserPermission> existing = userPermissionRepository.findByUserIdAndPermissionKey(userId, permissionKey);
        if (existing.isPresent()) {
            UserPermission up = existing.get();
            up.setEnabled(enabled);
            return userPermissionRepository.save(up);
        } else {
            UserPermission up = new UserPermission();
            up.setUserId(userId);
            up.setPermissionKey(permissionKey);
            up.setEnabled(enabled);
            return userPermissionRepository.save(up);
        }
    }

    @Transactional
    public void removeUserPermission(Long userId, String permissionKey) {
        userPermissionRepository.deleteByUserIdAndPermissionKey(userId, permissionKey);
    }

    @Transactional
    public void removeAllUserPermissions(Long userId) {
        userPermissionRepository.deleteByUserId(userId);
    }
}