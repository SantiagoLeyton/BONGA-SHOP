package com.bongashop.backend.order.service;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.order.dto.OrderDetailResponse;
import com.bongashop.backend.order.dto.OrderItemRequest;
import com.bongashop.backend.order.dto.OrderRequest;
import com.bongashop.backend.order.dto.OrderStatusUpdateRequest;
import com.bongashop.backend.order.dto.OrderSummaryResponse;
import com.bongashop.backend.order.entity.Order;
import com.bongashop.backend.order.mapper.OrderMapper;
import com.bongashop.backend.order.repository.OrderRepository;
import com.bongashop.backend.orderdetail.entity.OrderDetail;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.shared.enums.OrderStatus;
import com.bongashop.backend.shared.exception.ForbiddenOperationException;
import com.bongashop.backend.shared.exception.InsufficientStockException;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import com.bongashop.backend.user.service.UserService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final UserService userService;
    private final OrderMapper orderMapper;

    public OrderService(
            OrderRepository orderRepository,
            InventoryRepository inventoryRepository,
            UserService userService,
            OrderMapper orderMapper
    ) {
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
        this.userService = userService;
        this.orderMapper = orderMapper;
    }

    @Transactional
    public OrderDetailResponse createOrder(Long userId, OrderRequest request) {
        Order order = new Order();
        order.setUser(userService.getById(userId));
        order.setStatus(OrderStatus.CREATED);
        order.setShippingRecipient(request.shippingData().recipientName().trim());
        order.setShippingPhone(request.shippingData().phone().trim());
        order.setShippingAddress(request.shippingData().address().trim());
        order.setShippingCity(request.shippingData().city().trim());
        order.setNotes(request.shippingData().notes() == null ? null : request.shippingData().notes().trim());

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            Inventory inventory = inventoryRepository.findByVariantIdForUpdate(itemRequest.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id " + itemRequest.variantId()));
            ProductVariant variant = inventory.getVariant();
            if (!variant.isActive() || !variant.getProduct().isActive()) {
                throw new InsufficientStockException("Variant " + itemRequest.variantId() + " is not available");
            }
            if (inventory.getStock() < itemRequest.quantity()) {
                throw new InsufficientStockException("Insufficient stock for variant " + itemRequest.variantId());
            }

            inventory.setStock(inventory.getStock() - itemRequest.quantity());
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setVariant(variant);
            detail.setProductName(variant.getProduct().getName());
            detail.setVariantDescription(variant.getFlavor() + " - " + variant.getNicotineLevel());
            detail.setQuantity(itemRequest.quantity());
            detail.setUnitPrice(variant.getPrice());
            detail.setSubtotal(variant.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())));
            order.getItems().add(detail);
            total = total.add(detail.getSubtotal());
        }

        order.setTotal(total);
        Order savedOrder = orderRepository.save(order);
        return orderMapper.toDetail(getOrderEntity(savedOrder.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> getMyOrders(Long userId, int page, int size) {
        return PageResponse.from(orderRepository.findPageByUserId(userId, PageRequest.of(page, Math.min(size, 100)))
                .map(orderMapper::toSummary));
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(Long orderId, CustomUserDetails userDetails) {
        Order order = getOrderEntity(orderId);
        boolean admin = "ROLE_ADMIN".equals(userDetails.getRoleName());
        if (!admin && !order.getUser().getId().equals(userDetails.getUserId())) {
            throw new ForbiddenOperationException("You cannot access this order");
        }
        return orderMapper.toDetail(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listOrders(int page, int size, OrderStatus status, Long userId) {
        Specification<Order> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (userId != null) {
                predicates.add(builder.equal(root.get("user").get("id"), userId));
            }
            query.orderBy(builder.desc(root.get("placedAt")));
            return builder.and(predicates.toArray(new Predicate[0]));
        };
        return PageResponse.from(orderRepository.findAll(specification, PageRequest.of(page, Math.min(size, 100)))
                .map(orderMapper::toSummary));
    }

    @Transactional
    public OrderDetailResponse updateStatus(Long orderId, OrderStatusUpdateRequest request) {
        Order order = getOrderEntity(orderId);
        validateTransition(order.getStatus(), request.status());
        order.setStatus(request.status());
        return orderMapper.toDetail(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public Order getOrderEntity(Long orderId) {
        return orderRepository.findDetailedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        Map<OrderStatus, List<OrderStatus>> transitions = new EnumMap<>(OrderStatus.class);
        transitions.put(OrderStatus.CREATED, List.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED));
        transitions.put(OrderStatus.PROCESSING, List.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED));
        transitions.put(OrderStatus.SHIPPED, List.of(OrderStatus.DELIVERED));
        transitions.put(OrderStatus.DELIVERED, List.of());
        transitions.put(OrderStatus.CANCELLED, List.of());
        if (!transitions.getOrDefault(current, List.of()).contains(next)) {
            throw new ForbiddenOperationException("Invalid order status transition from " + current + " to " + next);
        }
    }
}
