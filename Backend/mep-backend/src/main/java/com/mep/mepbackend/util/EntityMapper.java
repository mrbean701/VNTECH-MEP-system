package com.mep.mepbackend.util;

import com.mep.mepbackend.dto.UserDTO;
import com.mep.mepbackend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class EntityMapper {

    // ====== USER ======
    public UserDTO toUserDTO(User user) {
        if (user == null) return null;
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setDepartmentId(user.getDepartmentId());
        dto.setDepartment(user.getDepartment());
        dto.setPosition(user.getPosition());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    public User toUserEntity(UserDTO dto) {
        if (dto == null) return null;
        User user = new User();
        user.setId(dto.getId());
        user.setEmail(dto.getEmail());
        user.setName(dto.getName());
        user.setRole(dto.getRole());
        user.setDepartmentId(dto.getDepartmentId());
        user.setDepartment(dto.getDepartment());
        user.setPosition(dto.getPosition());
        user.setCreatedAt(dto.getCreatedAt());
        user.setUpdatedAt(dto.getUpdatedAt());
        return user;
    }
}