package com.bongashop.backend.payment.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.order.entity.Order;
import com.bongashop.backend.order.service.OrderService;
import com.bongashop.backend.payment.dto.CreatePaymentRequest;
import com.bongashop.backend.payment.dto.PaymentResponse;
import com.bongashop.backend.payment.dto.UpdatePaymentStatusRequest;
import com.bongashop.backend.payment.service.PaymentService;
import com.bongashop.backend.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final UserService userService;

    public PaymentController(PaymentService paymentService, OrderService orderService, UserService userService) {
        this.paymentService = paymentService;
        this.orderService = orderService;
        this.userService = userService;
    }

    @GetMapping("/orders/{orderId}/payments")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public List<PaymentResponse> listOrderPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId
    ) {
        orderService.getOrderDetail(orderId, userDetails);
        return paymentService.listByOrder(orderId);
    }

    @PostMapping("/orders/{orderId}/payments")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPendingPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long orderId,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        orderService.getOrderDetail(orderId, userDetails);
        Order order = orderService.getOrderEntity(orderId);
        return paymentService.createPendingPayment(
                order,
                userService.getById(userDetails.getUserId()),
                order.getTotal(),
                request.currency(),
                request.provider(),
                request.paymentMethodId(),
                request.transactionReference()
        );
    }

    @PatchMapping("/payments/{paymentId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse updatePaymentStatus(
            @PathVariable Long paymentId,
            @Valid @RequestBody UpdatePaymentStatusRequest request
    ) {
        return paymentService.updateStatus(
                paymentId,
                request.status(),
                request.providerPaymentId(),
                request.failureReason()
        );
    }
}
