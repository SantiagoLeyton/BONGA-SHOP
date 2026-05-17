package com.bongashop.backend.favorite.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.favorite.dto.FavoriteCountResponse;
import com.bongashop.backend.favorite.dto.FavoriteResponse;
import com.bongashop.backend.favorite.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/favorites")
@PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteResponse> listFavorites(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return favoriteService.listFavorites(userDetails.getUserId());
    }

    @GetMapping("/count")
    public FavoriteCountResponse countFavorites(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return new FavoriteCountResponse(favoriteService.countFavorites(userDetails.getUserId()));
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    public FavoriteResponse addFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId
    ) {
        return favoriteService.addFavorite(userDetails.getUserId(), productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId
    ) {
        favoriteService.removeFavorite(userDetails.getUserId(), productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearFavorites(@AuthenticationPrincipal CustomUserDetails userDetails) {
        favoriteService.clearFavorites(userDetails.getUserId());
    }
}
