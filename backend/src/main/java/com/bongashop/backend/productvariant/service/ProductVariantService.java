package com.bongashop.backend.productvariant.service;

import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.product.service.ProductService;
import com.bongashop.backend.productvariant.dto.ProductVariantRequest;
import com.bongashop.backend.productvariant.dto.ProductVariantResponse;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.productvariant.mapper.ProductVariantMapper;
import com.bongashop.backend.productvariant.repository.ProductVariantRepository;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductService productService;
    private final InventoryRepository inventoryRepository;
    private final ProductVariantMapper productVariantMapper;

    public ProductVariantService(
            ProductVariantRepository productVariantRepository,
            ProductService productService,
            InventoryRepository inventoryRepository,
            ProductVariantMapper productVariantMapper
    ) {
        this.productVariantRepository = productVariantRepository;
        this.productService = productService;
        this.inventoryRepository = inventoryRepository;
        this.productVariantMapper = productVariantMapper;
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> listVariants(Long productId, boolean includeInactive) {
        return (includeInactive
                ? productVariantRepository.findByProductIdOrderByIdAsc(productId)
                : productVariantRepository.findByProductIdAndActiveTrueOrderByIdAsc(productId)).stream()
                .filter(variant -> includeInactive || (variant.getInventory() != null && variant.getInventory().getStock() > 0))
                .map(productVariantMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductVariant getVariantEntity(Long variantId) {
        return productVariantRepository.findDetailedById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id " + variantId));
    }

    @Transactional
    public ProductVariantResponse create(Long productId, ProductVariantRequest request) {
        Product product = productService.getProductEntity(productId);
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setFlavor(request.flavor().trim());
        variant.setNicotineLevel(request.nicotineLevel().trim());
        variant.setPrice(request.price());
        variant.setActive(request.active() == null || request.active());

        ProductVariant savedVariant = productVariantRepository.save(variant);
        Inventory inventory = new Inventory();
        inventory.setVariant(savedVariant);
        inventory.setStock(0);
        inventoryRepository.save(inventory);
        savedVariant.setInventory(inventory);
        return productVariantMapper.toResponse(savedVariant);
    }

    @Transactional
    public ProductVariantResponse update(Long variantId, ProductVariantRequest request) {
        ProductVariant variant = getVariantEntity(variantId);
        variant.setFlavor(request.flavor().trim());
        variant.setNicotineLevel(request.nicotineLevel().trim());
        variant.setPrice(request.price());
        if (request.active() != null) {
            variant.setActive(request.active());
        }
        return productVariantMapper.toResponse(productVariantRepository.save(variant));
    }

    @Transactional
    public void delete(Long variantId) {
        ProductVariant variant = getVariantEntity(variantId);
        variant.setActive(false);
        productVariantRepository.save(variant);
    }
}
