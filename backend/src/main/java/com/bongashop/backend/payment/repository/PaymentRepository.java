package com.bongashop.backend.payment.repository;

import com.bongashop.backend.payment.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"order", "user", "paymentMethod"})
    List<Payment> findByOrderIdOrderByCreatedAtAsc(Long orderId);

    Optional<Payment> findByTransactionReference(String transactionReference);
}
