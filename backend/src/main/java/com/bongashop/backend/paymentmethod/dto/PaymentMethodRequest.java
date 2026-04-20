package com.bongashop.backend.paymentmethod.dto;

import com.bongashop.backend.shared.enums.PaymentMethodType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentMethodRequest(
        @NotNull(message = "Payment method type is required")
        PaymentMethodType type,
        @NotBlank(message = "Provider is required")
        @Size(max = 60, message = "Provider must be at most 60 characters")
        String provider,
        @NotBlank(message = "Display name is required")
        @Size(max = 120, message = "Display name must be at most 120 characters")
        String displayName,
        @Size(max = 4, message = "Last four must be at most 4 characters")
        String lastFour,
        @Min(value = 1, message = "Expiration month must be between 1 and 12")
        @Max(value = 12, message = "Expiration month must be between 1 and 12")
        Integer expirationMonth,
        @Min(value = 2024, message = "Expiration year is invalid")
        Integer expirationYear,
        @Size(max = 255, message = "Token reference must be at most 255 characters")
        String tokenReference,
        boolean defaultMethod
) {
}
