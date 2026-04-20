package com.bongashop.backend.user.dto;

public record UserProfileResponse(
        Long id,
        String name,
        String email,
        String phone,
        String role,
        boolean active
) {
}
