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

@Service
public class CatalogBootstrapService {

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
        if (productRepository.count() > 0) {
            return;
        }

        Brand urbanMist = saveBrand("Urban Mist");
        Brand neonLabs = saveBrand("Neon Labs");
        Brand nocturne = saveBrand("Nocturne");

        Product breezeIceDuo = saveProduct(urbanMist, "Breeze Ice Duo",
                "Perfil frio y limpio con notas de menta y arandano. Diseno compacto y draw suave.");
        saveVariant(breezeIceDuo, "Menta glacial", "20 mg", "12.99", 48);
        saveVariant(breezeIceDuo, "Arandano", "20 mg", "12.99", 12);
        saveVariant(breezeIceDuo, "Menta glacial", "50 mg", "13.49", 3);

        Product neonCitrus = saveProduct(neonLabs, "Neon Citrus",
                "Explosion citrica con toque dulce. Acabado brillante y silueta delgada.");
        saveVariant(neonCitrus, "Limon y naranja", "20 mg", "11.50", 60);
        saveVariant(neonCitrus, "Limon y naranja", "35 mg", "11.90", 40);

        Product shadowGrape = saveProduct(nocturne, "Shadow Grape",
                "Uva profunda con final cremoso. Estetica oscura y acabado mate para un look premium.");
        saveVariant(shadowGrape, "Uva negra", "20 mg", "13.25", 5);
        saveVariant(shadowGrape, "Uva negra", "50 mg", "13.75", 2);

        Product metroMango = saveProduct(urbanMist, "Metro Mango",
                "Mango tropical con un toque helado. Sensacion jugosa y equilibrada para sesiones cortas.");
        saveVariant(metroMango, "Mango helado", "20 mg", "12.50", 33);
        saveVariant(metroMango, "Mango helado", "35 mg", "12.75", 28);
    }

    private Brand saveBrand(String name) {
        Brand brand = new Brand();
        brand.setName(name);
        brand.setActive(true);
        return brandRepository.save(brand);
    }

    private Product saveProduct(Brand brand, String name, String description) {
        Product product = new Product();
        product.setBrand(brand);
        product.setName(name);
        product.setDescription(description);
        product.setActive(true);
        return productRepository.save(product);
    }

    private void saveVariant(Product product, String flavor, String nicotineLevel, String price, int stock) {
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setFlavor(flavor);
        variant.setNicotineLevel(nicotineLevel);
        variant.setPrice(new BigDecimal(price));
        variant.setActive(true);

        ProductVariant savedVariant = productVariantRepository.save(variant);
        Inventory inventory = new Inventory();
        inventory.setVariant(savedVariant);
        inventory.setStock(stock);
        inventoryRepository.save(inventory);
    }
}
