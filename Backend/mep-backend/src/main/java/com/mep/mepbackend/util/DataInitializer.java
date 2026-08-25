package com.mep.mepbackend.util;

import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@mep.com")) {
            User admin = new User();
            admin.setEmail("admin@mep.com");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setName("Admin System");
            admin.setRole("ADMIN");
            admin.setPosition("Giám đốc hệ thống");
            admin.setCreatedAt(LocalDate.now());
            userRepository.save(admin);
            System.out.println("✅ Admin user created.");
        }
    }
}