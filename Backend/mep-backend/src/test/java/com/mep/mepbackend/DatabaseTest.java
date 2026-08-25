package com.mep.mepbackend; // ✅ ĐÚNG package chính

import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class DatabaseTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testCreateAdminUser() {
        if (!userRepository.existsByEmail("admin@mep.com")) {
            User admin = new User();
            admin.setEmail("admin@mep.com");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setName("Admin System");
            admin.setRole("ADMIN");
            admin.setPosition("Giám đốc hệ thống");
            userRepository.save(admin);
            System.out.println("✅ Admin user created.");
        } else {
            System.out.println("ℹ️ Admin user already exists.");
        }
    }
}