package com.bongashop.backend.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record VapeAssistantRequest(
        @NotEmpty(message = "At least one flavor preference is required")
        @Size(max = 4, message = "Too many flavor preferences")
        List<@NotBlank(message = "Flavor preference cannot be blank") String> flavors,

        @NotBlank(message = "Intensity is required")
        @Size(max = 30, message = "Intensity is too long")
        String intensity,

        @NotBlank(message = "Experience is required")
        @Size(max = 30, message = "Experience is too long")
        String experience
) {
}
