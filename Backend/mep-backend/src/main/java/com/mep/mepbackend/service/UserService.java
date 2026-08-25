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

    // Lấy tất cả user
    public List<User> getAll() {
        return userRepository.findAll();
    }

    // Lấy user theo ID
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    // Lấy user theo email
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    // ✅ Lấy danh sách user theo role
    public List<User> getByRole(String role) {
        return userRepository.findByRole(role);
    }

    // ✅ Lấy danh sách user theo departmentId
    public List<User> getByDepartmentId(Long departmentId) {
        return userRepository.findByDepartmentId(departmentId);
    }

    // Tạo user mới
    @Transactional
    public User create(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDate.now());
        return userRepository.save(user);
    }

    // Cập nhật user
    @Transactional
    public User update(Long id, User userDetails) {
        User user = getById(id);
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setDepartmentId(userDetails.getDepartmentId());
        user.setPosition(userDetails.getPosition());
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        user.setUpdatedAt(LocalDate.now());
        return userRepository.save(user);
    }

    // Xóa user
    @Transactional
    public void delete(Long id) {
        User user = getById(id);
        userRepository.delete(user);
    }
}