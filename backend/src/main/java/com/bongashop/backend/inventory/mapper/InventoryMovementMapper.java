package com.bongashop.backend.inventory.mapper;

import com.bongashop.backend.inventory.dto.InventoryMovementResponse;
import com.bongashop.backend.inventory.entity.InventoryMovement;
import org.springframework.stereotype.Component;

@Component
public class InventoryMovementMapper {

    public InventoryMovementResponse toResponse(InventoryMovement movement) {
        return new InventoryMovementResponse(
                movement.getId(),
                movement.getCreatedAt(),
                movement.getVariant().getProduct().getId(),
                movement.getVariant().getProduct().getName(),
                movement.getVariant().getId(),
                movement.getVariant().getFlavor() + " - " + movement.getVariant().getNicotineLevel(),
                movement.getType(),
                movement.getQuantityChange(),
                movement.getStockBefore(),
                movement.getStockAfter(),
                movement.getUser() == null ? "Sistema" : movement.getUser().getName(),
                movement.getReason()
        );
    }
}
