package com.mep.mepbackend.dto;

import com.mep.mepbackend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private User user; // Hoặc có thể dùng UserDTO
}