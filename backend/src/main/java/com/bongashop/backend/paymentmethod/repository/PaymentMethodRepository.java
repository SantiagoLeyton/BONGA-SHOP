package com.bongashop.backend.paymentmethod.repository;

import com.bongashop.backend.paymentmethod.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByUserIdAndActiveTrueOrderByDefaultMethodDescCreatedAtDesc(Long userId);

    Optional<PaymentMethod> findByIdAndUserId(Long id, Long userId);

    List<PaymentMethod> findByUserId(Long userId);
}
