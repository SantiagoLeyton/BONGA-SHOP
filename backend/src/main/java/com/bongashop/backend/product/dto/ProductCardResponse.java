package com.bongashop.backend.product.dto;

import java.math.BigDecimal;

public record ProductCardResponse(
        Long id,
        String name,
        String description,
        String brand,
        String imageUrl,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        boolean hasStock
) {
}
