package com.bongashop.backend.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderRequest(
        List<@Valid OrderItemRequest> items,
        @NotNull(message = "Shipping data is required")
        @Valid ShippingDataRequest shippingData
) {
}
