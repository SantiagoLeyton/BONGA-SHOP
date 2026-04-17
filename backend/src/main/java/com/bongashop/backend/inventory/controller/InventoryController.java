package com.bongashop.backend.inventory.controller;

import com.bongashop.backend.inventory.dto.InventoryResponse;
import com.bongashop.backend.inventory.dto.InventoryUpdateRequest;
import com.bongashop.backend.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@PreAuthorize("hasRole('ADMIN')")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
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
            @Valid @RequestBody InventoryUpdateRequest request
    ) {
        return inventoryService.updateStock(variantId, request);
    }
}
