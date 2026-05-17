package com.bongashop.backend.admin.service;

import com.bongashop.backend.brand.entity.Brand;
import com.bongashop.backend.ai.service.OllamaClient;
import com.bongashop.backend.config.properties.InventoryProperties;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.entity.InventoryMovement;
import com.bongashop.backend.inventory.repository.InventoryMovementRepository;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.order.repository.OrderRepository;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import com.bongashop.backend.shared.enums.RecommendationPriority;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRecommendationServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private InventoryMovementRepository movementRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OllamaClient ollamaClient;

    private AdminRecommendationService service;

    @BeforeEach
    void setUp() {
        service = new AdminRecommendationService(
                ollamaClient,
                new ObjectMapper(),
                inventoryRepository,
                movementRepository,
                orderRepository,
                new InventoryProperties(5)
        );
    }

    @Test
    void shouldGenerateOperationalRecommendationsFromInventoryAndSales() throws Exception {
        ProductVariant blueIce = variant(1L, product(10L, "Ignite V80", "Ignite"), "Blue Ice");
        ProductVariant watermelon = variant(2L, product(20L, "Watermelon Blue Sky", "Cloud"), "Watermelon");

        Inventory blueInventory = inventory(blueIce, 3);
        Inventory deadInventory = inventory(watermelon, 18);
        List<InventoryMovement> sales = new ArrayList<>();
        for (int i = 0; i < 7; i += 1) {
            sales.add(sale(blueIce, LocalDateTime.now().minusDays(i + 1)));
        }
        sales.add(sale(blueIce, LocalDateTime.now().minusDays(20)));

        when(inventoryRepository.findByFilters(isNull(), isNull(), anyBoolean(), anyInt()))
                .thenReturn(List.of(blueInventory, deadInventory));
        when(movementRepository.findByTypeAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                eq(InventoryMovementType.SALE),
                any(LocalDateTime.class)
        )).thenReturn(sales);
        when(orderRepository.countByPlacedAtGreaterThanEqual(any(LocalDateTime.class))).thenReturn(6L);
        when(ollamaClient.generate(anyString(), anyInt(), anyDouble())).thenReturn("""
                [
                  {
                    "title": "Reponer Ignite V80 antes del fin de semana",
                    "description": "Ignite V80 vendio 8 unidades en los ultimos 30 dias y conserva 3 unidades disponibles. La demanda reciente y el stock bajo justifican aumentar disponibilidad.",
                    "priority": "HIGH"
                  },
                  {
                    "title": "Reducir reposicion de Watermelon Blue Sky",
                    "description": "Watermelon Blue Sky mantiene 18 unidades en inventario y no registra ventas relevantes en 180 dias. Conviene pausar reposicion y revisar reemplazo.",
                    "priority": "MEDIUM"
                  },
                  {
                    "title": "Priorizar sabores mentolados",
                    "description": "Los sabores mentolados vendieron 7 unidades en los ultimos 14 dias frente a 1 en el periodo anterior. Esta aceleracion permite reforzar referencias frescas.",
                    "priority": "MEDIUM"
                  }
                ]
                """);

        var recommendations = service.getRecommendations();

        assertThat(recommendations).hasSizeLessThanOrEqualTo(5);
        assertThat(recommendations)
                .anySatisfy(item -> {
                    assertThat(item.title()).contains("Ignite V80");
                    assertThat(item.priority()).isEqualTo(RecommendationPriority.HIGH);
                    assertThat(item.description()).contains("30 dias").contains("stock bajo");
                });
        assertThat(recommendations)
                .anySatisfy(item -> {
                    assertThat(item.title()).contains("Watermelon Blue Sky");
                    assertThat(item.priority()).isEqualTo(RecommendationPriority.MEDIUM);
                    assertThat(item.description()).contains("180 dias");
                });
        assertThat(recommendations)
                .anySatisfy(item -> assertThat(item.title()).contains("sabores mentolados"));
    }

    @Test
    void shouldReturnUnavailableRecommendationWhenOllamaFails() throws Exception {
        ProductVariant blueIce = variant(1L, product(10L, "Ignite V80", "Ignite"), "Blue Ice");
        Inventory blueInventory = inventory(blueIce, 3);
        List<InventoryMovement> sales = List.of(
                sale(blueIce, LocalDateTime.now().minusDays(1)),
                sale(blueIce, LocalDateTime.now().minusDays(2))
        );

        when(inventoryRepository.findByFilters(isNull(), isNull(), anyBoolean(), anyInt()))
                .thenReturn(List.of(blueInventory));
        when(movementRepository.findByTypeAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                eq(InventoryMovementType.SALE),
                any(LocalDateTime.class)
        )).thenReturn(sales);
        when(orderRepository.countByPlacedAtGreaterThanEqual(any(LocalDateTime.class))).thenReturn(2L);
        when(ollamaClient.generate(anyString(), anyInt(), anyDouble())).thenThrow(new IllegalStateException("down"));

        var recommendations = service.getRecommendations();

        assertThat(recommendations).singleElement().satisfies(item -> {
            assertThat(item.title()).contains("no disponible");
            assertThat(item.description()).contains("Ollama");
            assertThat(item.priority()).isEqualTo(RecommendationPriority.LOW);
        });
    }

    private Product product(Long id, String name, String brandName) throws Exception {
        Brand brand = new Brand();
        setId(brand, id);
        brand.setName(brandName);

        Product product = new Product();
        setId(product, id);
        product.setName(name);
        product.setDescription("Sample");
        product.setBrand(brand);
        product.setActive(true);
        return product;
    }

    private ProductVariant variant(Long id, Product product, String flavor) throws Exception {
        ProductVariant variant = new ProductVariant();
        setId(variant, id);
        variant.setProduct(product);
        variant.setFlavor(flavor);
        variant.setNicotineLevel("5mg");
        variant.setActive(true);
        return variant;
    }

    private Inventory inventory(ProductVariant variant, int stock) {
        Inventory inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setStock(stock);
        variant.setInventory(inventory);
        return inventory;
    }

    private InventoryMovement sale(ProductVariant variant, LocalDateTime createdAt) throws Exception {
        InventoryMovement movement = new InventoryMovement();
        movement.setVariant(variant);
        movement.setType(InventoryMovementType.SALE);
        movement.setQuantityChange(-1);
        movement.setStockBefore(10);
        movement.setStockAfter(9);
        movement.setReason("Compra");
        setField(movement, "createdAt", createdAt);
        return movement;
    }

    private void setId(Object target, Long id) throws Exception {
        setField(target, "id", id);
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }
}
