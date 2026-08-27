package com.mep.mepbackend;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String raw = "password";
        String encoded = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        System.out.println(encoder.matches(raw, encoded)); // Phải trả về true
        // Nếu false, hãy tạo hash mới:
        System.out.println("New hash: " + encoder.encode(raw));
    }
}