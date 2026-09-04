package com.mep.mepbackend.util;

import com.mep.mepbackend.entity.Permission;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.entity.UserPermission;
import com.mep.mepbackend.exception.UnauthorizedException;
import com.mep.mepbackend.repository.PermissionRepository;
import com.mep.mepbackend.repository.UserPermissionRepository;
import com.mep.mepbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CurrentUserUtil {

    private final UserRepository userRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PermissionRepository permissionRepository;

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
     * Kiểm tra override permission - chỉ ADMIN mới có thể override
     */
    private boolean hasOverridePermission() {
        try {
            User user = getCurrentUser();
            // ADMIN luôn có override
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }
            return hasPermission("workflow.override");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kiểm tra quyền dựa trên:
     * 1. ADMIN -> true
     * 2. UserPermission (nếu có) -> theo enabled
     * 3. DepartmentPermission (nếu user có departmentId) -> theo enabled
     * 4. Mặc định -> false
     */
    public boolean hasPermission(String permissionKey) {
        try {
            User user = getCurrentUser();

            // ADMIN luôn có toàn quyền
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }

            // Bước 1: User permission (ghi đè)
            Optional<UserPermission> userPermOpt =
                    userPermissionRepository.findByUserIdAndPermissionKey(user.getId(), permissionKey);
            if (userPermOpt.isPresent()) {
                return userPermOpt.get().getEnabled();
            }

            // Bước 2: Department permission (nếu có)
            if (user.getDepartmentId() != null) {
                Optional<Permission> deptPermOpt =
                        permissionRepository.findByDepartmentIdAndPermissionKey(user.getDepartmentId(), permissionKey);
                if (deptPermOpt.isPresent()) {
                    return deptPermOpt.get().getEnabled();
                }
            }

            // Bước 3: Không có quyền
            return false;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kiểm tra quyền và phòng ban (nếu có yêu cầu)
     * - Nếu user là ADMIN: luôn true
     * - Nếu departmentId != null: user phải thuộc phòng ban đó
     * - Nếu departmentId == null: chỉ cần có permission
     */
    public boolean hasPermissionAndDepartment(String permissionKey, Long departmentId) {
        if (permissionKey == null || permissionKey.isEmpty()) return true;
        if (!hasPermission(permissionKey)) return false;

        // Nếu user là ADMIN, bỏ qua kiểm tra phòng ban
        try {
            User user = getCurrentUser();
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }
        } catch (Exception e) {
            return false;
        }

        // Nếu có yêu cầu phòng ban, kiểm tra
        if (departmentId != null) {
            return isInDepartment(departmentId);
        }
        return true;
    }

    public boolean hasAnyPermission(String... permissionKeys) {
        for (String key : permissionKeys) {
            if (hasPermission(key)) return true;
        }
        return false;
    }

    public boolean hasAllPermissions(String... permissionKeys) {
        for (String key : permissionKeys) {
            if (!hasPermission(key)) return false;
        }
        return true;
    }
}