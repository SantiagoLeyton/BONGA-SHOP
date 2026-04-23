package com.bongashop.backend.product.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.product.dto.ProductCardResponse;
import com.bongashop.backend.product.dto.ProductDetailResponse;
import com.bongashop.backend.product.dto.ProductRequest;
import com.bongashop.backend.product.service.ProductService;
import com.bongashop.backend.shared.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductCardResponse> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String flavor,
            @RequestParam(required = false) String nicotineLevel,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return productService.listProducts(
                search,
                brandId,
                minPrice,
                maxPrice,
                flavor,
                nicotineLevel,
                page,
                size,
                isAdmin(userDetails)
        );
    }

    @GetMapping("/{id}")
    public ProductDetailResponse getProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return productService.getDetail(id, isAdmin(userDetails));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDetailResponse createProduct(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDetailResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PostMapping(path = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductDetailResponse uploadImage(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file
    ) {
        return productService.updateImage(id, file);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        productService.delete(id);
    }

    private boolean isAdmin(CustomUserDetails userDetails) {
        return userDetails != null && "ROLE_ADMIN".equals(userDetails.getRoleName());
    }
}
