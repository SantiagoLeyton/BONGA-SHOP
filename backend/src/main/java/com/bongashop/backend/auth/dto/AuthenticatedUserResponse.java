package com.bongashop.backend.auth.dto;

public record AuthenticatedUserResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean active
) {
}
