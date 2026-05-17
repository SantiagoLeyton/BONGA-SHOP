package com.bongashop.backend.user.dto;

import jakarta.validation.constraints.NotNull;

public record UserStatusUpdateRequest(
        @NotNull(message = "Active is required")
        Boolean active
) {
}
