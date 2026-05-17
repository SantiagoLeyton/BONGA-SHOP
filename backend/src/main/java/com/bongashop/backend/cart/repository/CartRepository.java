package com.bongashop.backend.cart.repository;

import com.bongashop.backend.cart.entity.Cart;
import com.bongashop.backend.shared.enums.CartStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    @EntityGraph(attributePaths = {"items", "items.variant", "items.variant.product", "items.variant.product.brand", "items.variant.inventory"})
    Optional<Cart> findFirstByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, CartStatus status);

    @EntityGraph(attributePaths = {"items", "items.variant", "items.variant.product", "items.variant.product.brand", "items.variant.inventory"})
    List<Cart> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
