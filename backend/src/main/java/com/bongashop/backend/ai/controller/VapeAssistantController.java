package com.bongashop.backend.ai.controller;

import com.bongashop.backend.ai.dto.VapeAssistantRequest;
import com.bongashop.backend.ai.dto.VapeRecommendationResponse;
import com.bongashop.backend.ai.service.VapeAssistantService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
public class VapeAssistantController {

    private final VapeAssistantService vapeAssistantService;

    public VapeAssistantController(VapeAssistantService vapeAssistantService) {
        this.vapeAssistantService = vapeAssistantService;
    }

    @PostMapping("/vape-recommendations")
    public VapeRecommendationResponse recommend(@Valid @RequestBody VapeAssistantRequest request) {
        return vapeAssistantService.recommend(request);
    }
}
