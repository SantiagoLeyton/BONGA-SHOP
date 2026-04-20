package com.bongashop.backend.paymentmethod.dto;

import com.bongashop.backend.shared.enums.PaymentMethodType;

public record PaymentMethodResponse(
        Long id,
        Long userId,
        PaymentMethodType type,
        String provider,
        String displayName,
        String lastFour,
        Integer expirationMonth,
        Integer expirationYear,
        boolean active,
        boolean defaultMethod
) {
}
