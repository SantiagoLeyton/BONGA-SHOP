package com.bongashop.backend.payment.dto;

import com.bongashop.backend.shared.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        Long orderId,
        Long userId,
        Long paymentMethodId,
        PaymentStatus status,
        BigDecimal amount,
        String currency,
        String provider,
        String transactionReference,
        String providerPaymentId,
        String failureReason,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {
}
