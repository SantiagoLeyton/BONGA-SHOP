package com.bongashop.backend.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShippingDataRequest(
        @NotBlank(message = "Recipient name is required")
        @Size(max = 120, message = "Recipient name must have at most 120 characters")
        String recipientName,
        @NotBlank(message = "Phone is required")
        @Size(max = 30, message = "Phone must have at most 30 characters")
        String phone,
        @NotBlank(message = "Address is required")
        @Size(max = 255, message = "Address must have at most 255 characters")
        String address,
        @NotBlank(message = "City is required")
        @Size(max = 120, message = "City must have at most 120 characters")
        String city,
        @Size(max = 500, message = "Notes must have at most 500 characters")
        String notes
) {
}
