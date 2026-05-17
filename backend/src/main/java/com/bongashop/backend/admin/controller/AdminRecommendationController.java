package com.bongashop.backend.admin.controller;

import com.bongashop.backend.admin.dto.AdminRecommendationResponse;
import com.bongashop.backend.admin.service.AdminRecommendationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/recommendations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRecommendationController {

    private final AdminRecommendationService recommendationService;

    public AdminRecommendationController(AdminRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public List<AdminRecommendationResponse> listRecommendations() {
        return recommendationService.getRecommendations();
    }
}
