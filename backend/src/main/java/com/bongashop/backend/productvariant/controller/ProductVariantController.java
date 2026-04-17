package com.bongashop.backend.productvariant.controller;

import com.bongashop.backend.productvariant.dto.ProductVariantRequest;
import com.bongashop.backend.productvariant.dto.ProductVariantResponse;
import com.bongashop.backend.productvariant.service.ProductVariantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    public ProductVariantController(ProductVariantService productVariantService) {
        this.productVariantService = productVariantService;
    }

    @GetMapping("/products/{productId}/variants")
    public List<ProductVariantResponse> listVariants(@PathVariable Long productId) {
        return productVariantService.listPublicVariants(productId);
    }

    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductVariantResponse createVariant(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVariantRequest request
    ) {
        return productVariantService.create(productId, request);
    }

    @PutMapping("/variants/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductVariantResponse updateVariant(@PathVariable Long id, @Valid @RequestBody ProductVariantRequest request) {
        return productVariantService.update(id, request);
    }

    @DeleteMapping("/variants/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVariant(@PathVariable Long id) {
        productVariantService.delete(id);
    }
}
