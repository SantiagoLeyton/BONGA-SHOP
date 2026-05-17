package com.bongashop.backend.cart.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeCartItemVariantRequest(
        @NotNull(message = "Variant id is required")
        Long variantId
) {
}
