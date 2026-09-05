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

    private boolean hasOverridePermission() {
        try {
            User user = getCurrentUser();
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }
            return hasPermission("workflow.override");
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasPermission(String permissionKey) {
        try {
            User user = getCurrentUser();

            if ("ADMIN".equals(user.getRole())) {
                return true;
            }

            Optional<UserPermission> userPermOpt =
                    userPermissionRepository.findByUserIdAndPermissionKey(user.getId(), permissionKey);
            if (userPermOpt.isPresent()) {
                return userPermOpt.get().getEnabled();
            }

            if (user.getDepartmentId() != null) {
                Optional<Permission> deptPermOpt =
                        permissionRepository.findByDepartmentIdAndPermissionKey(user.getDepartmentId(), permissionKey);
                if (deptPermOpt.isPresent()) {
                    return deptPermOpt.get().getEnabled();
                }
            }

            return false;

        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasPermissionAndDepartment(String permissionKey, Long departmentId) {
        if (permissionKey == null || permissionKey.isEmpty()) return true;
        if (!hasPermission(permissionKey)) return false;

        try {
            User user = getCurrentUser();
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }
        } catch (Exception e) {
            return false;
        }

        if (departmentId != null) {
            return isInDepartment(departmentId);
        }
        return true;
    }

    // ✅ PHƯƠNG THỨC KIỂM TRA DUYỆT THEO CẤP ĐỘ - ĐÃ SỬA
// ===== CAN APPROVE STEP (MỚI) =====
    public boolean canApproveStep(int step, String permissionKey, Long departmentId) {
        try {
            User user = getCurrentUser();

            // ADMIN luôn có quyền
            if ("ADMIN".equals(user.getRole())) {
                return true;
            }

            // 1. Kiểm tra permission
            if (permissionKey != null && !permissionKey.isEmpty()) {
                if (!hasPermission(permissionKey)) {
                    return false;
                }
            }

            // 2. Kiểm tra department (nếu có yêu cầu)
            if (departmentId != null) {
                if (user.getDepartmentId() == null || !user.getDepartmentId().equals(departmentId)) {
                    return false;
                }
            }

            // 3. Kiểm tra approval level: user có level >= step thì được duyệt
            Integer level = user.getApprovalLevel();
            if (level == null) level = 0;

            // Nếu step = 0 (không cần duyệt) thì cho phép nếu có quyền
            if (step == 0) return true;

            // ✅ SỬA: level >= step (thay vì ==)
            return level >= step;

        } catch (Exception e) {
            return false;
        }
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