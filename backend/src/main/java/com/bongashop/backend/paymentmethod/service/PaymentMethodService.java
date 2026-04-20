package com.bongashop.backend.paymentmethod.service;

import com.bongashop.backend.paymentmethod.dto.PaymentMethodResponse;
import com.bongashop.backend.paymentmethod.entity.PaymentMethod;
import com.bongashop.backend.paymentmethod.mapper.PaymentMethodMapper;
import com.bongashop.backend.paymentmethod.repository.PaymentMethodRepository;
import com.bongashop.backend.shared.enums.PaymentMethodType;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import com.bongashop.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final PaymentMethodMapper paymentMethodMapper;
    private final UserService userService;

    public PaymentMethodService(
            PaymentMethodRepository paymentMethodRepository,
            PaymentMethodMapper paymentMethodMapper,
            UserService userService
    ) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.paymentMethodMapper = paymentMethodMapper;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> listActiveMethods(Long userId) {
        return paymentMethodRepository.findByUserIdAndActiveTrueOrderByDefaultMethodDescCreatedAtDesc(userId).stream()
                .map(paymentMethodMapper::toResponse)
                .toList();
    }

    @Transactional
    public PaymentMethodResponse saveMethod(
            Long userId,
            PaymentMethodType type,
            String provider,
            String displayName,
            String lastFour,
            Integer expirationMonth,
            Integer expirationYear,
            String tokenReference,
            boolean defaultMethod
    ) {
        if (defaultMethod) {
            clearDefaultMethod(userId);
        }

        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setUser(userService.getById(userId));
        paymentMethod.setType(type);
        paymentMethod.setProvider(provider.trim());
        paymentMethod.setDisplayName(displayName.trim());
        paymentMethod.setLastFour(lastFour == null ? null : lastFour.trim());
        paymentMethod.setExpirationMonth(expirationMonth);
        paymentMethod.setExpirationYear(expirationYear);
        paymentMethod.setTokenReference(tokenReference == null ? null : tokenReference.trim());
        paymentMethod.setActive(true);
        paymentMethod.setDefaultMethod(defaultMethod);
        return paymentMethodMapper.toResponse(paymentMethodRepository.save(paymentMethod));
    }

    @Transactional
    public void deactivateMethod(Long userId, Long paymentMethodId) {
        PaymentMethod paymentMethod = paymentMethodRepository.findByIdAndUserId(paymentMethodId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment method not found with id " + paymentMethodId));
        paymentMethod.setActive(false);
        paymentMethod.setDefaultMethod(false);
        paymentMethodRepository.save(paymentMethod);
    }

    private void clearDefaultMethod(Long userId) {
        paymentMethodRepository.findByUserId(userId).forEach(method -> {
            if (method.isDefaultMethod()) {
                method.setDefaultMethod(false);
                paymentMethodRepository.save(method);
            }
        });
    }
}
