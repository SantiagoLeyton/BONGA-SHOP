package com.bongashop.backend.inventory.service;

import com.bongashop.backend.config.properties.InventoryProperties;
import com.bongashop.backend.inventory.dto.InventoryResponse;
import com.bongashop.backend.inventory.dto.InventoryUpdateRequest;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.mapper.InventoryMapper;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;
    private final InventoryProperties inventoryProperties;
    private final InventoryMovementService movementService;
    private final UserService userService;

    public InventoryService(
            InventoryRepository inventoryRepository,
            InventoryMapper inventoryMapper,
            InventoryProperties inventoryProperties,
            InventoryMovementService movementService,
            UserService userService
    ) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryMapper = inventoryMapper;
        this.inventoryProperties = inventoryProperties;
        this.movementService = movementService;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> listInventory(Long productId, Long variantId, boolean lowStock) {
        return inventoryRepository.findByFilters(productId, variantId, lowStock, inventoryProperties.lowStockThreshold()).stream()
                .map(inventoryMapper::toResponse)
                .toList();
    }

    @Transactional
    public InventoryResponse updateStock(Long variantId, InventoryUpdateRequest request, Long userId) {
        Inventory inventory = inventoryRepository.findByVariantIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for variant " + variantId));
        int stockBefore = inventory.getStock();
        int stockAfter = request.stock();
        if (stockBefore == stockAfter) {
            return inventoryMapper.toResponse(inventory);
        }
        inventory.setStock(request.stock());
        Inventory saved = inventoryRepository.save(inventory);
        User user = userId == null ? null : userService.getById(userId);
        movementService.recordMovement(
                saved.getVariant(),
                movementTypeForManualUpdate(stockBefore, stockAfter),
                stockBefore,
                stockAfter,
                user,
                request.reason()
        );
        return inventoryMapper.toResponse(saved);
    }

    private InventoryMovementType movementTypeForManualUpdate(int stockBefore, int stockAfter) {
        if (stockAfter > stockBefore) {
            return InventoryMovementType.RESTOCK;
        }
        return InventoryMovementType.ADJUSTMENT;
    }
}
