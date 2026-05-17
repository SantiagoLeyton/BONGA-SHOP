package com.bongashop.backend.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150, message = "Name must have at most 150 characters")
        String name,
        @NotBlank(message = "Description is required")
        @Size(max = 1000, message = "Description must have at most 1000 characters")
        String description,
        @NotNull(message = "Brand id is required")
        Long brandId,
        Boolean active
) {
}
