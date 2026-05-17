package com.bongashop.backend.cartitem.repository;

import com.bongashop.backend.cartitem.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndVariantId(Long cartId, Long variantId);

    List<CartItem> findByCartIdOrderByIdAsc(Long cartId);
}
