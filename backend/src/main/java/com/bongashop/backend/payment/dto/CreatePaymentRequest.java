package com.bongashop.backend.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePaymentRequest(
        @NotBlank(message = "Currency is required")
        @Size(min = 3, max = 3, message = "Currency must have 3 characters")
        String currency,
        @NotBlank(message = "Provider is required")
        @Size(max = 60, message = "Provider must be at most 60 characters")
        String provider,
        Long paymentMethodId,
        @Size(max = 120, message = "Transaction reference must be at most 120 characters")
        String transactionReference
) {
}
