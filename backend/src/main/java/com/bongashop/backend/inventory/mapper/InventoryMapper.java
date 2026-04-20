package com.bongashop.backend.inventory.mapper;

import com.bongashop.backend.inventory.dto.InventoryResponse;
import com.bongashop.backend.inventory.entity.Inventory;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {
    public InventoryResponse toResponse(Inventory inventory) {
        return new InventoryResponse(
                inventory.getVariant().getId(),
                inventory.getVariant().getProduct().getId(),
                inventory.getVariant().getProduct().getName(),
                inventory.getVariant().getProduct().getBrand().getName(),
                inventory.getVariant().getFlavor(),
                inventory.getVariant().getNicotineLevel(),
                inventory.getStock(),
                inventory.getVariant().isActive()
        );
    }
}
