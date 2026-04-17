package com.bongashop.backend.order.service;

import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.order.dto.OrderItemRequest;
import com.bongashop.backend.order.dto.OrderRequest;
import com.bongashop.backend.order.dto.ShippingDataRequest;
import com.bongashop.backend.order.entity.Order;
import com.bongashop.backend.order.mapper.OrderMapper;
import com.bongashop.backend.order.repository.OrderRepository;
import com.bongashop.backend.product.entity.Product;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.shared.enums.OrderStatus;
import com.bongashop.backend.shared.exception.InsufficientStockException;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private UserService userService;

    private OrderMapper orderMapper;

    @InjectMocks
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderMapper = new OrderMapper();
        orderService = new OrderService(orderRepository, inventoryRepository, userService, orderMapper);
    }

    @Test
    void shouldCreateOrderAndDiscountInventory() throws Exception {
        User user = new User();
        user.setName("Alice");
        user.setEmail("alice@example.com");
        Product product = new Product();
        product.setName("Bonga Mango");
        product.setDescription("Sample");
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setFlavor("Mango");
        variant.setNicotineLevel("3mg");
        variant.setPrice(BigDecimal.valueOf(25));
        variant.setActive(true);
        Inventory inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setStock(10);
        variant.setInventory(inventory);

        when(userService.getById(5L)).thenReturn(user);
        when(inventoryRepository.findByVariantIdForUpdate(9L)).thenReturn(Optional.of(inventory));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            java.lang.reflect.Field idField = Order.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(order, 100L);
            return order;
        });
        when(orderRepository.findDetailedById(100L)).thenAnswer(invocation -> {
            Order order = ((Order) org.mockito.Mockito.mockingDetails(orderRepository).getInvocations().stream()
                    .filter(i -> i.getMethod().getName().equals("save"))
                    .findFirst()
                    .orElseThrow()
                    .getArgument(0));
            return Optional.of(order);
        });

        OrderRequest request = new OrderRequest(
                List.of(new OrderItemRequest(9L, 2)),
                new ShippingDataRequest("Alice", "3001234567", "Street 1", "Bogota", "Leave at door")
        );

        var response = orderService.createOrder(5L, request);

        assertThat(response.status()).isEqualTo(OrderStatus.CREATED.name());
        assertThat(response.total()).isEqualByComparingTo("50");
        assertThat(inventory.getStock()).isEqualTo(8);
    }

    @Test
    void shouldRejectOrderWhenStockIsInsufficient() {
        Product product = new Product();
        product.setActive(true);
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setFlavor("Mint");
        variant.setNicotineLevel("5mg");
        variant.setPrice(BigDecimal.TEN);
        variant.setActive(true);
        Inventory inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setStock(1);
        variant.setInventory(inventory);

        when(userService.getById(1L)).thenReturn(new User());
        when(inventoryRepository.findByVariantIdForUpdate(3L)).thenReturn(Optional.of(inventory));

        OrderRequest request = new OrderRequest(
                List.of(new OrderItemRequest(3L, 2)),
                new ShippingDataRequest("Bob", "3009876543", "Street 2", "Bogota", null)
        );

        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock");
    }
}
