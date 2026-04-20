package com.bongashop.backend.user.dto;

public record UserSummaryResponse(
        Long id,
        String name,
        String email,
        String phone,
        String role,
        boolean active
) {
}
