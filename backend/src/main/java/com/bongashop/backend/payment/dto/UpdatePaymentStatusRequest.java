package com.bongashop.backend.payment.dto;

import com.bongashop.backend.shared.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdatePaymentStatusRequest(
        @NotNull(message = "Payment status is required")
        PaymentStatus status,
        @Size(max = 120, message = "Provider payment id must be at most 120 characters")
        String providerPaymentId,
        @Size(max = 500, message = "Failure reason must be at most 500 characters")
        String failureReason
) {
}
