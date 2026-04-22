package com.bongashop.backend.config.bootstrap;

import com.bongashop.backend.brand.entity.Brand;
import com.bongashop.backend.brand.repository.BrandRepository;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.product.repository.ProductRepository;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.productvariant.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class CatalogBootstrapService {
    private static final BigDecimal LEGACY_PRICE_THRESHOLD = new BigDecimal("1000");
    private static final BigDecimal COP_CONVERSION_FACTOR = new BigDecimal("4000");

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryRepository;

    public CatalogBootstrapService(
            BrandRepository brandRepository,
            ProductRepository productRepository,
            ProductVariantRepository productVariantRepository,
            InventoryRepository inventoryRepository
    ) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional
    public void seedCatalogIfEmpty() {
        normalizeLegacyVariantPricesToCop();

        List<ProductSeed> seeds = List.of(
                new ProductSeed(
                        "Urban Mist",
                        "Breeze Ice Duo",
                        "Perfil frío y limpio con notas de menta glacial. Diseño compacto y draw suave para uso diario.",
                        List.of(
                                new VariantSeed("Menta glacial", "20 mg", "39000", 42),
                                new VariantSeed("Menta glacial", "35 mg", "43000", 26)
                        )
                ),
                new ProductSeed(
                        "Neon Labs",
                        "Neon Citrus",
                        "Explosión cítrica de limón y naranja con salida fresca y final dulce controlado.",
                        List.of(
                                new VariantSeed("Limón y naranja", "20 mg", "36000", 55),
                                new VariantSeed("Limón y naranja", "35 mg", "40500", 31)
                        )
                ),
                new ProductSeed(
                        "Nocturne",
                        "Shadow Grape",
                        "Uva negra intensa con perfil oscuro y acabado suave para caladas consistentes.",
                        List.of(
                                new VariantSeed("Uva negra", "20 mg", "38000", 21),
                                new VariantSeed("Uva negra", "35 mg", "42500", 14)
                        )
                ),
                new ProductSeed(
                        "Urban Mist",
                        "Metro Mango",
                        "Mango helado tropical con golpe fresco y sensación jugosa de larga duración.",
                        List.of(
                                new VariantSeed("Mango helado", "20 mg", "37000", 38),
                                new VariantSeed("Mango helado", "35 mg", "41500", 22)
                        )
                ),
                new ProductSeed(
                        "Concrete",
                        "Concrete Mint",
                        "Menta pura limpia y estable, ideal para quienes buscan frescura directa sin dulzor alto.",
                        List.of(
                                new VariantSeed("Menta pura", "20 mg", "35500", 47),
                                new VariantSeed("Menta pura", "35 mg", "39800", 29)
                        )
                ),
                new ProductSeed(
                        "Neon Labs",
                        "Velvet Berry",
                        "Blend de frutos rojos con balance entre dulzor y frescura para perfil afrutado premium.",
                        List.of(
                                new VariantSeed("Frutos rojos", "20 mg", "36500", 35),
                                new VariantSeed("Frutos rojos", "35 mg", "40900", 24)
                        )
                ),
                new ProductSeed(
                        "Nocturne",
                        "Afterdark Cola",
                        "Cola lima con cuerpo nocturno y final refrescante. Perfil clásico con toque cítrico.",
                        List.of(
                                new VariantSeed("Cola lima", "20 mg", "37500", 27),
                                new VariantSeed("Cola lima", "35 mg", "42000", 18)
                        )
                ),
                new ProductSeed(
                        "Urban Mist",
                        "Skyline Lychee",
                        "Lichi aromático de textura ligera con perfil moderno y final limpio.",
                        List.of(
                                new VariantSeed("Lichi", "20 mg", "37200", 23),
                                new VariantSeed("Lichi", "35 mg", "41600", 16)
                        )
                ),
                new ProductSeed(
                        "Concrete",
                        "Arctic Blueberry",
                        "Arándano frío con sensación cremosa y salida refrescante para una experiencia intensa.",
                        List.of(
                                new VariantSeed("Arándano", "20 mg", "38200", 19),
                                new VariantSeed("Arándano", "35 mg", "42600", 12)
                        )
                )
        );

        Map<String, Product> existingProductsByName = new HashMap<>();
        for (Product product : productRepository.findAll()) {
            existingProductsByName.put(normalize(product.getName()), product);
        }

        for (ProductSeed seed : seeds) {
            Brand brand = saveOrGetBrand(seed.brandName());
            Product product = saveOrUpdateProduct(existingProductsByName.get(normalize(seed.name())), brand, seed.name(), seed.description());
            existingProductsByName.put(normalize(seed.name()), product);
            syncVariants(product, seed.variants());
        }
    }

    private Brand saveOrGetBrand(String name) {
        return brandRepository.findByNameIgnoreCase(name)
                .map(existing -> {
                    if (!existing.isActive()) {
                        existing.setActive(true);
                        return brandRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    Brand brand = new Brand();
                    brand.setName(name);
                    brand.setActive(true);
                    return brandRepository.save(brand);
                });
    }

    private Product saveOrUpdateProduct(Product current, Brand brand, String name, String description) {
        Product product = current == null ? new Product() : current;
        product.setBrand(brand);
        product.setName(name);
        product.setDescription(description);
        product.setActive(true);
        return productRepository.save(product);
    }

    private void syncVariants(Product product, List<VariantSeed> seeds) {
        Map<String, ProductVariant> existingByKey = new HashMap<>();
        for (ProductVariant variant : productVariantRepository.findByProductIdOrderByIdAsc(product.getId())) {
            existingByKey.put(variantKey(variant.getFlavor(), variant.getNicotineLevel()), variant);
        }

        for (VariantSeed seed : seeds) {
            String key = variantKey(seed.flavor(), seed.nicotineLevel());
            ProductVariant variant = existingByKey.getOrDefault(key, new ProductVariant());
            variant.setProduct(product);
            variant.setFlavor(seed.flavor());
            variant.setNicotineLevel(seed.nicotineLevel());
            variant.setPrice(new BigDecimal(seed.price()));
            variant.setActive(true);
            ProductVariant savedVariant = productVariantRepository.save(variant);
            upsertInventory(savedVariant, seed.stock());
            existingByKey.remove(key);
        }

        // Mantiene limpio el catálogo y evita variantes obsoletas visibles.
        for (ProductVariant stale : existingByKey.values()) {
            stale.setActive(false);
            productVariantRepository.save(stale);
        }
    }

    private void upsertInventory(ProductVariant variant, int stock) {
        Inventory inventory = inventoryRepository.findByVariantId(variant.getId())
                .orElseGet(() -> {
                    Inventory fresh = new Inventory();
                    fresh.setVariant(variant);
                    return fresh;
                });
        inventory.setStock(Math.max(stock, 0));
        inventoryRepository.save(inventory);
    }

    private String variantKey(String flavor, String nicotineLevel) {
        return normalize(flavor) + "::" + normalize(nicotineLevel);
    }

    private String normalize(String value) {
        return Objects.requireNonNullElse(value, "")
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    /**
     * Migra precios legacy (p.ej. 12.99) a COP para evitar cards con valores irreales.
     */
    private void normalizeLegacyVariantPricesToCop() {
        for (ProductVariant variant : productVariantRepository.findAll()) {
            if (!variant.isActive() || variant.getPrice() == null) {
                continue;
            }
            if (variant.getPrice().compareTo(LEGACY_PRICE_THRESHOLD) >= 0) {
                continue;
            }
            BigDecimal normalized = variant.getPrice()
                    .multiply(COP_CONVERSION_FACTOR)
                    .setScale(2, RoundingMode.HALF_UP);
            variant.setPrice(normalized);
            productVariantRepository.save(variant);
        }
    }

    private record ProductSeed(String brandName, String name, String description, List<VariantSeed> variants) {
    }

    private record VariantSeed(String flavor, String nicotineLevel, String price, int stock) {
    }
}
