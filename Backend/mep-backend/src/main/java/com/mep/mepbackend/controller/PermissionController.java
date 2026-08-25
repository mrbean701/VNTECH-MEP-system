package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Permission;
import com.mep.mepbackend.entity.UserPermission;
import com.mep.mepbackend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    public List<Permission> getAll() {
        return permissionService.getAll();
    }

    @GetMapping("/role/{role}")
    public List<Permission> getByRole(@PathVariable String role) {
        return permissionService.getByRole(role);
    }

    @GetMapping("/role/{role}/key/{permissionKey}")
    public Permission getByRoleAndPermission(@PathVariable String role, @PathVariable String permissionKey) {
        return permissionService.getByRoleAndPermission(role, permissionKey);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Permission create(@RequestBody Permission permission) {
        return permissionService.create(permission);
    }

    @PutMapping("/{id}")
    public Permission update(@PathVariable Long id, @RequestBody Permission permission) {
        return permissionService.update(id, permission);
    }

    @DeleteMapping("/role/{role}/key/{permissionKey}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByRoleAndPermission(@PathVariable String role, @PathVariable String permissionKey) {
        permissionService.deleteByRoleAndPermission(role, permissionKey);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        permissionService.delete(id);
    }

    // User Permission endpoints
    @GetMapping("/user/{userId}")
    public List<UserPermission> getUserPermissions(@PathVariable Long userId) {
        return permissionService.getUserPermissions(userId);
    }

    @PostMapping("/user/{userId}/assign")
    public UserPermission assignUserPermission(@PathVariable Long userId,
                                               @RequestParam String permissionKey,
                                               @RequestParam(defaultValue = "true") Boolean enabled) {
        return permissionService.assignUserPermission(userId, permissionKey, enabled);
    }

    @DeleteMapping("/user/{userId}/remove")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeUserPermission(@PathVariable Long userId,
                                     @RequestParam String permissionKey) {
        permissionService.removeUserPermission(userId, permissionKey);
    }

    @DeleteMapping("/user/{userId}/remove-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAllUserPermissions(@PathVariable Long userId) {
        permissionService.removeAllUserPermissions(userId);
    }
}