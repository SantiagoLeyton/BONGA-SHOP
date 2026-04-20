package com.bongashop.backend.paymentmethod.mapper;

import com.bongashop.backend.paymentmethod.dto.PaymentMethodResponse;
import com.bongashop.backend.paymentmethod.entity.PaymentMethod;
import org.springframework.stereotype.Component;

@Component
public class PaymentMethodMapper {

    public PaymentMethodResponse toResponse(PaymentMethod paymentMethod) {
        return new PaymentMethodResponse(
                paymentMethod.getId(),
                paymentMethod.getUser().getId(),
                paymentMethod.getType(),
                paymentMethod.getProvider(),
                paymentMethod.getDisplayName(),
                paymentMethod.getLastFour(),
                paymentMethod.getExpirationMonth(),
                paymentMethod.getExpirationYear(),
                paymentMethod.isActive(),
                paymentMethod.isDefaultMethod()
        );
    }
}
