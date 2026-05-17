package com.bongashop.backend.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long variantId,
        Long productId,
        String productName,
        String brandName,
        String flavor,
        String nicotineLevel,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal subtotal
) {
}
