package com.bongashop.backend.auth.mapper;

import com.bongashop.backend.auth.dto.AuthResponse;
import com.bongashop.backend.auth.dto.AuthenticatedUserResponse;
import com.bongashop.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public AuthResponse toResponse(String token, User user) {
        return new AuthResponse(
                token,
                "Bearer",
                new AuthenticatedUserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole().getName().name().replace("ROLE_", ""),
                        user.isActive()
                )
        );
    }
}
