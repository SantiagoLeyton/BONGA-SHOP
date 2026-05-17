package com.bongashop.backend.payment.service;

import com.bongashop.backend.order.entity.Order;
import com.bongashop.backend.payment.dto.PaymentResponse;
import com.bongashop.backend.payment.entity.Payment;
import com.bongashop.backend.payment.mapper.PaymentMapper;
import com.bongashop.backend.payment.repository.PaymentRepository;
import com.bongashop.backend.paymentmethod.entity.PaymentMethod;
import com.bongashop.backend.paymentmethod.repository.PaymentMethodRepository;
import com.bongashop.backend.shared.enums.PaymentStatus;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import com.bongashop.backend.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final PaymentMapper paymentMapper;

    public PaymentService(
            PaymentRepository paymentRepository,
            PaymentMethodRepository paymentMethodRepository,
            PaymentMapper paymentMapper
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.paymentMapper = paymentMapper;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listByOrder(Long orderId) {
        return paymentRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse createPendingPayment(
            Order order,
            User user,
            BigDecimal amount,
            String currency,
            String provider,
            Long paymentMethodId,
            String transactionReference
    ) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setUser(user);
        payment.setAmount(amount);
        payment.setCurrency(currency.trim().toUpperCase());
        payment.setProvider(provider.trim());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionReference(transactionReference == null ? null : transactionReference.trim());
        if (paymentMethodId != null) {
            PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment method not found with id " + paymentMethodId));
            payment.setPaymentMethod(paymentMethod);
        }
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse updateStatus(
            Long paymentId,
            PaymentStatus status,
            String providerPaymentId,
            String failureReason
    ) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id " + paymentId));
        payment.setStatus(status);
        payment.setProviderPaymentId(providerPaymentId == null ? null : providerPaymentId.trim());
        payment.setFailureReason(failureReason == null ? null : failureReason.trim());
        if (status != PaymentStatus.PENDING) {
            payment.setProcessedAt(LocalDateTime.now());
        }
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }
}
