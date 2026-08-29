package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.service.UserService;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserUtil currentUserUtil;

    @GetMapping
    public List<User> getAll() {
        return userService.getAll();
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @GetMapping("/email/{email}")
    public User getByEmail(@PathVariable String email) {
        return userService.getByEmail(email);
    }

    @GetMapping("/role/{role}")
    public List<User> getByRole(@PathVariable String role) {
        return userService.getByRole(role);
    }

    @GetMapping("/department/{departmentId}")
    public List<User> getByDepartment(@PathVariable Long departmentId) {
        return userService.getByDepartmentId(departmentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User create(@RequestBody User user) {
        return userService.create(user);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) {
        return userService.update(id, user);
    }

    // ===== PHƯƠNG THỨC MỚI: Cập nhật hồ sơ cá nhân =====
    @PatchMapping("/{id}/profile")
    public User updateProfile(@PathVariable Long id, @RequestBody User user) {
        User currentUser = currentUserUtil.getCurrentUser();
        // Chỉ cho phép user tự sửa hồ sơ của mình, hoặc ADMIN sửa cho bất kỳ ai
        if (!currentUser.getId().equals(id) && !"ADMIN".equals(currentUser.getRole())) {
            throw new RuntimeException("Bạn chỉ có thể cập nhật hồ sơ của chính mình");
        }
        return userService.updateProfile(id, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}