package com.bongashop.backend.inventory.dto;

public record InventoryResponse(
        Long variantId,
        Long productId,
        String productName,
        String brandName,
        String flavor,
        String nicotineLevel,
        int stock,
        boolean active
) {
}
