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

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;

    public List<Permission> getAll() {
        return permissionRepository.findAll();
    }

    public List<Permission> getByRole(String role) {
        return permissionRepository.findByRole(role);
    }

    public Permission getByRoleAndPermission(String role, String permissionKey) {
        return permissionRepository.findByRoleAndPermissionKey(role, permissionKey)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found"));
    }

    @Transactional
    public Permission create(Permission permission) {
        if (permissionRepository.existsByRoleAndPermissionKey(
                permission.getRole(), permission.getPermissionKey())) {
            throw new RuntimeException("Permission đã tồn tại");
        }
        return permissionRepository.save(permission);
    }

    @Transactional
    public Permission update(Long id, Permission details) {
        Permission perm = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found"));
        perm.setEnabled(details.getEnabled());
        return permissionRepository.save(perm);
    }

    @Transactional
    public void delete(Long id) {
        Permission perm = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found"));
        permissionRepository.delete(perm);
    }

    @Transactional
    public void deleteByRoleAndPermission(String role, String permissionKey) {
        permissionRepository.deleteByRoleAndPermissionKey(role, permissionKey);
    }

    // User Permission
    public List<UserPermission> getUserPermissions(Long userId) {
        return userPermissionRepository.findByUserId(userId);
    }

    @Transactional
    public UserPermission assignUserPermission(Long userId, String permissionKey, Boolean enabled) {
        var existing = userPermissionRepository.findByUserIdAndPermissionKey(userId, permissionKey);
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