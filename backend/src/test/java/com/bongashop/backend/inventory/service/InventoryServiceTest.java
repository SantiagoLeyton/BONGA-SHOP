package com.bongashop.backend.inventory.service;

import com.bongashop.backend.config.properties.InventoryProperties;
import com.bongashop.backend.brand.entity.Brand;
import com.bongashop.backend.inventory.dto.InventoryUpdateRequest;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.mapper.InventoryMapper;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private InventoryProperties inventoryProperties;
    @Mock
    private InventoryMovementService movementService;
    @Mock
    private UserService userService;

    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(
                inventoryRepository,
                new InventoryMapper(),
                inventoryProperties,
                movementService,
                userService
        );
    }

    @Test
    void shouldRecordRestockWhenAdminIncreasesStock() {
        User admin = new User();
        admin.setName("Admin");
        Inventory inventory = inventoryWithStock(20);

        when(inventoryRepository.findByVariantIdForUpdate(7L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);
        when(userService.getById(1L)).thenReturn(admin);

        inventoryService.updateStock(7L, new InventoryUpdateRequest(35, "Reposicion"), 1L);

        verify(movementService).recordMovement(
                inventory.getVariant(),
                InventoryMovementType.RESTOCK,
                20,
                35,
                admin,
                "Reposicion"
        );
    }

    @Test
    void shouldNotRecordMovementWhenStockDoesNotChange() {
        Inventory inventory = inventoryWithStock(20);

        when(inventoryRepository.findByVariantIdForUpdate(7L)).thenReturn(Optional.of(inventory));

        inventoryService.updateStock(7L, new InventoryUpdateRequest(20, null), 1L);

        verify(inventoryRepository, never()).save(inventory);
        verify(movementService, never()).recordMovement(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    private Inventory inventoryWithStock(int stock) {
        Brand brand = new Brand();
        brand.setName("Bonga");

        Product product = new Product();
        product.setName("Bonga Mango");
        product.setBrand(brand);
        product.setActive(true);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setFlavor("Mango");
        variant.setNicotineLevel("3mg");
        variant.setActive(true);

        Inventory inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setStock(stock);
        variant.setInventory(inventory);
        return inventory;
    }
}
