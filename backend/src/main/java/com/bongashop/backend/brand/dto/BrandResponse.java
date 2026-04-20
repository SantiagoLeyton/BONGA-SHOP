package com.bongashop.backend.brand.dto;

public record BrandResponse(
        Long id,
        String name,
        boolean active
) {
}
