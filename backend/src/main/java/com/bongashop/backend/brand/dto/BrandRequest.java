package com.bongashop.backend.brand.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 120, message = "Name must have at most 120 characters")
        String name
) {
}
