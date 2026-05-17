package com.bongashop.backend.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderSummaryResponse(
        Long id,
        Long userId,
        String customerName,
        String status,
        BigDecimal total,
        LocalDateTime placedAt
) {
}
