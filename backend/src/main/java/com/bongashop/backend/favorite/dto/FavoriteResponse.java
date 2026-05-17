package com.bongashop.backend.favorite.dto;

import java.time.LocalDateTime;

public record FavoriteResponse(
        Long id,
        Long productId,
        String productName,
        String brandName,
        LocalDateTime createdAt
) {
}
