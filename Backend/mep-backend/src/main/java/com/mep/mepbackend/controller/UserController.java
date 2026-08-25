package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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

    // ✅ Lấy user theo role
    @GetMapping("/role/{role}")
    public List<User> getByRole(@PathVariable String role) {
        return userService.getByRole(role);
    }

    // ✅ Lấy user theo departmentId
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}