package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Permission;
import com.mep.mepbackend.entity.UserPermission;
import com.mep.mepbackend.service.PermissionService; // sửa import đúng
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    // ===== DEPARTMENT PERMISSIONS =====

    @GetMapping
    public List<Permission> getAll() {
        return permissionService.getAll();
    }

    @GetMapping("/department/{departmentId}")
    public List<Permission> getByDepartment(@PathVariable Long departmentId) {
        return permissionService.getByDepartmentId(departmentId);
    }

    @GetMapping("/department/{departmentId}/permission/{permissionKey}")
    public Permission getByDepartmentAndPermission(
            @PathVariable Long departmentId,
            @PathVariable String permissionKey) {
        return permissionService.getByDepartmentAndPermission(departmentId, permissionKey);
    }

    /**
     * Gán (hoặc cập nhật) quyền cho phòng ban
     * Query params: permissionKey, enabled (true/false)
     */
    @PostMapping("/department/{departmentId}/assign")
    @ResponseStatus(HttpStatus.CREATED)
    public Permission assignDepartmentPermission(
            @PathVariable Long departmentId,
            @RequestParam String permissionKey,
            @RequestParam(defaultValue = "true") Boolean enabled) {
        return permissionService.assignDepartmentPermission(departmentId, permissionKey, enabled);
    }

    /**
     * Xóa quyền của phòng ban
     */
    @DeleteMapping("/department/{departmentId}/remove")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeDepartmentPermission(
            @PathVariable Long departmentId,
            @RequestParam String permissionKey) {
        permissionService.removeDepartmentPermission(departmentId, permissionKey);
    }

    // ===== USER PERMISSIONS =====

    @GetMapping("/user/{userId}")
    public List<UserPermission> getUserPermissions(@PathVariable Long userId) {
        return permissionService.getUserPermissions(userId);
    }

    @PostMapping("/user/{userId}/assign")
    public UserPermission assignUserPermission(
            @PathVariable Long userId,
            @RequestParam String permissionKey,
            @RequestParam(defaultValue = "true") Boolean enabled) {
        return permissionService.assignUserPermission(userId, permissionKey, enabled);
    }

    @DeleteMapping("/user/{userId}/remove")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeUserPermission(
            @PathVariable Long userId,
            @RequestParam String permissionKey) {
        permissionService.removeUserPermission(userId, permissionKey);
    }

    @DeleteMapping("/user/{userId}/remove-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAllUserPermissions(@PathVariable Long userId) {
        permissionService.removeAllUserPermissions(userId);
    }
}