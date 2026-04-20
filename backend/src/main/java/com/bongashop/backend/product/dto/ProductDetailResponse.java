package com.bongashop.backend.product.dto;

import com.bongashop.backend.productvariant.dto.ProductVariantResponse;

import java.util.List;

public record ProductDetailResponse(
        Long id,
        String name,
        String description,
        boolean active,
        Long brandId,
        String brand,
        List<ProductVariantResponse> variants
) {
}
