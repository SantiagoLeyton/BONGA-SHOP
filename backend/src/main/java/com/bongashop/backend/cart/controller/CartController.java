package com.bongashop.backend.cart.controller;

import com.bongashop.backend.cart.dto.AddCartItemRequest;
import com.bongashop.backend.cart.dto.CartResponse;
import com.bongashop.backend.cart.dto.ChangeCartItemVariantRequest;
import com.bongashop.backend.cart.dto.UpdateCartItemRequest;
import com.bongashop.backend.cart.service.CartService;
import com.bongashop.backend.config.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
@PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getActiveCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return cartService.getActiveCart(userDetails.getUserId());
    }

    @PostMapping("/items")
    public CartResponse addItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AddCartItemRequest request
    ) {
        return cartService.addItem(userDetails.getUserId(), request.variantId(), request.quantity());
    }

    @PutMapping("/items/{variantId}")
    public CartResponse updateItemQuantity(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long variantId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateItemQuantity(userDetails.getUserId(), variantId, request.quantity());
    }

    @PatchMapping("/items/{variantId}/variant")
    public CartResponse changeItemVariant(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long variantId,
            @Valid @RequestBody ChangeCartItemVariantRequest request
    ) {
        return cartService.changeItemVariant(userDetails.getUserId(), variantId, request.variantId());
    }

    @DeleteMapping("/items/{variantId}")
    public CartResponse removeItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long variantId
    ) {
        return cartService.removeItem(userDetails.getUserId(), variantId);
    }

    @DeleteMapping("/items")
    public CartResponse clearActiveCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return cartService.clearActiveCart(userDetails.getUserId());
    }
}
