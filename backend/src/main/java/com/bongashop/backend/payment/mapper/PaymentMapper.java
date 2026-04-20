package com.bongashop.backend.payment.mapper;

import com.bongashop.backend.payment.dto.PaymentResponse;
import com.bongashop.backend.payment.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getUser().getId(),
                payment.getPaymentMethod() == null ? null : payment.getPaymentMethod().getId(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getProvider(),
                payment.getTransactionReference(),
                payment.getProviderPaymentId(),
                payment.getFailureReason(),
                payment.getProcessedAt(),
                payment.getCreatedAt()
        );
    }
}
