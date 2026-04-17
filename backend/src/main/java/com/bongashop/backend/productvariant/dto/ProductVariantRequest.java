package com.bongashop.backend.productvariant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductVariantRequest(
        @NotBlank(message = "Flavor is required")
        @Size(max = 120, message = "Flavor must have at most 120 characters")
        String flavor,
        @NotBlank(message = "Nicotine level is required")
        @Size(max = 60, message = "Nicotine level must have at most 60 characters")
        String nicotineLevel,
        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than zero")
        BigDecimal price,
        Boolean active
) {
}
