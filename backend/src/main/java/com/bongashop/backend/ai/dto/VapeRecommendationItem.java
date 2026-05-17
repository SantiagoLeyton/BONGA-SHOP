package com.bongashop.backend.ai.dto;

import java.math.BigDecimal;

public record VapeRecommendationItem(
        Long productId,
        Long variantId,
        String productName,
        String brandName,
        String flavor,
        String nicotineLevel,
        BigDecimal price,
        Integer stock,
        String reason
) {
}
