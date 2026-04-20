package com.bongashop.backend.cart.dto;

import com.bongashop.backend.shared.enums.CartStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CartResponse(
        Long id,
        Long userId,
        CartStatus status,
        Long convertedOrderId,
        Integer totalItems,
        BigDecimal totalAmount,
        LocalDateTime updatedAt,
        List<CartItemResponse> items
) {
}
