package com.bongashop.backend.productvariant.dto;

import java.math.BigDecimal;

public record ProductVariantResponse(
        Long id,
        Long productId,
        String flavor,
        String nicotineLevel,
        BigDecimal price,
        boolean active,
        int stock
) {
}
