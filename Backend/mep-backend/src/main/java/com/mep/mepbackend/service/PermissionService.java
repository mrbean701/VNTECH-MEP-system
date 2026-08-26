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

/**
 * Service quản lý phân quyền:
 * - Role-based permissions (bảng permissions)
 * - User-based permissions (bảng user_permissions) - ưu tiên hơn role
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;

    // ===== ROLE PERMISSIONS =====

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
            throw new RuntimeException("Permission đã tồn tại cho role này");
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

    // ===== USER PERMISSIONS (ưu tiên hơn role) =====

    public List<UserPermission> getUserPermissions(Long userId) {
        return userPermissionRepository.findByUserId(userId);
    }

    /**
     * Kiểm tra user có quyền cụ thể không (ưu tiên user permission).
     * Nếu user được gán permission (bất kể true/false) → trả về giá trị đó.
     * Nếu user không được gán → trả về null (để service quyết định fallback sang role).
     */
    public Boolean hasUserPermission(Long userId, String permissionKey) {
        return userPermissionRepository.findByUserIdAndPermissionKey(userId, permissionKey)
                .map(UserPermission::getEnabled)
                .orElse(null);
    }

    /**
     * Gán hoặc cập nhật quyền cho user.
     */
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