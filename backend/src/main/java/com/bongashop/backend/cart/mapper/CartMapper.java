package com.bongashop.backend.cart.mapper;

import com.bongashop.backend.cart.dto.CartItemResponse;
import com.bongashop.backend.cart.dto.CartResponse;
import com.bongashop.backend.cart.entity.Cart;
import com.bongashop.backend.cartitem.entity.CartItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class CartMapper {

    public CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::toItemResponse)
                .toList();
        int totalItems = items.stream().mapToInt(CartItemResponse::quantity).sum();
        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(
                cart.getId(),
                cart.getUser().getId(),
                cart.getStatus(),
                cart.getConvertedOrder() == null ? null : cart.getConvertedOrder().getId(),
                totalItems,
                totalAmount,
                cart.getUpdatedAt(),
                items
        );
    }

    private CartItemResponse toItemResponse(CartItem item) {
        BigDecimal subtotal = item.getVariant().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new CartItemResponse(
                item.getId(),
                item.getVariant().getId(),
                item.getVariant().getProduct().getId(),
                item.getVariant().getProduct().getName(),
                item.getVariant().getProduct().getBrand().getName(),
                item.getVariant().getFlavor(),
                item.getVariant().getNicotineLevel(),
                item.getVariant().getPrice(),
                item.getQuantity(),
                subtotal
        );
    }
}
