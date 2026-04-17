package com.bongashop.backend.inventory.service;

import com.bongashop.backend.config.properties.InventoryProperties;
import com.bongashop.backend.inventory.dto.InventoryResponse;
import com.bongashop.backend.inventory.dto.InventoryUpdateRequest;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.mapper.InventoryMapper;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;
    private final InventoryProperties inventoryProperties;

    public InventoryService(
            InventoryRepository inventoryRepository,
            InventoryMapper inventoryMapper,
            InventoryProperties inventoryProperties
    ) {
        this.inventoryRepository = inventoryRepository;
        this.inventoryMapper = inventoryMapper;
        this.inventoryProperties = inventoryProperties;
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> listInventory(Long productId, Long variantId, boolean lowStock) {
        return inventoryRepository.findByFilters(productId, variantId, lowStock, inventoryProperties.lowStockThreshold()).stream()
                .map(inventoryMapper::toResponse)
                .toList();
    }

    @Transactional
    public InventoryResponse updateStock(Long variantId, InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByVariantId(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for variant " + variantId));
        inventory.setStock(request.stock());
        return inventoryMapper.toResponse(inventoryRepository.save(inventory));
    }
}
