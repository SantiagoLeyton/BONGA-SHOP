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
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandService brandService;
    private final ProductMapper productMapper;
    private final ProductImageStorageService imageStorage;

    public ProductService(
            ProductRepository productRepository,
            BrandService brandService,
            ProductMapper productMapper,
            ProductImageStorageService imageStorage
    ) {
        this.productRepository = productRepository;
        this.brandService = brandService;
        this.productMapper = productMapper;
        this.imageStorage = imageStorage;
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
            int size,
            boolean includeInactive
    ) {
        Specification<Product> specification = Specification.where(includeInactive ? null : activeProducts())
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
    public ProductDetailResponse getDetail(Long id, boolean includeInactiveVariants) {
        Product product = productRepository.findDetailedById(id)
                .filter(item -> includeInactiveVariants || item.isActive())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
        return productMapper.toDetail(product, includeInactiveVariants);
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

    /**
     * Carga (o reemplaza) la imagen principal del producto. Guarda el archivo en disco,
     * actualiza la entidad con la nueva ruta relativa y borra el archivo previo si existía.
     */
    @Transactional
    public ProductDetailResponse updateImage(Long id, MultipartFile file) {
        Product product = getProductEntity(id);
        String previousPath = product.getImagePath();
        String storedPath = imageStorage.store(file);
        product.setImagePath(storedPath);
        Product saved = productRepository.save(product);
        if (previousPath != null && !previousPath.equals(storedPath)) {
            imageStorage.deleteQuietly(previousPath);
        }
        return productMapper.toDetail(saved, true);
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
