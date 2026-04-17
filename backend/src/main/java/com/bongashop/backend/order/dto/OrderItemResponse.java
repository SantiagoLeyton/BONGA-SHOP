package com.bongashop.backend.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long detailId,
        Long variantId,
        String productName,
        String variantDescription,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
