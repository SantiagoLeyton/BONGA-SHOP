package com.bongashop.backend.admin.dto;

import com.bongashop.backend.shared.enums.RecommendationPriority;

public record AdminRecommendationResponse(
        String title,
        String description,
        RecommendationPriority priority
) {
}
