package com.bongashop.backend.brand.mapper;

import com.bongashop.backend.brand.dto.BrandResponse;
import com.bongashop.backend.brand.entity.Brand;
import org.springframework.stereotype.Component;

@Component
public class BrandMapper {
    public BrandResponse toResponse(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.isActive());
    }
}
