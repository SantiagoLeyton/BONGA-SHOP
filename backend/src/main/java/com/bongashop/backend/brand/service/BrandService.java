package com.bongashop.backend.brand.service;

import com.bongashop.backend.brand.dto.BrandRequest;
import com.bongashop.backend.brand.dto.BrandResponse;
import com.bongashop.backend.brand.entity.Brand;
import com.bongashop.backend.brand.mapper.BrandMapper;
import com.bongashop.backend.brand.repository.BrandRepository;
import com.bongashop.backend.product.repository.ProductRepository;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final BrandMapper brandMapper;

    public BrandService(BrandRepository brandRepository, ProductRepository productRepository, BrandMapper brandMapper) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
        this.brandMapper = brandMapper;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> listActiveBrands() {
        return brandRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(brandMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Brand getActiveBrand(Long id) {
        return brandRepository.findById(id)
                .filter(Brand::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id " + id));
    }

    @Transactional
    public BrandResponse create(BrandRequest request) {
        validateName(request.name(), null);
        Brand brand = new Brand();
        brand.setName(request.name().trim());
        brand.setActive(true);
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Transactional
    public BrandResponse update(Long id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id " + id));
        validateName(request.name(), id);
        brand.setName(request.name().trim());
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Transactional
    public void delete(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id " + id));
        if (productRepository.existsByBrandIdAndActiveTrue(id)) {
            throw new BusinessException("Brand cannot be deleted because it has active products");
        }
        brand.setActive(false);
        brandRepository.save(brand);
    }

    private void validateName(String name, Long currentId) {
        brandRepository.findByNameIgnoreCase(name.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new BusinessException("Brand name is already registered");
                });
    }
}
