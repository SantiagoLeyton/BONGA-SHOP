package com.bongashop.backend.order.mapper;

import com.bongashop.backend.order.dto.OrderDetailResponse;
import com.bongashop.backend.order.dto.OrderItemResponse;
import com.bongashop.backend.order.dto.OrderSummaryResponse;
import com.bongashop.backend.order.entity.Order;
import com.bongashop.backend.orderdetail.entity.OrderDetail;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderMapper {

    public OrderSummaryResponse toSummary(Order order) {
        return new OrderSummaryResponse(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getName(),
                order.getStatus().name(),
                order.getTotal(),
                order.getPlacedAt()
        );
    }

    public OrderDetailResponse toDetail(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(this::toItem).toList();
        return new OrderDetailResponse(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getName(),
                order.getUser().getEmail(),
                order.getStatus().name(),
                order.getTotal(),
                order.getPlacedAt(),
                order.getShippingRecipient(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getShippingCity(),
                order.getNotes(),
                items
        );
    }

    private OrderItemResponse toItem(OrderDetail detail) {
        return new OrderItemResponse(
                detail.getId(),
                detail.getVariant().getId(),
                detail.getProductName(),
                detail.getVariantDescription(),
                detail.getQuantity(),
                detail.getUnitPrice(),
                detail.getSubtotal()
        );
    }
}
