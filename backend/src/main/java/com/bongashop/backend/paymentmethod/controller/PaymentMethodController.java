package com.bongashop.backend.paymentmethod.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.paymentmethod.dto.PaymentMethodRequest;
import com.bongashop.backend.paymentmethod.dto.PaymentMethodResponse;
import com.bongashop.backend.paymentmethod.service.PaymentMethodService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payment-methods")
@PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    public PaymentMethodController(PaymentMethodService paymentMethodService) {
        this.paymentMethodService = paymentMethodService;
    }

    @GetMapping
    public List<PaymentMethodResponse> listMethods(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return paymentMethodService.listActiveMethods(userDetails.getUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentMethodResponse createMethod(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentMethodRequest request
    ) {
        return paymentMethodService.saveMethod(
                userDetails.getUserId(),
                request.type(),
                request.provider(),
                request.displayName(),
                request.lastFour(),
                request.expirationMonth(),
                request.expirationYear(),
                request.tokenReference(),
                request.defaultMethod()
        );
    }

    @DeleteMapping("/{paymentMethodId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateMethod(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long paymentMethodId
    ) {
        paymentMethodService.deactivateMethod(userDetails.getUserId(), paymentMethodId);
    }
}
