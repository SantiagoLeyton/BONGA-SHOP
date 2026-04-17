package com.bongashop.backend.product.service;

import com.bongashop.backend.brand.service.BrandService;
import com.bongashop.backend.product.dto.ProductCardResponse;
import com.bongashop.backend.product.dto.ProductDetailResponse;
import com.bongashop.backend.product.dto.ProductRequest;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.product.mapper.ProductMapper;
import com.bongashop.backend.product.repository.ProductRepository;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandService brandService;
    private final ProductMapper productMapper;

    public ProductService(ProductRepository productRepository, BrandService brandService, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.brandService = brandService;
        this.productMapper = productMapper;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductCardResponse> listProducts(
            String search,
            Long brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String flavor,
            String nicotineLevel,
            int page,
            int size
    ) {
        Specification<Product> specification = Specification.where(activeProducts())
                .and(filterBySearch(search))
                .and(filterByBrand(brandId))
                .and(filterByMinPrice(minPrice))
                .and(filterByMaxPrice(maxPrice))
                .and(filterByFlavor(flavor))
                .and(filterByNicotine(nicotineLevel));

        return PageResponse.from(productRepository.findAll(specification, PageRequest.of(page, Math.min(size, 100)))
                .map(productMapper::toCard));
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getPublicDetail(Long id) {
        Product product = productRepository.findDetailedById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
        return productMapper.toDetail(product, false);
    }

    @Transactional(readOnly = true)
    public Product getProductEntity(Long id) {
        return productRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    @Transactional
    public ProductDetailResponse create(ProductRequest request) {
        Product product = new Product();
        product.setName(request.name().trim());
        product.setDescription(request.description().trim());
        product.setBrand(brandService.getActiveBrand(request.brandId()));
        product.setActive(request.active() == null || request.active());
        return productMapper.toDetail(productRepository.save(product), true);
    }

    @Transactional
    public ProductDetailResponse update(Long id, ProductRequest request) {
        Product product = getProductEntity(id);
        product.setName(request.name().trim());
        product.setDescription(request.description().trim());
        product.setBrand(brandService.getActiveBrand(request.brandId()));
        if (request.active() != null) {
            product.setActive(request.active());
        }
        return productMapper.toDetail(productRepository.save(product), true);
    }

    @Transactional
    public void delete(Long id) {
        Product product = getProductEntity(id);
        product.setActive(false);
        product.getVariants().forEach(variant -> variant.setActive(false));
        productRepository.save(product);
    }

    private Specification<Product> activeProducts() {
        return (root, query, builder) -> builder.isTrue(root.get("active"));
    }

    private Specification<Product> filterBySearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return (root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"),
                builder.like(builder.lower(root.get("description")), "%" + search.trim().toLowerCase() + "%")
        );
    }

    private Specification<Product> filterByBrand(Long brandId) {
        return brandId == null ? null : (root, query, builder) -> builder.equal(root.get("brand").get("id"), brandId);
    }

    private Specification<Product> filterByMinPrice(BigDecimal minPrice) {
        return minPrice == null ? null : (root, query, builder) -> {
            query.distinct(true);
            var variants = root.join("variants", JoinType.LEFT);
            return builder.greaterThanOrEqualTo(variants.get("price"), minPrice);
        };
    }

    private Specification<Product> filterByMaxPrice(BigDecimal maxPrice) {
        return maxPrice == null ? null : (root, query, builder) -> {
            query.distinct(true);
            var variants = root.join("variants", JoinType.LEFT);
            return builder.lessThanOrEqualTo(variants.get("price"), maxPrice);
        };
    }

    private Specification<Product> filterByFlavor(String flavor) {
        return flavor == null || flavor.isBlank() ? null : (root, query, builder) -> {
            query.distinct(true);
            var variants = root.join("variants", JoinType.LEFT);
            return builder.like(builder.lower(variants.get("flavor")), "%" + flavor.trim().toLowerCase() + "%");
        };
    }

    private Specification<Product> filterByNicotine(String nicotineLevel) {
        return nicotineLevel == null || nicotineLevel.isBlank() ? null : (root, query, builder) -> {
            query.distinct(true);
            var variants = root.join("variants", JoinType.LEFT);
            return builder.like(builder.lower(variants.get("nicotineLevel")), "%" + nicotineLevel.trim().toLowerCase() + "%");
        };
    }
}
