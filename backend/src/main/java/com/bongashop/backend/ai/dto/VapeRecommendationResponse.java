package com.bongashop.backend.ai.dto;

import java.util.List;

public record VapeRecommendationResponse(
        boolean aiAvailable,
        String message,
        List<VapeRecommendationItem> recommendations
) {
}
