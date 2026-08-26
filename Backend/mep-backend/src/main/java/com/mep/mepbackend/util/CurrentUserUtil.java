package com.mep.mepbackend.util;

import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.UnauthorizedException;
import com.mep.mepbackend.repository.UserRepository;
import com.mep.mepbackend.repository.UserPermissionRepository;
import com.mep.mepbackend.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Tiện ích lấy thông tin user hiện tại và kiểm tra quyền.
 */
@Component
@RequiredArgsConstructor
public class CurrentUserUtil {

    private final UserRepository userRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PermissionRepository permissionRepository;

    /**
     * Lấy thông tin user hiện tại từ SecurityContext.
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new UnauthorizedException("Bạn chưa đăng nhập");
        }

        Object principal = auth.getPrincipal();
        String email;

        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        } else {
            throw new UnauthorizedException("Không thể xác định thông tin user");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy user với email: " + email));
    }

    /**
     * Kiểm tra user hiện tại có role được chỉ định không.
     */
    public boolean hasRole(String role) {
        try {
            User user = getCurrentUser();
            return user.getRole() != null && user.getRole().equals(role);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kiểm tra user hiện tại có thuộc department được chỉ định không.
     */
    public boolean isInDepartment(Long departmentId) {
        if (departmentId == null) return true;
        try {
            User user = getCurrentUser();
            return user.getDepartmentId() != null && user.getDepartmentId().equals(departmentId);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kiểm tra user hiện tại có role và department phù hợp không.
     */
    public boolean canApprove(String requiredRole, Long requiredDepartmentId) {
        if (requiredRole == null) return true;
        try {
            User user = getCurrentUser();
            if (!user.getRole().equals(requiredRole)) return false;
            if (requiredDepartmentId != null) {
                return user.getDepartmentId() != null && user.getDepartmentId().equals(requiredDepartmentId);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * ✅ KIỂM TRA QUYỀN USER (ƯU TIÊN HƠN ROLE)
     *
     * Logic:
     * 1. Nếu user được gán permission trong bảng user_permissions:
     *    - enabled = true → có quyền (trả về true)
     *    - enabled = false → KHÔNG có quyền (trả về false) - ghi đè role
     * 2. Nếu user KHÔNG được gán trong user_permissions:
     *    - Kiểm tra role trong bảng permissions
     *    - Nếu role có permission và enabled = true → true
     *    - Ngược lại → false
     * 3. ADMIN luôn có tất cả quyền (có thể bỏ qua nếu muốn quản lý chặt)
     */
    public boolean hasPermission(String permissionKey) {
        try {
            User user = getCurrentUser();

            // ADMIN luôn có toàn quyền
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }

            // Bước 1: Kiểm tra user_permissions (ưu tiên cao nhất)
            var userPermOpt = userPermissionRepository.findByUserIdAndPermissionKey(user.getId(), permissionKey);
            if (userPermOpt.isPresent()) {
                return userPermOpt.get().getEnabled(); // true → có quyền, false → bị từ chối
            }

            // Bước 2: Fallback sang role_permissions
            var rolePermOpt = permissionRepository.findByRoleAndPermissionKey(user.getRole(), permissionKey);
            if (rolePermOpt.isPresent()) {
                return rolePermOpt.get().getEnabled();
            }

            // Bước 3: Không có quyền nào được cấp
            return false;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kiểm tra user có bất kỳ quyền nào trong danh sách không.
     */
    public boolean hasAnyPermission(String... permissionKeys) {
        for (String key : permissionKeys) {
            if (hasPermission(key)) return true;
        }
        return false;
    }

    /**
     * Kiểm tra user có tất cả quyền trong danh sách không.
     */
    public boolean hasAllPermissions(String... permissionKeys) {
        for (String key : permissionKeys) {
            if (!hasPermission(key)) return false;
        }
        return true;
    }
}