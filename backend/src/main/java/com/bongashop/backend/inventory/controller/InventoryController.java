package com.bongashop.backend.inventory.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.inventory.dto.InventoryMovementResponse;
import com.bongashop.backend.inventory.dto.InventoryResponse;
import com.bongashop.backend.inventory.dto.InventoryUpdateRequest;
import com.bongashop.backend.inventory.service.InventoryMovementService;
import com.bongashop.backend.inventory.service.InventoryService;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/inventory")
@PreAuthorize("hasRole('ADMIN')")
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryMovementService movementService;

    public InventoryController(InventoryService inventoryService, InventoryMovementService movementService) {
        this.inventoryService = inventoryService;
        this.movementService = movementService;
    }

    @GetMapping
    public List<InventoryResponse> listInventory(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "false") boolean lowStock
    ) {
        return inventoryService.listInventory(productId, variantId, lowStock);
    }

    @PutMapping("/{variantId}")
    public InventoryResponse updateStock(
            @PathVariable Long variantId,
            @Valid @RequestBody InventoryUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return inventoryService.updateStock(variantId, request, userDetails == null ? null : userDetails.getUserId());
    }

    @GetMapping("/movements")
    public PageResponse<InventoryMovementResponse> listMovements(
            @RequestParam(required = false) InventoryMovementType type,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return movementService.listMovements(type, productId, date, page, size);
    }
}
