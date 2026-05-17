package com.bongashop.backend.inventory.dto;

import com.bongashop.backend.shared.enums.InventoryMovementType;

import java.time.LocalDateTime;

public record InventoryMovementResponse(
        Long id,
        LocalDateTime createdAt,
        Long productId,
        String productName,
        Long variantId,
        String variantName,
        InventoryMovementType type,
        Integer quantityChange,
        Integer stockBefore,
        Integer stockAfter,
        String userName,
        String reason
) {
}
