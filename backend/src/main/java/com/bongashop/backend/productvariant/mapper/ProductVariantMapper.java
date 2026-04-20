package com.bongashop.backend.productvariant.mapper;

import com.bongashop.backend.productvariant.dto.ProductVariantResponse;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import org.springframework.stereotype.Component;

@Component
public class ProductVariantMapper {
    public ProductVariantResponse toResponse(ProductVariant variant) {
        int stock = variant.getInventory() == null ? 0 : variant.getInventory().getStock();
        return new ProductVariantResponse(
                variant.getId(),
                variant.getProduct().getId(),
                variant.getFlavor(),
                variant.getNicotineLevel(),
                variant.getPrice(),
                variant.isActive(),
                stock
        );
    }
}
