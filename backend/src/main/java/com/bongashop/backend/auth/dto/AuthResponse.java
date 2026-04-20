package com.bongashop.backend.auth.dto;

public record AuthResponse(
        String token,
        String type,
        AuthenticatedUserResponse user
) {
}
