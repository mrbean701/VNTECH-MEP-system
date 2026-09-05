package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final PermissionService permissionService;

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<User> getByRole(String role) {
        return userRepository.findByRole(role);
    }

    public List<User> getByDepartmentId(Long departmentId) {
        return userRepository.findByDepartmentId(departmentId);
    }

    @Transactional
    public User create(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDate.now());

        // ✅ Đảm bảo approvalLevel có giá trị mặc định
        if (user.getApprovalLevel() == null) {
            user.setApprovalLevel(0);
        }

        User saved = userRepository.save(user);

        if (user.getGrantAllDeptPermissions() != null &&
                user.getGrantAllDeptPermissions() &&
                user.getDepartmentId() != null) {
            permissionService.grantAllDepartmentPermissionsToUser(saved.getId(), user.getDepartmentId());
        }

        auditLogService.log("CREATE", "USER", String.valueOf(saved.getId()),
                "Tạo người dùng " + saved.getName() + " (" + saved.getEmail() + ")", null);
        return saved;
    }

    @Transactional
    public User update(Long id, User userDetails) {
        User user = getById(id);
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setDepartmentId(userDetails.getDepartmentId());
        user.setPosition(userDetails.getPosition());
        user.setAddress(userDetails.getAddress());
        user.setPhone(userDetails.getPhone());
        user.setEducation(userDetails.getEducation());

        // ✅ Cập nhật approvalLevel
        if (userDetails.getApprovalLevel() != null) {
            user.setApprovalLevel(userDetails.getApprovalLevel());
        }

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        user.setUpdatedAt(LocalDate.now());
        User saved = userRepository.save(user);

        if (userDetails.getGrantAllDeptPermissions() != null &&
                userDetails.getGrantAllDeptPermissions() &&
                user.getDepartmentId() != null) {
            permissionService.removeAllUserPermissions(id);
            permissionService.grantAllDepartmentPermissionsToUser(id, user.getDepartmentId());
        }

        auditLogService.log("UPDATE", "USER", String.valueOf(id),
                "Cập nhật người dùng " + saved.getName(), null);
        return saved;
    }

    @Transactional
    public User updateProfile(Long userId, User details) {
        User user = getById(userId);
        user.setName(details.getName());
        user.setAddress(details.getAddress());
        user.setPhone(details.getPhone());
        user.setEducation(details.getEducation());
        user.setUpdatedAt(LocalDate.now());
        User saved = userRepository.save(user);
        auditLogService.log("UPDATE_PROFILE", "USER", String.valueOf(userId),
                "Cập nhật hồ sơ của " + saved.getName(), null);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        User user = getById(id);
        permissionService.removeAllUserPermissions(id);
        userRepository.delete(user);
        auditLogService.log("DELETE", "USER", String.valueOf(id),
                "Xóa người dùng " + user.getName(), null);
    }
}