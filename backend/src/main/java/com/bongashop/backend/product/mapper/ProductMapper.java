package com.bongashop.backend.product.mapper;

import com.bongashop.backend.product.dto.ProductCardResponse;
import com.bongashop.backend.product.dto.ProductDetailResponse;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.productvariant.dto.ProductVariantResponse;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.productvariant.mapper.ProductVariantMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Component
public class ProductMapper {

    private final ProductVariantMapper productVariantMapper;

    public ProductMapper(ProductVariantMapper productVariantMapper) {
        this.productVariantMapper = productVariantMapper;
    }

    public ProductCardResponse toCard(Product product) {
        List<ProductVariant> activeVariants = product.getVariants().stream()
                .filter(ProductVariant::isActive)
                .toList();
        BigDecimal minPrice = activeVariants.stream().map(ProductVariant::getPrice).min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = activeVariants.stream().map(ProductVariant::getPrice).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        boolean hasStock = activeVariants.stream().anyMatch(variant -> variant.getInventory() != null && variant.getInventory().getStock() > 0);
        return new ProductCardResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getBrand().getName(),
                minPrice,
                maxPrice,
                hasStock
        );
    }

    public ProductDetailResponse toDetail(Product product, boolean includeInactiveVariants) {
        List<ProductVariantResponse> variants = product.getVariants().stream()
                .filter(variant -> includeInactiveVariants || (variant.isActive() && variant.getInventory() != null && variant.getInventory().getStock() > 0))
                .map(productVariantMapper::toResponse)
                .toList();
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.isActive(),
                product.getBrand().getId(),
                product.getBrand().getName(),
                variants
        );
    }
}
