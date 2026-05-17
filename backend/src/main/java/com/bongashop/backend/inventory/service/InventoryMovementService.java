package com.bongashop.backend.inventory.service;

import com.bongashop.backend.inventory.dto.InventoryMovementResponse;
import com.bongashop.backend.inventory.entity.InventoryMovement;
import com.bongashop.backend.inventory.mapper.InventoryMovementMapper;
import com.bongashop.backend.inventory.repository.InventoryMovementRepository;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import com.bongashop.backend.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final InventoryMovementMapper movementMapper;

    public InventoryMovementService(
            InventoryMovementRepository movementRepository,
            InventoryMovementMapper movementMapper
    ) {
        this.movementRepository = movementRepository;
        this.movementMapper = movementMapper;
    }

    @Transactional(readOnly = true)
    public PageResponse<InventoryMovementResponse> listMovements(
            InventoryMovementType type,
            Long productId,
            LocalDate date,
            int page,
            int size
    ) {
        Specification<InventoryMovement> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null) {
                predicates.add(builder.equal(root.get("type"), type));
            }
            if (productId != null) {
                predicates.add(builder.equal(root.get("variant").get("product").get("id"), productId));
            }
            if (date != null) {
                predicates.add(builder.between(
                        root.get("createdAt"),
                        date.atStartOfDay(),
                        date.atTime(LocalTime.MAX)
                ));
            }
            query.orderBy(builder.desc(root.get("createdAt")));
            return builder.and(predicates.toArray(new Predicate[0]));
        };

        return PageResponse.from(movementRepository.findAll(specification, PageRequest.of(page, Math.min(size, 100)))
                .map(movementMapper::toResponse));
    }

    @Transactional
    public void recordMovement(
            ProductVariant variant,
            InventoryMovementType type,
            int stockBefore,
            int stockAfter,
            User user,
            String reason
    ) {
        int quantityChange = stockAfter - stockBefore;
        if (quantityChange == 0 && type != InventoryMovementType.ENTRY) {
            return;
        }
        InventoryMovement movement = new InventoryMovement();
        movement.setVariant(variant);
        movement.setType(type);
        movement.setQuantityChange(quantityChange);
        movement.setStockBefore(stockBefore);
        movement.setStockAfter(stockAfter);
        movement.setUser(user);
        movement.setReason(normalizeReason(reason, type));
        movementRepository.save(movement);
    }

    private String normalizeReason(String reason, InventoryMovementType type) {
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        return switch (type) {
            case SALE -> "Compra";
            case RESTOCK -> "Reposicion";
            case ENTRY -> "Entrada";
            case ADJUSTMENT -> "Ajuste manual";
        };
    }
}
