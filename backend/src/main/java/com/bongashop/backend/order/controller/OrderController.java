package com.bongashop.backend.order.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.order.dto.OrderDetailResponse;
import com.bongashop.backend.order.dto.OrderRequest;
import com.bongashop.backend.order.dto.OrderStatusUpdateRequest;
import com.bongashop.backend.order.dto.OrderSummaryResponse;
import com.bongashop.backend.order.service.OrderService;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.shared.enums.OrderStatus;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDetailResponse createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OrderRequest request
    ) {
        return orderService.createOrder(userDetails.getUserId(), request);
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CLIENT')")
    public PageResponse<OrderSummaryResponse> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return orderService.getMyOrders(userDetails.getUserId(), page, size);
    }

    @GetMapping("/{id}")
    public OrderDetailResponse getOrderDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return orderService.getOrderDetail(id, userDetails);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<OrderSummaryResponse> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long userId
    ) {
        return orderService.listOrders(page, size, status, userId);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderDetailResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        return orderService.updateStatus(id, request);
    }
}
