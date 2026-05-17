package com.bongashop.backend.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDetailResponse(
        Long id,
        Long userId,
        String customerName,
        String customerEmail,
        String status,
        BigDecimal total,
        LocalDateTime placedAt,
        String shippingRecipient,
        String shippingPhone,
        String shippingAddress,
        String shippingCity,
        String notes,
        List<OrderItemResponse> items
) {
}
